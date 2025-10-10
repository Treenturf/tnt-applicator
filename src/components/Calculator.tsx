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
  addDoc,
  getDocs,
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
  totalAmount?: number;
  totalPounds?: number;
  totalBags?: number;
  tankSelection?: string;
  ouncesNeeded?: number;

}

const Calculator: React.FC = () => {
  // TNT calculation logic
  const handleTntCalculate = () => {
    if (!selectedProduct || thousandSqFt <= 0) {
      return;
    }
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    // For TNT: thousandSqFt is used as gallons
    const gallons = thousandSqFt;
    const rate = truckType === 'hose' ? product.hoseRatePerGallon : product.cartRatePerGallon;
    const ouncesNeeded = gallons * rate;
    const result: CalculationResult = {
      product,
      gallons,
      ouncesNeeded,
      tankSelection: truckType || ''
    };
    setCalculations([result]);
  };
  const { user, logout } = useAuth();
  const { currentKiosk } = useKiosk();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedFertilizer = searchParams.get('fertilizer');
  const fertilizerName = searchParams.get('name');
  const truckType = searchParams.get('type'); // 'hose' or 'cart' for TNT Calculator
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [thousandSqFt, setThousandSqFt] = useState<number>(0);
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  const [activeInput, setActiveInput] = useState<'thousandSqFt' | null>(null);

  // Sample fertilizer products for testing
  const sampleProducts: Product[] = [
    {
      id: '1',
      name: '10-10-10 Fertilizer',
      type: 'fertilizer',
      hoseRatePerGallon: 0,
      cartRatePerGallon: 0,
      poundsPer1000SqFt: 2.5,
      poundsPerBag: 50,
      unit: 'pounds',
      isActive: true
    },
    {
      id: '2', 
      name: '16-4-8 Lawn Fertilizer',
      type: 'fertilizer',
      hoseRatePerGallon: 0,
      cartRatePerGallon: 0,
      poundsPer1000SqFt: 3.0,
      poundsPerBag: 50,
      unit: 'pounds',
      isActive: true
    },
    {
      id: '3',
      name: '0-0-60 Potash',
      type: 'fertilizer',
      hoseRatePerGallon: 0,
      cartRatePerGallon: 0,
      poundsPer1000SqFt: 1.5,
      poundsPerBag: 50,
      unit: 'pounds',
      isActive: true
    },
    {
      id: '4',
      name: '46-0-0 Urea',
      type: 'fertilizer',
      hoseRatePerGallon: 0,
      cartRatePerGallon: 0,
      poundsPer1000SqFt: 2.0,
      poundsPerBag: 50,
      unit: 'pounds',
      isActive: true
    },
    {
      id: '5',
      name: 'Lime',
      type: 'fertilizer',
      hoseRatePerGallon: 0,
      cartRatePerGallon: 0,
      poundsPer1000SqFt: 10.0,
      poundsPerBag: 50,
      unit: 'pounds',
      isActive: true
    }
  ];

  useEffect(() => {
    if (preSelectedFertilizer) {
      setProducts(sampleProducts);
      setMode('fertilizer');
    } else if (truckType === 'hose' || truckType === 'cart') {
      setMode('tnt');
      loadLiquidProducts();
    } else {
      setProducts([]);
      setMode('fertilizer');
    }
  }, [preSelectedFertilizer, truckType]);

  const [mode, setMode] = useState<'fertilizer' | 'tnt'>('fertilizer');

  const loadLiquidProducts = async () => {
    try {
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      // Only show active, non-fertilizer products with a rate for the selected truck
      const liquidProducts = productsData.filter(p =>
        p.isActive &&
        p.type !== 'fertilizer' &&
        ((truckType === 'hose' && p.hoseRatePerGallon > 0) || (truckType === 'cart' && p.cartRatePerGallon > 0))
      );
      setProducts(liquidProducts);
    } catch (error) {
      console.error('Error loading liquid products:', error);
    }
  };

  // Handle pre-selected fertilizer from URL
  useEffect(() => {
    if (preSelectedFertilizer && products.length > 0) {
      const product = products.find(p => 
        p.id === preSelectedFertilizer || 
        p.name.toLowerCase() === (fertilizerName || '').toLowerCase()
      );
      
      if (product) {
        setSelectedProduct(product.id);
        // Auto-activate keypad when fertilizer is pre-selected
        setActiveInput('thousandSqFt');
        console.log('🌾 Pre-selected fertilizer:', product.name);
      }
    }
  }, [preSelectedFertilizer, fertilizerName, products]);

  const handleCalculate = () => {
    if (!selectedProduct || thousandSqFt <= 0) {
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product || !product.poundsPer1000SqFt) {
      return;
    }

    // Calculate for granular products - thousandSqFt is in units of 1000 sq ft
    const totalPounds = thousandSqFt * product.poundsPer1000SqFt;
    const totalBags = product.poundsPerBag ? Math.ceil(totalPounds / product.poundsPerBag) : 0;
    const actualSquareFeet = thousandSqFt * 1000; // Convert for display/logging

    const result: CalculationResult = {
      product,
      squareFeet: actualSquareFeet,
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
          userCode: user?.userCode,
          userName: user?.name,
          kioskId: currentKiosk?.id || 'fertilizer',
          kioskName: currentKiosk?.name || 'Fertilizer Kiosk',
          calculations: calculations.map(calc => ({
            productId: calc.product.id,
            productName: calc.product.name,
            productType: calc.product.type,
            squareFeet: calc.squareFeet,
            totalPounds: calc.totalPounds,
            totalBags: calc.totalBags,
            unit: calc.product.unit
          })),
          totalSquareFeet: calculations.reduce((sum, calc) => sum + (calc.squareFeet || 0), 0),
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
      setThousandSqFt(0);
      return;
    }

    if (value === 'backspace') {
      const current = thousandSqFt.toString();
      const newValue = current.slice(0, -1);
      setThousandSqFt(newValue ? parseFloat(newValue) : 0);
      return;
    }

    // Handle number and decimal input
    const currentStr = thousandSqFt === 0 ? '' : thousandSqFt.toString();
    
    // Prevent multiple decimal points
    if (value === '.' && currentStr.includes('.')) return;
    
    const newValueStr = currentStr + value;
    const newValue = parseFloat(newValueStr);
    
    if (!isNaN(newValue) && newValue >= 0) {
      setThousandSqFt(newValue);
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
          Enter 1000 Square Feet
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
            {mode === 'tnt' ? 'TNT Calculator' : 'Fertilizer Calculator'}
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
                  {mode === 'tnt' ? 'TNT Calculator' : 'Fertilizer Calculator'}
                </Typography>

                {/* Product Selection */}
                {mode === 'fertilizer' && !preSelectedFertilizer && (
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
                )}
                {mode === 'tnt' && (
                  <TextField
                    select
                    fullWidth
                    label={`Select Product (${truckType === 'hose' ? 'Hose' : 'Cart'} Truck)`}
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    sx={{ mb: 3 }}
                  >
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name} - {truckType === 'hose' ? product.hoseRatePerGallon : product.cartRatePerGallon} oz/gal
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                {/* 1000 Square Feet Input (fertilizer) or Gallons Input (TNT) */}
                {mode === 'fertilizer' && (
                  <TextField
                    fullWidth
                    label="1000 Square Feet to Cover"
                    value={thousandSqFt || ''}
                    onClick={() => setActiveInput('thousandSqFt')}
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
                )}
                {mode === 'tnt' && (
                  <TextField
                    fullWidth
                    label="Gallons to Spray"
                    value={thousandSqFt || ''}
                    onClick={() => setActiveInput('thousandSqFt')}
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
                )}

                {/* Keypad */}
                {renderKeypad()}

                {mode === 'fertilizer' && (
                  <Button 
                    fullWidth 
                    variant="contained" 
                    size="large"
                    onClick={handleCalculate}
                    disabled={!selectedProduct || thousandSqFt <= 0}
                    startIcon={<CalculateIcon />}
                    sx={{ mt: 2 }}
                  >
                    Calculate Fertilizer
                  </Button>
                )}
                {mode === 'tnt' && (
                  <Button 
                    fullWidth 
                    variant="contained" 
                    size="large"
                    onClick={handleTntCalculate}
                    disabled={!selectedProduct || thousandSqFt <= 0}
                    startIcon={<CalculateIcon />}
                    sx={{ mt: 2 }}
                  >
                    Calculate TNT Mix
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Results */}
          {calculations.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {mode === 'tnt' ? 'TNT Mix Requirements' : 'Fertilizer Requirements'}
                  </Typography>

                  {calculations.map((calc, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {calc.product.name}
                      </Typography>
                      {mode === 'fertilizer' ? (
                        <>
                          <Typography variant="body1">
                            Area: {calc.acres} acres ({calc.squareFeet?.toLocaleString()} sq ft)
                          </Typography>
                          <Typography variant="h5" color="primary" sx={{ my: 1 }}>
                            {calc.totalBags} bags needed
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {calc.totalPounds?.toFixed(1)} pounds total
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="body1">
                            Gallons: {calc.gallons}
                          </Typography>
                          <Typography variant="h5" color="primary" sx={{ my: 1 }}>
                            {calc.ouncesNeeded?.toFixed(2)} oz needed
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Rate: {truckType === 'hose' ? calc.product.hoseRatePerGallon : calc.product.cartRatePerGallon} oz/gal
                          </Typography>
                        </>
                      )}
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
}

export default Calculator;