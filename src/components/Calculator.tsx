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
  Divider
} from '@mui/material';
import { 
  ArrowBack as BackIcon,
  Calculate as CalculateIcon,
  LocalShipping as TruckIcon,
  Logout as LogoutIcon,
  Computer as KioskIcon
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
  frontTankGallons?: number;
  backTankGallons?: number;
  frontTankOunces?: number;
  backTankOunces?: number;
  acres?: number;
  squareFeet?: number;
  totalAmount?: number;
  totalPounds?: number;
  totalBags?: number;
  tankSelection?: string;
  ouncesNeeded?: number;

}

const Calculator: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentKiosk, refreshKioskConfig } = useKiosk();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // If we're on a fertilizer kiosk, ignore pre-selected fertilizer from URL
  // (prevents cached URL params from interfering with the general calculator)
  const preSelectedFertilizer = currentKiosk?.type === 'fertilizer' ? null : searchParams.get('fertilizer');
  const fertilizerName = searchParams.get('name');
  const truckType = searchParams.get('type'); // 'hose' or 'cart' for TNT Calculator
  const applicationId = searchParams.get('application'); // Application recipe ID from equipment selector
  const equipmentType = searchParams.get('equipment'); // 'trailer' or 'backpack' from equipment selector
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [defaultApplication, setDefaultApplication] = useState<any>(null);
  const [selectedApplication, setSelectedApplication] = useState<any>(null); // Specific application from equipment selector
  const [thousandSqFt, setThousandSqFt] = useState<number>(0);
  const [frontTank, setFrontTank] = useState<number>(0);
  const [backTank, setBackTank] = useState<number>(0);
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  const [activeInput, setActiveInput] = useState<'thousandSqFt' | 'frontTank' | 'backTank' | null>(null);
  const [mode, setMode] = useState<'fertilizer' | 'tnt' | 'application'>('fertilizer');

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
    console.log('🔧 Calculator useEffect - truckType:', truckType, 'preSelectedFertilizer:', preSelectedFertilizer, 'applicationId:', applicationId, 'equipment:', equipmentType);
    
    if (applicationId && equipmentType) {
      console.log('📌 Mode: Application Recipe with Equipment');
      setMode('application');
      loadSelectedApplication(applicationId);
      // Auto-open keypad for gallons input
      setActiveInput('frontTank');
    } else if (preSelectedFertilizer) {
      console.log('📌 Mode: Pre-selected fertilizer');
      setProducts(sampleProducts);
      setMode('fertilizer');
      setActiveInput('thousandSqFt'); // Auto-open keypad for fertilizer
    } else if (truckType === 'hose' || truckType === 'cart') {
      console.log('📌 Mode: TNT Calculator - truck type:', truckType);
      setMode('tnt');
      loadDefaultApplication();
      // Auto-open keypad: front tank (driver tank for cart, front tank for hose)
      setActiveInput('frontTank');
    } else {
      console.log('📌 Mode: Fertilizer Calculator - loading products from Firestore');
      // Fertilizer mode - load products from Firestore
      setMode('fertilizer');
      loadFertilizerProducts();
      setActiveInput('thousandSqFt');
    }
  }, [preSelectedFertilizer, truckType, applicationId, equipmentType]);

  // Debug: Monitor calculations state changes
  useEffect(() => {
    console.log('📋 Calculations state updated:', calculations);
  }, [calculations]);

  const loadDefaultApplication = async () => {
    try {
      const applicationsSnapshot = await getDocs(collection(db, 'applications'));
      const applicationsData = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Find the default application
      const defaultApp = applicationsData.find(app => app.isDefault && app.isActive);
      
      if (defaultApp) {
        setDefaultApplication(defaultApp);
      } else {
        console.warn('No default application recipe found. Admin needs to set one.');
      }
    } catch (error) {
      console.error('Error loading default application:', error);
    }
  };

  const loadSelectedApplication = async (appId: string) => {
    try {
      console.log('🎯 Loading selected application:', appId);
      const applicationsSnapshot = await getDocs(collection(db, 'applications'));
      const applicationsData = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Find the specific application by ID
      const app = applicationsData.find(a => a.id === appId && a.isActive);
      
      if (app) {
        setSelectedApplication(app);
        console.log('✅ Loaded application recipe:', app.name, 'with', app.products?.length || 0, 'products');
      } else {
        console.error('❌ Application not found or inactive:', appId);
      }
    } catch (error) {
      console.error('❌ Error loading selected application:', error);
    }
  };

  const loadFertilizerProducts = async () => {
    try {
      console.log('🌾 Loading fertilizer products from Firestore...');
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const allProducts = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Filter for active fertilizer products that have the required poundsPer1000SqFt field
      let fertilizerProducts = allProducts.filter(p => 
        p.isActive && 
        (p.type === 'fertilizer' || p.type === 'granular') &&
        p.poundsPer1000SqFt !== undefined && 
        p.poundsPer1000SqFt > 0
      );
      
      // If kiosk has specific products assigned, filter to only those
      if (currentKiosk?.availableProducts && currentKiosk.availableProducts.length > 0) {
        console.log('🔒 Filtering products for kiosk:', currentKiosk.name);
        console.log('  └─ Available product IDs:', currentKiosk.availableProducts);
        fertilizerProducts = fertilizerProducts.filter(p => 
          currentKiosk.availableProducts.includes(p.id)
        );
        console.log('  └─ Filtered to', fertilizerProducts.length, 'products');
      }
      
      console.log('📦 Loaded fertilizer products:', fertilizerProducts);
      setProducts(fertilizerProducts);
    } catch (error) {
      console.error('❌ Error loading fertilizer products:', error);
      // Fallback to sample products if Firestore fails
      setProducts(sampleProducts);
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
    console.log('🧮 Calculate button clicked');
    console.log('Selected product:', selectedProduct);
    console.log('ThousandSqFt:', thousandSqFt);
    console.log('Products array:', products);
    
    if (!selectedProduct || thousandSqFt <= 0) {
      console.warn('❌ Missing data - selectedProduct:', selectedProduct, 'thousandSqFt:', thousandSqFt);
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    console.log('Found product:', product);
    
    if (!product || !product.poundsPer1000SqFt) {
      console.warn('❌ Invalid product or missing poundsPer1000SqFt:', product);
      return;
    }

    // Calculate for granular products - thousandSqFt is in units of 1000 sq ft
    const totalPounds = thousandSqFt * product.poundsPer1000SqFt;
    const totalBags = product.poundsPerBag ? Math.ceil(totalPounds / product.poundsPerBag) : 0;
    const actualSquareFeet = thousandSqFt * 1000; // Convert for display/logging
    const acres = actualSquareFeet / 43560; // Convert square feet to acres

    console.log('📊 Calculation results:', { totalPounds, totalBags, actualSquareFeet, acres });

    const result: CalculationResult = {
      product,
      squareFeet: actualSquareFeet,
      acres: acres,
      totalAmount: totalPounds,
      totalPounds,
      totalBags,
      tankSelection: 'granular'
    };

    console.log('✅ Setting calculation result:', result);
    console.log('📋 Current calculations state before setState:', calculations);
    setCalculations([result]);
    console.log('📋 setCalculations called with:', [result]);
  };

  // TNT calculation logic for hose/cart trucks using default application or selected application
  const handleTntCalculate = () => {
    // Use selectedApplication if in application mode, otherwise use defaultApplication
    const applicationToUse = mode === 'application' ? selectedApplication : defaultApplication;
    
    if (!applicationToUse || !applicationToUse.products || applicationToUse.products.length === 0) {
      console.warn('No application or products found');
      return;
    }

    const results: CalculationResult[] = [];

    // For application mode, both trailer and backpack use single tank
    if (mode === 'application') {
      // Application mode: Single tank for both trailer and backpack
      if (frontTank <= 0) return;
      
      // Calculate for each product in the application recipe
      applicationToUse.products.forEach((appProduct: any) => {
        const rate = appProduct.hoseRate || 0; // Use hoseRate for application mode
        const tankOunces = frontTank * rate;
        
        const result: CalculationResult = {
          product: {
            id: appProduct.productId,
            name: appProduct.productName,
            type: appProduct.productType || 'herbicide',
            hoseRatePerGallon: rate,
            cartRatePerGallon: appProduct.cartRate || 0,
            poundsPer1000SqFt: 0,
            poundsPerBag: 0,
            unit: appProduct.unit || 'ounces',
            isActive: true
          },
          gallons: frontTank,
          frontTankGallons: frontTank,
          backTankGallons: 0,
          frontTankOunces: tankOunces,
          backTankOunces: 0,
          ouncesNeeded: tankOunces,
          tankSelection: equipmentType || 'application'
        };
        results.push(result);
      });
    } else if (truckType === 'hose') {
      // Hose truck: calculate for both tanks separately for each product
      if (frontTank <= 0 && backTank <= 0) return;
      
      // Calculate for each product in the application recipe
      applicationToUse.products.forEach((appProduct: any) => {
        const rate = appProduct.hoseRate || 0;
        const frontTankOunces = frontTank * rate;
        const backTankOunces = backTank * rate;
        
        const result: CalculationResult = {
          product: {
            id: appProduct.productId,
            name: appProduct.productName,
            type: appProduct.productType || 'herbicide',
            hoseRatePerGallon: rate,
            cartRatePerGallon: appProduct.cartRate || 0,
            poundsPer1000SqFt: 0,
            poundsPerBag: 0,
            unit: appProduct.unit || 'ounces',
            isActive: true
          },
          gallons: frontTank + backTank,
          frontTankGallons: frontTank,
          backTankGallons: backTank,
          frontTankOunces: frontTankOunces,
          backTankOunces: backTankOunces,
          ouncesNeeded: frontTankOunces + backTankOunces,
          tankSelection: 'hose'
        };
        results.push(result);
      });
    } else {
      // Cart truck: Dual tank calculation (driver and passenger tanks)
      if (frontTank <= 0 && backTank <= 0) return;
      
      // Calculate for each product in the application recipe
      applicationToUse.products.forEach((appProduct: any) => {
        const rate = appProduct.cartRate || 0;
        const driverTankOunces = frontTank * rate;
        const passengerTankOunces = backTank * rate;
        
        const result: CalculationResult = {
          product: {
            id: appProduct.productId,
            name: appProduct.productName,
            type: appProduct.productType || 'herbicide',
            hoseRatePerGallon: appProduct.hoseRate || 0,
            cartRatePerGallon: rate,
            poundsPer1000SqFt: 0,
            poundsPerBag: 0,
            unit: appProduct.unit || 'ounces',
            isActive: true
          },
          gallons: frontTank + backTank,
          frontTankGallons: frontTank,
          backTankGallons: backTank,
          frontTankOunces: driverTankOunces,
          backTankOunces: passengerTankOunces,
          ouncesNeeded: driverTankOunces + passengerTankOunces,
          tankSelection: 'cart'
        };
        results.push(result);
      });
    }
    
    setCalculations(results);
  };

  const handleLogOut = async () => {
    try {
      if (calculations.length > 0) {
        // Save application to database
        if (mode === 'fertilizer') {
          // Save fertilizer application
          await addDoc(collection(db, 'applications'), {
            userCode: user?.userCode,
            userName: user?.name,
            kioskId: currentKiosk?.id || 'fertilizer-kiosk',
            kioskName: currentKiosk?.name || 'Dry Fertilizer',
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
        } else {
          // Save TNT application (liquid products)
          await addDoc(collection(db, 'applications'), {
            userCode: user?.userCode,
            userName: user?.name,
            kioskId: currentKiosk?.id || 'specialty-kiosk',
            kioskName: currentKiosk?.name || 'Specialty Applications',
            applicationName: defaultApplication?.name || 'TNT Mix',
            truckType: truckType,
            calculations: calculations.map(calc => ({
              productId: calc.product.id,
              productName: calc.product.name,
              productType: calc.product.type,
              frontTankGallons: calc.frontTankGallons,
              backTankGallons: calc.backTankGallons,
              frontTankOunces: calc.frontTankOunces,
              backTankOunces: calc.backTankOunces,
              totalOunces: calc.ouncesNeeded,
              unit: calc.product.unit
            })),
            totalGallons: frontTank + backTank,
            frontTankGallons: frontTank,
            backTankGallons: backTank,
            timestamp: serverTimestamp(),
            sessionType: 'tnt'
          });
          console.log('✅ TNT application saved to database');
        }
      }
      
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleSaveAndReset = async () => {
    try {
      if (calculations.length > 0) {
        // Save fertilizer application
        await addDoc(collection(db, 'applications'), {
          userCode: user?.userCode,
          userName: user?.name,
          kioskId: currentKiosk?.id || 'fertilizer-kiosk',
          kioskName: currentKiosk?.name || 'Dry Fertilizer',
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
        console.log('✅ Fertilizer application saved, resetting calculator');
      }
      
      // Reset the calculator
      setSelectedProduct('');
      setThousandSqFt(0);
      setCalculations([]);
      setActiveInput('thousandSqFt');
    } catch (error) {
      console.error('Error saving application:', error);
    }
  };

  const handleChangeKiosk = async () => {
    // Clear kiosk configuration to show selector again
    localStorage.removeItem('tnt-current-kiosk-id');
    localStorage.removeItem('tnt-kiosk-last-set');
    // Refresh the context and navigate to dashboard
    await refreshKioskConfig();
    // Navigate to dashboard which will show KioskSelector via KioskConfigWrapper
    navigate('/dashboard', { replace: true });
  };

  // Keypad functions
  const handleKeypadInput = (value: string) => {
    if (!activeInput) return;

    if (value === 'clear') {
      if (activeInput === 'frontTank') setFrontTank(0);
      else if (activeInput === 'backTank') setBackTank(0);
      else setThousandSqFt(0);
      return;
    }

    if (value === 'backspace') {
      if (activeInput === 'frontTank') {
        const current = frontTank.toString();
        const newValue = current.slice(0, -1);
        setFrontTank(newValue ? parseFloat(newValue) : 0);
      } else if (activeInput === 'backTank') {
        const current = backTank.toString();
        const newValue = current.slice(0, -1);
        setBackTank(newValue ? parseFloat(newValue) : 0);
      } else {
        const current = thousandSqFt.toString();
        const newValue = current.slice(0, -1);
        setThousandSqFt(newValue ? parseFloat(newValue) : 0);
      }
      return;
    }

    // Handle number and decimal input
    let currentStr = '';
    if (activeInput === 'frontTank') {
      currentStr = frontTank === 0 ? '' : frontTank.toString();
    } else if (activeInput === 'backTank') {
      currentStr = backTank === 0 ? '' : backTank.toString();
    } else {
      currentStr = thousandSqFt === 0 ? '' : thousandSqFt.toString();
    }
    
    // Prevent multiple decimal points
    if (value === '.' && currentStr.includes('.')) return;
    
    const newValueStr = currentStr + value;
    const newValue = parseFloat(newValueStr);
    
    if (!isNaN(newValue) && newValue >= 0) {
      if (activeInput === 'frontTank') {
        setFrontTank(newValue);
      } else if (activeInput === 'backTank') {
        setBackTank(newValue);
      } else {
        setThousandSqFt(newValue);
      }
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

    let label = 'Enter 1000 Square Feet';
    if (activeInput === 'frontTank') {
      if (mode === 'application') {
        label = 'Enter Tank Gallons';
      } else if (truckType === 'cart') {
        label = 'Enter Driver Tank Gallons';
      } else {
        label = 'Enter Front Tank Gallons';
      }
    } else if (activeInput === 'backTank') {
      if (mode === 'application') {
        label = 'Enter Tank Gallons';
      } else if (truckType === 'cart') {
        label = 'Enter Passenger Tank Gallons';
      } else {
        label = 'Enter Back Tank Gallons';
      }
    } else if (mode === 'tnt' || mode === 'application') {
      label = 'Enter Gallons';
    }

    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, textAlign: 'center' }}>
          {label}
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
      </Box>
    );
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {mode !== 'fertilizer' && (
            <Button 
              color="inherit" 
              startIcon={<BackIcon />}
              onClick={() => navigate('/dashboard')}
              sx={{ mr: 2 }}
            >
              Back to Dashboard
            </Button>
          )}
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: mode === 'fertilizer' ? 'center' : 'flex-start' }}>
            {mode === 'fertilizer' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TruckIcon sx={{ fontSize: 40 }} />
                <Typography variant="h6" component="div">
                  Fertilizer Calculator
                  {currentKiosk && (
                    <Typography variant="subtitle2" component="div" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      🏭 {currentKiosk.name}
                    </Typography>
                  )}
                </Typography>
                {user?.role?.toLowerCase() === 'admin' && (
                  <Button
                    size="small"
                    color="inherit"
                    onClick={handleChangeKiosk}
                    startIcon={<KioskIcon />}
                    sx={{ 
                      color: 'rgba(255,255,255,0.9)',
                      minWidth: 'auto',
                      fontSize: '0.75rem',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                    }}
                  >
                    Change Kiosk
                  </Button>
                )}
              </Box>
            )}
            {mode !== 'fertilizer' && (
              <>
                <TruckIcon sx={{ mr: 2 }} />
                <Typography variant="h6" component="div">
                  {mode === 'application' ? 'Application Calculator' : 'TNT Calculator'}
                  {currentKiosk && (
                    <Typography variant="subtitle2" component="div" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      🏭 {currentKiosk.name}
                    </Typography>
                  )}
                </Typography>
              </>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {user?.name}
              </Typography>
              <Typography variant="caption">
                {user?.role?.toLowerCase() === 'admin' ? 'Administrator' : ''} Applicator Code: {user?.userCode}
              </Typography>
            </Box>
            <Button 
              color="inherit" 
              onClick={handleLogOut}
              startIcon={<LogoutIcon />}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } 
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Product Selection Cards - Only show in fertilizer mode without pre-selected product */}
        {mode === 'fertilizer' && !preSelectedFertilizer && !selectedProduct && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
              Select Your Fertilizer Product
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card 
                    sx={{ 
                      height: '220px',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: selectedProduct === product.id ? '3px solid' : '1px solid',
                      borderColor: selectedProduct === product.id ? 'primary.main' : 'grey.300',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                        borderColor: 'primary.main'
                      }
                    }}
                    onClick={() => {
                      setSelectedProduct(product.id);
                      setActiveInput('thousandSqFt');
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {product.name}
                      </Typography>
                      <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                        {product.poundsPer1000SqFt} lbs/1000 sq ft
                      </Typography>
                      {product.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {product.description}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Grid container spacing={3}>
          {/* Only show calculator card in fertilizer mode if a product is selected */}
          {(mode !== 'fertilizer' || selectedProduct) && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalculateIcon sx={{ mr: 1 }} />
                    {mode === 'application' ? 'Application Calculator' : mode === 'tnt' ? 'TNT Calculator' : 'Fertilizer Calculator'}
                  </Typography>

                  {/* Display selected product name in fertilizer mode */}
                  {mode === 'fertilizer' && selectedProduct && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>
                        {products.find(p => p.id === selectedProduct)?.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'success.contrastText' }}>
                        {products.find(p => p.id === selectedProduct)?.poundsPer1000SqFt} lbs/1000 sq ft
                      </Typography>
                    </Box>
                    {!preSelectedFertilizer && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setSelectedProduct('');
                          setThousandSqFt(0);
                          setCalculations([]);
                          setActiveInput(null);
                        }}
                        sx={{ 
                          color: 'success.contrastText',
                          borderColor: 'success.contrastText',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)',
                            borderColor: 'success.contrastText'
                          }
                        }}
                      >
                        Change
                      </Button>
                    )}
                  </Box>
                )}

                {/* Display default application name for TNT mode */}
                {mode === 'tnt' && defaultApplication && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1, color: 'primary.contrastText' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {defaultApplication.name}
                    </Typography>
                    {defaultApplication.description && (
                      <Typography variant="body2">
                        {defaultApplication.description}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Display selected application for application mode */}
                {mode === 'application' && selectedApplication && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', borderRadius: 1, color: 'success.contrastText' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {selectedApplication.name}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      Equipment: {equipmentType === 'trailer' ? '🚜 Trailer' : '🎒 Backpack'}
                    </Typography>
                    {selectedApplication.description && (
                      <Typography variant="body2">
                        {selectedApplication.description}
                      </Typography>
                    )}
                  </Box>
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
                {/* Tank Inputs - Different for hose vs cart vs application mode */}
                {mode === 'tnt' && truckType === 'hose' && (
                  <>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Front Tank (Gallons)"
                          value={frontTank || ''}
                          onClick={() => setActiveInput('frontTank')}
                          InputProps={{
                            readOnly: true,
                            style: { cursor: 'pointer', fontSize: '1.2rem', textAlign: 'center' }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover': {
                                backgroundColor: 'action.hover'
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Back Tank (Gallons)"
                          value={backTank || ''}
                          onClick={() => setActiveInput('backTank')}
                          InputProps={{
                            readOnly: true,
                            style: { cursor: 'pointer', fontSize: '1.2rem', textAlign: 'center' }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover': {
                                backgroundColor: 'action.hover'
                              }
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </>
                )}
                {/* Application Mode - Single tank for both trailer and backpack */}
                {mode === 'application' && (
                  <TextField
                    fullWidth
                    label="Tank (Gallons)"
                    value={frontTank || ''}
                    onClick={() => setActiveInput('frontTank')}
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
                {mode === 'tnt' && truckType === 'cart' && (
                  <>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Driver Tank (gallons)"
                          value={frontTank || ''}
                          onClick={() => setActiveInput('frontTank')}
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
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Passenger Tank (gallons)"
                          value={backTank || ''}
                          onClick={() => setActiveInput('backTank')}
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
                      </Grid>
                    </Grid>
                  </>
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
                {(mode === 'tnt' || mode === 'application') && (
                  <Button 
                    fullWidth 
                    variant="contained" 
                    size="large"
                    onClick={handleTntCalculate}
                    disabled={
                      (mode === 'tnt' && !defaultApplication) ||
                      (mode === 'application' && !selectedApplication) ||
                      (mode === 'application' ? frontTank <= 0 : (frontTank <= 0 && backTank <= 0))
                    }
                    startIcon={<CalculateIcon />}
                    sx={{ mt: 2 }}
                  >
                    Calculate TNT Mix
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
          )}

          {/* Results */}
          {calculations.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {mode === 'application' ? 'Application Mix Requirements' : mode === 'tnt' ? 'TNT Mix Requirements' : 'Fertilizer Requirements'}
                  </Typography>

                  {calculations.map((calc, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {calc.product.name}
                      </Typography>
                      {mode === 'fertilizer' ? (
                        <>
                          <Typography variant="body1">
                            Area: {calc.squareFeet?.toLocaleString()} sq ft
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
                          {mode === 'application' ? (
                            // Application mode: Single tank display
                            <>
                              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Tank: {calc.frontTankGallons} gallons
                              </Typography>
                              <Typography variant="h5" color="primary" sx={{ textAlign: 'center', my: 2 }}>
                                {calc.ouncesNeeded?.toFixed(2)} oz needed
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Rate: {calc.product.hoseRatePerGallon} oz/gal
                              </Typography>
                            </>
                          ) : calc.frontTankGallons !== undefined && calc.backTankGallons !== undefined && calc.backTankGallons > 0 ? (
                            // TNT mode: Two tanks display
                            <>
                              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {truckType === 'cart' ? 'Driver Tank' : 'Front Tank'}: {calc.frontTankGallons} gallons
                              </Typography>
                              <Typography variant="h6" color="primary" sx={{ ml: 2, mb: 2 }}>
                                {calc.frontTankOunces?.toFixed(2)} oz
                              </Typography>
                              
                              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {truckType === 'cart' ? 'Passenger Tank' : 'Back Tank'}: {calc.backTankGallons} gallons
                              </Typography>
                              <Typography variant="h6" color="primary" sx={{ ml: 2 }}>
                                {calc.backTankOunces?.toFixed(2)} oz
                              </Typography>
                              
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="h5" color="primary" sx={{ textAlign: 'center' }}>
                                Total: {calc.ouncesNeeded?.toFixed(2)} oz
                              </Typography>
                            </>
                          ) : (
                            // Fallback: Single tank display
                            <>
                              <Typography variant="body1">
                                Gallons: {calc.gallons}
                              </Typography>
                              <Typography variant="h5" color="primary" sx={{ my: 1 }}>
                                {calc.ouncesNeeded?.toFixed(2)} oz needed
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Rate: {calc.product.cartRatePerGallon} oz/gal
                              </Typography>
                            </>
                          )}
                        </>
                      )}
                    </Box>
                  ))}

                  {mode === 'fertilizer' && (
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      color="success"
                      size="large"
                      onClick={handleSaveAndReset}
                      startIcon={<CalculateIcon />}
                      sx={{ mt: 3, mb: 2 }}
                    >
                      Do Another Calculation
                    </Button>
                  )}

                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary"
                    size="large"
                    onClick={handleLogOut}
                    startIcon={<LogoutIcon />}
                    sx={{ mt: mode === 'fertilizer' ? 0 : 3 }}
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