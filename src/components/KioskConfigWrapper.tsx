import React from 'react';
import { useKiosk } from '../contexts/KioskContext';
import KioskSelector from './KioskSelector';
import { Box, CircularProgress } from '@mui/material';

const KioskConfigWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isKioskConfigured, isLoading, currentKiosk } = useKiosk();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isKioskConfigured) {
    return <KioskSelector onKioskSelected={() => {}} />;
  }

  return <>{children}</>;
};

export default KioskConfigWrapper;