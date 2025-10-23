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
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Product {
  id: string;
  name: string;
  type: 'fertilizer' | 'herbicide' | 'insecticide' | 'pre-emergent' | 'spreader-sticker' | 'other';
  hoseRatePerGallon: number;
  cartRatePerGallon: number;
  backpackRatePerGallon?: number;
  trailerRatePerGallon?: number;
  unit: string;
  description?: string;
  isActive: boolean;
  category?: string;
}

const ProductManagementReadOnly: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      setProducts(productsData.sort((a, b) => a.name.localeCompare(b.name)));
      setMessage('');
    } catch (error) {
      console.error('Error loading products:', error);
      setMessage('Error loading products: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'fertilizer': return 'success';
      case 'herbicide': return 'warning';
      case 'insecticide': return 'error';
      case 'pre-emergent': return 'info';
      case 'spreader-sticker': return 'secondary';
      default: return 'default';
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesType = filterType === 'all' || product.type === filterType;
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const isManager = user?.role?.toLowerCase() === 'manager';

  if (loading) {
    return (
      <Container>
        <Typography>Loading products...</Typography>
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
          <Typography sx={{ fontSize: 40, mr: 2 }}>📦</Typography>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Product Management {isManager && '(Read Only)'}
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
            Products Library {isManager && '(View Only)'}
          </Typography>
        </Box>

        {/* Filter and Search Controls */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Search Products"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or description..."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={filterType}
                label="Filter by Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="fertilizer">Fertilizer</MenuItem>
                <MenuItem value="herbicide">Herbicide</MenuItem>
                <MenuItem value="insecticide">Insecticide</MenuItem>
                <MenuItem value="pre-emergent">Pre-emergent</MenuItem>
                <MenuItem value="spreader-sticker">Spreader Sticker</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Products Overview */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="primary.main">
                  {products.filter(p => p.isActive).length}
                </Typography>
                <Typography variant="caption">Active Products</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="success.main">
                  {products.filter(p => p.type === 'fertilizer' && p.isActive).length}
                </Typography>
                <Typography variant="caption">Fertilizers</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="warning.main">
                  {products.filter(p => p.type === 'herbicide' && p.isActive).length}
                </Typography>
                <Typography variant="caption">Herbicides</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="error.main">
                  {products.filter(p => p.type === 'insecticide' && p.isActive).length}
                </Typography>
                <Typography variant="caption">Insecticides</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Products Table */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Rates per Gallon</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{product.name}</Typography>
                          {product.description && (
                            <Typography variant="caption" color="text.secondary">
                              {product.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={product.type} 
                          color={getCategoryColor(product.type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            Hose: {product.hoseRatePerGallon} {product.unit}/gal
                          </Typography>
                          <Typography variant="body2">
                            Cart: {product.cartRatePerGallon} {product.unit}/gal
                          </Typography>
                          {product.trailerRatePerGallon !== undefined && (
                            <Typography variant="body2">
                              Trailer: {product.trailerRatePerGallon} {product.unit}/gal
                            </Typography>
                          )}
                          {product.backpackRatePerGallon !== undefined && (
                            <Typography variant="body2">
                              Backpack: {product.backpackRatePerGallon} {product.unit}/gal
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {product.unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={product.isActive ? 'Active' : 'Inactive'} 
                          color={product.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          {searchTerm || filterType !== 'all' 
                            ? 'No products match your search criteria.'
                            : 'No products found. Ask an administrator to add products.'}
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
        {(searchTerm || filterType !== 'all') && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredProducts.length} of {products.length} products
              {searchTerm && ` matching "${searchTerm}"`}
              {filterType !== 'all' && ` of type "${filterType}"`}
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
};

export default ProductManagementReadOnly;