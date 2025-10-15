import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  useTheme
} from '@mui/material';
import {
  Today as TodayIcon,
  Login as LoginIcon,
  Inventory as ProductsIcon,
  Analytics as AnalyticsIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const reportCards = [
    {
      title: "Today's Loading Totals",
      description: "View today's loading activity and totals by user and application",
      icon: <TodayIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />,
      route: '/reports/todays-loading',
      color: '#1976d2'  // Blue
    },
    {
      title: "Log in Report",
      description: "View user login activity and session information",
      icon: <LoginIcon sx={{ fontSize: 48, color: theme.palette.secondary.main }} />,
      route: '/reports/login-report',
      color: '#9c27b0'  // Purple
    },
    {
      title: "Total Products Used",
      description: "View comprehensive product usage totals and statistics",
      icon: <ProductsIcon sx={{ fontSize: 48, color: theme.palette.success.main }} />,
      route: '/reports/product-totals',
      color: '#2e7d32'  // Green
    },
    {
      title: "Analytics",
      description: "Advanced filtering, detailed logs, and Excel export capabilities",
      icon: <AnalyticsIcon sx={{ fontSize: 48, color: theme.palette.info.main }} />,
      route: '/reports/analytics',
      color: '#ed6c02'  // Orange
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Back to Admin Panel Button */}
        <Button
          variant="contained"
          color="info"
          startIcon={<BackIcon />}
          onClick={() => navigate('/admin')}
          sx={{ mb: 3 }}
        >
          Back
        </Button>
        
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          Reports Dashboard
        </Typography>
        
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 6 }}>
          Select a report type to view detailed information and analytics
        </Typography>

        <Grid container spacing={4}>
          {reportCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={6} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                  border: `2px solid ${card.color}`,
                  borderRadius: 2
                }}
              >
                <CardContent sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  textAlign: 'center',
                  pt: 4
                }}>
                  <Box sx={{ mb: 2 }}>
                    {card.icon}
                  </Box>
                  
                  <Typography variant="h5" component="h2" gutterBottom sx={{ color: card.color, fontWeight: 'bold' }}>
                    {card.title}
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    {card.description}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button 
                    variant="contained" 
                    size="large"
                    onClick={() => navigate(card.route)}
                    sx={{ 
                      backgroundColor: card.color,
                      '&:hover': {
                        backgroundColor: card.color,
                        filter: 'brightness(0.9)',
                      },
                      minWidth: 140,
                      py: 1.5
                    }}
                  >
                    Open Report
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Each report provides specialized insights into different aspects of your TNT application usage.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Reports;