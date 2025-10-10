import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  AppBar, 
  Toolbar, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Chip
} from '@mui/material';
import { 
  Assessment as ReportsIcon,
  AdminPanelSettings as AdminIcon,
  ExitToApp as LogoutIcon,
  Computer as KioskIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useKiosk } from '../contexts/KioskContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentKiosk, refreshKioskConfig } = useKiosk();
  const navigate = useNavigate();
  const [fertilizerProducts, setFertilizerProducts] = useState<any[]>([]);

  // Load fertilizer products for fertilizer kiosk
  useEffect(() => {
    if (currentKiosk?.type === 'fertilizer') {
      loadFertilizerProducts();
    }
  }, [currentKiosk]);

  const loadFertilizerProducts = async () => {
    try {
      // Load products from Firebase
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const allProducts = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter for active fertilizer products
      const fertilizerProducts = allProducts.filter((product: any) => 
        product.isActive && product.type === 'fertilizer'
      );

      // If kiosk has specific product assignments, filter by those
      if (currentKiosk?.availableProducts && currentKiosk.availableProducts.length > 0) {
        const assignedProducts = fertilizerProducts.filter((product: any) => 
          currentKiosk.availableProducts.includes(product.id)
        );
        setFertilizerProducts(assignedProducts);
      } else {
        // Show all active fertilizer products if no specific assignment
        setFertilizerProducts(fertilizerProducts);
      }
    } catch (error) {
      console.error('Error loading fertilizer products:', error);
      // Fallback to sample products on error
      const sampleProducts = [
        { id: '1', name: '10-10-10 Fertilizer', type: 'fertilizer', poundsPer1000SqFt: 2.5, isActive: true },
        { id: '2', name: '16-4-8 Lawn Fertilizer', type: 'fertilizer', poundsPer1000SqFt: 3.0, isActive: true },
        { id: '3', name: '0-0-60 Potash', type: 'fertilizer', poundsPer1000SqFt: 1.5, isActive: true },
        { id: '4', name: '46-0-0 Urea', type: 'fertilizer', poundsPer1000SqFt: 2.0, isActive: true },
        { id: '5', name: 'Lime', type: 'fertilizer', poundsPer1000SqFt: 10.0, isActive: true }
      ];
      setFertilizerProducts(sampleProducts);
    }
  };

  const handleFertilizerSelect = (product: any) => {
    // Navigate to calculator with pre-selected fertilizer
    navigate(`/calculator?fertilizer=${product.id}&name=${encodeURIComponent(product.name)}`);
  };

  const handleLogout = async () => {
    console.log('🚪 Logout button clicked');
    try {
      await logout();
      console.log('✅ Logout successful, clearing localStorage and navigating to login');
      
      // Force clear localStorage
      localStorage.removeItem('tnt-user');
      localStorage.clear();
      
      // Navigate to login screen (keypad interface)
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Force navigate to login anyway
      navigate('/login', { replace: true });
    }
  };

  const getSubtitleMessage = () => {
    if (currentKiosk?.type === 'fertilizer') {
      return "Select your fertilizer product";
    }
    return "Select an option below to get started";
  };

  const getKioskWelcomeMessage = () => {
    if (!currentKiosk) return 'Welcome to TNT Loading Zone';
    
    switch (currentKiosk.type) {
      case 'fertilizer':
        return 'TNT Fertilizer Station';
      case 'specialty':
        return 'TNT Specialty Applications';
      case 'mixed':
        return 'TNT Multi-Product Station';
      default:
        return 'TNT Loading Zone';
    }
  };

  const handleChangeKiosk = () => {
    // Clear kiosk configuration to show selector again
    localStorage.removeItem('tnt-current-kiosk-id');
    localStorage.removeItem('tnt-kiosk-last-set');
    // Force the context to refresh
    refreshKioskConfig().then(() => {
      window.location.reload();
    });
  };

  const handleTruckSelection = (truckType: 'hose' | 'cart') => {
    // Always go to calculator with both tanks selected
    navigate(`/calculator?type=${truckType}&tank=both`);
  };

  const actionCards = [
    {
      title: 'TNT Calculator - Hose Truck',
      description: 'Calculate application amounts for hose truck',
      icon: (
        <img 
          src="/images/hose-truck.png" 
          alt="Hose Truck" 
          style={{ width: 70, height: 70, objectFit: 'contain' }}
          onLoad={() => console.log('Hose truck image loaded successfully')}
          onError={(e) => {
            console.error('Failed to load hose truck image');
            // Fallback to icon if image fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.innerHTML = '<div style="font-size: 70px;">🚛</div>';
          }}
        />
      ),
      action: () => handleTruckSelection('hose'),
      color: 'primary.main',
      available: currentKiosk?.type === 'specialty'
    },
    {
      title: 'TNT Calculator - Cart Truck',
      description: 'Calculate application amounts for cart truck',
      icon: (
        <img 
          src="/images/cart-truck.png" 
          alt="Cart Truck" 
          style={{ width: 70, height: 70, objectFit: 'contain' }}
          onLoad={() => console.log('Cart truck image loaded successfully')}
          onError={(e) => {
            console.error('Failed to load cart truck image');
            // Fallback to icon if image fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.innerHTML = '<div style="font-size: 70px;">🚚</div>';
          }}
        />
      ),
      action: () => handleTruckSelection('cart'),
      color: 'success.main',
      available: currentKiosk?.type === 'specialty'
    },
    {
      title: 'View Reports',
      description: 'Check usage reports and activity logs',
      icon: <ReportsIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/reports'),
      color: 'info.main',
      available: user?.role?.toLowerCase() === 'admin' && currentKiosk?.type === 'specialty'
    },
    {
      title: 'Admin Panel',
      description: 'Manage users and system settings',
      icon: <AdminIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/admin'),
      color: 'secondary.main',
      available: user?.role?.toLowerCase() === 'admin' && currentKiosk?.type === 'specialty'
    },
    {
      title: 'Debug Database',
      description: 'Debug activity logs and data issues',
      icon: <Typography sx={{ fontSize: 40 }}>🔍</Typography>,
      action: () => navigate('/debug'),
      color: 'warning.main',
      available: user?.role?.toLowerCase() === 'admin' && currentKiosk?.type === 'specialty'
    }
  ];

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              Welcome
            </Typography>
            {currentKiosk && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <KioskIcon sx={{ color: 'rgba(255,255,255,0.8)' }} />
                <Chip 
                  label={`${currentKiosk.name} (${currentKiosk.type.charAt(0).toUpperCase() + currentKiosk.type.slice(1)})`}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                <Button
                  size="small"
                  color="inherit"
                  onClick={refreshKioskConfig}
                  startIcon={<RefreshIcon />}
                  sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    minWidth: 'auto',
                    fontSize: '0.75rem'
                  }}
                >
                  Refresh
                </Button>
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
              onClick={handleLogout}
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
      
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, px: 3 }}>
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {getKioskWelcomeMessage()}
          </Typography>
          <Typography variant="h5" color="text.secondary">
            {getSubtitleMessage()}
          </Typography>
        </Box>

        {/* Fertilizer Product Selection */}
        {currentKiosk?.type === 'fertilizer' && (
          <Box sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}>
            <Grid container spacing={3} justifyContent="center">
              {fertilizerProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card 
                    sx={{ 
                      height: '250px',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        borderColor: 'primary.main'
                      },
                      border: 2,
                      borderColor: 'transparent'
                    }}
                    onClick={() => handleFertilizerSelect(product)}
                  >
                    <CardContent sx={{ flexGrow: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: 40, mb: 1 }}>
                          🌾
                        </Typography>
                      </Box>
                      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                        {product.name}
                      </Typography>
                      <Box sx={{ 
                        backgroundColor: 'primary.light', 
                        color: 'primary.contrastText', 
                        borderRadius: 1, 
                        py: 0.5, 
                        px: 1, 
                        display: 'inline-block',
                        mt: 1
                      }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {product.poundsPer1000SqFt} lbs per 1000 sq ft
                        </Typography>
                      </Box>
                      {product.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
                          {product.description}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                      <Button 
                        variant="contained" 
                        color="primary"
                        size="large"
                        sx={{ minWidth: 120 }}
                      >
                        SELECT
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Action Cards - Show for specialty kiosk */}
        {currentKiosk?.type === 'specialty' && (
          <Grid container spacing={4} justifyContent="center">
          {actionCards.filter(card => card.available).map((card, index) => (
            <Grid item xs={12} sm={8} md={6} lg={4} key={index}>
              <Card 
                sx={{ 
                  height: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={card.action}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Box sx={{ color: card.color, mb: 2 }}>
                      {card.icon}
                    </Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.description}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button 
                    variant="contained" 
                    onClick={card.action}
                    sx={{ 
                      minWidth: '160px',
                      fontSize: '1.2rem',
                      py: 2,
                      px: 4,
                      fontWeight: 'bold'
                    }}
                  >
                    OPEN
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          </Grid>
        )}

      </Container>
    </>
  );
};

export default Dashboard;