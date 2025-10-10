import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Computer as KioskIcon,
  CheckCircle as SelectedIcon
} from '@mui/icons-material';
import { 
  KIOSK_TYPES, 
  DEFAULT_KIOSKS, 
  getCurrentKioskId, 
  setCurrentKioskId
} from '../types/kiosk';
import { useKiosk } from '../contexts/KioskContext';

interface KioskSelectorProps {
  onKioskSelected?: (kioskId: string) => void;
}

const KioskSelector: React.FC<KioskSelectorProps> = ({ onKioskSelected }) => {
  const { refreshKioskConfig } = useKiosk();
  const [selectedKioskId, setSelectedKioskId] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingKioskId, setPendingKioskId] = useState<string>('');

  useEffect(() => {
    // Check if kiosk is already configured
    const currentKioskId = getCurrentKioskId();
    const lastSet = localStorage.getItem('tnt-kiosk-last-set');
    
    // If kiosk was set recently (within 24 hours), auto-select it
    if (currentKioskId && lastSet) {
      const lastSetDate = new Date(lastSet);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastSetDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        console.log('🏭 Auto-selecting previously configured kiosk:', currentKioskId);
        handleKioskAutoSelect(currentKioskId);
        return;
      }
    }
    
    setSelectedKioskId(currentKioskId);
  }, []);

  const handleKioskAutoSelect = async (kioskId: string) => {
    setCurrentKioskId(kioskId);
    await refreshKioskConfig();
    onKioskSelected?.(kioskId);
  };

  const handleKioskSelect = (kioskId: string) => {
    if (selectedKioskId === kioskId) {
      // If already selected, confirm and proceed
      confirmKioskSelection(kioskId);
    } else {
      setSelectedKioskId(kioskId);
    }
  };

  const confirmKioskSelection = (kioskId: string) => {
    setPendingKioskId(kioskId);
    setShowConfirmDialog(true);
  };

  const handleConfirmSelection = async () => {
    setCurrentKioskId(pendingKioskId);
    await refreshKioskConfig();
    setShowConfirmDialog(false);
    onKioskSelected?.(pendingKioskId);
  };

  const getKioskTypeInfo = (type: string) => {
    return KIOSK_TYPES[type as keyof typeof KIOSK_TYPES];
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <KioskIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            TNT Kiosk Configuration
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Select the type of kiosk terminal you're setting up
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2">
            This setting will determine which products and calculation methods are available on this terminal.
            You can change this later in the admin panel if needed.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          {DEFAULT_KIOSKS.map((kiosk) => {
            const typeInfo = getKioskTypeInfo(kiosk.type);
            const isSelected = selectedKioskId === kiosk.id;
            
            return (
              <Grid item xs={12} md={4} key={kiosk.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    border: isSelected ? 3 : 1,
                    borderColor: isSelected ? typeInfo.color : 'divider',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-4px)'
                    },
                    position: 'relative'
                  }}
                  onClick={() => handleKioskSelect(kiosk.id)}
                >
                  {isSelected && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <SelectedIcon sx={{ color: typeInfo.color, fontSize: 30 }} />
                    </Box>
                  )}
                  
                  <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                    <Typography sx={{ fontSize: 60, mb: 2 }}>
                      {typeInfo.icon}
                    </Typography>
                    
                    <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {kiosk.name}
                    </Typography>
                    
                    <Chip 
                      label={typeInfo.name}
                      sx={{ 
                        backgroundColor: typeInfo.color, 
                        color: 'white',
                        fontWeight: 'bold',
                        mb: 2
                      }}
                    />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {kiosk.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" display="block" gutterBottom>
                        <strong>Units:</strong> {kiosk.units.primary}
                        {kiosk.units.secondary && ` / ${kiosk.units.secondary}`}
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>Trucks:</strong> {kiosk.defaultTruckTypes.join(', ')}
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
                    <Button 
                      variant={isSelected ? "contained" : "outlined"}
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmKioskSelection(kiosk.id);
                      }}
                      sx={{ 
                        backgroundColor: isSelected ? typeInfo.color : 'transparent',
                        borderColor: typeInfo.color,
                        '&:hover': {
                          backgroundColor: typeInfo.color,
                          opacity: 0.8
                        }
                      }}
                    >
                      {isSelected ? 'Start Application' : 'Select'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {selectedKioskId && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Selected: <strong>{DEFAULT_KIOSKS.find(k => k.id === selectedKioskId)?.name}</strong>
            </Typography>
          </Box>
        )}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Kiosk Configuration</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to configure this terminal as:
          </Typography>
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="h6">
              {DEFAULT_KIOSKS.find(k => k.id === pendingKioskId)?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {DEFAULT_KIOSKS.find(k => k.id === pendingKioskId)?.description}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            This setting will determine which products and features are available on this terminal.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmSelection} variant="contained">
            Confirm & Start
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default KioskSelector;