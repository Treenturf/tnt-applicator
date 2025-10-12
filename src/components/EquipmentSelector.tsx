import React from 'react';
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
  CardActions
} from '@mui/material';
import { 
  ArrowBack as BackIcon,
  LocalShipping as TrailerIcon,
  Backpack as BackpackIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const EquipmentSelector: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const applicationId = searchParams.get('application');
  const applicationName = searchParams.get('name');

  const handleEquipmentSelection = (equipmentType: 'trailer' | 'backpack') => {
    // Navigate to calculator with application and equipment type
    navigate(`/calculator?application=${applicationId}&name=${encodeURIComponent(applicationName || '')}&equipment=${equipmentType}`);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: 'success.main' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              color="inherit"
              onClick={handleBack}
              startIcon={<BackIcon />}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } 
              }}
            >
              Back
            </Button>
          </Box>
          <Box sx={{ textAlign: 'center', flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Select Equipment Type
            </Typography>
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
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, px: 3 }}>
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {applicationName || 'Application Recipe'}
          </Typography>
          <Typography variant="h5" color="text.secondary">
            Choose your equipment type
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {/* Trailer Card */}
          <Grid item xs={12} sm={6} md={5}>
            <Card 
              sx={{ 
                height: '350px',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => handleEquipmentSelection('trailer')}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 3 }}>
                  <TrailerIcon sx={{ fontSize: 100 }} />
                </Box>
                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Trailer
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Large capacity equipment for extensive coverage
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 4 }}>
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={() => handleEquipmentSelection('trailer')}
                  sx={{ 
                    minWidth: '180px',
                    fontSize: '1.3rem',
                    py: 2.5,
                    px: 5,
                    fontWeight: 'bold'
                  }}
                >
                  SELECT
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Backpack Card */}
          <Grid item xs={12} sm={6} md={5}>
            <Card 
              sx={{ 
                height: '350px',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => handleEquipmentSelection('backpack')}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ color: 'success.main', mb: 3 }}>
                  <BackpackIcon sx={{ fontSize: 100 }} />
                </Box>
                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Backpack
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Portable equipment for precise spot treatment
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 4 }}>
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={() => handleEquipmentSelection('backpack')}
                  sx={{ 
                    minWidth: '180px',
                    fontSize: '1.3rem',
                    py: 2.5,
                    px: 5,
                    fontWeight: 'bold'
                  }}
                >
                  SELECT
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default EquipmentSelector;
