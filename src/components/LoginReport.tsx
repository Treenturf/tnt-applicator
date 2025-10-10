import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Login as LoginIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface LoginLog {
  id: string;
  userCode: string;
  userName: string;
  action: string;
  timestamp: any;
  date: string;
  time: string;
}

const LoginReport: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    loadLoginLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, startDate, endDate]);

  const loadLoginLogs = async () => {
    try {
      setLoading(true);
      const logsRef = collection(db, 'activityLogs');
      
      // Get all activity logs and filter client-side to avoid index requirements
      const querySnapshot = await getDocs(logsRef);
      const logsData: LoginLog[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Only include Login and Logout actions
        if (data.action === 'Login' || data.action === 'Logout') {
          const timestamp = data.timestamp?.toDate() || new Date();
          
          logsData.push({
            id: doc.id,
            userCode: data.userCode || 'Unknown',
            userName: data.userName || 'Unknown User',
            action: data.action,
            timestamp: timestamp,
            date: formatDate(timestamp),
            time: formatTime(timestamp)
          });
        }
      });
      
      // Sort by timestamp descending (most recent first)
      logsData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading login logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(log => log.timestamp >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => log.timestamp <= end);
    }
    
    setFilteredLogs(filtered);
  };

  const formatDate = (timestamp: Date) => {
    return timestamp.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const setTodayFilter = () => {
    const today = getTodayDate();
    setStartDate(today);
    setEndDate(today);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          <Button 
            color="inherit" 
            onClick={() => navigate('/reports')}
            startIcon={<BackIcon />}
            sx={{ mr: 2 }}
          >
            Back to Reports Dashboard
          </Button>
          <LoginIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Login Report
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Date Filters */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FilterIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" color="primary">
                Date Filters
              </Typography>
            </Box>
            
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={setTodayFilter}
                  sx={{ height: '56px' }}
                >
                  Today Only
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={clearFilters}
                  sx={{ height: '56px' }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Login Activity Summary
            </Typography>
            {!loading && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total Records: <strong>{filteredLogs.length}</strong>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Logins: <strong>{filteredLogs.filter(log => log.action === 'Login').length}</strong>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Logouts: <strong>{filteredLogs.filter(log => log.action === 'Logout').length}</strong>
                  </Typography>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Login Activity Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Login Activity Details
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredLogs.length === 0 ? (
              <Alert severity="info">
                No login activity found for the selected date range.
              </Alert>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Time</strong></TableCell>
                      <TableCell><strong>User Name</strong></TableCell>
                      <TableCell><strong>User Code</strong></TableCell>
                      <TableCell><strong>Action</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.date}</TableCell>
                        <TableCell>{log.time}</TableCell>
                        <TableCell>{log.userName}</TableCell>
                        <TableCell>{log.userCode}</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'inline-block',
                              px: 2,
                              py: 0.5,
                              borderRadius: 1,
                              backgroundColor: log.action === 'Login' ? 'success.light' : 'warning.light',
                              color: log.action === 'Login' ? 'success.contrastText' : 'warning.contrastText',
                              fontWeight: 'bold'
                            }}
                          >
                            {log.action}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginReport;