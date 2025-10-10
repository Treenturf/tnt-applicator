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
  Autocomplete
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
  ShoppingCart as CartTruckIcon
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
  doc,
  writeBatch
} from 'firebase/firestore';

// Application interface
interface ApplicationProduct {
  productId: string;
  productName: string;
  productType: string;
  hoseRate: number;
  cartRate: number;
  unit: string;
  truckTypes: ('hose' | 'cart')[]; // Array to support multiple truck types
}

interface Application {
  id: string;
  name: string;
  description?: string;
  category: 'fertilizer' | 'herbicide' | 'insecticide' | 'pre-emergent' | 'spreader-sticker' | 'mixed';
  products: ApplicationProduct[];
  isActive: boolean;
  isDefault?: boolean;
  createdAt?: any;
}

// Product interface (for selecting products)
interface Product {
  id: string;
  name: string;
  type: 'fertilizer' | 'herbicide' | 'insecticide' | 'pre-emergent' | 'spreader-sticker' | 'other';
  hoseRatePerGallon: number;
  cartRatePerGallon: number;
  unit: string;
  description?: string;
  isActive: boolean;
}

const ApplicationManagement: React.FC = () => {
  const {} = useAuth(); // Using auth context for consistency
  const navigate = useNavigate();

  // Helper function to determine truck compatibility for an application
  const getTruckCompatibility = (application: Application) => {
    const hasHoseRates = application.products.some(p => p.hoseRate > 0);
    const hasCartRates = application.products.some(p => p.cartRate > 0);
    return { hasHoseRates, hasCartRates };
  };

  // Helper function to migrate legacy product data (add truckTypes if missing)
  const migrateLegacyProduct = (product: any): ApplicationProduct => {
    if (!product.truckTypes) {
      // For legacy products, add truck types based on rates
      const truckTypes: ('hose' | 'cart')[] = [];
      if (product.hoseRate > 0) truckTypes.push('hose');
      if (product.cartRate > 0) truckTypes.push('cart');
      
      return {
        ...product,
        truckTypes: truckTypes.length > 0 ? truckTypes : ['cart'] // Default to cart if no rates
      };
    }
    return product;
  };
  const [applications, setApplications] = useState<Application[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [message, setMessage] = useState('');
  const [newApplication, setNewApplication] = useState({
    name: '',
    description: '',
    category: 'mixed' as const,
    products: [] as ApplicationProduct[],
    isActive: true,
    isDefault: false
  });

  // Product selection state
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTruckTypes, setSelectedTruckTypes] = useState<('hose' | 'cart')[]>([]);

  useEffect(() => {
    // Clear any previous error messages and force fresh state
    setMessage('');
    setOpenDialog(false);
    setEditingApplication(null);
    loadApplications();
    loadProducts();
  }, []);

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
      const applicationData = {
        name: newApplication.name || '',
        description: newApplication.description || '',
        category: newApplication.category || 'mixed',
        products: newApplication.products || [],
        isActive: newApplication.isActive !== undefined ? newApplication.isActive : true,
        isDefault: newApplication.isDefault !== undefined ? newApplication.isDefault : false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('📝 Clean application data:', applicationData);
      
      const docRef = await addDoc(collection(db, 'applications'), applicationData);
      
      console.log('✅ Application added with ID:', docRef.id);
      setMessage('Application added successfully!');
      setOpenDialog(false);
      setNewApplication({ 
        name: '', 
        description: '', 
        category: 'mixed', 
        products: [], 
        isActive: true,
        isDefault: false
      });
      loadApplications();
    } catch (error) {
      console.error('❌ Error adding application:', error);
      setMessage('Error adding application: ' + (error as Error).message);
    }
  };

  const handleEditApplication = async () => {
    if (!editingApplication) return;
    
    if (!editingApplication.name.trim()) {
      setMessage('Application name is required');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'applications', editingApplication.id), {
        name: editingApplication.name,
        description: editingApplication.description,
        category: editingApplication.category,
        products: editingApplication.products,
        isActive: editingApplication.isActive,
        isDefault: editingApplication.isDefault || false
      });
      setMessage('Application updated successfully!');
      setOpenDialog(false);
      setEditingApplication(null);
      loadApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      setMessage('Error updating application: ' + (error as Error).message);
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
      products: [], 
      isActive: true,
      isDefault: false
    });
    setOpenDialog(true);
    console.log('✅ Dialog should now be open');
  };

  const openEditDialog = (application: Application) => {
    setEditingApplication(application);
    setOpenDialog(true);
  };

  const addProductToApplication = () => {
    if (!selectedProduct || selectedTruckTypes.length === 0) {
      setMessage('Please select a product and at least one truck type');
      return;
    }

    const applicationProduct: ApplicationProduct = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productType: selectedProduct.type,
      hoseRate: selectedProduct.hoseRatePerGallon || 0,
      cartRate: selectedProduct.cartRatePerGallon || 0,
      unit: selectedProduct.unit,
      truckTypes: [...selectedTruckTypes]
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
    setSelectedTruckTypes([]);
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fertilizer': return 'success';
      case 'herbicide': return 'warning';
      case 'insecticide': return 'error';
      case 'pre-emergent': return 'info';
      case 'spreader-sticker': return 'secondary';
      case 'mixed': return 'primary';
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
            Application Recipes
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={openAddDialog}
            size="large"
          >
            Create New Application
          </Button>
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
                    <TableCell>Truck Compatibility</TableCell>
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
                          const compatibility = getTruckCompatibility(application);
                          return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {compatibility.hasHoseRates && (
                                <Chip
                                  icon={<CheckIcon />}
                                  label="Hose Truck"
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              )}
                              {compatibility.hasCartRates && (
                                <Chip
                                  icon={<CheckIcon />}
                                  label="Cart Truck"
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                />
                              )}
                              {!compatibility.hasHoseRates && !compatibility.hasCartRates && (
                                <Chip
                                  label="No rates set"
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
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
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

              {/* Products in Application */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Products in Application</Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddProductIcon />}
                    onClick={() => {
                      setSelectedProduct(null);
                      setSelectedTruckTypes([]);
                      setOpenProductDialog(true);
                    }}
                  >
                    Add Product
                  </Button>
                </Box>
                
                {currentProducts.length > 0 ? (
                  <List>
                    {currentProducts.map((product) => (
                      <ListItem key={product.productId} divider>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" component="span">
                                {product.productName}
                              </Typography>
                              {/* Selected truck types for this product */}
                              <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                                {product.truckTypes ? (
                                  product.truckTypes.map((truckType) => (
                                    <Chip
                                      key={truckType}
                                      icon={truckType === 'hose' ? <HoseTruckIcon /> : <CartTruckIcon />}
                                      label={`${truckType === 'hose' ? 'Hose' : 'Cart'} Truck`}
                                      size="small"
                                      color={truckType === 'hose' ? 'primary' : 'secondary'}
                                      variant="filled"
                                    />
                                  ))
                                ) : (
                                  // Fallback for legacy products without truckTypes
                                  <>
                                    {product.hoseRate > 0 && (
                                      <Chip
                                        icon={<CheckIcon />}
                                        label="Hose Truck"
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                    )}
                                    {product.cartRate > 0 && (
                                      <Chip
                                        icon={<CheckIcon />}
                                        label="Cart Truck"
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                      />
                                    )}
                                    {product.hoseRate === 0 && product.cartRate === 0 && (
                                      <Chip
                                        label="No rates set"
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                      />
                                    )}
                                  </>
                                )}
                              </Box>
                            </Box>
                          }
                          secondary={`${product.productType} - Hose: ${product.hoseRate} ${product.unit}/gal, Cart: ${product.cartRate} ${product.unit}/gal`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            onClick={() => removeProductFromApplication(product.productId)}
                            color="error"
                          >
                            <RemoveProductIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
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
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              onClick={editingApplication ? handleEditApplication : handleAddApplication}
              variant="contained"
            >
              {editingApplication ? 'Update' : 'Create'}
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
                  Select Truck Types for this Product:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<HoseTruckIcon />}
                    label={`Hose Truck (${selectedProduct.hoseRatePerGallon || 0} ${selectedProduct.unit}/gal)`}
                    clickable
                    color={selectedTruckTypes.includes('hose') ? 'primary' : 'default'}
                    variant={selectedTruckTypes.includes('hose') ? 'filled' : 'outlined'}
                    onClick={() => {
                      if (selectedProduct.hoseRatePerGallon > 0) {
                        setSelectedTruckTypes(prev => 
                          prev.includes('hose') 
                            ? prev.filter(t => t !== 'hose')
                            : [...prev, 'hose']
                        );
                      }
                    }}
                    disabled={selectedProduct.hoseRatePerGallon <= 0}
                  />
                  <Chip
                    icon={<CartTruckIcon />}
                    label={`Cart Truck (${selectedProduct.cartRatePerGallon || 0} ${selectedProduct.unit}/gal)`}
                    clickable
                    color={selectedTruckTypes.includes('cart') ? 'primary' : 'default'}
                    variant={selectedTruckTypes.includes('cart') ? 'filled' : 'outlined'}
                    onClick={() => {
                      if (selectedProduct.cartRatePerGallon > 0) {
                        setSelectedTruckTypes(prev => 
                          prev.includes('cart') 
                            ? prev.filter(t => t !== 'cart')
                            : [...prev, 'cart']
                        );
                      }
                    }}
                    disabled={selectedProduct.cartRatePerGallon <= 0}
                  />
                </Box>
                {selectedTruckTypes.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    Please select at least one truck type
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenProductDialog(false);
              setSelectedProduct(null);
              setSelectedTruckTypes([]);
            }}>Cancel</Button>
            <Button 
              onClick={addProductToApplication}
              variant="contained"
              disabled={!selectedProduct || selectedTruckTypes.length === 0}
            >
              Add Product
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default ApplicationManagement;