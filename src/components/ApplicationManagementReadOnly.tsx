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
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { 
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  LocalShipping as HoseTruckIcon,
  ShoppingCart as CartTruckIcon,
  Upgrade as TrailerIcon,
  Backpack as BackpackIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

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
  equipmentTypes: ('hose-truck' | 'trailer' | 'cart-truck' | 'backpack')[];
}

interface Application {
  id: string;
  name: string;
  description?: string;
  category: 'fertilizer' | 'herbicide' | 'insecticide' | 'fungicide' | 'pre-emergent' | 'spreader-sticker' | 'mixed';
  applicationCategory?: 'trees' | 'other';
  products: ApplicationProduct[];
  isActive: boolean;
  isDefault?: boolean;
  availableKiosks?: ('specialty' | 'mixed' | 'fertilizer')[];
  createdAt?: any;
}

const ApplicationManagementReadOnly: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Helper function to migrate legacy product data
  const migrateLegacyProduct = (product: any): ApplicationProduct => {
    let equipmentTypes: ('hose-truck' | 'trailer' | 'cart-truck' | 'backpack')[] = [];
    
    if (!product.equipmentTypes) {
      if (product.truckTypes) {
        if (product.truckTypes.includes('hose')) {
          equipmentTypes.push('hose-truck', 'trailer');
        }
        if (product.truckTypes.includes('cart')) {
          equipmentTypes.push('cart-truck', 'backpack');
        }
      } else {
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

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      console.log('🔍 Starting application load process...');
      const applicationsRef = collection(db, 'applications');
      const querySnapshot = await getDocs(applicationsRef);
      
      const applicationsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const migratedProducts = data.products ? data.products.map(migrateLegacyProduct) : [];
        
        return {
          id: doc.id,
          ...data,
          products: migratedProducts
        };
      }) as Application[];
      
      const sortedApplications = applicationsData.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      });
      
      setApplications(sortedApplications);
      setMessage('');
      console.log('✅ Applications loaded successfully!');
    } catch (error) {
      console.error('❌ Error during application loading:', error);
      setMessage('Error loading applications: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
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

  const filteredApplications = applications.filter(application => {
    const matchesCategory = filterCategory === 'all' || application.category === filterCategory;
    const matchesSearch = searchTerm === '' || 
      application.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (application.description && application.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const isManager = user?.role?.toLowerCase() === 'manager';

  if (loading) {
    return (
      <Container>
        <Typography>Loading applications...</Typography>
      </Container>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Button 
            color="inherit" 
            startIcon={<BackIcon />}
            onClick={() => navigate(isManager ? '/manager' : '/admin')}
            sx={{ mr: 2 }}
          >
            Back to {isManager ? 'Manager' : 'Admin'}
          </Button>
          <Typography sx={{ fontSize: 40, mr: 2 }}>🧪</Typography>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Application Management {isManager && '(Read Only)'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {message && (
          <Alert 
            severity={message.includes('Error') ? 'error' : 'success'} 
            sx={{ mb: 3 }} 
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Application Recipes {isManager && '(View Only)'}
          </Typography>
        </Box>

        {/* Filter and Search Controls */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Search Applications"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or description..."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by Category</InputLabel>
              <Select
                value={filterCategory}
                label="Filter by Category"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="fertilizer">Fertilizer</MenuItem>
                <MenuItem value="herbicide">Herbicide</MenuItem>
                <MenuItem value="insecticide">Insecticide</MenuItem>
                <MenuItem value="pre-emergent">Pre-emergent</MenuItem>
                <MenuItem value="spreader-sticker">Spreader Sticker</MenuItem>
                <MenuItem value="mixed">Mixed Application</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

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
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApplications.map((application) => (
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
                                      case 'hose-truck': return { bgcolor: '#0066cc', color: 'white', borderColor: '#0066cc' };
                                      case 'cart-truck': return { bgcolor: '#cc0066', color: 'white', borderColor: '#cc0066' };
                                      case 'trailer': return { bgcolor: '#00cc66', color: 'white', borderColor: '#00cc66' };
                                      case 'backpack': return { bgcolor: '#ff6600', color: 'white', borderColor: '#ff6600' };
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
                            />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredApplications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          {searchTerm || filterCategory !== 'all' 
                            ? 'No applications match your search criteria.'
                            : 'No applications found. Ask an administrator to create application recipes.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {(searchTerm || filterCategory !== 'all') && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredApplications.length} of {applications.length} applications
              {searchTerm && ` matching "${searchTerm}"`}
              {filterCategory !== 'all' && ` in category "${filterCategory}"`}
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
};

export default ApplicationManagementReadOnly;