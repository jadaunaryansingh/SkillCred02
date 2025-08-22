import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-rcb-black via-rcb-black-dark to-rcb-black flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-8 max-w-md mx-auto"
          >
            <motion.div
              className="inline-block p-4 rounded-full bg-rcb-red/20 mb-6"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertTriangle className="h-12 w-12 text-rcb-red" />
            </motion.div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              Something went wrong
            </h1>
            
            <p className="text-gray-400 mb-6">
              An unexpected error occurred. Don't worry, your data is safe.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-rcb-red to-rcb-red-bright hover:from-rcb-red-bright hover:to-rcb-red-glow"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Application
              </Button>
              
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full border-rcb-red/30 text-white hover:bg-rcb-red/10"
              >
                Try Again
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-gray-500 text-sm cursor-pointer mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-gray-600 bg-rcb-black/50 p-3 rounded overflow-auto">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
