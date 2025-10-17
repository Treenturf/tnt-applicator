import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  IconButton,
  FormControlLabel,
  Checkbox
} from '@mui/material';
// Using emoji instead of Material-UI icons for better compatibility
import { useAuth } from '../contexts/AuthContext';
import { useKiosk } from '../contexts/KioskContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const AdminPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentKiosk } = useKiosk();
  const navigate = useNavigate();

  // State management
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [kiosks, setKiosks] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dialog states
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openKioskDialog, setOpenKioskDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingKiosk, setEditingKiosk] = useState<any>(null);
  const [isAddingKiosk, setIsAddingKiosk] = useState(false);
  
  // Form states
  const [newUser, setNewUser] = useState({
    name: '',
    userCode: '',
    role: 'applicator',
    email: '',
    isActive: true
  });
  
  const [newKiosk, setNewKiosk] = useState<{
    name: string;
    type: string;
    description: string;
    availableProducts: string[];
    availableApplications?: string[];
    defaultTruckTypes: string[];
    calculationMode: string;
    units: { primary: string };
    location: string;
  }>({
    name: '',
    type: 'specialty',
    description: '',
    availableProducts: [],
    availableApplications: [],
    defaultTruckTypes: [],
    calculationMode: 'both',
    units: { primary: 'gallons' },
    location: ''
  });

  // Navigation items
  const navigationItems = [
    {
      title: 'User Management',
      description: 'Manage applicators and administrators',
      icon: <Typography sx={{ fontSize: 40, fontWeight: 'bold' }}>USERS</Typography>,
      action: () => setOpenUserDialog(true),
      color: 'primary.main'
    },
    {
      title: 'Product Management', 
      description: 'Add and manage products',
      icon: <Typography sx={{ fontSize: 40 }}>📦</Typography>,
      action: () => navigate('/admin/products'),
      color: 'success.main'
    },
    {
      title: 'Application Recipes', 
      description: 'Create and manage application recipes',
      icon: <Typography sx={{ fontSize: 40 }}>🧪</Typography>,
      action: () => navigate('/admin/applications'),
      color: 'warning.main'
    },
    {
      title: 'Kiosk Management', 
      description: 'Configure kiosk terminals and their settings',
      icon: <Typography sx={{ fontSize: 40 }}>🖥️</Typography>,
      action: () => {
        console.log('🔘 Kiosk Management card clicked!');
        // Load kiosks and open dialog
        loadKiosks();
        setOpenKioskDialog(true);
        console.log('📂 Dialog should now be open');
      },
      color: 'secondary.main'
    },
    {
      title: 'View Reports',
      description: 'Check usage reports and activity logs',
      icon: <Typography sx={{ fontSize: 40 }}>📊</Typography>,
      action: () => navigate('/reports'),
      color: 'info.main'
    },
    {
      title: 'Debug Database',
      description: 'Debug activity logs and data issues',
      icon: <Typography sx={{ fontSize: 40 }}>🔍</Typography>,
      action: () => navigate('/debug'),
      color: 'warning.main'
    }
  ];

  useEffect(() => {
    loadUsers();
    loadProducts();
    loadKiosks();
    loadApplications();
  }, []);

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Error loading users');
    }
  };

  const loadProducts = async () => {
    try {
      console.log('🔍 AdminPanel: Loading products from Firebase...');
      const productsSnapshot = await getDocs(collection(db, 'products'));
      console.log('📊 AdminPanel: Got snapshot with', productsSnapshot.docs.length, 'documents');
      
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('📦 AdminPanel: Mapped products:', productsData);
      
      const activeProducts = productsData.filter((p: any) => p.isActive);
      console.log('✅ AdminPanel: Active products:', activeProducts);
      
      setProducts(activeProducts);
      console.log('💾 AdminPanel: Set products state with', activeProducts.length, 'products');
    } catch (error) {
      console.error('❌ AdminPanel: Error loading products:', error);
      setMessage('Error loading products');
    }
  };

  const loadApplications = async () => {
    try {
      console.log('🔍 AdminPanel: Loading applications from Firebase...');
      const applicationsSnapshot = await getDocs(collection(db, 'applications'));
      const applicationsData = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const activeApplications = applicationsData.filter((a: any) => a.isActive);
      setApplications(activeApplications);
      console.log('💾 AdminPanel: Loaded', activeApplications.length, 'active applications');
    } catch (error) {
      console.error('❌ AdminPanel: Error loading applications:', error);
      setMessage('Error loading applications');
    }
  };

  const loadKiosks = async () => {
    try {
      console.log('🖥️ AdminPanel: Loading kiosks...');
      
      // Start with default kiosks
      const { DEFAULT_KIOSKS } = await import('../types/kiosk');
      console.log('📦 AdminPanel: Loaded', DEFAULT_KIOSKS.length, 'default kiosks');
      
      // Try to load saved configurations from Firestore
      try {
        const kiosksSnapshot = await getDocs(collection(db, 'kiosks'));
        console.log('🔥 Firestore: Found', kiosksSnapshot.size, 'saved kiosk configurations');
        
        if (kiosksSnapshot.size > 0) {
          // Map Firestore kiosks by ID
          const firestoreKiosks = new Map();
          kiosksSnapshot.docs.forEach(doc => {
            firestoreKiosks.set(doc.id, { id: doc.id, ...doc.data() });
          });
          
          // Merge: Use Firestore version if exists, otherwise use default
          const mergedKiosks = DEFAULT_KIOSKS.map(defaultKiosk => {
            const saved = firestoreKiosks.get(defaultKiosk.id);
            if (saved) {
              console.log('✅ Using saved config for:', defaultKiosk.id);
              console.log('   Available Products:', saved.availableProducts);
              console.log('   Product Count:', (saved.availableProducts || []).length);
              return saved;
            }
            console.log('📋 Using default config for:', defaultKiosk.id);
            return defaultKiosk;
          });
          
          setKiosks(mergedKiosks);
          console.log('💾 AdminPanel: Loaded', mergedKiosks.length, 'kiosks (merged)');
        } else {
          // No Firestore kiosks, use defaults
          setKiosks(DEFAULT_KIOSKS);
          console.log('💾 AdminPanel: Using default kiosks only');
        }
      } catch (firestoreError) {
        console.warn('⚠️ Could not load from Firestore, using defaults:', firestoreError);
        setKiosks(DEFAULT_KIOSKS);
      }
    } catch (error) {
      console.error('❌ AdminPanel: Error loading kiosks:', error);
      setMessage('Error loading kiosks');
    }
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      const userToSave = {
        ...newUser,
        userCode: newUser.userCode.toUpperCase(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingUser) {
        await updateDoc(doc(db, 'users', editingUser.id), userToSave);
        setMessage(`User "${userToSave.name}" updated successfully!`);
      } else {
        await addDoc(collection(db, 'users'), userToSave);
        setMessage(`User "${userToSave.name}" created successfully!`);
      }

      setOpenUserDialog(false);
      setEditingUser(null);
      setNewUser({ name: '', userCode: '', role: 'applicator', email: '', isActive: true });
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      setMessage('Error saving user');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKiosk = async () => {
    try {
      setLoading(true);
      
      console.log('💾 SAVING KIOSK - Current newKiosk state:', JSON.stringify(newKiosk, null, 2));
      console.log('📦 Products being saved:', newKiosk.availableProducts);
      
      if (editingKiosk) {
        // Update existing kiosk in Firestore
        const kioskToSave = {
          ...newKiosk,
          id: editingKiosk.id, // Keep the original ID
          updatedAt: new Date().toISOString()
        };
        
        console.log('✏️ UPDATING kiosk:', kioskToSave.id);
        console.log('📦 Final products to save:', kioskToSave.availableProducts);
        
        // Save to Firestore using the kiosk ID as document ID
        await setDoc(doc(db, 'kiosks', editingKiosk.id), kioskToSave, { merge: true });
        setMessage(`Kiosk "${kioskToSave.name}" updated successfully! Products assigned: ${kioskToSave.availableProducts.length}`);
        
        console.log('✅ Updated kiosk in Firestore:', kioskToSave);
        console.log('📦 Selected products:', kioskToSave.availableProducts);
      } else {
        // Create new kiosk
        const kioskToSave = {
          ...newKiosk,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        console.log('➕ CREATING new kiosk');
        console.log('📦 Final products to save:', kioskToSave.availableProducts);
        
        await addDoc(collection(db, 'kiosks'), kioskToSave);
        setMessage(`Kiosk "${kioskToSave.name}" created successfully! Products assigned: ${kioskToSave.availableProducts.length}`);
      }

      setOpenKioskDialog(false);
      setEditingKiosk(null);
      setIsAddingKiosk(false);
      setNewKiosk({
        name: '',
        type: 'specialty',
        description: '',
        availableProducts: [],
        availableApplications: [],
        defaultTruckTypes: [],
        calculationMode: 'both',
        units: { primary: 'gallons' },
        location: ''
      });
      loadKiosks();
    } catch (error) {
      console.error('Error saving kiosk:', error);
      setMessage('Error saving kiosk. Check Firestore permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditKiosk = (kiosk: any) => {
    setEditingKiosk(kiosk);
    setIsAddingKiosk(false);
    setNewKiosk({
      name: kiosk.name || '',
      type: kiosk.type || 'specialty',
      description: kiosk.description || '',
      availableProducts: kiosk.availableProducts || [],
      availableApplications: kiosk.availableApplications || [],
      defaultTruckTypes: kiosk.defaultTruckTypes || [],
      calculationMode: kiosk.calculationMode || 'both',
      units: kiosk.units || { primary: 'gallons' },
      location: kiosk.location || ''
    });
    setOpenKioskDialog(true);
  };

  const handleProductToggle = (productId: string, checked: boolean) => {
    console.log('🔄 Toggle product:', productId, 'checked:', checked);
    console.log('📦 Current availableProducts:', newKiosk.availableProducts);
    
    const currentProducts = newKiosk.availableProducts || [];
    let updated: string[];
    
    if (checked) {
      // Add product if not already in list
      updated = currentProducts.includes(productId) 
        ? currentProducts 
        : [...currentProducts, productId];
      console.log('✅ Adding product. New list:', updated);
    } else {
      // Remove product
      updated = currentProducts.filter(id => id !== productId);
      console.log('❌ Removing product. New list:', updated);
    }
    
    // Update the state with a completely new object
    setNewKiosk(prev => ({
      ...prev,
      availableProducts: updated
    }));
    
    console.log('💾 State updated with', updated.length, 'products');
  };

  const handleApplicationToggle = (applicationId: string, checked: boolean) => {
    console.log('🔄 Toggle application:', applicationId, 'checked:', checked);
    console.log('📋 Current availableApplications:', newKiosk.availableApplications);
    
    const currentApplications = newKiosk.availableApplications || [];
    let updated: string[];
    
    if (checked) {
      // Add application if not already in list
      updated = currentApplications.includes(applicationId) 
        ? currentApplications 
        : [...currentApplications, applicationId];
      console.log('✅ Adding application. New list:', updated);
    } else {
      // Remove application
      updated = currentApplications.filter(id => id !== applicationId);
      console.log('❌ Removing application. New list:', updated);
    }
    
    // Update the state with a completely new object
    setNewKiosk(prev => ({
      ...prev,
      availableApplications: updated
    }));
    
    console.log('💾 State updated with', updated.length, 'applications');
  };

  // Memoize filtered products to prevent re-renders
  const filteredProducts = useMemo(() => {
    console.log('🔍 Filtering products for kiosk type:', newKiosk.type);
    console.log('📦 Total products available:', products.length);
    
    if (newKiosk.type === 'fertilizer') {
      const filtered = products.filter(p => p.category === 'fertilizer');
      console.log('✅ Filtered fertilizer products:', filtered.length);
      return filtered;
    } else if (newKiosk.type === 'specialty') {
      const filtered = products.filter(p => 
        p.category === 'herbicide' || 
        p.category === 'insecticide' || 
        p.category === 'specialty'
      );
      console.log('✅ Filtered specialty products:', filtered.length);
      return filtered;
    } else {
      // mixed type - show all products
      console.log('✅ Showing all products for mixed kiosk');
      return products;
    }
  }, [products, newKiosk.type]);

  // Memoize filtered applications to prevent re-renders
  const filteredApplications = useMemo(() => {
    return applications.filter(app => 
      app.availableKiosks?.includes(newKiosk.type) || false
    );
  }, [applications, newKiosk.type]);

  // Log when availableProducts changes
  useEffect(() => {
    if (isAddingKiosk || editingKiosk) {
      console.log('📦 newKiosk.availableProducts changed:', newKiosk.availableProducts);
      console.log('📝 Form state - isAddingKiosk:', isAddingKiosk, 'editingKiosk:', editingKiosk?.name || 'none');
    }
  }, [newKiosk.availableProducts, isAddingKiosk, editingKiosk]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setMessage('Error logging out');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <AppBar position="static" sx={{ bgcolor: 'primary.main', mb: 4 }}>
        <Toolbar>
          <Button 
            color="inherit" 
            onClick={() => navigate('/dashboard')}
            sx={{ 
              mr: 2,
              bgcolor: 'rgba(255,255,255,0.1)', 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            Dashboard
          </Button>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            TNT Admin Panel
          </Typography>
          <Button 
            color="inherit" 
            onClick={handleLogout}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)', 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } 
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Navigation Cards */}
      <Grid container spacing={4} justifyContent="center" sx={{ mb: 4 }}>
        {navigationItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={item.action}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  {item.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Kiosk Management Dialog */}
      <Dialog open={openKioskDialog} onClose={() => setOpenKioskDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Kiosk Management
          <IconButton
            onClick={() => setOpenKioskDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Typography sx={{ fontSize: 20, fontWeight: 'bold' }}>
              ×
            </Typography>
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* Existing Kiosks */}
          <Typography variant="h6" gutterBottom>
            Existing Kiosks ({kiosks.length})
          </Typography>
          {kiosks.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1, mb: 3 }}>
              <Typography variant="body1" color="text.secondary">
                No kiosks found. Click "Add New Kiosk" to create your first kiosk.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {kiosks.map((kiosk) => (
                <Grid item xs={12} key={kiosk.id}>
                  <Card sx={{ mb: 2, border: currentKiosk?.id === kiosk.id ? '2px solid' : '1px solid', borderColor: currentKiosk?.id === kiosk.id ? 'primary.main' : 'grey.300' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6">
                            {kiosk.name}
                            {currentKiosk?.id === kiosk.id && (
                              <Chip label="Current" color="primary" size="small" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Type: {kiosk.type} • 
                            Products: {kiosk.availableProducts?.length || 0} • 
                            Location: {kiosk.location || 'Not specified'}
                          </Typography>
                          <Typography variant="body2">
                            {kiosk.description}
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleEditKiosk(kiosk)}
                        >
                          Edit
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <Button
            variant="contained"
            onClick={() => {
              console.log('➕ Add New Kiosk button clicked!');
              setEditingKiosk(null);
              setIsAddingKiosk(true);
              setNewKiosk({
                name: '',
                type: 'specialty',
                description: '',
                availableProducts: [],
                availableApplications: [],
                defaultTruckTypes: [],
                calculationMode: 'both',
                units: { primary: 'gallons' },
                location: ''
              });
              console.log('✅ isAddingKiosk set to true, newKiosk initialized');
            }}
            sx={{ mb: 3 }}
          >
            Add New Kiosk
          </Button>

          {/* Kiosk Form */}
          {(editingKiosk || isAddingKiosk) && (
            <Box sx={{ border: '1px solid', borderColor: 'grey.300', borderRadius: 1, p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {editingKiosk ? 'Edit Kiosk' : 'Add New Kiosk'}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Kiosk Name"
                    value={newKiosk.name}
                    onChange={(e) => setNewKiosk({...newKiosk, name: e.target.value})}
                    margin="dense"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Kiosk Type</InputLabel>
                    <Select
                      value={newKiosk.type}
                      label="Kiosk Type"
                      onChange={(e) => setNewKiosk({...newKiosk, type: e.target.value})}
                    >
                      <MenuItem value="specialty">Specialty (Main Terminal)</MenuItem>
                      <MenuItem value="fertilizer">Fertilizer</MenuItem>
                      <MenuItem value="mixed">Mixed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={newKiosk.description}
                    onChange={(e) => setNewKiosk({...newKiosk, description: e.target.value})}
                    margin="dense"
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={newKiosk.location}
                    onChange={(e) => setNewKiosk({...newKiosk, location: e.target.value})}
                    margin="dense"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    {newKiosk.type === 'mixed' ? 'Available Recipes' : 'Available Products'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {newKiosk.type === 'mixed' 
                      ? 'Select which application recipes should be available on this kiosk:' 
                      : 'Select which products should be available on this kiosk:'}
                  </Typography>
                  
                  <Box 
                    sx={{ 
                      maxHeight: 200, 
                      overflow: 'auto', 
                      border: '1px solid', 
                      borderColor: 'grey.300', 
                      borderRadius: 1, 
                      p: 1
                    }}
                  >
                    {newKiosk.type === 'mixed' ? (
                      // Show applications for mixed/specialty kiosk
                      filteredApplications.length === 0 ? (
                        <Typography color="text.secondary">No applications available for this kiosk type.</Typography>
                      ) : (
                        filteredApplications.map((application) => (
                          <Box 
                            key={application.id} 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              py: 0.5,
                              px: 1,
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.hover' },
                              borderRadius: 1
                            }}
                          >
                            <Checkbox
                              checked={newKiosk.availableApplications?.includes(application.id) || false}
                              onChange={(e) => {
                                console.log('📌 Application checkbox changed!', application.name, application.id, 'New state:', e.target.checked);
                                handleApplicationToggle(application.id, e.target.checked);
                              }}
                            />
                            <Box 
                              sx={{ ml: 1, flexGrow: 1, cursor: 'pointer' }}
                              onClick={() => {
                                const isCurrentlyChecked = newKiosk.availableApplications?.includes(application.id) || false;
                                const newCheckedState = !isCurrentlyChecked;
                                console.log('📌 Application label clicked!', application.name, 'Toggle to:', newCheckedState);
                                handleApplicationToggle(application.id, newCheckedState);
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {application.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {application.description || 'No description'}
                              </Typography>
                            </Box>
                          </Box>
                        ))
                      )
                    ) : (
                      // Show products for other kiosk types
                    products.length === 0 ? (
                      <Typography color="text.secondary">No products available. Please add products first.</Typography>
                    ) : (
                      <>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Found {filteredProducts.length} product(s) for this kiosk type
                        </Typography>
                        {filteredProducts.length === 0 ? (
                          <Typography color="text.secondary" sx={{ p: 2 }}>
                            No products match this kiosk type. Add products first.
                          </Typography>
                        ) : (
                          filteredProducts.map((product) => (
                            <Box 
                              key={product.id} 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                py: 0.5,
                                px: 1,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' },
                                borderRadius: 1
                              }}
                            >
                              <Checkbox
                                checked={newKiosk.availableProducts?.includes(product.id) || false}
                                onChange={(e) => {
                                  console.log('📌 Checkbox changed!', product.name, product.id, 'New state:', e.target.checked);
                                  handleProductToggle(product.id, e.target.checked);
                                }}
                              />
                              <Box 
                                sx={{ ml: 1, flexGrow: 1, cursor: 'pointer' }}
                                onClick={() => {
                                  const isCurrentlyChecked = newKiosk.availableProducts?.includes(product.id) || false;
                                  const newCheckedState = !isCurrentlyChecked;
                                  console.log('📌 Label clicked!', product.name, 'Toggle to:', newCheckedState);
                                  handleProductToggle(product.id, newCheckedState);
                                }}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {product.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Type: {product.type}
                                </Typography>
                              </Box>
                            </Box>
                          ))
                        )}
                      </>
                    )
                    )}
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleSaveKiosk}
                  disabled={loading || !newKiosk.name}
                >
                  {loading ? 'Saving...' : editingKiosk ? 'Update Kiosk' : 'Create Kiosk'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditingKiosk(null);
                    setNewKiosk({
                      name: '',
                      type: 'specialty',
                      description: '',
                      availableProducts: [],
                      availableApplications: [],
                      defaultTruckTypes: [],
                      calculationMode: 'both',
                      units: { primary: 'gallons' },
                      location: ''
                    });
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* User Management Dialog */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          User Management
          <IconButton
            onClick={() => setOpenUserDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Typography sx={{ fontSize: 20, fontWeight: 'bold' }}>
              ×
            </Typography>
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" gutterBottom>
            System Users
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>User Code</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.userCode}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        color={user.role === 'admin' ? 'secondary' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.isActive ? 'Active' : 'Inactive'} 
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            variant="contained"
            onClick={() => {
              setEditingUser(null);
              setNewUser({ name: '', userCode: '', role: 'applicator', email: '', isActive: true });
            }}
          >
            Add New User
          </Button>

          {/* User Form */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              {editingUser ? 'Edit User' : 'Add New User'}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  margin="dense"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="User Code"
                  value={newUser.userCode}
                  onChange={(e) => setNewUser({...newUser, userCode: e.target.value.toUpperCase()})}
                  margin="dense"
                  helperText="Unique identifier for the user"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={newUser.role}
                    label="Role"
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <MenuItem value="applicator">Applicator</MenuItem>
                    <MenuItem value="admin">Administrator</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  margin="dense"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleSaveUser}
                disabled={loading || !newUser.name || !newUser.userCode}
              >
                {loading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setEditingUser(null);
                  setNewUser({ name: '', userCode: '', role: 'applicator', email: '', isActive: true });
                  setOpenUserDialog(false);
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setMessage('')} severity="info">
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminPanel;