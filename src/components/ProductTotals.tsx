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
  Toolbar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Inventory as ProductsIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface ProductUsage {
  id: string;
  userCode: string;
  userName: string;
  productName: string;
  amount: number;
  truckType: string;
  tankSelection: string;
  application: string;
  timestamp: any;
  date: string;
  time: string;
}

interface ProductSummary {
  productName: string;
  totalAmount: number;
  usageCount: number;
  users: Set<string>;
  lastUsed: Date;
}

interface YTDComparison {
  productName: string;
  currentYTD: number;
  previousYTD: number;
  percentChange: number;
}

const ProductTotals: React.FC = () => {
  const navigate = useNavigate();
  const [usageData, setUsageData] = useState<ProductUsage[]>([]);
  const [filteredData, setFilteredData] = useState<ProductUsage[]>([]);
  const [productSummaries, setProductSummaries] = useState<ProductSummary[]>([]);
  const [ytdComparisons, setYtdComparisons] = useState<YTDComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);
  const [currentComparisonYear, setCurrentComparisonYear] = useState<number>(new Date().getFullYear());
  const [previousComparisonYear, setPreviousComparisonYear] = useState<number>(new Date().getFullYear() - 1);

  useEffect(() => {
    loadProductUsage();
  }, []);

  useEffect(() => {
    filterData();
    calculateYTDComparison();
  }, [usageData, startDate, endDate, selectedProduct, currentComparisonYear, previousComparisonYear]);

  const loadProductUsage = async () => {
    try {
      setLoading(true);
      const logsRef = collection(db, 'activityLogs');
      
      // Get all activity logs and filter for calculations
      const querySnapshot = await getDocs(logsRef);
      const usageData: ProductUsage[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Only include calculation activities that have products
        if (data.action === 'application_calculated' && data.products && Array.isArray(data.products)) {
          const timestamp = data.timestamp?.toDate() || new Date();
          
          // Process each product in the calculation
          data.products.forEach((product: any, index: number) => {
            usageData.push({
              id: `${doc.id}-${index}`,
              userCode: data.userCode || 'Unknown',
              userName: data.userName || 'Unknown User',
              productName: product.name || 'Unknown Product',
              amount: product.amount || 0,
              truckType: data.truckType || 'Unknown',
              tankSelection: data.tankSelection || 'Unknown',
              application: data.application || 'Individual Products',
              timestamp: timestamp,
              date: formatDate(timestamp),
              time: formatTime(timestamp)
            });
          });
        }
      });
      
      // Sort by timestamp descending (most recent first)
      usageData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Extract unique product names for filter dropdown
      const uniqueProducts = Array.from(new Set(usageData.map(item => item.productName))).sort();
      console.log('📦 Available products for filter:', uniqueProducts);
      setAvailableProducts(uniqueProducts);
      
      setUsageData(usageData);
    } catch (error) {
      console.error('Error loading product usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = usageData;
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(item => item.timestamp >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => item.timestamp <= end);
    }
    
    if (selectedProduct) {
      filtered = filtered.filter(item => item.productName === selectedProduct);
    }
    
    setFilteredData(filtered);
    
    // Calculate product summaries
    const summaryMap = new Map<string, ProductSummary>();
    
    filtered.forEach(item => {
      if (!summaryMap.has(item.productName)) {
        summaryMap.set(item.productName, {
          productName: item.productName,
          totalAmount: 0,
          usageCount: 0,
          users: new Set(),
          lastUsed: item.timestamp
        });
      }
      
      const summary = summaryMap.get(item.productName)!;
      summary.totalAmount += item.amount;
      summary.usageCount += 1;
      summary.users.add(item.userName);
      
      if (item.timestamp > summary.lastUsed) {
        summary.lastUsed = item.timestamp;
      }
    });
    
    const summaries = Array.from(summaryMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    setProductSummaries(summaries);
  };

  const calculateYTDComparison = () => {
    // Use selected years instead of hardcoded current/previous year
    const currentYear = currentComparisonYear;
    const previousYear = previousComparisonYear;
    
    // Calculate current YTD (Jan 1 to today of selected current year)
    const currentYTDStart = new Date(currentYear, 0, 1); // Jan 1
    const currentYTDEnd = currentYear === new Date().getFullYear() 
      ? new Date() // If current year, use today
      : new Date(currentYear, 11, 31); // If past year, use Dec 31
    
    // Calculate previous YTD (Jan 1 to same date of selected previous year)
    const previousYTDStart = new Date(previousYear, 0, 1); // Jan 1 of previous year
    const previousYTDEnd = currentYear === new Date().getFullYear()
      ? new Date(previousYear, currentYTDEnd.getMonth(), currentYTDEnd.getDate()) // Same date last year
      : new Date(previousYear, 11, 31); // If comparing full years, use Dec 31
    
    // Filter data for current YTD
    const currentYTDData = usageData.filter(item => 
      item.timestamp >= currentYTDStart && item.timestamp <= currentYTDEnd
    );
    
    // Filter data for previous YTD
    const previousYTDData = usageData.filter(item => 
      item.timestamp >= previousYTDStart && item.timestamp <= previousYTDEnd
    );
    
    // Calculate totals by product
    const currentYTDTotals = new Map<string, number>();
    const previousYTDTotals = new Map<string, number>();
    
    currentYTDData.forEach(item => {
      currentYTDTotals.set(item.productName, (currentYTDTotals.get(item.productName) || 0) + item.amount);
    });
    
    previousYTDData.forEach(item => {
      previousYTDTotals.set(item.productName, (previousYTDTotals.get(item.productName) || 0) + item.amount);
    });
    
    // Create comparison array
    const allProducts = new Set([...currentYTDTotals.keys(), ...previousYTDTotals.keys()]);
    const comparisons: YTDComparison[] = [];
    
    allProducts.forEach(productName => {
      const currentYTD = currentYTDTotals.get(productName) || 0;
      const previousYTD = previousYTDTotals.get(productName) || 0;
      
      let percentChange = 0;
      if (previousYTD > 0) {
        percentChange = ((currentYTD - previousYTD) / previousYTD) * 100;
      } else if (currentYTD > 0) {
        percentChange = 100; // New product this year
      }
      
      comparisons.push({
        productName,
        currentYTD,
        previousYTD,
        percentChange
      });
    });
    
    // Sort by current YTD amount descending
    comparisons.sort((a, b) => b.currentYTD - a.currentYTD);
    setYtdComparisons(comparisons);
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
            Back
          </Button>
          <ProductsIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
            Total Products Used
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
                <FormControl fullWidth>
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={selectedProduct}
                    label="Product"
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    <MenuItem value="">All Products</MenuItem>
                    {availableProducts.map((product) => (
                      <MenuItem key={product} value={product}>
                        {product}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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

        {/* Product Summary */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Product Usage Summary
            </Typography>
            {!loading && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total Applications:{' '}
                    <Typography component="span" variant="body1" color="text.primary" fontWeight="bold">
                      {filteredData.length}
                    </Typography>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Unique Products:{' '}
                    <Typography component="span" variant="body1" color="text.primary" fontWeight="bold">
                      {productSummaries.length}
                    </Typography>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount:{' '}
                    <Typography component="span" variant="body1" color="text.primary" fontWeight="bold">
                      {filteredData.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                    </Typography>
                  </Typography>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Year-to-Date Comparison */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Year-to-Date Comparison ({currentComparisonYear} vs {previousComparisonYear})
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="Current Year"
                  type="number"
                  size="small"
                  value={currentComparisonYear}
                  onChange={(e) => setCurrentComparisonYear(parseInt(e.target.value))}
                  inputProps={{ min: 2020, max: 2030 }}
                  sx={{ width: 120 }}
                />
                <Typography variant="body2" color="text.secondary">vs</Typography>
                <TextField
                  label="Previous Year"
                  type="number"
                  size="small"
                  value={previousComparisonYear}
                  onChange={(e) => setPreviousComparisonYear(parseInt(e.target.value))}
                  inputProps={{ min: 2020, max: 2030 }}
                  sx={{ width: 120 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const currentYear = new Date().getFullYear();
                    setCurrentComparisonYear(currentYear);
                    setPreviousComparisonYear(currentYear - 1);
                  }}
                >
                  Reset
                </Button>
              </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {currentComparisonYear === new Date().getFullYear() 
                ? `Comparing Jan 1 - ${new Date().toLocaleDateString()} for both years`
                : `Comparing full years (Jan 1 - Dec 31)`
              }
            </Typography>
            
            {!loading && ytdComparisons.length > 0 ? (
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Product</strong></TableCell>
                      <TableCell align="right"><strong>{currentComparisonYear}</strong></TableCell>
                      <TableCell align="right"><strong>{previousComparisonYear}</strong></TableCell>
                      <TableCell align="center"><strong>Change</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ytdComparisons.slice(0, 10).map((comparison) => (
                      <TableRow key={comparison.productName}>
                        <TableCell>{comparison.productName}</TableCell>
                        <TableCell align="right">
                          <strong>{comparison.currentYTD.toFixed(2)}</strong>
                        </TableCell>
                        <TableCell align="right">
                          {comparison.previousYTD.toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${comparison.percentChange >= 0 ? '+' : ''}${comparison.percentChange.toFixed(1)}%`}
                            size="small"
                            color={comparison.percentChange >= 0 ? 'success' : 'error'}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : !loading ? (
              <Alert severity="info">
                No data available for year-to-date comparison.
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        {/* Product Totals Table */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Product Totals by Type
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : productSummaries.length === 0 ? (
              <Alert severity="info">
                No product usage found for the selected date range.
              </Alert>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Product Name</strong></TableCell>
                      <TableCell align="right"><strong>Total Amount</strong></TableCell>
                      <TableCell align="center"><strong>Times Used</strong></TableCell>
                      <TableCell align="center"><strong>Users</strong></TableCell>
                      <TableCell><strong>Last Used</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productSummaries.map((summary) => (
                      <TableRow key={summary.productName}>
                        <TableCell>{summary.productName}</TableCell>
                        <TableCell align="right">
                          <strong>{summary.totalAmount.toFixed(2)}</strong>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={summary.usageCount} 
                            size="small" 
                            color="primary"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={summary.users.size} 
                            size="small" 
                            color="secondary"
                          />
                        </TableCell>
                        <TableCell>{formatDate(summary.lastUsed)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Detailed Usage Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Detailed Product Usage
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredData.length === 0 ? (
              <Alert severity="info">
                No product usage found for the selected date range.
              </Alert>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Time</strong></TableCell>
                      <TableCell><strong>User</strong></TableCell>
                      <TableCell><strong>Product</strong></TableCell>
                      <TableCell align="right"><strong>Amount</strong></TableCell>
                      <TableCell><strong>Truck Type</strong></TableCell>
                      <TableCell><strong>Application</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.time}</TableCell>
                        <TableCell>{item.userName}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell align="right">
                          <strong>{item.amount.toFixed(2)}</strong>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.truckType} 
                            size="small" 
                            color={item.truckType.includes('Hose') ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell>
                          {item.application && item.application !== 'Individual Products' ? (
                            <Chip 
                              label={item.application} 
                              size="small" 
                              color="info"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Individual Products
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
      </Container>
    </Box>
  );
};

export default ProductTotals;