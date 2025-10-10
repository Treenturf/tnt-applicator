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
  TextField,
  Alert,
  Grid,
  MenuItem
} from '@mui/material';
import { 
  ArrowBack as BackIcon,
  Calculate as CalculateIcon,
  LocalShipping as TruckIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useKiosk } from '../contexts/KioskContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';

// Product interface (enhanced for liquid and granular products)
interface Product {
  id: string;
  name: string;
  type: 'fertilizer' | 'herbicide' | 'insecticide' | 'pre-emergent' | 'spreader-sticker' | 'other';
  // Liquid product properties (ounces per gallon)
  hoseRatePerGallon: number;
  cartRatePerGallon: number;
  // Granular product properties
  poundsPer1000SqFt?: number; // Application rate in pounds per 1000 square feet
  poundsPerBag?: number; // Weight of each bag
  unit: string;
  description?: string;
  isActive: boolean;
}

interface CalculationResult {
  product: Product;
  gallons?: number;
  acres?: number;
  squareFeet?: number;
  totalAmount: number;
  totalPounds?: number;
  totalBags?: number;
  tankSelection: string;
}

const Calculator: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentKiosk } = useKiosk();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedFertilizer = searchParams.get('fertilizer');
  const fertilizerName = searchParams.get('name');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [acres, setAcres] = useState<number>(0);
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  const [activeInput, setActiveInput] = useState<'acres' | null>(null);

  // Sample fertilizer products for testing
  const sampleProducts: Product[] = [
    {
      id: 'fert1',
      name: '34-0-0 Nitrogen',
      type: 'fertilizer',
      hoseRatePerGallon: 0,
      cartRatePerGallon: 0,
      poundsPer1000SqFt: 3,
      poundsPerBag: 50,
      unit: 'pounds',
      isActive: true
    },
    {
      id: 'fert2', 
      name: '18-24-12 Starter',
      type: 'fertilizer',
      hoseRatePerGallon: 0,
      cartRatePerGallon: 0,
      poundsPer1000SqFt: 4,
      poundsPerBag: 50,
      unit: 'pounds',
      isActive: true
    },
    {
      id: 'fert3',
      name: '32-5-10 Premium',
      type: 'fertilizer',
      hoseRatePerGallon: 0,
      cartRatePerGallon: 0,
      poundsPer1000SqFt: 3.5,
      poundsPerBag: 50,
      unit: 'pounds', 
      isActive: true
    }
  ];

  useEffect(() => {
    // Set sample products
    setProducts(sampleProducts);
  }, []);

  // Handle pre-selected fertilizer from URL
  useEffect(() => {
    if (preSelectedFertilizer && products.length > 0) {
      const product = products.find(p => 
        p.id === preSelectedFertilizer || 
        p.name.toLowerCase() === (fertilizerName || '').toLowerCase()
      );
      
      if (product) {
        setSelectedProduct(product.id);
        console.log('🌾 Pre-selected fertilizer:', product.name);
      }
    }
  }, [preSelectedFertilizer, fertilizerName, products]);

  const handleCalculate = () => {
    if (!selectedProduct || acres <= 0) {
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product || !product.poundsPer1000SqFt) {
      return;
    }

    // Calculate for granular products
    const squareFeet = acres * 43560; // Convert acres to square feet
    const totalPounds = (squareFeet / 1000) * product.poundsPer1000SqFt;
    const totalBags = product.poundsPerBag ? Math.ceil(totalPounds / product.poundsPerBag) : 0;

    const result: CalculationResult = {
      product,
      acres,
      squareFeet,
      totalAmount: totalPounds,
      totalPounds,
      totalBags,
      tankSelection: 'granular'
    };

    setCalculations([result]);
  };

  const handleLogOut = async () => {
    try {
      if (calculations.length > 0) {
        // Save application to database
        await addDoc(collection(db, 'applications'), {
          userId: user?.id,
          userCode: user?.userCode,
          userName: user?.name,
          kioskId: currentKiosk?.id || 'fertilizer',
          kioskName: currentKiosk?.name || 'Fertilizer Kiosk',
          calculations: calculations.map(calc => ({
            productId: calc.product.id,
            productName: calc.product.name,
            productType: calc.product.type,
            acres: calc.acres,
            totalPounds: calc.totalPounds,
            totalBags: calc.totalBags,
            unit: calc.product.unit
          })),
          totalAcres: calculations.reduce((sum, calc) => sum + (calc.acres || 0), 0),
          timestamp: serverTimestamp(),
          sessionType: 'fertilizer'
        });
        console.log('✅ Fertilizer application saved to database');
      }
      
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Keypad functions
  const handleKeypadInput = (value: string) => {
    if (!activeInput) return;

    if (value === 'clear') {
      setAcres(0);
      return;
    }

    if (value === 'backspace') {
      const current = acres.toString();
      const newValue = current.slice(0, -1);
      setAcres(newValue ? parseFloat(newValue) : 0);
      return;
    }

    // Handle number and decimal input
    const currentStr = acres === 0 ? '' : acres.toString();
    
    // Prevent multiple decimal points
    if (value === '.' && currentStr.includes('.')) return;
    
    const newValueStr = currentStr + value;
    const newValue = parseFloat(newValueStr);
    
    if (!isNaN(newValue) && newValue >= 0) {
      setAcres(newValue);
    }
  };

  const renderKeypad = () => {
    if (!activeInput) return null;

    const keys = [
      ['7', '8', '9'],
      ['4', '5', '6'],
      ['1', '2', '3'],
      ['clear', '0', '.'],
      ['backspace']
    ];

    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, textAlign: 'center' }}>
          Enter Acres
        </Typography>
        {keys.map((row, rowIndex) => (
          <Grid container spacing={1} key={rowIndex} sx={{ mb: 1 }}>
            {row.map((key) => (
              <Grid item xs={key === 'backspace' ? 12 : 4} key={key}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => handleKeypadInput(key)}
                  sx={{
                    minHeight: 50,
                    fontSize: '1.2rem',
                    bgcolor: key === 'clear' ? 'error.main' : 
                           key === 'backspace' ? 'warning.main' : 
                           'primary.main'
                  }}
                >
                  {key === 'clear' ? 'Clear' : 
                   key === 'backspace' ? '⌫ Backspace' : 
                   key}
                </Button>
              </Grid>
            ))}
          </Grid>
        ))}
        <Button
          variant="outlined"
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => setActiveInput(null)}
        >
          Close Keypad
        </Button>
      </Box>
    );
  };

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
          <TruckIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Fertilizer Calculator
            {currentKiosk && (
              <Typography variant="subtitle2" component="div" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                🏭 {currentKiosk.name}
              </Typography>
            )}
          </Typography>
          <Typography variant="subtitle1">
            {user?.name} ({user?.userCode})
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalculateIcon sx={{ mr: 1 }} />
                  Fertilizer Calculator
                </Typography>

                {/* Product Selection */}
                <TextField
                  select
                  fullWidth
                  label="Select Fertilizer"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  sx={{ mb: 3 }}
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} - {product.poundsPer1000SqFt} lbs/1000 sq ft
                    </MenuItem>
                  ))}
                </TextField>

                {/* Acres Input */}
                <TextField
                  fullWidth
                  label="Acres to Cover"
                  value={acres || ''}
                  onClick={() => setActiveInput('acres')}
                  InputProps={{
                    readOnly: true,
                    style: { cursor: 'pointer', fontSize: '1.2rem', textAlign: 'center' }
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }
                  }}
                />

                {/* Keypad */}
                {renderKeypad()}

                <Button 
                  fullWidth 
                  variant="contained" 
                  size="large"
                  onClick={handleCalculate}
                  disabled={!selectedProduct || acres <= 0}
                  startIcon={<CalculateIcon />}
                  sx={{ mt: 2 }}
                >
                  Calculate Fertilizer
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Results */}
          {calculations.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Fertilizer Requirements
                  </Typography>

                  {calculations.map((calc, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {calc.product.name}
                      </Typography>
                      <Typography variant="body1">
                        Area: {calc.acres} acres ({calc.squareFeet?.toLocaleString()} sq ft)
                      </Typography>
                      <Typography variant="h5" color="primary" sx={{ my: 1 }}>
                        {calc.totalBags} bags needed
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {calc.totalPounds?.toFixed(1)} pounds total
                      </Typography>
                    </Box>
                  ))}

                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary"
                    size="large"
                    onClick={handleLogOut}
                    startIcon={<LogoutIcon />}
                    sx={{ mt: 3 }}
                  >
                    Complete & Log Out
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Container>
    </>
  );
};

export default Calculator;