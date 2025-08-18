import { logEvent, setUserProperties, setUserId } from "firebase/analytics";
import { trace, getPerformance } from "firebase/performance";
import { analytics, performance } from "./firebase";

// Analytics Events
export enum AnalyticsEvents {
  // Authentication Events
  SIGN_UP = 'sign_up',
  LOGIN = 'login',
  LOGOUT = 'logout',
  
  // Analysis Events
  ANALYSIS_STARTED = 'analysis_started',
  ANALYSIS_COMPLETED = 'analysis_completed',
  ANALYSIS_FAILED = 'analysis_failed',
  BATCH_ANALYSIS_STARTED = 'batch_analysis_started',
  BATCH_ANALYSIS_COMPLETED = 'batch_analysis_completed',
  
  // File Events
  FILE_UPLOADED = 'file_uploaded',
  FILE_DOWNLOADED = 'file_downloaded',
  FILE_DELETED = 'file_deleted',
  
  // User Engagement
  PAGE_VIEW = 'page_view',
  SEARCH_PERFORMED = 'search',
  SHARE_RESULTS = 'share',
  EXPORT_DATA = 'export_data',
  
  // Subscription Events
  SUBSCRIPTION_UPGRADE = 'subscription_upgrade',
  SUBSCRIPTION_DOWNGRADE = 'subscription_downgrade',
  
  // Feature Usage
  FEATURE_USED = 'feature_used',
  SETTINGS_CHANGED = 'settings_changed',
  NOTIFICATION_CLICKED = 'notification_clicked'
}

// Performance Traces
export enum PerformanceTraces {
  SENTIMENT_ANALYSIS = 'sentiment_analysis_trace',
  FILE_UPLOAD = 'file_upload_trace',
  PAGE_LOAD = 'page_load_trace',
  DATABASE_QUERY = 'database_query_trace',
  API_CALL = 'api_call_trace'
}

// Custom Analytics Service
export class AdvancedAnalytics {
  private static sessionStartTime = Date.now();
  private static pageStartTime = Date.now();
  
  // Initialize analytics for user
  static initializeForUser(userId: string, userProperties: Record<string, any> = {}) {
    if (analytics) {
      setUserId(analytics, userId);
      setUserProperties(analytics, {
        user_type: userProperties.subscription_plan || 'free',
        signup_method: userProperties.signup_method || 'unknown',
        user_tier: userProperties.user_tier || 'basic',
        created_at: userProperties.created_at || new Date().toISOString(),
        ...userProperties
      });
    }
  }

  // Track page views with enhanced data
  static trackPageView(pageName: string, additionalData: Record<string, any> = {}) {
    const timeOnPreviousPage = Date.now() - this.pageStartTime;
    this.pageStartTime = Date.now();

    if (analytics) {
      logEvent(analytics, AnalyticsEvents.PAGE_VIEW, {
        page_title: pageName,
        page_location: window.location.href,
        time_on_previous_page: timeOnPreviousPage,
        session_duration: Date.now() - this.sessionStartTime,
        ...additionalData
      });
    }
  }

