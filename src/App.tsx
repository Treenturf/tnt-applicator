import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { KioskProvider, useKiosk } from './contexts/KioskContext';
import ErrorBoundary from './components/ErrorBoundary';
import DatabaseErrorBoundary from './components/DatabaseErrorBoundary';
import KioskSelector from './components/KioskSelector';
import KioskConfigWrapper from './components/KioskConfigWrapper';
import SplashScreen from './components/SplashScreen';
import LoginPage from './components/LoginPage.tsx';
import Dashboard from './components/Dashboard.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import ManagerPanel from './components/ManagerPanel.tsx';
import ProductManagement from './components/ProductManagement.tsx';
import ProductManagementReadOnly from './components/ProductManagementReadOnly.tsx';
import ApplicationManagement from './components/ApplicationManagement.tsx';
import ApplicationManagementReadOnly from './components/ApplicationManagementReadOnly.tsx';
import Calculator from './components/Calculator.tsx';
import EquipmentSelector from './components/EquipmentSelector.tsx';
import Reports from './components/Reports.tsx';
import Analytics from './components/Analytics.tsx';
import TodaysLoadingTotals from './components/TodaysLoadingTotals.tsx';
import LoginReport from './components/LoginReport.tsx';
import ProductTotals from './components/ProductTotals.tsx';
import DatabaseDebug from './components/DatabaseDebug.tsx';
import { CircularProgress, Box } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green theme for agriculture
    },
    secondary: {
      main: '#ff6f00',
    },
  },
});

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireManager?: boolean;
  requireReports?: boolean;
  allowedRoles?: ('admin' | 'manager' | 'applicator')[];
}> = ({ children, requireAdmin = false, requireManager = false, requireReports = false, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const userRole = user.role?.toLowerCase() as 'admin' | 'manager' | 'applicator';

  // Check specific role requirements
  if (requireAdmin && userRole !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  if (requireManager && userRole !== 'manager' && userRole !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  // Check allowed roles
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" />;
  }

  // Check reports permission for managers
  if (requireReports && userRole === 'manager' && !user.canAccessReports) {
    console.log('🚫 Manager reports access denied - canAccessReports:', user.canAccessReports);
    return <Navigate to="/dashboard" />;
  }
  
  if (requireReports && userRole === 'manager' && user.canAccessReports) {
    console.log('✅ Manager reports access granted - canAccessReports:', user.canAccessReports);
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { user, loading } = useAuth();

  // Show splash screen on initial load
  useEffect(() => {
    // Check if we're coming back from a logout
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash && user) {
      setShowSplash(false);
    }
  }, [user]);

  // Reset splash screen when user logs out
  useEffect(() => {
    if (!user && !loading) {
      setShowSplash(true);
      sessionStorage.removeItem('hasSeenSplash');
    }
  }, [user, loading]);

  const handleSplashTap = () => {
    setShowSplash(false);
    sessionStorage.setItem('hasSeenSplash', 'true');
  };

  if (showSplash && !user) {
    return <SplashScreen onTap={handleSplashTap} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <KioskConfigWrapper>
              <Dashboard />
            </KioskConfigWrapper>
          </ProtectedRoute>
        } />
        <Route path="/calculator" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Calculator />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/equipment-selector" element={
          <ProtectedRoute>
            <KioskConfigWrapper>
              <EquipmentSelector />
            </KioskConfigWrapper>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']} requireReports={true}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/reports/analytics" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']} requireReports={true}>
            <DatabaseErrorBoundary component="Analytics">
              <Analytics />
            </DatabaseErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/reports/todays-loading" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']} requireReports={true}>
            <DatabaseErrorBoundary component="Today's Loading Totals">
              <TodaysLoadingTotals />
            </DatabaseErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/reports/login-report" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']} requireReports={true}>
            <DatabaseErrorBoundary component="Login Report">
              <LoginReport />
            </DatabaseErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/reports/product-totals" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']} requireReports={true}>
            <DatabaseErrorBoundary component="Product Totals">
              <ProductTotals />
            </DatabaseErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <ErrorBoundary>
              <AdminPanel />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/admin/products" element={
          <ProtectedRoute requireAdmin>
            <ErrorBoundary>
              <ProductManagement />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/admin/applications" element={
          <ProtectedRoute requireAdmin>
            <ErrorBoundary>
              <ApplicationManagement />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        
        {/* Manager Routes */}
        <Route path="/manager" element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <ErrorBoundary>
              <ManagerPanel />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/manager/products" element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <ErrorBoundary>
              <ProductManagementReadOnly />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/manager/applications" element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <ErrorBoundary>
              <ApplicationManagementReadOnly />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/debug" element={
          <ProtectedRoute requireAdmin>
            <ErrorBoundary>
              <DatabaseDebug />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
  <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <KioskProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </KioskProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
