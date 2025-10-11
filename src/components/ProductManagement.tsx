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
  IconButton
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Inventory as ProductsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useKiosk } from '../contexts/KioskContext';
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
import { getKioskProducts } from '../types/kiosk';

// Product interface
interface Product {
  id: string;
  name: string;
  type: 'fertilizer' | 'herbicide' | 'insecticide' | 'pre-emergent' | 'spreader-sticker' | 'other';
  // Liquid product properties
  hoseRatePerGallon: number; // Amount per gallon for hose truck
  cartRatePerGallon: number; // Amount per gallon for cart truck
  // Granular/Fertilizer product properties
  poundsPer1000SqFt?: number; // Application rate in pounds per 1000 square feet
  poundsPerBag?: number; // Weight of each bag in pounds
  unit: string; // e.g., "lbs", "oz", "pints"
  description?: string;
  isActive: boolean;
}

const ProductManagement: React.FC = () => {
  const { user } = useAuth();
  const { currentKiosk, kioskId } = useKiosk();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    type: 'fertilizer' as const,
    hoseRatePerGallon: 0,
    cartRatePerGallon: 0,
    poundsPer1000SqFt: 0,
    poundsPerBag: 50,
    unit: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products when kiosk configuration changes
  useEffect(() => {
    if (currentKiosk && allProducts.length > 0) {
      const filteredProducts = getKioskProducts(currentKiosk, allProducts);
      setProducts(filteredProducts);
      console.log(`🏭 [${currentKiosk.name}] Filtered products:`, filteredProducts.length, 'of', allProducts.length);
    }
  }, [currentKiosk, allProducts]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      const sortedProducts = productsData.sort((a, b) => a.name.localeCompare(b.name));
      setAllProducts(sortedProducts);
      
      // If no kiosk is selected, show all products (admin view)
      if (!currentKiosk) {
        setProducts(sortedProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setMessage('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    // Detailed validation with specific error messages
    if (!newProduct.name.trim()) {
      setMessage('Product name is required');
      return;
    }
    
    if (!newProduct.unit.trim()) {
      setMessage('Unit is required (e.g., lbs, oz, pints)');
      return;
    }
    
    if (newProduct.hoseRatePerGallon < 0 || newProduct.cartRatePerGallon < 0) {
      setMessage('Rates cannot be negative');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'products'), newProduct);
      console.log('Product added with ID:', docRef.id);
      setMessage('Product added successfully!');
      setOpenDialog(false);
      setNewProduct({ 
        name: '', 
        type: 'fertilizer', 
        hoseRatePerGallon: 0, 
        cartRatePerGallon: 0,
        poundsPer1000SqFt: 0,
        poundsPerBag: 50,
        unit: '', 
        description: '', 
        isActive: true 
      });
      loadProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      setMessage('Error adding product: ' + (error as Error).message);
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;
    
    console.log('Editing product:', editingProduct);
    
    // Detailed validation with specific error messages
    if (!editingProduct.name.trim()) {
      setMessage('Product name is required');
      return;
    }
    
    if (!editingProduct.unit.trim()) {
      setMessage('Unit is required (e.g., lbs, oz, pints)');
      return;
    }
    
    if ((editingProduct.hoseRatePerGallon || 0) < 0 || (editingProduct.cartRatePerGallon || 0) < 0) {
      setMessage('Rates cannot be negative');
      return;
    }
    
    try {
      console.log('Updating product with ID:', editingProduct.id);
      await updateDoc(doc(db, 'products', editingProduct.id), {
        name: editingProduct.name,
        type: editingProduct.type,
        hoseRatePerGallon: editingProduct.hoseRatePerGallon || 0,
        cartRatePerGallon: editingProduct.cartRatePerGallon || 0,
        poundsPer1000SqFt: editingProduct.poundsPer1000SqFt || 0,
        poundsPerBag: editingProduct.poundsPerBag || 50,
        unit: editingProduct.unit,
        description: editingProduct.description || '',
        isActive: editingProduct.isActive
      });
      console.log('Product updated successfully');
      setMessage('Product updated successfully!');
      setOpenDialog(false);
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      setMessage('Error updating product: ' + (error as Error).message);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        setMessage('Product deleted successfully!');
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        setMessage('Error deleting product: ' + (error as Error).message);
      }
    }
  };

  const openAddDialog = () => {
    setEditingProduct(null);
    setNewProduct({ 
      name: '', 
      type: 'fertilizer', 
      hoseRatePerGallon: 0, 
      cartRatePerGallon: 0,
      unit: '', 
      description: '', 
      isActive: true 
    });
    setOpenDialog(true);
  };

  const openEditDialog = (product: Product) => {
    console.log('Opening edit dialog for product:', product);
    
    // Only migrate if this is truly an old product (has ratePerGallon but missing new rates)
    const needsMigration = (product as any).ratePerGallon !== undefined && 
                          (product.hoseRatePerGallon === undefined || product.cartRatePerGallon === undefined);
    
    let productToEdit = product;
    
    if (needsMigration) {
      // Migration: Convert old ratePerGallon to new structure
      productToEdit = {
        ...product,
        hoseRatePerGallon: product.hoseRatePerGallon || (product as any).ratePerGallon || 0,
        cartRatePerGallon: product.cartRatePerGallon || (product as any).ratePerGallon || 0
      };
      setMessage(`Editing: ${product.name} - Old product detected, rates will be migrated to new format`);
    } else {
      setMessage(`Editing: ${product.name} (ID: ${product.id})`);
    }
    
    setEditingProduct(productToEdit);
    setOpenDialog(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fertilizer': return 'success';
      case 'herbicide': return 'warning';
      case 'insecticide': return 'error';
      case 'pre-emergent': return 'info';
      case 'spreader-sticker': return 'secondary';
      default: return 'default';
    }
  };

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
            onClick={() => navigate('/admin')}
            sx={{ mr: 2 }}
          >
            Back to Admin
          </Button>
          <ProductsIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Product Management
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
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Product Catalog
            </Typography>
            {currentKiosk && (
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                🏭 {currentKiosk.name} ({currentKiosk.type.charAt(0).toUpperCase() + currentKiosk.type.slice(1)})
                - Showing {products.length} of {allProducts.length} products
              </Typography>
            )}
            {!currentKiosk && user?.role === 'admin' && (
              <Typography variant="subtitle1" color="warning.main" sx={{ mb: 1 }}>
                ⚠️ Admin View - Showing all products (no kiosk selected)
              </Typography>
            )}
          </Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={openAddDialog}
            size="large"
          >
            Add New Product
          </Button>
        </Box>

        {/* Products Overview */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="success.main">
                  {products.filter(p => p.type === 'fertilizer' && p.isActive).length}
                </Typography>
                <Typography variant="caption">Fertilizers</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="warning.main">
                  {products.filter(p => p.type === 'herbicide' && p.isActive).length}
                </Typography>
                <Typography variant="caption">Herbicides</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="error.main">
                  {products.filter(p => p.type === 'insecticide' && p.isActive).length}
                </Typography>
                <Typography variant="caption">Insecticides</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="info.main">
                  {products.filter(p => p.type === 'pre-emergent' && p.isActive).length}
                </Typography>
                <Typography variant="caption">Pre-emergent</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="secondary.main">
                  {products.filter(p => p.type === 'spreader-sticker' && p.isActive).length}
                </Typography>
                <Typography variant="caption">Spreader Sticker</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="primary.main">
                  {products.filter(p => p.isActive).length}
                </Typography>
                <Typography variant="caption">Total Active</Typography>
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
                    <TableCell>Hose Rate</TableCell>
                    <TableCell>Cart Rate</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
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
                          color={getTypeColor(product.type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {product.hoseRatePerGallon !== undefined 
                          ? product.hoseRatePerGallon 
                          : ((product as any).ratePerGallon !== undefined ? `${(product as any).ratePerGallon} (old)` : 'N/A')
                        }
                      </TableCell>
                      <TableCell>
                        {product.cartRatePerGallon !== undefined 
                          ? product.cartRatePerGallon 
                          : ((product as any).ratePerGallon !== undefined ? `${(product as any).ratePerGallon} (old)` : 'N/A')
                        }
                      </TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell>
                        <Chip 
                          label={product.isActive ? 'Active' : 'Inactive'} 
                          color={product.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => openEditDialog(product)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No products found. Add your first product to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Add/Edit Product Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Product Name *"
              fullWidth
              variant="outlined"
              required
              value={editingProduct ? editingProduct.name : newProduct.name}
              onChange={(e) => {
                if (editingProduct) {
                  setEditingProduct({ ...editingProduct, name: e.target.value });
                } else {
                  setNewProduct({ ...newProduct, name: e.target.value });
                }
              }}
              sx={{ mb: 2 }}
              helperText="Enter the product name (e.g., '10-10-10 Fertilizer')"
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Product Type</InputLabel>
              <Select
                value={editingProduct ? editingProduct.type : newProduct.type}
                label="Product Type"
                onChange={(e) => {
                  if (editingProduct) {
                    setEditingProduct({ ...editingProduct, type: e.target.value as any });
                  } else {
                    setNewProduct({ ...newProduct, type: e.target.value as any });
                  }
                }}
              >
                <MenuItem value="fertilizer">Fertilizer</MenuItem>
                <MenuItem value="herbicide">Herbicide</MenuItem>
                <MenuItem value="insecticide">Insecticide</MenuItem>
                <MenuItem value="pre-emergent">Pre-emergent</MenuItem>
                <MenuItem value="spreader-sticker">Spreader Sticker</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              margin="dense"
              label="Hose Truck Rate per Gallon *"
              type="number"
              fullWidth
              variant="outlined"
              required
              value={editingProduct ? (editingProduct.hoseRatePerGallon || 0) : newProduct.hoseRatePerGallon}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                if (editingProduct) {
                  setEditingProduct({ ...editingProduct, hoseRatePerGallon: value });
                } else {
                  setNewProduct({ ...newProduct, hoseRatePerGallon: value });
                }
              }}
              sx={{ mb: 2 }}
              inputProps={{ min: 0, step: 0.1 }}
              helperText="Amount of product needed per gallon for hose truck (0 = not applicable)"
            />

            <TextField
              margin="dense"
              label="Cart Truck Rate per Gallon *"
              type="number"
              fullWidth
              variant="outlined"
              required
              value={editingProduct ? (editingProduct.cartRatePerGallon || 0) : newProduct.cartRatePerGallon}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                if (editingProduct) {
                  setEditingProduct({ ...editingProduct, cartRatePerGallon: value });
                } else {
                  setNewProduct({ ...newProduct, cartRatePerGallon: value });
                }
              }}
              sx={{ mb: 2 }}
              inputProps={{ min: 0, step: 0.1 }}
              helperText="Amount of product needed per gallon for cart truck (0 = not applicable)"
            />

            <TextField
              margin="dense"
              label="Pounds per 1000 Sq Ft (Fertilizer)"
              type="number"
              fullWidth
              variant="outlined"
              value={editingProduct ? (editingProduct.poundsPer1000SqFt || 0) : (newProduct.poundsPer1000SqFt || 0)}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                if (editingProduct) {
                  setEditingProduct({ ...editingProduct, poundsPer1000SqFt: value });
                } else {
                  setNewProduct({ ...newProduct, poundsPer1000SqFt: value });
                }
              }}
              sx={{ mb: 2 }}
              inputProps={{ min: 0, step: 0.1 }}
              helperText="Application rate for granular/fertilizer products (0 = not applicable)"
            />

            <TextField
              margin="dense"
              label="Pounds per Bag (Fertilizer)"
              type="number"
              fullWidth
              variant="outlined"
              value={editingProduct ? (editingProduct.poundsPerBag || 50) : (newProduct.poundsPerBag || 50)}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                if (editingProduct) {
                  setEditingProduct({ ...editingProduct, poundsPerBag: value });
                } else {
                  setNewProduct({ ...newProduct, poundsPerBag: value });
                }
              }}
              sx={{ mb: 2 }}
              inputProps={{ min: 0, step: 1 }}
              helperText="Weight of each bag in pounds (typically 50)"
            />

            <TextField
              margin="dense"
              label="Unit *"
              fullWidth
              variant="outlined"
              required
              value={editingProduct ? editingProduct.unit : newProduct.unit}
              onChange={(e) => {
                if (editingProduct) {
                  setEditingProduct({ ...editingProduct, unit: e.target.value });
                } else {
                  setNewProduct({ ...newProduct, unit: e.target.value });
                }
              }}
              sx={{ mb: 2 }}
              helperText="Unit of measurement (e.g., lbs, oz, pints, ml)"
            />

            <TextField
              margin="dense"
              label="Description (optional)"
              fullWidth
              variant="outlined"
              multiline
              rows={2}
              value={editingProduct ? editingProduct.description : newProduct.description}
              onChange={(e) => {
                if (editingProduct) {
                  setEditingProduct({ ...editingProduct, description: e.target.value });
                } else {
                  setNewProduct({ ...newProduct, description: e.target.value });
                }
              }}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editingProduct ? editingProduct.isActive.toString() : newProduct.isActive.toString()}
                label="Status"
                onChange={(e) => {
                  const isActive = e.target.value === 'true';
                  if (editingProduct) {
                    setEditingProduct({ ...editingProduct, isActive });
                  } else {
                    setNewProduct({ ...newProduct, isActive });
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
              onClick={editingProduct ? handleEditProduct : handleAddProduct}
              variant="contained"
            >
              {editingProduct ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default ProductManagement;