import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  AppBar, 
  Toolbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
  Checkbox,
  FormGroup,
  FormLabel
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Agriculture as ApplicationIcon,
  AddCircle as AddProductIcon,
  RemoveCircle as RemoveProductIcon,
  Star as DefaultIcon,
  CheckCircle as CheckIcon,
  LocalShipping as HoseTruckIcon,
  ShoppingCart as CartTruckIcon,
  Upgrade as TrailerIcon,
  Backpack as BackpackIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc
} from 'firebase/firestore';

// Application interface
interface ApplicationProduct {
  productId: string;
  productName: string;
  productType: string;
  hoseRate: number;
  cartRate: number;
  trailerRate?: number;
  backpackRate?: number;
  unit: string;
  equipmentTypes: ('hose-truck' | 'trailer' | 'cart-truck' | 'backpack')[]; // Array to support individual equipment types
  truckTypes?: ('hose' | 'cart')[]; // Legacy field for backward compatibility
}

interface Application {
  id: string;
  name: string;
  description?: string;
  category: 'fertilizer' | 'herbicide' | 'insecticide' | 'fungicide' | 'pre-emergent' | 'spreader-sticker' | 'mixed';
  applicationCategory?: 'trees' | 'other'; // New field for Trees vs Other categorization
  products: ApplicationProduct[];
  isActive: boolean;
  isDefault?: boolean;
  availableKiosks?: ('specialty' | 'mixed' | 'fertilizer')[]; // Which kiosks can use this recipe
  createdAt?: any;
}

// Product interface (for selecting products)
interface Product {
  id: string;
  name: string;
  type: 'fertilizer' | 'herbicide' | 'insecticide' | 'fungicide' | 'pre-emergent' | 'spreader-sticker' | 'other';
  hoseRatePerGallon: number;
  cartRatePerGallon: number;
  backpackRatePerGallon?: number;
  trailerRatePerGallon?: number;
  unit: string;
  description?: string;
  isActive: boolean;
}

