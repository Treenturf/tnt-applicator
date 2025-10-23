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
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Snackbar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ManagerPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State management
  const [kiosks, setKiosks] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dialog states
  const [openKioskDialog, setOpenKioskDialog] = useState(false);
  const [openApplicationsDialog, setOpenApplicationsDialog] = useState(false);
  const [selectedKiosk, setSelectedKiosk] = useState<any>(null);

  // Navigation items for managers
  const navigationItems = [
    {
      title: 'Kiosk Management',
      description: 'Configure kiosk terminals and their settings',
      icon: <Typography sx={{ fontSize: 40 }}>🖥️</Typography>,
      action: () => {
        loadKiosks();
        setOpenKioskDialog(true);
      },
      color: 'secondary.main'
    },
    {
      title: 'Default Applications',
      description: 'Set default applications for different kiosk types',
      icon: <Typography sx={{ fontSize: 40 }}>⭐</Typography>,
      action: () => {
        loadApplications();
        setOpenApplicationsDialog(true);
      },
      color: 'warning.main'
    },
    {
      title: 'View Products',
      description: 'View product information (read-only)',
      icon: <Typography sx={{ fontSize: 40 }}>📦</Typography>,
      action: () => navigate('/manager/products'),
      color: 'success.main'
    },
    {
      title: 'View Recipes',
      description: 'View application recipes (read-only)',
      icon: <Typography sx={{ fontSize: 40 }}>🧪</Typography>,
      action: () => navigate('/manager/applications'),
      color: 'info.main'
    },
    {
      title: 'View Reports',
      description: 'Check usage reports and activity logs',
      icon: <Typography sx={{ fontSize: 40 }}>📊</Typography>,
      action: () => navigate('/reports'),
      color: 'primary.main'
    }
  ];

  useEffect(() => {
    loadKiosks();
    loadApplications();
    loadProducts();
  }, []);

  const loadKiosks = async () => {
    try {
      console.log('🖥️ ManagerPanel: Loading kiosks...');
      
      // Start with default kiosks
      const { DEFAULT_KIOSKS } = await import('../types/kiosk');
      
      // Try to load saved configurations from Firestore
      try {
        const kiosksSnapshot = await getDocs(collection(db, 'kiosks'));
        
        if (kiosksSnapshot.size > 0) {
          // Map Firestore kiosks by ID
          const firestoreKiosks = new Map();
          kiosksSnapshot.docs.forEach(doc => {
            firestoreKiosks.set(doc.id, { id: doc.id, ...doc.data() });
          });
          
          // Merge: Use Firestore version if exists, otherwise use default
          const mergedKiosks = DEFAULT_KIOSKS.map(defaultKiosk => {
            const saved = firestoreKiosks.get(defaultKiosk.id);
            return saved || defaultKiosk;
          });
          
          setKiosks(mergedKiosks);
        } else {
          setKiosks(DEFAULT_KIOSKS);
        }
      } catch (firestoreError) {
        console.warn('⚠️ Could not load from Firestore, using defaults:', firestoreError);
        setKiosks(DEFAULT_KIOSKS);
      }
    } catch (error) {
      console.error('❌ ManagerPanel: Error loading kiosks:', error);
      setMessage('Error loading kiosks');
    }
  };

  const loadApplications = async () => {
    try {
      const applicationsSnapshot = await getDocs(collection(db, 'applications'));
      const applicationsData = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const activeApplications = applicationsData.filter((a: any) => a.isActive);
      setApplications(activeApplications);
    } catch (error) {
      console.error('❌ Error loading applications:', error);
      setMessage('Error loading applications');
    }
  };

  const loadProducts = async () => {
    try {
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const activeProducts = productsData.filter((p: any) => p.isActive);
      setProducts(activeProducts);
    } catch (error) {
      console.error('❌ Error loading products:', error);
      setMessage('Error loading products');
    }
  };

  const handleSetDefaultApplication = async (applicationId: string) => {
    try {
      setLoading(true);
      
      // First, remove default flag from all applications
      for (const app of applications) {
        if (app.isDefault) {
          await updateDoc(doc(db, 'applications', app.id), { isDefault: false });
        }
      }
      
      // Then set the selected application as default
      await updateDoc(doc(db, 'applications', applicationId), { isDefault: true });
      
      setMessage('Default application updated successfully!');
      loadApplications();
    } catch (error) {
      console.error('Error setting default application:', error);
      setMessage('Error setting default application');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKioskType = async (kioskId: string, newType: string) => {
    try {
      setLoading(true);
      
      // Update kiosk type in Firestore
      const kioskToUpdate = kiosks.find(k => k.id === kioskId);
      if (kioskToUpdate) {
        const updatedKiosk = {
          ...kioskToUpdate,
          type: newType,
          updatedAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'kiosks', kioskId), updatedKiosk, { merge: true });
        setMessage(`Kiosk type updated to ${newType} successfully!`);
        loadKiosks();
      }
    } catch (error) {
      console.error('Error updating kiosk type:', error);
      setMessage('Error updating kiosk type');
    } finally {
      setLoading(false);
    }
  };

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
      <AppBar position="static" sx={{ bgcolor: 'warning.main', mb: 4 }}>
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
            TNT Manager Panel
          </Typography>
          <Chip 
            label="Manager" 
            color="default" 
            sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
          />
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
        {navigationItems
          .filter(item => {
            // Filter out View Reports for managers without permission
            if (item.title === 'View Reports') {
              return user?.canAccessReports === true;
            }
            return true;
          })
          .map((item, index) => (
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
            <Typography sx={{ fontSize: 20, fontWeight: 'bold' }}>×</Typography>
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" gutterBottom>
            Manage Kiosk Types
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            Change kiosk types to control which products and applications are available.
          </Typography>
          
          {kiosks.map((kiosk) => (
            <Card key={kiosk.id} sx={{ mb: 2, p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6">{kiosk.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Location: {kiosk.location || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id={`kiosk-type-label-${kiosk.id}`}>Kiosk Type</InputLabel>
                    <Select
                      labelId={`kiosk-type-label-${kiosk.id}`}
                      id={`kiosk-type-${kiosk.id}`}
                      value={kiosk.type}
                      label="Kiosk Type"
                      onChange={(e) => handleUpdateKioskType(kiosk.id, e.target.value)}
                      disabled={loading}
                    >
                      <MenuItem value="specialty">Specialty (Main Terminal)</MenuItem>
                      <MenuItem value="fertilizer">Fertilizer</MenuItem>
                      <MenuItem value="mixed">Mixed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Card>
          ))}
        </DialogContent>
      </Dialog>

      {/* Default Applications Dialog */}
      <Dialog open={openApplicationsDialog} onClose={() => setOpenApplicationsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Default Application Management
          <IconButton
            onClick={() => setOpenApplicationsDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Typography sx={{ fontSize: 20, fontWeight: 'bold' }}>×</Typography>
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" gutterBottom>
            Set Default Application
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            Select which application recipe should be the default for new calculations.
          </Typography>
          
          <List>
            {applications.map((application) => (
              <ListItem key={application.id} disablePadding>
                <ListItemButton 
                  onClick={() => handleSetDefaultApplication(application.id)}
                  disabled={loading || application.isDefault}
                  sx={{ 
                    border: application.isDefault ? '2px solid' : '1px solid',
                    borderColor: application.isDefault ? 'warning.main' : 'grey.300',
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{application.name}</Typography>
                        {application.isDefault && (
                          <Chip label="Current Default" color="warning" size="small" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Category: {application.category} • Products: {application.products?.length || 0}
                        </Typography>
                        {application.description && (
                          <Typography variant="body2" color="text.secondary">
                            {application.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setMessage('')} severity={message.includes('Error') ? 'error' : 'success'}>
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ManagerPanel;