import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { KioskProvider, useKiosk } from './contexts/KioskContext';
import ErrorBoundary from './components/ErrorBoundary';
import DatabaseErrorBoundary from './components/DatabaseErrorBoundary';
import KioskSelector from './components/KioskSelector';
import KioskConfigWrapper from './components/KioskConfigWrapper';
import LoginPage from './components/LoginPage.tsx';
import Dashboard from './components/Dashboard.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import ProductManagement from './components/ProductManagement.tsx';
import ApplicationManagement from './components/ApplicationManagement.tsx';
import Calculator from './components/Calculator.tsx';
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
}> = ({ children, requireAdmin = false }) => {
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

  if (requireAdmin && user.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
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
        <Route path="/reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/reports/analytics" element={
          <ProtectedRoute>
            <DatabaseErrorBoundary component="Analytics">
              <Analytics />
            </DatabaseErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/reports/todays-loading" element={
          <ProtectedRoute>
            <DatabaseErrorBoundary component="Today's Loading Totals">
              <TodaysLoadingTotals />
            </DatabaseErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/reports/login-report" element={
          <ProtectedRoute>
            <DatabaseErrorBoundary component="Login Report">
              <LoginReport />
            </DatabaseErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/reports/product-totals" element={
          <ProtectedRoute>
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