const ApplicationManagement: React.FC = () => {
  const {} = useAuth(); // Using auth context for consistency
  const navigate = useNavigate();

  // Helper function to migrate legacy product data (add equipmentTypes if missing)
  const migrateLegacyProduct = (product: any): ApplicationProduct => {
    let equipmentTypes: ('hose-truck' | 'trailer' | 'cart-truck' | 'backpack')[] = [];
    
    if (!product.equipmentTypes) {
      // For legacy products, convert old truckTypes to new equipmentTypes
      if (product.truckTypes) {
        // Migrate from old truckTypes format
        if (product.truckTypes.includes('hose')) {
          equipmentTypes.push('hose-truck', 'trailer');
        }
        if (product.truckTypes.includes('cart')) {
          equipmentTypes.push('cart-truck', 'backpack');
        }
      } else {
        // Very old products without truckTypes - use rates
        if (product.hoseRate > 0) {
          equipmentTypes.push('hose-truck', 'trailer');
        }
        if (product.cartRate > 0) {
          equipmentTypes.push('cart-truck', 'backpack');
        }
      }
      
      if (equipmentTypes.length === 0) {
        equipmentTypes = ['cart-truck', 'backpack'];
      }
    } else {
      equipmentTypes = [...product.equipmentTypes];
    }

    // Clean up equipment types - remove those without valid rates
    const validEquipmentTypes = equipmentTypes.filter(equipType => {
      switch (equipType) {
        case 'hose-truck':
          return product.hoseRate && product.hoseRate > 0;
        case 'trailer':
          return product.trailerRate && product.trailerRate > 0;
        case 'cart-truck':
          return product.cartRate && product.cartRate > 0;
        case 'backpack':
          return product.backpackRate && product.backpackRate > 0;
        default:
          return false;
      }
    });
    
    return {
      ...product,
      equipmentTypes: validEquipmentTypes.length > 0 ? validEquipmentTypes : ['cart-truck']
    };
  };
  const [applications, setApplications] = useState<Application[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [message, setMessage] = useState('');
  const [newApplication, setNewApplication] = useState({
    name: '',
    description: '',
    category: 'mixed' as const,
    applicationCategory: undefined as 'trees' | 'other' | undefined,
    products: [] as ApplicationProduct[],
    isActive: true,
    isDefault: false,
    availableKiosks: ['mixed'] as ('specialty' | 'mixed' | 'fertilizer')[]
  });

  // Product selection state
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedEquipmentTypes, setSelectedEquipmentTypes] = useState<('hose-truck' | 'trailer' | 'cart-truck' | 'backpack')[]>([]);
  
  // Edit product state
  const [openEditProductDialog, setOpenEditProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApplicationProduct | null>(null);

  useEffect(() => {
    // Clear any previous error messages and force fresh state
    setMessage('');
    setOpenDialog(false);
    setEditingApplication(null);
    loadApplications();
    loadProducts();
  }, []);

  // Debug: Monitor editing application changes
  useEffect(() => {
    if (editingApplication) {
      console.log('🔄 EditingApplication state changed:', {
        name: editingApplication.name,
        category: editingApplication.category,
        id: editingApplication.id
      });
    }
  }, [editingApplication?.category, editingApplication?.name]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      console.log('🔍 Starting application load process...');
      console.log('📡 Current Firebase project:', db.app.options.projectId);
      console.log('🌐 Database app name:', db.app.name);
      console.log('🔗 Collection path: applications');
      
      const applicationsRef = collection(db, 'applications');
      console.log('� Collection reference created:', applicationsRef);
      
      const querySnapshot = await getDocs(applicationsRef);
      console.log('📊 Query completed successfully!');
      console.log('📊 Query results:', {
        size: querySnapshot.size,
        empty: querySnapshot.empty,
        docCount: querySnapshot.docs.length,
        metadata: querySnapshot.metadata
      });
      
      if (querySnapshot.empty) {
        console.log('📭 No applications found in database');
      } else {
        console.log('📄 Found documents:', querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
      }
      
      const applicationsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Processing application:', doc.id, data);
        console.log('  └─ availableKiosks:', data.availableKiosks || 'NOT SET');
        
        // Migrate legacy products to include truckTypes
        const migratedProducts = data.products ? data.products.map(migrateLegacyProduct) : [];
        
        return {
          id: doc.id,
          ...data,
          products: migratedProducts
        };
      }) as Application[];
      
      console.log('📝 Total applications processed:', applicationsData.length);
      
      // Safe sorting - handle missing name properties
      const sortedApplications = applicationsData.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      });
      
      setApplications(sortedApplications);
      
      // Clear any previous error messages on successful load
      setMessage('');
      console.log('✅ Applications loaded successfully!');
    } catch (error) {
      console.error('❌ Error during application loading:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        code: (error as any)?.code,
        details: (error as any)?.details
      });
      setMessage('Error loading applications: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
      console.log('🔚 Application loading process complete');
    }
  };

  const loadProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData.filter(p => p.isActive));
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleAddApplication = async () => {
    console.log('🆕 Starting application creation...', newApplication);
    
    if (!newApplication.name.trim()) {
      console.log('❌ Application name is empty');
      setMessage('Application name is required');
      return;
    }

    try {
      console.log('💾 Saving application to Firestore...', {
        name: newApplication.name,
        products: newApplication.products.length,
        category: newApplication.category
      });
      
      // Create a clean object without undefined fields for Firestore
      const applicationData: any = {
        name: newApplication.name || '',
        description: newApplication.description || '',
        category: newApplication.category || 'mixed',
        products: newApplication.products || [],
        isActive: newApplication.isActive !== undefined ? newApplication.isActive : true,
        isDefault: newApplication.isDefault !== undefined ? newApplication.isDefault : false,
        availableKiosks: newApplication.availableKiosks || ['mixed'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Only add applicationCategory if it has a valid value
      if (newApplication.applicationCategory && 
          (newApplication.applicationCategory === 'trees' || newApplication.applicationCategory === 'other')) {
        applicationData.applicationCategory = newApplication.applicationCategory;
      }
      
      console.log('📝 Clean application data:', applicationData);
      
      const docRef = await addDoc(collection(db, 'applications'), applicationData);
      
      console.log('✅ Application added with ID:', docRef.id);
      setMessage('Application added successfully!');
      setOpenDialog(false);
      setNewApplication({ 
        name: '', 
        description: '', 
        category: 'mixed', 
        applicationCategory: undefined,
        products: [], 
        isActive: true,
        isDefault: false,
        availableKiosks: ['mixed']
      });
      loadApplications();
    } catch (error) {
      console.error('❌ Error adding application:', error);
      setMessage('Error adding application: ' + (error as Error).message);
    }
  };

  const handleEditApplication = async () => {
    console.log('🔄 Starting handleEditApplication...');
    
    if (saving) {
      console.log('⏳ Already saving, skipping...');
      return;
    }
    
    if (!editingApplication) {
      console.log('❌ No editing application found');
      setMessage('No application selected for editing');
      return;
    }
    
    console.log('📝 Editing application:', {
      id: editingApplication.id,
      name: editingApplication.name,
      category: editingApplication.category,
      products: editingApplication.products?.length || 0,
      availableKiosks: editingApplication.availableKiosks
    });
    
    if (!editingApplication.name.trim()) {
      console.log('❌ Application name is empty');
      setMessage('Application name is required');
      return;
    }
    

    
    setSaving(true);
    try {
      console.log('💾 Updating application in Firestore...');
      console.log('🆔 Application ID:', editingApplication.id);
      console.log('🏪 Database project:', db.app.options.projectId);
      
      // Verify document exists
      const docRef = doc(db, 'applications', editingApplication.id);
      console.log('📄 Document reference:', docRef.path);
      
      // Clean up products before saving
      const cleanedProducts = editingApplication.products.map(product => migrateLegacyProduct(product));
      console.log('🧹 Cleaned products count:', cleanedProducts.length);
      
      // Validate category
      const validCategories = ['fertilizer', 'herbicide', 'insecticide', 'pre-emergent', 'spreader-sticker', 'mixed'];
      const category = editingApplication.category || 'mixed';
      
      if (!validCategories.includes(category)) {
        console.log('❌ Invalid category:', category);
        setMessage(`Invalid category: ${category}. Must be one of: ${validCategories.join(', ')}`);
        return;
      }
      
      console.log('✅ Category validation passed:', category);
      
      // Build update data - only include applicationCategory if it has a valid value
      const updateData: any = {
        name: editingApplication.name.trim(),
        description: editingApplication.description || '',
        category: category,
        products: cleanedProducts,
        isActive: editingApplication.isActive !== undefined ? editingApplication.isActive : true,
        isDefault: editingApplication.isDefault || false,
        availableKiosks: editingApplication.availableKiosks || ['mixed'],
        updatedAt: new Date()
      };
      
      // Only add applicationCategory if it has a valid value (not undefined/null/empty)
      if (editingApplication.applicationCategory && 
          (editingApplication.applicationCategory === 'trees' || editingApplication.applicationCategory === 'other')) {
        updateData.applicationCategory = editingApplication.applicationCategory;
      }
      
      console.log('📊 Update data:', updateData);
      console.log('📊 Category being saved:', updateData.category);
      
      await updateDoc(docRef, updateData);
      
      console.log('✅ Application updated successfully in Firestore!');
      console.log('✅ Updated category to:', updateData.category);
      setMessage('Application updated successfully!');
      setOpenDialog(false);
      setEditingApplication(null);
      loadApplications();
    } catch (error) {
      console.error('❌ Error updating application:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        details: (error as any)?.details,
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      setMessage('Error updating application: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (applicationId: string, applicationName: string) => {
    if (window.confirm(`Set "${applicationName}" as the default application?`)) {
      try {
        // First, remove default flag from all applications
        const querySnapshot = await getDocs(collection(db, 'applications'));
        const batch = writeBatch(db);
        
        querySnapshot.docs.forEach((document) => {
          batch.update(doc(db, 'applications', document.id), { isDefault: false });
        });
        
        // Then set the selected application as default
        batch.update(doc(db, 'applications', applicationId), { isDefault: true });
        
        await batch.commit();
        setMessage(`"${applicationName}" set as default application!`);
        loadApplications();
      } catch (error) {
        console.error('Error setting default application:', error);
        setMessage('Error setting default application: ' + (error as Error).message);
      }
    }
  };

  const handleDeleteApplication = async (applicationId: string, applicationName: string) => {
    if (window.confirm(`Are you sure you want to delete "${applicationName}"?`)) {
      try {
        await deleteDoc(doc(db, 'applications', applicationId));
        setMessage('Application deleted successfully!');
        loadApplications();
      } catch (error) {
        console.error('Error deleting application:', error);
        setMessage('Error deleting application: ' + (error as Error).message);
      }
    }
  };

  const openAddDialog = () => {
    console.log('🔧 Opening add application dialog...');
    setEditingApplication(null);
    setNewApplication({ 
      name: '', 
      description: '', 
      category: 'mixed',
      applicationCategory: undefined, 
      products: [], 
      isActive: true,
      isDefault: false,
      availableKiosks: ['mixed']
    });
    setOpenDialog(true);
    console.log('✅ Dialog should now be open');
  };

  const openEditDialog = (application: Application) => {
    console.log('🔧 Opening edit dialog for application:', application.id);
    console.log('  └─ Current availableKiosks:', application.availableKiosks);
    
    // Ensure availableKiosks is initialized for legacy applications
    const appWithKiosks = {
      ...application,
      availableKiosks: application.availableKiosks || []
    };
    
    console.log('  └─ After initialization:', appWithKiosks.availableKiosks);
    setEditingApplication(appWithKiosks);
    setOpenDialog(true);
  };

  const addProductToApplication = () => {
    if (!selectedProduct || selectedEquipmentTypes.length === 0) {
      setMessage('Please select a product and at least one equipment type');
      return;
    }

    // Filter out equipment types that don't have valid rates
    const validEquipmentTypes = selectedEquipmentTypes.filter(equipType => {
      switch (equipType) {
        case 'hose-truck':
          return selectedProduct.hoseRatePerGallon && selectedProduct.hoseRatePerGallon > 0;
        case 'trailer':
          return selectedProduct.trailerRatePerGallon && selectedProduct.trailerRatePerGallon > 0;
        case 'cart-truck':
          return selectedProduct.cartRatePerGallon && selectedProduct.cartRatePerGallon > 0;
        case 'backpack':
          return selectedProduct.backpackRatePerGallon && selectedProduct.backpackRatePerGallon > 0;
        default:
          return false;
      }
    });

    if (validEquipmentTypes.length === 0) {
      setMessage('Selected equipment types are not valid for this product');
      return;
    }

    const applicationProduct: ApplicationProduct = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productType: selectedProduct.type,
      hoseRate: selectedProduct.hoseRatePerGallon || 0,
      cartRate: selectedProduct.cartRatePerGallon || 0,
      trailerRate: selectedProduct.trailerRatePerGallon || 0,
      backpackRate: selectedProduct.backpackRatePerGallon || 0,
      unit: selectedProduct.unit,
      equipmentTypes: validEquipmentTypes
    };

    if (editingApplication) {
      // Check if product already exists
      const existingProduct = editingApplication.products.find(p => p.productId === selectedProduct.id);
      if (existingProduct) {
        setMessage('Product already added to this application');
        return;
      }

      setEditingApplication({
        ...editingApplication,
        products: [...editingApplication.products, applicationProduct]
      });
    } else {
      // Check if product already exists
      const existingProduct = newApplication.products.find(p => p.productId === selectedProduct.id);
      if (existingProduct) {
        setMessage('Product already added to this application');
        return;
      }

      setNewApplication({
        ...newApplication,
        products: [...newApplication.products, applicationProduct]
      });
    }

    setSelectedProduct(null);
    setSelectedEquipmentTypes([]);
    setOpenProductDialog(false);
    setMessage(`Added ${selectedProduct.name} to application`);
  };

  const removeProductFromApplication = (productId: string) => {
    if (editingApplication) {
      setEditingApplication({
        ...editingApplication,
        products: editingApplication.products.filter(p => p.productId !== productId)
      });
    } else {
      setNewApplication({
        ...newApplication,
        products: newApplication.products.filter(p => p.productId !== productId)
      });
    }
  };

  const handleEditProductInApplication = (product: ApplicationProduct) => {
    // Clean up equipment types when editing to prevent invalid selections
    const validEquipmentTypes = (product.equipmentTypes || []).filter(equipType => {
      switch (equipType) {
        case 'hose-truck':
          return product.hoseRate && product.hoseRate > 0;
        case 'trailer':
          return product.trailerRate && product.trailerRate > 0;
        case 'cart-truck':
          return product.cartRate && product.cartRate > 0;
        case 'backpack':
          return product.backpackRate && product.backpackRate > 0;
        default:
          return false;
      }
    });
    
    setEditingProduct(product);
    setSelectedEquipmentTypes(validEquipmentTypes);
    setOpenEditProductDialog(true);
  };

  const updateProductInApplication = () => {
    if (!editingProduct || selectedEquipmentTypes.length === 0) {
      setMessage('Please select at least one equipment type');
      return;
    }

    // Filter out equipment types that don't have valid rates
    const validEquipmentTypes = selectedEquipmentTypes.filter(equipType => {
      switch (equipType) {
        case 'hose-truck':
          return editingProduct.hoseRate && editingProduct.hoseRate > 0;
        case 'trailer':
          return editingProduct.trailerRate && editingProduct.trailerRate > 0;
        case 'cart-truck':
          return editingProduct.cartRate && editingProduct.cartRate > 0;
        case 'backpack':
          return editingProduct.backpackRate && editingProduct.backpackRate > 0;
        default:
          return false;
      }
    });

    if (validEquipmentTypes.length === 0) {
      setMessage('Selected equipment types are not valid for this product');
      return;
    }

    const updatedProduct: ApplicationProduct = {
      ...editingProduct,
      equipmentTypes: validEquipmentTypes
    };

    if (editingApplication) {
      setEditingApplication({
        ...editingApplication,
        products: editingApplication.products.map(p => 
          p.productId === editingProduct.productId ? updatedProduct : p
        )
      });
    } else {
      setNewApplication({
        ...newApplication,
        products: newApplication.products.map(p => 
          p.productId === editingProduct.productId ? updatedProduct : p
        )
      });
    }

    setEditingProduct(null);
    setSelectedEquipmentTypes([]);
    setOpenEditProductDialog(false);
    setMessage(`Updated ${editingProduct.productName} equipment types`);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fertilizer': return 'success';
      case 'herbicide': return 'warning';
      case 'insecticide': return 'error';
      case 'fungicide': return 'secondary';
      case 'pre-emergent': return 'info';
      case 'spreader-sticker': return 'primary';
      case 'mixed': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading applications...</Typography>
      </Container>
    );
  }

  const currentProducts = editingApplication ? editingApplication.products : newApplication.products;

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Button 
            color="inherit" 
            startIcon={<BackIcon />}
            onClick={() => navigate('/admin')}
            sx={{ mr: 2 }}
          >
            Back to Admin
          </Button>
          <ApplicationIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Application Management
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {message && (
          <Alert 
            severity={message.includes('Error') || message.includes('Please') ? 'error' : 'success'} 
            sx={{ mb: 3 }} 
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Recipes
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={openAddDialog}
              size="large"
            >
              Create New Recipe
            </Button>
          </Box>
        </Box>

        {/* Applications Overview */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="primary.main">
                  {applications.filter(a => a.isActive).length}
                </Typography>
                <Typography variant="caption">Active Applications</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="success.main">
                  {applications.filter(a => a.category === 'fertilizer' && a.isActive).length}
                </Typography>
                <Typography variant="caption">Fertilizer Mixes</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="warning.main">
                  {applications.filter(a => a.category === 'herbicide' && a.isActive).length}
                </Typography>
                <Typography variant="caption">Herbicide Mixes</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="primary.main">
                  {applications.filter(a => a.category === 'mixed' && a.isActive).length}
                </Typography>
                <Typography variant="caption">Mixed Applications</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Applications Table */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Application Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Products</TableCell>
                    <TableCell>Equipment Compatibility</TableCell>
                    <TableCell>Available Kiosks</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{application.name}</Typography>
                          {application.description && (
                            <Typography variant="caption" color="text.secondary">
                              {application.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={application.category} 
                          color={getCategoryColor(application.category) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {(application.products || []).length} product{(application.products || []).length !== 1 ? 's' : ''}
                        </Typography>
                        {(application.products || []).slice(0, 2).map(product => (
                          <Typography key={product.productId} variant="caption" display="block" color="text.secondary">
                            {product.productName}
                          </Typography>
                        ))}
                        {(application.products || []).length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{(application.products || []).length - 2} more...
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          // Collect all unique equipment types from all products
                          const allEquipmentTypes = new Set<string>();
                          application.products.forEach(product => {
                            const migratedProduct = migrateLegacyProduct(product);
                            migratedProduct.equipmentTypes.forEach(type => allEquipmentTypes.add(type));
                          });
                          
                          return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {allEquipmentTypes.size > 0 ? (
                                Array.from(allEquipmentTypes).sort().map(equipType => {
                                  const getEquipmentIcon = (type: string) => {
                                    switch(type) {
                                      case 'hose-truck': return <HoseTruckIcon />;
                                      case 'trailer': return <TrailerIcon />;
                                      case 'cart-truck': return <CartTruckIcon />;
                                      case 'backpack': return <BackpackIcon />;
                                      default: return <CheckIcon />;
                                    }
                                  };
                                  
                                  const getEquipmentLabel = (type: string) => {
                                    switch(type) {
                                      case 'hose-truck': return 'Hose Truck';
                                      case 'trailer': return 'Trailer';
                                      case 'cart-truck': return 'Cart Truck';
                                      case 'backpack': return 'Backpack';
                                      default: return type;
                                    }
                                  };
                                  
                                  const getEquipmentStyle = (type: string) => {
                                    switch(type) {
                                      case 'hose-truck': return { bgcolor: '#0066cc', color: 'white', borderColor: '#0066cc' };   // Bright Blue
                                      case 'cart-truck': return { bgcolor: '#cc0066', color: 'white', borderColor: '#cc0066' };   // Magenta/Pink
                                      case 'trailer': return { bgcolor: '#00cc66', color: 'white', borderColor: '#00cc66' };      // Bright Green
                                      case 'backpack': return { bgcolor: '#ff6600', color: 'white', borderColor: '#ff6600' };     // Bright Orange
                                      default: return { bgcolor: 'grey.400', color: 'white', borderColor: 'grey.400' };
                                    }
                                  };
                                  
                                  return (
                                    <Chip
                                      key={equipType}
                                      icon={getEquipmentIcon(equipType)}
                                      label={getEquipmentLabel(equipType)}
                                      size="small"
                                      variant="outlined"
                                      sx={getEquipmentStyle(equipType)}
                                    />
                                  );
                                })
                              ) : (
                                <Chip
                                  label="No equipment set"
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {(application.availableKiosks && application.availableKiosks.length > 0) ? (
                            application.availableKiosks.map(kiosk => (
                              <Chip
                                key={kiosk}
                                label={
                                  kiosk === 'specialty' ? 'Standard' :
                                  kiosk === 'mixed' ? 'Specialty' :
                                  'Fertilizer'
                                }
                                size="small"
                                color={
                                  kiosk === 'specialty' ? 'primary' :
                                  kiosk === 'mixed' ? 'success' :
                                  'warning'
                                }
                                variant="outlined"
                              />
                            ))
                          ) : (
                            <Chip
                              label="Not Set"
                              size="small"
                              color="default"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={application.isActive ? 'Active' : 'Inactive'} 
                            color={application.isActive ? 'success' : 'error'}
                            size="small"
                          />
                          {application.isDefault && (
                            <Chip 
                              label="Default" 
                              color="warning"
                              size="small"
                              icon={<DefaultIcon />}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {!application.isDefault && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleSetDefault(application.id, application.name)}
                            color="warning"
                            title="Set as Default Application"
                          >
                            <DefaultIcon />
                          </IconButton>
                        )}
                        <IconButton 
                          size="small" 
                          onClick={() => openEditDialog(application)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteApplication(application.id, application.name)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {applications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No applications found. Create your first application recipe to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Add/Edit Application Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingApplication ? 'Edit Application' : 'Create New Application'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Application Name *"
                  fullWidth
                  variant="outlined"
                  required
                  value={editingApplication ? editingApplication.name : newApplication.name}
                  onChange={(e) => {
                    if (editingApplication) {
                      setEditingApplication({ ...editingApplication, name: e.target.value });
                    } else {
                      setNewApplication({ ...newApplication, name: e.target.value });
                    }
                  }}
                  helperText="Enter a descriptive name for this application recipe"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={editingApplication ? editingApplication.category : newApplication.category}
                    label="Category"
                    onChange={(e) => {
                      if (editingApplication) {
                        setEditingApplication({ ...editingApplication, category: e.target.value as any });
                      } else {
                        setNewApplication({ ...newApplication, category: e.target.value as any });
                      }
                    }}
                  >
                    <MenuItem value="fertilizer">Fertilizer</MenuItem>
                    <MenuItem value="herbicide">Herbicide</MenuItem>
                    <MenuItem value="insecticide">Insecticide</MenuItem>
                    <MenuItem value="fungicide">Fungicide</MenuItem>
                    <MenuItem value="pre-emergent">Pre-emergent</MenuItem>
                    <MenuItem value="spreader-sticker">Spreader Sticker</MenuItem>
                    <MenuItem value="mixed">Mixed Application</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Description (optional)"
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={2}
                  value={editingApplication ? editingApplication.description : newApplication.description}
                  onChange={(e) => {
                    if (editingApplication) {
                      setEditingApplication({ ...editingApplication, description: e.target.value });
                    } else {
                      setNewApplication({ ...newApplication, description: e.target.value });
                    }
                  }}
                  helperText="Describe when and how to use this application"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editingApplication ? editingApplication.isActive.toString() : newApplication.isActive.toString()}
                    label="Status"
                    onChange={(e) => {
                      const isActive = e.target.value === 'true';
                      if (editingApplication) {
                        setEditingApplication({ ...editingApplication, isActive });
                      } else {
                        setNewApplication({ ...newApplication, isActive });
                      }
                    }}
                  >
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Application Category (Trees vs Other) */}
              <Grid item xs={12}>
                <FormControl component="fieldset" variant="standard">
                  <FormLabel component="legend">Application Category (for Specialty Apps)</FormLabel>
                  <FormGroup row>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mr: 3, '&:hover': { bgcolor: 'action.hover' } }}
                      onClick={() => {
                        if (editingApplication) {
                          setEditingApplication({ ...editingApplication, applicationCategory: 'trees' });
                        } else {
                          setNewApplication({ ...newApplication, applicationCategory: 'trees' });
                        }
                      }}
                    >
                      <Checkbox
                        checked={
                          (editingApplication?.applicationCategory || newApplication.applicationCategory) === 'trees'
                        }
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            if (editingApplication) {
                              setEditingApplication({ ...editingApplication, applicationCategory: 'trees' });
                            } else {
                              setNewApplication({ ...newApplication, applicationCategory: 'trees' });
                            }
                          }
                        }}
                      />
                      <Typography>Trees</Typography>
                    </Box>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                      onClick={() => {
                        if (editingApplication) {
                          setEditingApplication({ ...editingApplication, applicationCategory: 'other' });
                        } else {
                          setNewApplication({ ...newApplication, applicationCategory: 'other' });
                        }
                      }}
                    >
                      <Checkbox
                        checked={
                          (editingApplication?.applicationCategory || newApplication.applicationCategory) === 'other'
                        }
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            if (editingApplication) {
                              setEditingApplication({ ...editingApplication, applicationCategory: 'other' });
                            } else {
                              setNewApplication({ ...newApplication, applicationCategory: 'other' });
                            }
                          }
                        }}
                      />
                      <Typography>Other</Typography>
                    </Box>
                  </FormGroup>
                </FormControl>
              </Grid>

              {/* Kiosk Availability */}
              <Grid item xs={12}>
                <FormControl component="fieldset" variant="standard">
                  <FormLabel component="legend">Available on Kiosks</FormLabel>
                  <FormGroup row>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                      onClick={() => {
                        console.log('📌 Specialty Box clicked!');
                        const currentKiosks = editingApplication?.availableKiosks || newApplication.availableKiosks || [];
                        const isCurrentlyChecked = currentKiosks.includes('specialty');
                        const newCheckedState = !isCurrentlyChecked;
                        console.log(`  └─ Toggling 'specialty' from ${isCurrentlyChecked} to ${newCheckedState}`);
                        
                        let newKiosks: ('specialty' | 'mixed' | 'fertilizer')[];
                        if (newCheckedState) {
                          newKiosks = [...currentKiosks, 'specialty'];
                        } else {
                          newKiosks = currentKiosks.filter(k => k !== 'specialty');
                        }
                        
                        console.log('  └─ New kiosks:', JSON.stringify(newKiosks));
                        
                        if (editingApplication) {
                          setEditingApplication({ ...editingApplication, availableKiosks: newKiosks });
                          console.log('  └─ Updated editingApplication');
                        } else {
                          setNewApplication({ ...newApplication, availableKiosks: newKiosks });
                          console.log('  └─ Updated newApplication');
                        }
                      }}
                    >
                      <Checkbox
                        checked={
                          (editingApplication?.availableKiosks || newApplication.availableKiosks || []).includes('specialty')
                        }
                        onChange={(e) => {
                          console.log('📌 Specialty Checkbox onChange!', e.target.checked);
                          e.stopPropagation();
                          const currentKiosks = editingApplication?.availableKiosks || newApplication.availableKiosks || [];
                          
                          let newKiosks: ('specialty' | 'mixed' | 'fertilizer')[];
                          if (e.target.checked) {
                            newKiosks = currentKiosks.includes('specialty') 
                              ? currentKiosks 
                              : [...currentKiosks, 'specialty'];
                          } else {
                            newKiosks = currentKiosks.filter(k => k !== 'specialty');
                          }
                          
                          console.log('  └─ New kiosks:', JSON.stringify(newKiosks));
                          
                          if (editingApplication) {
                            setEditingApplication({ ...editingApplication, availableKiosks: newKiosks });
                          } else {
                            setNewApplication({ ...newApplication, availableKiosks: newKiosks });
                          }
                        }}
                      />
                      <Typography>Standard Applications</Typography>
                    </Box>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', ml: 2, '&:hover': { bgcolor: 'action.hover' } }}
                      onClick={() => {
                        console.log('📌 Mixed Box clicked!');
                        const currentKiosks = editingApplication?.availableKiosks || newApplication.availableKiosks || [];
                        const isCurrentlyChecked = currentKiosks.includes('mixed');
                        const newCheckedState = !isCurrentlyChecked;
                        console.log(`  └─ Toggling 'mixed' from ${isCurrentlyChecked} to ${newCheckedState}`);
                        
                        let newKiosks: ('specialty' | 'mixed' | 'fertilizer')[];
                        if (newCheckedState) {
                          newKiosks = [...currentKiosks, 'mixed'];
                        } else {
                          newKiosks = currentKiosks.filter(k => k !== 'mixed');
                        }
                        
                        console.log('  └─ New kiosks:', JSON.stringify(newKiosks));
                        
                        if (editingApplication) {
                          setEditingApplication({ ...editingApplication, availableKiosks: newKiosks });
                          console.log('  └─ Updated editingApplication');
                        } else {
                          setNewApplication({ ...newApplication, availableKiosks: newKiosks });
                          console.log('  └─ Updated newApplication');
                        }
                      }}
                    >
                      <Checkbox
                        checked={
                          (editingApplication?.availableKiosks || newApplication.availableKiosks || []).includes('mixed')
                        }
                        onChange={(e) => {
                          console.log('📌 Mixed Checkbox onChange!', e.target.checked);
                          e.stopPropagation();
                          const currentKiosks = editingApplication?.availableKiosks || newApplication.availableKiosks || [];
                          
                          let newKiosks: ('specialty' | 'mixed' | 'fertilizer')[];
                          if (e.target.checked) {
                            newKiosks = currentKiosks.includes('mixed') 
                              ? currentKiosks 
                              : [...currentKiosks, 'mixed'];
                          } else {
                            newKiosks = currentKiosks.filter(k => k !== 'mixed');
                          }
                          
                          console.log('  └─ New kiosks:', JSON.stringify(newKiosks));
                          
                          if (editingApplication) {
                            setEditingApplication({ ...editingApplication, availableKiosks: newKiosks });
                          } else {
                            setNewApplication({ ...newApplication, availableKiosks: newKiosks });
                          }
                        }}
                      />
                      <Typography>Specialty Apps</Typography>
                    </Box>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', ml: 2, '&:hover': { bgcolor: 'action.hover' } }}
                      onClick={() => {
                        console.log('📌 Fertilizer Box clicked!');
                        const currentKiosks = editingApplication?.availableKiosks || newApplication.availableKiosks || [];
                        const isCurrentlyChecked = currentKiosks.includes('fertilizer');
                        const newCheckedState = !isCurrentlyChecked;
                        console.log(`  └─ Toggling 'fertilizer' from ${isCurrentlyChecked} to ${newCheckedState}`);
                        
                        let newKiosks: ('specialty' | 'mixed' | 'fertilizer')[];
                        if (newCheckedState) {
                          newKiosks = [...currentKiosks, 'fertilizer'];
                        } else {
                          newKiosks = currentKiosks.filter(k => k !== 'fertilizer');
                        }
                        
                        console.log('  └─ New kiosks:', JSON.stringify(newKiosks));
                        
                        if (editingApplication) {
                          setEditingApplication({ ...editingApplication, availableKiosks: newKiosks });
                          console.log('  └─ Updated editingApplication');
                        } else {
                          setNewApplication({ ...newApplication, availableKiosks: newKiosks });
                          console.log('  └─ Updated newApplication');
                        }
                      }}
                    >
                      <Checkbox
                        checked={
                          (editingApplication?.availableKiosks || newApplication.availableKiosks || []).includes('fertilizer')
                        }
                        onChange={(e) => {
                          console.log('📌 Fertilizer Checkbox onChange!', e.target.checked);
                          e.stopPropagation();
                          const currentKiosks = editingApplication?.availableKiosks || newApplication.availableKiosks || [];
                          
                          let newKiosks: ('specialty' | 'mixed' | 'fertilizer')[];
                          if (e.target.checked) {
                            newKiosks = currentKiosks.includes('fertilizer') 
                              ? currentKiosks 
                              : [...currentKiosks, 'fertilizer'];
                          } else {
                            newKiosks = currentKiosks.filter(k => k !== 'fertilizer');
                          }
                          
                          console.log('  └─ New kiosks:', JSON.stringify(newKiosks));
                          
                          if (editingApplication) {
                            setEditingApplication({ ...editingApplication, availableKiosks: newKiosks });
                          } else {
                            setNewApplication({ ...newApplication, availableKiosks: newKiosks });
                          }
                        }}
                      />
                      <Typography>Dry Fertilizer</Typography>
                    </Box>
                  </FormGroup>
                </FormControl>
              </Grid>

              {/* Products in Application */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Products in Application</Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddProductIcon />}
                    onClick={() => {
                      setSelectedProduct(null);
                      setSelectedEquipmentTypes([]);
                      setOpenProductDialog(true);
                    }}
                  >
                    Add Product
                  </Button>
                </Box>
                
                {currentProducts.length > 0 ? (
                  <List>
                    {currentProducts.map((product) => {
                      // Migrate legacy products
                      const migratedProduct = migrateLegacyProduct(product);
                      
                      return (
                      <ListItem key={product.productId} divider>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" component="span">
                                {product.productName}
                              </Typography>
                              {/* Selected equipment types for this product */}
                              <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexWrap: 'wrap' }}>
                                {migratedProduct.equipmentTypes.map((equipType) => {
                                  const getEquipmentIcon = (type: string) => {
                                    switch(type) {
                                      case 'hose-truck': return <HoseTruckIcon />;
                                      case 'trailer': return <TrailerIcon />;
                                      case 'cart-truck': return <CartTruckIcon />;
                                      case 'backpack': return <BackpackIcon />;
                                      default: return <CheckIcon />;
                                    }
                                  };
                                  
                                  const getEquipmentLabel = (type: string) => {
                                    switch(type) {
                                      case 'hose-truck': return 'Hose Truck';
                                      case 'trailer': return 'Trailer';
                                      case 'cart-truck': return 'Cart Truck';
                                      case 'backpack': return 'Backpack';
                                      default: return type;
                                    }
                                  };
                                  
                                  const getEquipmentStyle = (type: string) => {
                                    switch(type) {
                                      case 'hose-truck': return { bgcolor: '#0066cc', color: 'white' };   // Bright Blue
                                      case 'cart-truck': return { bgcolor: '#cc0066', color: 'white' };   // Magenta/Pink
                                      case 'trailer': return { bgcolor: '#00cc66', color: 'white' };      // Bright Green
                                      case 'backpack': return { bgcolor: '#ff6600', color: 'white' };     // Bright Orange
                                      default: return { bgcolor: 'grey.400', color: 'white' };
                                    }
                                  };
                                  
                                  return (
                                    <Chip
                                      key={equipType}
                                      icon={getEquipmentIcon(equipType)}
                                      label={getEquipmentLabel(equipType)}
                                      size="small"
                                      variant="filled"
                                      sx={getEquipmentStyle(equipType)}
                                    />
                                  );
                                })}
                              </Box>
                            </Box>
                          }
                          secondary={`${product.productType} - Hose: ${product.hoseRate} ${product.unit}/gal, Cart: ${product.cartRate} ${product.unit}/gal`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            onClick={() => handleEditProductInApplication(product)}
                            color="primary"
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            edge="end" 
                            onClick={() => removeProductFromApplication(product.productId)}
                            color="error"
                          >
                            <RemoveProductIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      );
                    })}
                  </List>
                ) : (
                  <Alert severity="info">
                    No products added yet. Click "Add Product" to start building your application recipe.
                  </Alert>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setOpenDialog(false);
                setEditingApplication(null);
                setSaving(false);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={editingApplication ? handleEditApplication : handleAddApplication}
              variant="contained"
              disabled={saving}
            >
              {saving ? 'Saving...' : (editingApplication ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Product Selection Dialog */}
        <Dialog open={openProductDialog} onClose={() => setOpenProductDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Product to Application</DialogTitle>
          <DialogContent>
            <Autocomplete
              options={products}
              getOptionLabel={(option) => `${option.name} (${option.type})`}
              value={selectedProduct}
              onChange={(_, newValue) => setSelectedProduct(newValue)}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Select Product" 
                  margin="dense"
                  fullWidth
                  helperText="Choose a product to add to this application"
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.type} - H:{option.hoseRatePerGallon || 0} C:{option.cartRatePerGallon || 0} {option.unit}/gal
                    </Typography>
                  </Box>
                </Box>
              )}
            />
            
            {selectedProduct && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Select Equipment Types for this Product:
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Hose: {selectedProduct.hoseRatePerGallon || 0} | Trailer: {selectedProduct.trailerRatePerGallon || 0} | Cart: {selectedProduct.cartRatePerGallon || 0} | Backpack: {selectedProduct.backpackRatePerGallon || 0} {selectedProduct.unit}/gal
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<HoseTruckIcon />}
                    label={`Hose Truck (${selectedProduct.hoseRatePerGallon || 0} ${selectedProduct.unit}/gal)`}
                    clickable={Boolean(selectedProduct.hoseRatePerGallon && selectedProduct.hoseRatePerGallon > 0)}
                    color={selectedEquipmentTypes.includes('hose-truck') ? 'primary' : 'default'}
                    variant={selectedEquipmentTypes.includes('hose-truck') ? 'filled' : 'outlined'}
                    onClick={() => {
                      if (selectedProduct.hoseRatePerGallon && selectedProduct.hoseRatePerGallon > 0) {
                        setSelectedEquipmentTypes(prev => 
                          prev.includes('hose-truck') 
                            ? prev.filter(t => t !== 'hose-truck')
                            : [...prev, 'hose-truck']
                        );
                      }
                    }}
                    disabled={!selectedProduct.hoseRatePerGallon || selectedProduct.hoseRatePerGallon <= 0}
                    sx={(!selectedProduct.hoseRatePerGallon || selectedProduct.hoseRatePerGallon <= 0) ? 
                      { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  />
                  <Chip
                    icon={<TrailerIcon />}
                    label={`Trailer (${selectedProduct.trailerRatePerGallon || 0} ${selectedProduct.unit}/gal)`}
                    clickable={Boolean(selectedProduct.trailerRatePerGallon && selectedProduct.trailerRatePerGallon > 0)}
                    color={selectedEquipmentTypes.includes('trailer') ? 'primary' : 'default'}
                    variant={selectedEquipmentTypes.includes('trailer') ? 'filled' : 'outlined'}
                    onClick={() => {
                      if (selectedProduct.trailerRatePerGallon && selectedProduct.trailerRatePerGallon > 0) {
                        setSelectedEquipmentTypes(prev => 
                          prev.includes('trailer') 
                            ? prev.filter(t => t !== 'trailer')
                            : [...prev, 'trailer']
                        );
                      }
                    }}
                    disabled={!selectedProduct.trailerRatePerGallon || selectedProduct.trailerRatePerGallon <= 0}
                    sx={(!selectedProduct.trailerRatePerGallon || selectedProduct.trailerRatePerGallon <= 0) ? 
                      { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  />
                  <Chip
                    icon={<CartTruckIcon />}
                    label={`Cart Truck (${selectedProduct.cartRatePerGallon || 0} ${selectedProduct.unit}/gal)`}
                    clickable={Boolean(selectedProduct.cartRatePerGallon && selectedProduct.cartRatePerGallon > 0)}
                    color={selectedEquipmentTypes.includes('cart-truck') ? 'secondary' : 'default'}
                    variant={selectedEquipmentTypes.includes('cart-truck') ? 'filled' : 'outlined'}
                    onClick={() => {
                      if (selectedProduct.cartRatePerGallon && selectedProduct.cartRatePerGallon > 0) {
                        setSelectedEquipmentTypes(prev => 
                          prev.includes('cart-truck') 
                            ? prev.filter(t => t !== 'cart-truck')
                            : [...prev, 'cart-truck']
                        );
                      }
                    }}
                    disabled={!selectedProduct.cartRatePerGallon || selectedProduct.cartRatePerGallon <= 0}
                    sx={(!selectedProduct.cartRatePerGallon || selectedProduct.cartRatePerGallon <= 0) ? 
                      { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  />
                  <Chip
                    icon={<BackpackIcon />}
                    label={`Backpack (${selectedProduct.backpackRatePerGallon || 0} ${selectedProduct.unit}/gal)`}
                    clickable={Boolean(selectedProduct.backpackRatePerGallon && selectedProduct.backpackRatePerGallon > 0)}
                    color={selectedEquipmentTypes.includes('backpack') ? 'secondary' : 'default'}
                    variant={selectedEquipmentTypes.includes('backpack') ? 'filled' : 'outlined'}
                    onClick={() => {
                      if (selectedProduct.backpackRatePerGallon && selectedProduct.backpackRatePerGallon > 0) {
                        setSelectedEquipmentTypes(prev => 
                          prev.includes('backpack') 
                            ? prev.filter(t => t !== 'backpack')
                            : [...prev, 'backpack']
                        );
                      }
                    }}
                    disabled={!selectedProduct.backpackRatePerGallon || selectedProduct.backpackRatePerGallon <= 0}
                    sx={(!selectedProduct.backpackRatePerGallon || selectedProduct.backpackRatePerGallon <= 0) ? 
                      { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  />
                </Box>
                {selectedEquipmentTypes.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    Please select at least one equipment type
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenProductDialog(false);
              setSelectedProduct(null);
              setSelectedEquipmentTypes([]);
            }}>Cancel</Button>
            <Button 
              onClick={addProductToApplication}
              variant="contained"
              disabled={!selectedProduct || selectedEquipmentTypes.length === 0}
            >
              Add Product
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={openEditProductDialog} onClose={() => setOpenEditProductDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Product Equipment</DialogTitle>
          <DialogContent>
            {editingProduct && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {editingProduct.productName}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  {editingProduct.productType}
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Select Equipment Types:
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Hose: {editingProduct.hoseRate || 0} | Trailer: {editingProduct.trailerRate || 0} | Cart: {editingProduct.cartRate || 0} | Backpack: {editingProduct.backpackRate || 0} {editingProduct.unit}/gal
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<HoseTruckIcon />}
                    label={`Hose Truck (${editingProduct.hoseRate || 0} ${editingProduct.unit}/gal)`}
                    clickable={Boolean(editingProduct.hoseRate && editingProduct.hoseRate > 0)}
                    color={selectedEquipmentTypes.includes('hose-truck') ? 'primary' : 'default'}
                    variant={selectedEquipmentTypes.includes('hose-truck') ? 'filled' : 'outlined'}
                    onClick={() => {
                      if (editingProduct.hoseRate && editingProduct.hoseRate > 0) {
                        setSelectedEquipmentTypes(prev => 
                          prev.includes('hose-truck') 
                            ? prev.filter(t => t !== 'hose-truck')
                            : [...prev, 'hose-truck']
                        );
                      }
                    }}
                    disabled={!editingProduct.hoseRate || editingProduct.hoseRate <= 0}
                    sx={(!editingProduct.hoseRate || editingProduct.hoseRate <= 0) ? 
                      { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  />
                  <Chip
                    icon={<TrailerIcon />}
                    label={`Trailer (${editingProduct.trailerRate || 0} ${editingProduct.unit}/gal)`}
                    clickable={Boolean(editingProduct.trailerRate && editingProduct.trailerRate > 0)}
                    color={selectedEquipmentTypes.includes('trailer') ? 'primary' : 'default'}
                    variant={selectedEquipmentTypes.includes('trailer') ? 'filled' : 'outlined'}
                    onClick={() => {
                      if (editingProduct.trailerRate && editingProduct.trailerRate > 0) {
                        setSelectedEquipmentTypes(prev => 
                          prev.includes('trailer') 
                            ? prev.filter(t => t !== 'trailer')
                            : [...prev, 'trailer']
                        );
                      }
                    }}
                    disabled={!editingProduct.trailerRate || editingProduct.trailerRate <= 0}
                    sx={(!editingProduct.trailerRate || editingProduct.trailerRate <= 0) ? 
                      { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  />
                  <Chip
                    icon={<CartTruckIcon />}
                    label={`Cart Truck (${editingProduct.cartRate || 0} ${editingProduct.unit}/gal)`}
                    clickable={Boolean(editingProduct.cartRate && editingProduct.cartRate > 0)}
                    color={selectedEquipmentTypes.includes('cart-truck') ? 'secondary' : 'default'}
                    variant={selectedEquipmentTypes.includes('cart-truck') ? 'filled' : 'outlined'}
                    onClick={() => {
                      if (editingProduct.cartRate && editingProduct.cartRate > 0) {
                        setSelectedEquipmentTypes(prev => 
                          prev.includes('cart-truck') 
                            ? prev.filter(t => t !== 'cart-truck')
                            : [...prev, 'cart-truck']
                        );
                      }
                    }}
                    disabled={!editingProduct.cartRate || editingProduct.cartRate <= 0}
                    sx={(!editingProduct.cartRate || editingProduct.cartRate <= 0) ? 
                      { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  />
                  <Chip
                    icon={<BackpackIcon />}
                    label={`Backpack (${editingProduct.backpackRate || 0} ${editingProduct.unit}/gal)`}
                    clickable={Boolean(editingProduct.backpackRate && editingProduct.backpackRate > 0)}
                    color={selectedEquipmentTypes.includes('backpack') ? 'secondary' : 'default'}
                    variant={selectedEquipmentTypes.includes('backpack') ? 'filled' : 'outlined'}
                    onClick={() => {
                      if (editingProduct.backpackRate && editingProduct.backpackRate > 0) {
                        setSelectedEquipmentTypes(prev => 
                          prev.includes('backpack') 
                            ? prev.filter(t => t !== 'backpack')
                            : [...prev, 'backpack']
                        );
                      }
                    }}
                    disabled={!editingProduct.backpackRate || editingProduct.backpackRate <= 0}
                    sx={(!editingProduct.backpackRate || editingProduct.backpackRate <= 0) ? 
                      { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  />
                </Box>
                {selectedEquipmentTypes.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    Please select at least one equipment type
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenEditProductDialog(false);
              setEditingProduct(null);
              setSelectedEquipmentTypes([]);
            }}>Cancel</Button>
            <Button 
              onClick={updateProductInApplication}
              variant="contained"
              disabled={selectedEquipmentTypes.length === 0}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default ApplicationManagement;