  // Track authentication events
  static trackAuth(method: string, success: boolean, errorCode?: string) {
    if (analytics) {
      logEvent(analytics, success ? AnalyticsEvents.LOGIN : 'login_failed', {
        method,
        success,
        error_code: errorCode,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Track sentiment analysis with detailed metrics
  static trackSentimentAnalysis(data: {
    type: 'text' | 'file' | 'url' | 'batch',
    language: string,
    sentiment: string,
    confidence: number,
    processingTime: number,
    inputLength: number,
    success: boolean,
    errorType?: string
  }) {
    if (analytics) {
      logEvent(analytics, data.success ? AnalyticsEvents.ANALYSIS_COMPLETED : AnalyticsEvents.ANALYSIS_FAILED, {
        analysis_type: data.type,
        detected_language: data.language,
        primary_sentiment: data.sentiment,
        confidence_score: Math.round(data.confidence * 100),
        processing_time_ms: data.processingTime,
        input_length: data.inputLength,
        success: data.success,
        error_type: data.errorType,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Track file operations
  static trackFileOperation(operation: 'upload' | 'download' | 'delete', data: {
    fileType: string,
    fileSize: number,
    fileName?: string,
    success: boolean,
    errorType?: string
  }) {
    let eventName;
    switch (operation) {
      case 'upload': eventName = AnalyticsEvents.FILE_UPLOADED; break;
      case 'download': eventName = AnalyticsEvents.FILE_DOWNLOADED; break;
      case 'delete': eventName = AnalyticsEvents.FILE_DELETED; break;
    }

    if (analytics) {
      logEvent(analytics, eventName, {
        file_type: data.fileType,
        file_size_bytes: data.fileSize,
        file_size_mb: Math.round(data.fileSize / 1024 / 1024 * 100) / 100,
        file_name: data.fileName,
        success: data.success,
        error_type: data.errorType,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Track feature usage
  static trackFeatureUsage(featureName: string, additionalData: Record<string, any> = {}) {
    if (analytics) {
      logEvent(analytics, AnalyticsEvents.FEATURE_USED, {
        feature_name: featureName,
        timestamp: new Date().toISOString(),
        ...additionalData
      });
    }
  }

  // Track user engagement
  static trackEngagement(action: string, data: Record<string, any> = {}) {
    if (analytics) {
      logEvent(analytics, action, {
        engagement_time_msec: Date.now() - this.sessionStartTime,
        timestamp: new Date().toISOString(),
        ...data
      });
    }
  }

  // Track errors
  static trackError(errorType: string, errorMessage: string, context: string) {
    if (analytics) {
      logEvent(analytics, 'exception', {
        description: errorMessage,
        fatal: false,
        error_type: errorType,
        context,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Track custom events
  static trackCustomEvent(eventName: string, parameters: Record<string, any> = {}) {
    if (analytics) {
      logEvent(analytics, eventName, {
        timestamp: new Date().toISOString(),
        ...parameters
      });
    }
  }
}

// Performance Monitoring Service
export class AdvancedPerformance {
  private static traces: Map<string, any> = new Map();

  // Start a performance trace
  static startTrace(traceName: string): string {
    const traceId = `${traceName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (performance) {
      const traceInstance = trace(performance, traceName);
      traceInstance.start();
      this.traces.set(traceId, traceInstance);
    }

    return traceId;
  }

  // Stop a performance trace
  static stopTrace(traceId: string, attributes: Record<string, any> = {}) {
    const traceInstance = this.traces.get(traceId);
    if (traceInstance) {
      // Add custom attributes
      Object.entries(attributes).forEach(([key, value]) => {
        traceInstance.putAttribute(key, String(value));
      });
      
      traceInstance.stop();
      this.traces.delete(traceId);
    }
  }

  // Measure function execution time
  static async measureFunction<T>(
    functionName: string,
    fn: () => Promise<T>,
    attributes: Record<string, any> = {}
  ): Promise<T> {
    const traceId = this.startTrace(`function_${functionName}`);
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const endTime = performance.now();
      
      this.stopTrace(traceId, {
        ...attributes,
        execution_time_ms: Math.round(endTime - startTime),
        success: true
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      this.stopTrace(traceId, {
        ...attributes,
        execution_time_ms: Math.round(endTime - startTime),
        success: false,
        error_type: error instanceof Error ? error.name : 'unknown'
      });
      
      throw error;
    }
  }

  // Measure API call performance
  static async measureApiCall<T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    additionalAttributes: Record<string, any> = {}
  ): Promise<T> {
    return this.measureFunction(
      'api_call',
      apiCall,
      {
        endpoint,
        ...additionalAttributes
      }
    );
  }

  // Measure database query performance
  static async measureDatabaseQuery<T>(
    queryType: string,
    query: () => Promise<T>,
    additionalAttributes: Record<string, any> = {}
  ): Promise<T> {
    return this.measureFunction(
      'database_query',
      query,
      {
        query_type: queryType,
        ...additionalAttributes
      }
    );
  }

  // Monitor page load performance
  static monitorPageLoad(pageName: string) {
    if (typeof window !== 'undefined' && window.performance) {
      // Wait for page to fully load
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (analytics) {
            logEvent(analytics, 'page_load_performance', {
              page_name: pageName,
              load_time: navigation.loadEventEnd - navigation.fetchStart,
              dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
              first_contentful_paint: this.getFirstContentfulPaint(),
              largest_contentful_paint: this.getLargestContentfulPaint(),
              cumulative_layout_shift: this.getCumulativeLayoutShift()
            });
          }
        }, 0);
      });
    }
  }

  // Get Web Vitals
  private static getFirstContentfulPaint(): number {
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  private static getLargestContentfulPaint(): number {
    return new Promise((resolve) => {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    }) as any;
  }

  private static getCumulativeLayoutShift(): number {
    return new Promise((resolve) => {
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        resolve(clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
    }) as any;
  }
}

// Auto-initialize analytics
if (typeof window !== 'undefined') {
  // Monitor page load performance
  AdvancedPerformance.monitorPageLoad(window.location.pathname);
  
  // Track initial page view
  AdvancedAnalytics.trackPageView(document.title);
  
  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      AdvancedAnalytics.trackEngagement('page_hidden');
    } else {
      AdvancedAnalytics.trackEngagement('page_visible');
    }
  });
  
  // Track errors
  window.addEventListener('error', (event) => {
    AdvancedAnalytics.trackError(
      'javascript_error',
      event.message,
      `${event.filename}:${event.lineno}:${event.colno}`
    );
  });
  
  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    AdvancedAnalytics.trackError(
      'unhandled_promise_rejection',
      String(event.reason),
      'global'
    );
  });
}
