import React, { useState, useEffect } from 'react';
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
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { 
  People as PeopleIcon,
  Assessment as ReportsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Agriculture as ApplicationIcon,
  Inventory as ProductsIcon,
  Computer as KioskIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useKiosk } from '../contexts/KioskContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_KIOSKS, KIOSK_TYPES, type KioskConfig } from '../types/kiosk';

interface User {
  id: string;
  userCode: string;
  name: string;
  role: string;
  isActive: boolean;
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { currentKiosk } = useKiosk();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [kiosks, setKiosks] = useState<KioskConfig[]>([]);
  const [defaultApplication, setDefaultApplication] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openKioskDialog, setOpenKioskDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingKiosk, setEditingKiosk] = useState<KioskConfig | null>(null);
  const [newUser, setNewUser] = useState({
    userCode: '',
    name: '',
    role: 'applicator',
    isActive: true
  });
  const [newKiosk, setNewKiosk] = useState<KioskConfig>({
    id: '',
    name: '',
    type: 'specialty',
    description: '',
    availableProducts: [],
    defaultTruckTypes: ['hose', 'cart'],
    calculationMode: 'liquid',
    units: {
      primary: 'gallons'
    }
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUsers();
    loadProducts();
    loadDefaultApplication();
    loadKiosks();
  }, []);

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

  const loadKiosks = async () => {
    try {
      // For now, load from localStorage and default configurations
      // In the future, this could be moved to Firestore
      const storedKiosks = localStorage.getItem('tnt-admin-kiosks');
      if (storedKiosks) {
        setKiosks(JSON.parse(storedKiosks));
      } else {
        // Initialize with default kiosks
        setKiosks(DEFAULT_KIOSKS);
        localStorage.setItem('tnt-admin-kiosks', JSON.stringify(DEFAULT_KIOSKS));
      }
    } catch (error) {
      console.error('Error loading kiosks:', error);
      setMessage('Error loading kiosk configurations');
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultApplication = async () => {
    try {
      const applicationsSnapshot = await getDocs(collection(db, 'applications'));
      const applicationsData = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      const defaultApp = applicationsData.find((app: any) => app.isDefault);
      setDefaultApplication(defaultApp || null);
    } catch (error) {
      console.error('Error loading default application:', error);
    }
  };

  const handleAddUser = async () => {
    // Validation
    if (!newUser.userCode || !newUser.name) {
      setMessage('Please fill in all required fields');
      return;
    }
    
    if (newUser.userCode.length !== 4) {
      setMessage('User code must be exactly 4 digits');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'users'), newUser);
      console.log('User added with ID:', docRef.id);
      setMessage('User added successfully!');
      setOpenDialog(false);
      setNewUser({ userCode: '', name: '', role: 'applicator', isActive: true });
      loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      setMessage('Error adding user: ' + (error as Error).message);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    
    // Validation
    if (!editingUser.userCode || !editingUser.name) {
      setMessage('Please fill in all required fields');
      return;
    }
    
    if (editingUser.userCode.length !== 4) {
      setMessage('User code must be exactly 4 digits');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        userCode: editingUser.userCode,
        name: editingUser.name,
        role: editingUser.role,
        isActive: editingUser.isActive
      });
      setMessage('User updated successfully!');
      setOpenDialog(false);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage('Error updating user: ' + (error as Error).message);
    }
  };

  const openAddDialog = () => {
    setEditingUser(null);
    setNewUser({ userCode: '', name: '', role: 'applicator', isActive: true });
    setOpenDialog(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setOpenDialog(true);
  };

  const adminCards = [
    {
      title: 'Manage Users',
      description: 'Add, edit, and manage applicator accounts',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: 'primary.main',
      count: users.length
    },
    {
      title: 'Kiosk Management',
      description: 'Configure kiosk types and product assignments',
      icon: <KioskIcon sx={{ fontSize: 40 }} />,
      color: 'warning.main',
      count: kiosks.length,
      action: () => setOpenKioskDialog(true)
    },
    {
      title: 'View Reports',
      description: 'Access usage reports and analytics',
      icon: <ReportsIcon sx={{ fontSize: 40 }} />,
      color: 'info.main',
      action: () => navigate('/reports')
    },
    {
      title: 'Applications',
      description: 'Manage application types (fertilizer, herbicide, etc.)',
      icon: <ApplicationIcon sx={{ fontSize: 40 }} />,
      color: 'success.main',
      action: () => navigate('/admin/applications')
    },
    {
      title: 'Products',
      description: 'Manage product catalog and specifications',
      icon: <ProductsIcon sx={{ fontSize: 40 }} />,
      color: 'secondary.main',
      action: () => navigate('/admin/products')
    }
  ];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Button 
            color="inherit" 
            startIcon={<BackIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Panel - {user?.name}
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

        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Administrator Dashboard
        </Typography>

        {/* Admin Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {adminCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ cursor: card.action ? 'pointer' : 'default' }} onClick={card.action}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Box sx={{ color: card.color, mb: 2 }}>
                    {card.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {card.description}
                  </Typography>
                  {card.count !== undefined && (
                    <Chip label={`${card.count} Users`} color="primary" />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Default Application Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ApplicationIcon sx={{ mr: 2 }} />
              Default Application
            </Typography>
            {defaultApplication ? (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" color="primary.main">
                    {defaultApplication.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Category: {defaultApplication.category} • {defaultApplication.products?.length || 0} products
                  </Typography>
                  {defaultApplication.description && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {defaultApplication.description}
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/applications')}
                  sx={{ ml: 2 }}
                >
                  Change Default
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No default application set. Set one in Application Management for automatic loading.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/admin/applications')}
                  sx={{ ml: 2 }}
                >
                  Set Default
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* User Management Section */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                User Management
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={openAddDialog}
              >
                Add New User
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.userCode}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role} 
                          color={user.role === 'admin' ? 'secondary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.isActive ? 'Active' : 'Inactive'} 
                          color={user.isActive ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          startIcon={<EditIcon />}
                          onClick={() => openEditDialog(user)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Add/Edit User Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingUser ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="4-Digit User Code"
              fullWidth
              variant="outlined"
              value={editingUser ? editingUser.userCode : newUser.userCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                if (editingUser) {
                  setEditingUser({ ...editingUser, userCode: value });
                } else {
                  setNewUser({ ...newUser, userCode: value });
                }
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Name"
              fullWidth
              variant="outlined"
              value={editingUser ? editingUser.name : newUser.name}
              onChange={(e) => {
                if (editingUser) {
                  setEditingUser({ ...editingUser, name: e.target.value });
                } else {
                  setNewUser({ ...newUser, name: e.target.value });
                }
              }}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={editingUser ? editingUser.role : newUser.role}
                label="Role"
                onChange={(e) => {
                  if (editingUser) {
                    setEditingUser({ ...editingUser, role: e.target.value });
                  } else {
                    setNewUser({ ...newUser, role: e.target.value });
                  }
                }}
              >
                <MenuItem value="applicator">Applicator</MenuItem>
                <MenuItem value="admin">Administrator</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editingUser ? editingUser.isActive.toString() : newUser.isActive.toString()}
                label="Status"
                onChange={(e) => {
                  const isActive = e.target.value === 'true';
                  if (editingUser) {
                    setEditingUser({ ...editingUser, isActive });
                  } else {
                    setNewUser({ ...newUser, isActive });
                  }
                }}
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              onClick={editingUser ? handleEditUser : handleAddUser}
              variant="contained"
            >
              {editingUser ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Kiosk Management Dialog */}
        <Dialog open={openKioskDialog} onClose={() => setOpenKioskDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Kiosk Management
          </DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Configured Kiosks
            </Typography>
            
            {kiosks.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No kiosks configured yet. Default kiosks will be loaded automatically.
              </Alert>
            ) : (
              <Box sx={{ mb: 3 }}>
                {kiosks.map((kiosk) => (
                  <Card key={kiosk.id} sx={{ mb: 2, border: currentKiosk?.id === kiosk.id ? '2px solid' : '1px solid', borderColor: currentKiosk?.id === kiosk.id ? 'primary.main' : 'grey.300' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h6">
                              {kiosk.name}
                            </Typography>
                            <Chip 
                              label={kiosk.type.charAt(0).toUpperCase() + kiosk.type.slice(1)}
                              size="small"
                              color={kiosk.type === 'specialty' ? 'secondary' : kiosk.type === 'fertilizer' ? 'success' : 'primary'}
                            />
                            {currentKiosk?.id === kiosk.id && (
                              <Chip label="Current" size="small" color="primary" variant="outlined" />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {kiosk.description || KIOSK_TYPES[kiosk.type]?.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Products: {kiosk.availableProducts.length} • 
                            Units: {kiosk.units.primary}
                            {kiosk.units.secondary && ` / ${kiosk.units.secondary}`} • 
                            Trucks: {kiosk.defaultTruckTypes.join(', ')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => {
                              setEditingKiosk(kiosk);
                              setNewKiosk({
                                ...kiosk,
                                availableProducts: [...kiosk.availableProducts]
                              });
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${kiosk.name}"?`)) {
                                const updatedKiosks = kiosks.filter(k => k.id !== kiosk.id);
                                setKiosks(updatedKiosks);
                                localStorage.setItem('tnt-admin-kiosks', JSON.stringify(updatedKiosks));
                                setMessage(`Kiosk "${kiosk.name}" deleted successfully!`);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingKiosk(null);
                setNewKiosk({
                  id: `kiosk-${Date.now()}`,
                  name: '',
                  type: 'specialty',
                  description: '',
                  availableProducts: [],
                  defaultTruckTypes: ['hose', 'cart'],
                  calculationMode: 'liquid',
                  units: { primary: 'gallons' }
                });
              }}
              sx={{ mb: 2 }}
            >
              Add New Kiosk
            </Button>

            {(editingKiosk || newKiosk.name) && (
              <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {editingKiosk ? 'Edit' : 'Add'} Kiosk Configuration
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Kiosk Name"
                      value={newKiosk.name}
                      onChange={(e) => setNewKiosk({ ...newKiosk, name: e.target.value })}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Kiosk Type</InputLabel>
                      <Select
                        value={newKiosk.type}
                        label="Kiosk Type"
                        onChange={(e) => {
                          const type = e.target.value as 'specialty' | 'fertilizer' | 'mixed';
                          setNewKiosk({ 
                            ...newKiosk, 
                            type,
                            units: { primary: KIOSK_TYPES[type]?.defaultUnits as any },
                            calculationMode: type === 'fertilizer' ? 'granular' : type === 'mixed' ? 'both' : 'liquid'
                          });
                        }}
                      >
                        <MenuItem value="specialty">🧪 Specialty Applications</MenuItem>
                        <MenuItem value="fertilizer">🌾 Bagged Fertilizer</MenuItem>
                        <MenuItem value="mixed">🚛 Mixed Operations</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={newKiosk.description}
                      onChange={(e) => setNewKiosk({ ...newKiosk, description: e.target.value })}
                      margin="normal"
                      multiline
                      rows={2}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Available Products
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Select which products should be available on this kiosk:
                    </Typography>
                    
                    <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid', borderColor: 'grey.300', borderRadius: 1, p: 1 }}>
                      {products.length === 0 ? (
                        <Typography color="text.secondary">No products available. Please add products first.</Typography>
                      ) : (
                        <>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Found {products.length} product(s) {currentKiosk && `(Current kiosk: ${currentKiosk.name} - ${currentKiosk.type})`}
                          </Typography>
                          {console.log('🎯 AdminPanel products for assignment:', products.map(p => ({ id: p.id, name: p.name, type: p.type })))}
                          {products.map((product) => (
                            <Box key={product.id} sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={newKiosk.availableProducts.includes(product.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setNewKiosk({
                                          ...newKiosk,
                                          availableProducts: [...newKiosk.availableProducts, product.id]
                                        });
                                      } else {
                                        setNewKiosk({
                                          ...newKiosk,
                                          availableProducts: newKiosk.availableProducts.filter(id => id !== product.id)
                                        });
                                      }
                                    }}
                                    size="small"
                                  />
                                }
                                label={
                                  <Typography variant="body2">
                                    {product.name} ({product.type}) - {product.unit}
                                  </Typography>
                                }
                              />
                            </Box>
                          ))}
                        </>
                      )}
                    </Box>
                    
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        onClick={() => {
                          setNewKiosk({
                            ...newKiosk,
                            availableProducts: products.map(p => p.id)
                          });
                        }}
                      >
                        Select All
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setNewKiosk({
                            ...newKiosk,
                            availableProducts: []
                          });
                        }}
                      >
                        Clear All
                      </Button>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      // Validation
                      if (!newKiosk.name.trim()) {
                        setMessage('Please enter a kiosk name');
                        return;
                      }
                      
                      if (!editingKiosk && kiosks.some(k => k.name.toLowerCase() === newKiosk.name.toLowerCase())) {
                        setMessage('A kiosk with this name already exists');
                        return;
                      }
                      
                      // Save kiosk logic
                      const kioskToSave = {
                        ...newKiosk,
                        id: newKiosk.id || `kiosk-${Date.now()}`,
                        description: newKiosk.description || KIOSK_TYPES[newKiosk.type]?.description || ''
                      };
                      
                      const updatedKiosks = editingKiosk 
                        ? kiosks.map(k => k.id === editingKiosk.id ? kioskToSave : k)
                        : [...kiosks, kioskToSave];
                      
                      setKiosks(updatedKiosks);
                      localStorage.setItem('tnt-admin-kiosks', JSON.stringify(updatedKiosks));
                      setMessage(`Kiosk "${kioskToSave.name}" ${editingKiosk ? 'updated' : 'created'} successfully! Products assigned: ${kioskToSave.availableProducts.length}`);
                      setEditingKiosk(null);
                      setNewKiosk({
                        id: '',
                        name: '',
                        type: 'specialty',
                        description: '',
                        availableProducts: [],
                        defaultTruckTypes: ['hose', 'cart'],
                        calculationMode: 'liquid',
                        units: { primary: 'gallons' }
                      });
                    }}
                  >
                    {editingKiosk ? 'Update' : 'Save'} Kiosk
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditingKiosk(null);
                      setNewKiosk({
                        id: '',
                        name: '',
                        type: 'specialty',
                        description: '',
                        availableProducts: [],
                        defaultTruckTypes: ['hose', 'cart'],
                        calculationMode: 'liquid',
                        units: { primary: 'gallons' }
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenKioskDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default AdminPanel;