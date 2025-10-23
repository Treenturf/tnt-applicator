import React, { useEffect, useState, useMemo } from 'react';
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
import { useAuth } from '../contexts/AuthContext';
import { useKiosk } from '../contexts/KioskContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import CategorySelector from './CategorySelector';

// Application interface
interface Application {
  id: string;
  name: string;
  description?: string;
  category: string;
  applicationCategory?: 'trees' | 'other';
  products: any[];
  isActive: boolean;
  isDefault?: boolean;
  availableKiosks?: ('specialty' | 'mixed' | 'fertilizer')[];
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentKiosk, refreshKioskConfig } = useKiosk();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'trees' | 'other' | null>(null);

  // Load applications for Standard Applications kiosk
  useEffect(() => {
    if (currentKiosk?.type === 'mixed') {
      loadApplications();
    }
  }, [currentKiosk]);

  const loadApplications = async () => {
    try {
      const applicationsSnapshot = await getDocs(collection(db, 'applications'));
      const applicationsData = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Application[];
      
      // Filter for active applications available on the current kiosk
      const availableApplications = applicationsData.filter(app => 
        app.isActive && 
        app.availableKiosks?.includes(currentKiosk?.type || 'mixed')
      );
      
      setApplications(availableApplications);
      console.log('📋 Loaded applications for kiosk:', availableApplications);
      console.log('📋 Applications with categories:', availableApplications.map(app => ({
        name: app.name,
        category: app.applicationCategory
      })));
    } catch (error) {
      console.error('❌ Error loading applications:', error);
    }
  };

  // Auto-redirect to calculator for fertilizer kiosk (all users including admin)
  useEffect(() => {
    if (currentKiosk?.type === 'fertilizer') {
      console.log('🌾 Fertilizer kiosk detected - redirecting to calculator');
      navigate('/calculator', { replace: true });
    }
  }, [currentKiosk, navigate]);

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

  const handleExitKiosk = async () => {
    console.log('🚪 Exit Kiosk button clicked');
    
    try {
      // Try to call the local exit endpoint on the Pi
      await fetch('http://localhost:8888/exit', { method: 'GET', mode: 'no-cors' });
      console.log('✅ Exit signal sent');
    } catch (error) {
      console.error('❌ Error sending exit signal:', error);
      // Fallback: navigate to exit page
      window.location.href = '/exit-kiosk.html';
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
        return 'Standard Applications';
      case 'mixed':
        return 'Specialty Applications';
      default:
        return 'TNT Loading Zone';
    }
  };

  const handleChangeKiosk = async () => {
    // Clear kiosk configuration to show selector again
    localStorage.removeItem('tnt-current-kiosk-id');
    localStorage.removeItem('tnt-kiosk-last-set');
    // Refresh the context - this will show the KioskSelector since isKioskConfigured will be false
    await refreshKioskConfig();
  };

  const handleTruckSelection = (truckType: 'hose' | 'cart') => {
    // Always go to calculator with both tanks selected
    navigate(`/calculator?type=${truckType}&tank=both`);
  };

  const actionCards = [
    {
      title: 'Hose Truck',
      description: '',
      icon: (
        <img 
          src="/images/hose-truck.png" 
          alt="Hose Truck" 
          style={{ width: 70, height: 70, objectFit: 'contain' }}
          onLoad={() => console.log('✅ Hose truck image loaded')}
          onError={(e) => {
            console.error('❌ Failed to load hose truck image');
            // Fallback to emoji if image fails
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.innerHTML = '<div style="font-size: 70px;">🚛</div>';
            }
          }}
        />
      ),
      action: () => handleTruckSelection('hose'),
      color: 'primary.main',
      available: currentKiosk?.type === 'specialty' || currentKiosk?.type === 'mixed'
    },
    {
      title: 'Cart Truck',
      description: '',
      icon: (
        <img 
          src="/images/cart-truck.png" 
          alt="Cart Truck" 
          style={{ width: 70, height: 70, objectFit: 'contain' }}
          onLoad={() => console.log('✅ Cart truck image loaded')}
          onError={(e) => {
            console.error('❌ Failed to load cart truck image');
            // Fallback to emoji if image fails
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.innerHTML = '<div style="font-size: 70px;">🚚</div>';
            }
          }}
        />
      ),
      action: () => handleTruckSelection('cart'),
      color: 'success.main',
      available: currentKiosk?.type === 'specialty' || currentKiosk?.type === 'mixed'
    },
    {
      title: 'Dry Fertilizer Calculator',
      description: 'Calculate fertilizer amounts for bagged products',
      icon: <Typography sx={{ fontSize: 40 }}>🌾</Typography>,
      action: () => navigate('/calculator'),
      color: 'success.main',
      available: currentKiosk?.type === 'fertilizer'
    },
    {
      title: 'Admin Panel',
      description: 'Manage users and system settings',
      icon: <Typography sx={{ fontSize: 40 }}>⚙️</Typography>,
      action: () => navigate('/admin'),
      color: 'secondary.main',
      available: user?.role?.toLowerCase() === 'admin' && (currentKiosk?.type === 'specialty' || currentKiosk?.type === 'mixed')
    },
    {
      title: 'Manager Panel',
      description: 'Manage kiosks and default applications',
      icon: <Typography sx={{ fontSize: 40 }}>👨‍💼</Typography>,
      action: () => navigate('/manager'),
      color: 'warning.main',
      available: user?.role?.toLowerCase() === 'manager' && (currentKiosk?.type === 'specialty' || currentKiosk?.type === 'mixed')
    }
  ];

  // Get theme color based on kiosk type
  const getAppBarColor = () => {
    if (currentKiosk?.type === 'fertilizer') return '#0288d1'; // Sea blue for fertilizer
    if (currentKiosk?.type === 'mixed' || currentKiosk?.id === 'specialty-kiosk') return '#c62828'; // Red for specialty
    return 'primary.main'; // Default green
  };

  // Get button color for theme consistency
  const getButtonColor = () => {
    if (currentKiosk?.type === 'fertilizer') return { bgcolor: '#0288d1', '&:hover': { bgcolor: '#0277bd' } };
    if (currentKiosk?.type === 'mixed' || currentKiosk?.id === 'specialty-kiosk') return { bgcolor: '#c62828', '&:hover': { bgcolor: '#b71c1c' } };
    return {}; // Default will use primary.main from theme
  };

  const buttonColorSx = getButtonColor();

  // Memoize filtered applications to prevent render loops
  const filteredApplications = useMemo(() => {
    if (!selectedCategory) return applications;
    
    const filtered = applications.filter(app => app.applicationCategory === selectedCategory);
    
    console.log('🔍 Filtering applications:', {
      selectedCategory,
      totalApps: applications.length,
      filteredApps: filtered.length,
      appsWithCategory: filtered.map(a => ({ name: a.name, category: a.applicationCategory }))
    });
    
    return filtered;
  }, [applications, selectedCategory]);

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: getAppBarColor() }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              Welcome
            </Typography>
            {currentKiosk && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                <Typography sx={{ fontSize: 20 }}>⬛</Typography>
                <Chip 
                  label={currentKiosk.name}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                {user?.role?.toLowerCase() === 'admin' && (
                  <Button
                    size="small"
                    color="inherit"
                    onClick={handleChangeKiosk}
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
                {user?.role?.toLowerCase() === 'admin' ? 'Admin' : 
                 user?.role?.toLowerCase() === 'manager' ? 'Manager' : 'Applicator'}
              </Typography>
            </Box>
            {user?.role?.toLowerCase() === 'admin' && (
              <Button 
                color="inherit" 
                onClick={handleExitKiosk}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } 
                }}
                title="Exit Kiosk Mode"
              >
                Exit Kiosk
              </Button>
            )}
            {user?.role?.toLowerCase() === 'manager' && (
              <Chip 
                label="Manager Mode" 
                color="warning" 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  '& .MuiChip-label': { color: 'white' }
                }} 
              />
            )}
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
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Show CategorySelector for Specialty Apps kiosk if no category selected */}
      {currentKiosk?.type === 'mixed' && !selectedCategory ? (
        <CategorySelector onCategorySelected={(category) => {
          console.log('📂 Category selected:', category);
          console.log('📋 Total applications:', applications.length);
          console.log('📋 Applications in this category:', applications.filter(app => app.applicationCategory === category).length);
          setSelectedCategory(category);
        }} />
      ) : (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4, px: 3 }}>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {getKioskWelcomeMessage()}
            </Typography>
            <Typography variant="h5" color="text.secondary">
              {getSubtitleMessage()}
            </Typography>
            {/* Show selected category for Specialty Apps kiosk */}
            {currentKiosk?.type === 'mixed' && selectedCategory && (
              <Box sx={{ mt: 2 }}>
                <Chip 
                  label={selectedCategory === 'trees' ? 'Trees' : 'Other'}
                  size="medium"
                  color="success"
                  sx={{ fontWeight: 'bold', fontSize: '1rem' }}
                  onDelete={() => setSelectedCategory(null)}
                />
              </Box>
            )}
          </Box>

          {/* Action Cards - Show recipe cards for Standard Applications, standard cards for others */}
          <Grid container spacing={4} justifyContent="center">
          {/* Show application recipe cards for Standard Applications kiosk */}
          {currentKiosk?.type === 'mixed' && applications.length > 0 ? (
            filteredApplications.length === 0 && selectedCategory ? (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    No applications found for "{selectedCategory === 'trees' ? 'Trees' : 'Other'}"
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Please mark some applications with this category in the Admin Panel
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedCategory(null)}
                    sx={{ mt: 3 }}
                  >
                    Choose Different Category
                  </Button>
                </Box>
              </Grid>
            ) : (
              filteredApplications.map((app) => (
              <Grid item xs={12} sm={8} md={6} lg={4} key={app.id}>
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
                onClick={() => {
                  // Navigate to equipment selector for this application recipe
                  navigate(`/equipment-selector?application=${app.id}&name=${encodeURIComponent(app.name)}`);
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Box sx={{ color: 'success.main', mb: 2 }}>
                      <Typography sx={{ fontSize: 70 }}>📋</Typography>
                    </Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {app.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {app.description || `${app.products.length} products in recipe`}
                    </Typography>
                    {app.category && app.category.toLowerCase() !== 'mixed' && (
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={app.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      navigate(`/equipment-selector?application=${app.id}&name=${encodeURIComponent(app.name)}`);
                    }}
                    sx={{ 
                      minWidth: '160px',
                      fontSize: '1.2rem',
                      py: 2,
                      px: 4,
                      fontWeight: 'bold',
                      ...buttonColorSx
                    }}
                  >
                    LOAD
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
            )
        ) : (
          /* Show standard action cards for other kiosk types */
          actionCards.filter(card => card.available).map((card, index) => (
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
                    {card.description && (
                      <Typography variant="body2" color="text.secondary">
                        {card.description}
                      </Typography>
                    )}
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
                      fontWeight: 'bold',
                      ...buttonColorSx
                    }}
                  >
                    OPEN
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
        </Grid>

        </Container>
      )}
    </>
  );
};

export default Dashboard;