import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  Container,
  Grid
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [userCode, setUserCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userCode.length !== 4 || !/^\d+$/.test(userCode)) {
      setError('Please enter a valid 4-digit code');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      console.log('🚀 Attempting login with code:', userCode);
      
      const success = await login(userCode);
      if (success) {
        console.log('✅ Login successful, navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.log('❌ Login failed');
        setError(`Invalid user code "${userCode}". Please check your 4-digit code and try again. Check browser console for more details.`);
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      setError('Failed to log in. Please check the browser console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4); // Only digits, max 4
    setUserCode(value);
  };

  const handleKeypadClick = (digit: string) => {
    if (userCode.length < 4) {
      const newCode = userCode + digit;
      setUserCode(newCode);
      
      // Auto-submit when 4 digits are entered
      if (newCode.length === 4) {
        setTimeout(() => {
          handleAutoSubmit(newCode);
        }, 100); // Small delay to allow UI to update
      }
    }
  };

  const handleAutoSubmit = async (code: string) => {
    if (code.length !== 4 || !/^\d+$/.test(code)) {
      setError('Please enter a valid 4-digit code');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      console.log('🚀 Auto-submitting login with code:', code);
      
      const success = await login(code);
      if (success) {
        console.log('✅ Login successful, navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.log('❌ Login failed');
        setError(`Invalid user code "${code}". Please check your 4-digit code and try again. Check browser console for more details.`);
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      setError('Failed to log in. Please check the browser console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUserCode('');
    setError('');
  };

  const handleBackspace = () => {
    setUserCode(prev => prev.slice(0, -1));
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
          justifyContent: 'center'
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: '500px' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            TNT Applicator
          </Typography>
          <Typography component="h2" variant="h6" align="center" color="textSecondary" gutterBottom>
            Enter Your 4-Digit Code
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="userCode"
              label="4-Digit User Code"
              name="userCode"
              autoComplete="off"
              value={userCode}
              onChange={handleCodeChange}
              placeholder="1234"
              inputProps={{
                maxLength: 4,
                readOnly: true,
                style: { 
                  fontSize: '2rem', 
                  textAlign: 'center',
                  letterSpacing: '0.5rem',
                  cursor: 'default'
                }
              }}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '2rem',
                  textAlign: 'center',
                  letterSpacing: '0.5rem'
                }
              }}
            />
            
            {/* Touch Keypad */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Grid container spacing={1}>
                {/* Row 1 */}
                <Grid item xs={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ py: 2, fontSize: '1.5rem', minHeight: '60px' }}
                    onClick={() => handleKeypadClick('1')}
                  >
                    1
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ py: 2, fontSize: '1.5rem', minHeight: '60px' }}
                    onClick={() => handleKeypadClick('2')}
                  >
                    2
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ py: 2, fontSize: '1.5rem', minHeight: '60px' }}
                    onClick={() => handleKeypadClick('3')}
                  >
                    3
                  </Button>
                </Grid>
                
                {/* Row 2 */}
                <Grid item xs={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ py: 2, fontSize: '1.5rem', minHeight: '60px' }}
                    onClick={() => handleKeypadClick('4')}
                  >
                    4
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ py: 2, fontSize: '1.5rem', minHeight: '60px' }}
                    onClick={() => handleKeypadClick('5')}
                  >
                    5
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ py: 2, fontSize: '1.5rem', minHeight: '60px' }}
                    onClick={() => handleKeypadClick('6')}
                  >
                    6
                  </Button>
                </Grid>
                
                {/* Row 3 */}
                <Grid item xs={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ py: 2, fontSize: '1.5rem', minHeight: '60px' }}
                    onClick={() => handleKeypadClick('7')}
                  >
                    7
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ py: 2, fontSize: '1.5rem', minHeight: '60px' }}
                    onClick={() => handleKeypadClick('8')}
                  >
                    8
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ py: 2, fontSize: '1.5rem', minHeight: '60px' }}
                    onClick={() => handleKeypadClick('9')}
                  >
                    9
                  </Button>
                </Grid>
                
                {/* Row 4 */}
                <Grid item xs={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ py: 2, fontSize: '1rem', minHeight: '60px' }}
                    onClick={handleClear}
                    color="secondary"
                  >
                    Clear
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ py: 2, fontSize: '1.5rem', minHeight: '60px' }}
                    onClick={() => handleKeypadClick('0')}
                  >
                    0
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ py: 2, fontSize: '1rem', minHeight: '60px' }}
                    onClick={handleBackspace}
                    color="secondary"
                  >
                    ⌫
                  </Button>
                </Grid>
              </Grid>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.2rem' }}
              disabled={loading || userCode.length !== 4}
            >
              {loading ? 'Logging In...' : 'Login'}
            </Button>
          </Box>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" display="block" align="center" color="textSecondary">
              🔒 Kiosk Mode - Local Network Only
            </Typography>
            <Typography variant="caption" display="block" align="center" color="textSecondary">
              Contact admin if you don't have a user code
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;