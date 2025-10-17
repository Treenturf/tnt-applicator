import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const SplashContainer = styled(Box)({
  width: '100vw',
  height: '100vh',
  backgroundColor: '#2d5016', // Tree n Turf green - adjust to your brand color
  backgroundImage: `
    linear-gradient(45deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(0, 0, 0, 0.05) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(0, 0, 0, 0.05) 75%)
  `,
  backgroundSize: '40px 40px',
  backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px',
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
        />
      </LogoContainer>
      
      <TapText>Tap to continue</TapText>
    </SplashContainer>
  );
}
