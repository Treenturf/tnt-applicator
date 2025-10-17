import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const SplashContainer = styled(Box)({
  width: '100vw',
  height: '100vh',
  backgroundColor: '#2d5016', // Tree n Turf green - adjust to your brand color
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'opacity 0.3s ease',
  '&:hover': {
    opacity: 0.95,
  },
});

const LogoContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2rem',
});

const LogoImage = styled('img')({
  maxWidth: '400px',
  maxHeight: '400px',
  width: '80%',
  height: 'auto',
  objectFit: 'contain',
  animation: 'pulse 2s ease-in-out infinite',
  '@keyframes pulse': {
    '0%, 100%': {
      transform: 'scale(1)',
    },
    '50%': {
      transform: 'scale(1.05)',
    },
  },
});

const TapText = styled(Typography)({
  color: '#ffffff',
  fontSize: '1.5rem',
  fontWeight: 300,
  marginTop: '2rem',
  opacity: 0.8,
  animation: 'fade 2s ease-in-out infinite',
  '@keyframes fade': {
    '0%, 100%': {
      opacity: 0.8,
    },
    '50%': {
      opacity: 0.3,
    },
  },
});

interface SplashScreenProps {
  onTap: () => void;
}

export default function SplashScreen({ onTap }: SplashScreenProps) {
  return (
    <SplashContainer onClick={onTap}>
      <LogoContainer>
        {/* Add your logo here - place it in public/images/tree-n-turf-logo.png */}
        <LogoImage 
          src="/images/tree-n-turf-logo.png" 
          alt="Tree n Turf Logo"
          onError={(e) => {
            // Fallback if logo doesn't exist yet
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        
        {/* Fallback text if no logo */}
        <Typography 
          variant="h1" 
          sx={{ 
            color: '#ffffff',
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: { xs: '2.5rem', sm: '4rem', md: '5rem' },
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          Tree n Turf
        </Typography>
        
        <Typography 
          variant="h4" 
          sx={{ 
            color: '#ffffff',
            fontWeight: 300,
            textAlign: 'center',
            fontSize: { xs: '1.2rem', sm: '1.8rem', md: '2rem' },
            opacity: 0.9,
          }}
        >
          TNT Applicator
        </Typography>
      </LogoContainer>
      
      <TapText>Tap to continue</TapText>
    </SplashContainer>
  );
}
