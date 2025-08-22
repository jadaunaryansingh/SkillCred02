// Error tracking and logging utilities

interface ErrorLog {
  timestamp: Date;
  error: string;
  context: string;
  userAgent: string;
  domain: string;
}

class ErrorTracker {
  private errors: ErrorLog[] = [];
  private maxErrors = 50; // Keep last 50 errors

  logError(error: Error | string, context: string = 'unknown') {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      error: error instanceof Error ? error.message : error,
      context,
      userAgent: navigator.userAgent,
      domain: window.location.hostname
    };

    this.errors.unshift(errorLog);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🐛 Error tracked: ${context}`);
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Domain:', window.location.hostname);
      console.groupEnd();
    }
  }

  getRecentErrors(count: number = 10): ErrorLog[] {
    return this.errors.slice(0, count);
  }

  getErrorsForContext(context: string): ErrorLog[] {
    return this.errors.filter(log => log.context === context);
  }

  clearErrors() {
    this.errors = [];
  }

  getErrorSummary(): { [context: string]: number } {
    const summary: { [context: string]: number } = {};
    this.errors.forEach(log => {
      summary[log.context] = (summary[log.context] || 0) + 1;
    });
    return summary;
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker();

// Helper function for Firebase auth errors
export function trackFirebaseAuthError(error: any, context: string = 'firebase-auth') {
  if (error?.code === 'auth/unauthorized-domain') {
    errorTracker.logError(
      `Firebase Auth: Unauthorized domain (${window.location.hostname})`,
      'firebase-auth-domain'
    );
    return {
      userMessage: "Google Sign-In is not available in this environment. Please use email/password authentication.",
      handled: true
    };
  }

  if (error?.code === 'auth/network-request-failed') {
    errorTracker.logError(
      `Firebase Auth: Network request failed (${window.location.hostname})`,
      'firebase-network-error'
    );
    return {
      userMessage: "Network connection failed. Authentication services may be unavailable in this environment.",
      handled: true,
      isNetworkError: true
    };
  }

  if (error?.code === 'auth/too-many-requests') {
    errorTracker.logError(
      `Firebase Auth: Too many requests`,
      'firebase-rate-limit'
    );
    return {
      userMessage: "Too many authentication attempts. Please try again later.",
      handled: true
    };
  }

  errorTracker.logError(error, context);
  return {
    userMessage: error?.message || "Authentication failed. Please try again.",
    handled: false
  };
}

// Helper function for general error tracking
export function trackError(error: Error | string, context: string) {
  errorTracker.logError(error, context);
}

// Export error stats for debugging
export function getErrorStats() {
  return {
    totalErrors: errorTracker.getRecentErrors(1000).length,
    recentErrors: errorTracker.getRecentErrors(5),
    errorSummary: errorTracker.getErrorSummary()
  };
}
