import React from 'react';
import { useKiosk } from '../contexts/KioskContext';
import { useAuth } from '../contexts/AuthContext';
import KioskSelector from './KioskSelector';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';

const KioskConfigWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isKioskConfigured, isLoading } = useKiosk();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isKioskConfigured) {
    // Check if user is admin
    const isAdmin = user?.role?.toLowerCase() === 'admin';
    
    if (isAdmin) {
      // Admins can configure the kiosk
      return <KioskSelector onKioskSelected={() => {}} />;
    } else {
      // Applicators see a message to contact admin
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh" p={4}>
          <Box maxWidth={600} textAlign="center">
            <Typography variant="h4" gutterBottom color="warning.main">
              🖥️ Terminal Not Configured
            </Typography>
            <Alert severity="warning" sx={{ mt: 3, mb: 3 }}>
              This kiosk terminal has not been configured yet. Please contact an administrator to set up this terminal.
            </Alert>
            <Typography variant="body1" color="text.secondary">
              An administrator needs to configure which type of terminal this is (Main Terminal, Specialty Applications, or Bagged Fertilizer).
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 3 }}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      );
    }
  }

  return <>{children}</>;
};

export default KioskConfigWrapper;