import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { 
  Alert, 
  Button, 
  Box, 
  Typography,
  Collapse
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  component?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

class DatabaseErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      showDetails: false
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`DatabaseErrorBoundary caught an error in ${this.props.component}:`, error, errorInfo);
    
    // Log database-specific errors
    if (error.message.includes('firestore') || 
        error.message.includes('network') || 
        error.message.includes('permission') ||
        error.message.includes('auth')) {
      console.warn('Database/Network error detected:', {
        component: this.props.component,
        error: error.message,
        stack: error.stack
      });
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      showDetails: false
    });
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      const componentName = this.props.component || 'Component';
      const isNetworkError = this.state.error?.message.includes('network') || 
                            this.state.error?.message.includes('fetch') ||
                            this.state.error?.message.includes('timeout');
      
      const isFirestoreError = this.state.error?.message.includes('firestore') ||
                              this.state.error?.message.includes('permission-denied') ||
                              this.state.error?.message.includes('unauthenticated');

      return (
        <Box sx={{ p: 2 }}>
          <Alert 
            severity={isNetworkError ? "warning" : "error"} 
            sx={{ mb: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
              >
                Retry
              </Button>
            }
          >
            <Typography variant="body2" component="div">
              <strong>
                {isNetworkError ? 'Connection Issue' : 
                 isFirestoreError ? 'Database Error' : 
                 'Error'} in {componentName}
              </strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {isNetworkError ? 
                'Unable to connect to the server. Please check your internet connection and try again.' :
                isFirestoreError ?
                'There was an issue accessing the database. Please try again or contact support.' :
                this.state.error?.message || 'An unexpected error occurred.'
              }
            </Typography>
          </Alert>

          {import.meta.env.DEV && (
            <>
              <Button
                size="small"
                onClick={this.toggleDetails}
                startIcon={this.state.showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ mb: 1 }}
              >
                {this.state.showDetails ? 'Hide' : 'Show'} Details
              </Button>
              
              <Collapse in={this.state.showDetails}>
                <Alert severity="info" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {this.state.error?.stack}
                  </Typography>
                </Alert>
              </Collapse>
            </>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default DatabaseErrorBoundary;