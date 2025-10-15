import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  FileDownload as ExcelIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import * as XLSX from 'xlsx';

interface ActivityLog {
  id: string;
  userCode: string;
  userName: string;
  action: string;
  details: string;
  timestamp: any;
  date: string;
  time: string;
  // Calculator specific fields
  application?: string;
  truckType?: string;
  tankSelection?: string;
  products?: Array<{
    name: string;
    amount: number;
    frontTank?: number;
    backTank?: number;
    driverTank?: number;
    passengerTank?: number;
  }>;
}

interface User {
  id: string;
  userCode: string;
  name: string;
  role: string;
}

interface Application {
  id: string;
  name: string;
  category: string;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  userFilter: string;
  applicationFilter: string;
  actionFilter: string;
}

interface ProductTotals {
  [productName: string]: {
    total: number;
    frontTank: number;
    backTank: number;
    driverTank: number;
    passengerTank: number;
    combined: number;
  };
}

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    userFilter: '',
    applicationFilter: '',
    actionFilter: ''
  });
  const [productTotals, setProductTotals] = useState<ProductTotals>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activityLogs, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load activity logs
      const logsSnapshot = await getDocs(
        query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'))
      );
      const logsData = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];

      console.log('📊 Analytics: Total activity logs loaded:', logsData.length);
      
      // Debug user #5555 logs
      const user5555Logs = logsData.filter(log => log.userCode === '5555');
      console.log('🔍 Analytics: User #5555 logs found:', {
        count: user5555Logs.length,
        logs: user5555Logs
      });

      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];

      // Load applications
      const appsSnapshot = await getDocs(collection(db, 'applications'));
      const appsData = appsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Application[];

      setActivityLogs(logsData);
      setUsers(usersData);
      setApplications(appsData);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...activityLogs];

    // Date filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(log => {
        const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        return logDate >= startDate;
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(log => {
        const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        return logDate <= endDate;
      });
    }

    // User filter
    if (filters.userFilter) {
      filtered = filtered.filter(log => log.userCode === filters.userFilter);
    }

    // Application filter
    if (filters.applicationFilter) {
      filtered = filtered.filter(log => 
        log.application && log.application.includes(filters.applicationFilter)
      );
    }

    // Action filter
    if (filters.actionFilter) {
      filtered = filtered.filter(log => log.action === filters.actionFilter);
    }

    setFilteredLogs(filtered);
    calculateProductTotals(filtered);
  };

  const calculateProductTotals = (logs: ActivityLog[]) => {
    const totals: ProductTotals = {};

    logs.forEach(log => {
      if (log.action === 'application_calculated' && log.products) {
        log.products.forEach(product => {
          if (!totals[product.name]) {
            totals[product.name] = {
              total: 0,
              frontTank: 0,
              backTank: 0,
              driverTank: 0,
              passengerTank: 0,
              combined: 0
            };
          }

          totals[product.name].total += product.amount;
          
          if (product.frontTank) totals[product.name].frontTank += product.frontTank;
          if (product.backTank) totals[product.name].backTank += product.backTank;
          if (product.driverTank) totals[product.name].driverTank += product.driverTank;
          if (product.passengerTank) totals[product.name].passengerTank += product.passengerTank;
          
          // Combined is total for each truck type
          if (log.tankSelection === 'both') {
            totals[product.name].combined += product.amount;
          }
        });
      }
    });

    setProductTotals(totals);
  };

  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      userFilter: '',
      applicationFilter: '',
      actionFilter: ''
    });
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportToExcel = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Helper function to format tank selection details
    const formatTankDetails = (log: any) => {
      const tanks: string[] = [];
      let total = 0;
      
      if (log.frontTankGallons && log.frontTankGallons > 0) {
        tanks.push(`Front: ${log.frontTankGallons} gal`);
        total += log.frontTankGallons;
      }
      if (log.backTankGallons && log.backTankGallons > 0) {
        tanks.push(`Back: ${log.backTankGallons} gal`);
        total += log.backTankGallons;
      }
      if (log.driverTankGallons && log.driverTankGallons > 0) {
        tanks.push(`Driver: ${log.driverTankGallons} gal`);
        total += log.driverTankGallons;
      }
      if (log.passengerTankGallons && log.passengerTankGallons > 0) {
        tanks.push(`Passenger: ${log.passengerTankGallons} gal`);
        total += log.passengerTankGallons;
      }
      
      if (tanks.length > 0) {
        return `${tanks.join(', ')} | Total: ${total} gal`;
      }
      return log.tankSelection || '';
    };

    // Activity Logs Sheet
    const logsData = filteredLogs.map(log => ({
      'Date': formatDate(log.timestamp),
      'Time': formatTime(log.timestamp),
      'User': log.userName,
      'Action': log.action,
      'Equipment Type': log.truckType || '',
      'Tank Details': formatTankDetails(log),
      'Details': log.details
    }));

    const logsSheet = XLSX.utils.json_to_sheet(logsData);
    XLSX.utils.book_append_sheet(wb, logsSheet, 'Activity Logs');

    // Product Totals Sheet
    const totalsData = Object.entries(productTotals).map(([productName, totals]) => ({
      'Product': productName,
      'Total Amount': totals.total.toFixed(2),
      'Front Tank': totals.frontTank.toFixed(2),
      'Back Tank': totals.backTank.toFixed(2),
      'Driver Tank': totals.driverTank.toFixed(2),
      'Passenger Tank': totals.passengerTank.toFixed(2),
      'Combined Tanks': totals.combined.toFixed(2)
    }));

    const totalsSheet = XLSX.utils.json_to_sheet(totalsData);
    XLSX.utils.book_append_sheet(wb, totalsSheet, 'Product Totals');

    // Detailed Product Usage Sheet
    const detailedData: any[] = [];
    filteredLogs.forEach(log => {
      if (log.action === 'application_calculated' && log.products) {
        log.products.forEach(product => {
          detailedData.push({
            'Date': formatDate(log.timestamp),
            'Time': formatTime(log.timestamp),
            'User': log.userName,
            'Equipment Type': log.truckType || '',
            'Product': product.name,
            'Total Amount': product.amount.toFixed(2)
          });
        });
      }
    });

    const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(wb, detailedSheet, 'Detailed Usage');

    // Generate filename with current date
    const filename = `TNT_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Back to Admin Panel Button */}
        <Button
          variant="contained"
          color="warning"
          startIcon={<BackIcon />}
          onClick={() => navigate('/reports')}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        
        <Typography variant="h4" gutterBottom>
          Reports & Analytics
        </Typography>

        {/* Filters Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Filters
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>User</InputLabel>
                  <Select
                    value={filters.userFilter}
                    onChange={(e) => handleFilterChange('userFilter', e.target.value)}
                    label="User"
                  >
                    <MenuItem value="">All Users</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.userCode}>
                        {user.name} ({user.userCode})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Application</InputLabel>
                  <Select
                    value={filters.applicationFilter}
                    onChange={(e) => handleFilterChange('applicationFilter', e.target.value)}
                    label="Application"
                  >
                    <MenuItem value="">All Applications</MenuItem>
                    {applications.map(app => (
                      <MenuItem key={app.id} value={app.name}>
                        {app.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={filters.actionFilter}
                    onChange={(e) => handleFilterChange('actionFilter', e.target.value)}
                    label="Action"
                  >
                    <MenuItem value="">All Actions</MenuItem>
                    <MenuItem value="Login">Login</MenuItem>
                    <MenuItem value="Logout">Logout</MenuItem>
                    <MenuItem value="application_calculated">Calculations</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={clearFilters}
                    startIcon={<ClearIcon />}
                    sx={{ minWidth: '80px' }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={loadData}
                    disabled={loading}
                    sx={{ minWidth: '80px' }}
                  >
                    {loading ? 'Loading...' : 'Refresh'}
                  </Button>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="warning"
                onClick={exportToExcel}
                startIcon={<ExcelIcon />}
                disabled={filteredLogs.length === 0}
              >
                Export to Excel
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2, display: 'inline' }}>
                {filteredLogs.length} records found
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Product Totals Summary */}
        {Object.keys(productTotals).length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Usage Summary
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Product</strong></TableCell>
                      <TableCell align="right"><strong>Total Amount</strong></TableCell>
                      <TableCell align="right"><strong>Front Tank</strong></TableCell>
                      <TableCell align="right"><strong>Back Tank</strong></TableCell>
                      <TableCell align="right"><strong>Driver Tank</strong></TableCell>
                      <TableCell align="right"><strong>Passenger Tank</strong></TableCell>
                      <TableCell align="right"><strong>Combined</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(productTotals).map(([productName, totals]) => (
                      <TableRow key={productName}>
                        <TableCell>{productName}</TableCell>
                        <TableCell align="right">{totals.total.toFixed(2)}</TableCell>
                        <TableCell align="right">{totals.frontTank.toFixed(2)}</TableCell>
                        <TableCell align="right">{totals.backTank.toFixed(2)}</TableCell>
                        <TableCell align="right">{totals.driverTank.toFixed(2)}</TableCell>
                        <TableCell align="right">{totals.passengerTank.toFixed(2)}</TableCell>
                        <TableCell align="right">{totals.combined.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Activity Logs Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Activity Logs
            </Typography>
            
            {filteredLogs.length === 0 ? (
              <Alert severity="info">
                No activity logs found for the selected filters.
              </Alert>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Time</strong></TableCell>
                      <TableCell><strong>User</strong></TableCell>
                      <TableCell><strong>Action</strong></TableCell>
                      <TableCell><strong>Application</strong></TableCell>
                      <TableCell><strong>Truck Type</strong></TableCell>
                      <TableCell><strong>Product Details</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>{formatTime(log.timestamp)}</TableCell>
                        <TableCell>
                          {log.userName}
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            ({log.userCode})
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={log.action} 
                            size="small"
                            color={log.action === 'application_calculated' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{log.application || '-'}</TableCell>
                        <TableCell>
                          {log.truckType ? (
                            <Chip 
                              label={log.truckType} 
                              size="small"
                              color={log.truckType === 'hose' ? 'success' : 'warning'}
                            />
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {log.action === 'application_calculated' && log.products ? (
                            <Box>
                              {log.products.map((product: any, index: number) => (
                                <Box key={index} sx={{ mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                  <Typography variant="body2" fontWeight="bold">
                                    {product.name}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Total: {product.amount.toFixed(2)}
                                  </Typography>
                                  {log.truckType === 'hose' ? (
                                    <>
                                      <Typography variant="caption" display="block" color="primary">
                                        Front Tank: {(product.frontTank || 0).toFixed(2)}
                                      </Typography>
                                      <Typography variant="caption" display="block" color="secondary">
                                        Back Tank: {(product.backTank || 0).toFixed(2)}
                                      </Typography>
                                    </>
                                  ) : (
                                    <>
                                      <Typography variant="caption" display="block" color="primary">
                                        Driver Tank: {(product.driverTank || 0).toFixed(2)}
                                      </Typography>
                                      <Typography variant="caption" display="block" color="secondary">
                                        Passenger Tank: {(product.passengerTank || 0).toFixed(2)}
                                      </Typography>
                                    </>
                                  )}
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2">
                              {log.details}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Reports;