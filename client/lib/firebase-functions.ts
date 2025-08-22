import { httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { functions } from "./firebase";

// Cloud Function Interfaces
export interface CloudFunctionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface AdvancedSentimentAnalysisRequest {
  text: string;
  options: {
    deepAnalysis: boolean;
    emotionalTone: boolean;
    contextualAnalysis: boolean;
    multiLanguageDetection: boolean;
    customModelId?: string;
  };
}

export interface BatchProcessingRequest {
  texts: string[];
  options: {
    parallel: boolean;
    maxConcurrency: number;
    includeMetrics: boolean;
  };
}

export interface TextSummarizationRequest {
  text: string;
  maxLength: number;
  language?: string;
}

export interface LanguageTranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  preserveFormatting: boolean;
}

export interface ContentModerationRequest {
  text: string;
  checkTypes: ('toxicity' | 'spam' | 'profanity' | 'hate_speech')[];
  strictness: 'low' | 'medium' | 'high';
}

// Cloud Functions Service
export class CloudFunctionsService {
  // Advanced Sentiment Analysis
  static async advancedSentimentAnalysis(
    request: AdvancedSentimentAnalysisRequest
  ): Promise<CloudFunctionResponse> {
    try {
      const advancedAnalysis = httpsCallable(functions, 'advancedSentimentAnalysis');
      const result = await advancedAnalysis(request);
      return result.data as CloudFunctionResponse;
    } catch (error) {
      console.error('Advanced sentiment analysis error:', error);
      throw new Error('Failed to perform advanced sentiment analysis');
    }
  }

  // Batch Processing
  static async batchProcess(
    request: BatchProcessingRequest
  ): Promise<CloudFunctionResponse> {
    try {
      const batchProcessor = httpsCallable(functions, 'batchSentimentAnalysis');
      const result = await batchProcessor(request);
      return result.data as CloudFunctionResponse;
    } catch (error) {
      console.error('Batch processing error:', error);
      throw new Error('Failed to process batch analysis');
    }
  }

  // Text Summarization
  static async summarizeText(
    request: TextSummarizationRequest
  ): Promise<CloudFunctionResponse> {
    try {
      const summarizer = httpsCallable(functions, 'summarizeText');
      const result = await summarizer(request);
      return result.data as CloudFunctionResponse;
    } catch (error) {
      console.error('Text summarization error:', error);
      throw new Error('Failed to summarize text');
    }
  }

  // Language Translation
  static async translateText(
    request: LanguageTranslationRequest
  ): Promise<CloudFunctionResponse> {
    try {
      const translator = httpsCallable(functions, 'translateText');
      const result = await translator(request);
      return result.data as CloudFunctionResponse;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Failed to translate text');
    }
  }

  // Content Moderation
  static async moderateContent(
    request: ContentModerationRequest
  ): Promise<CloudFunctionResponse> {
    try {
      const moderator = httpsCallable(functions, 'moderateContent');
      const result = await moderator(request);
      return result.data as CloudFunctionResponse;
    } catch (error) {
      console.error('Content moderation error:', error);
      throw new Error('Failed to moderate content');
    }
  }

  // Generate AI Insights
  static async generateInsights(data: {
    sentimentHistory: any[];
    timeRange: string;
    analysisType: string;
  }): Promise<CloudFunctionResponse> {
    try {
      const insightGenerator = httpsCallable(functions, 'generateInsights');
      const result = await insightGenerator(data);
      return result.data as CloudFunctionResponse;
    } catch (error) {
      console.error('Insight generation error:', error);
      throw new Error('Failed to generate insights');
    }
  }

  // Export Data
  static async exportUserData(options: {
    format: 'json' | 'csv' | 'pdf';
    includeAnalytics: boolean;
    dateRange: { start: string; end: string };
  }): Promise<CloudFunctionResponse> {
    try {
      const exporter = httpsCallable(functions, 'exportUserData');
      const result = await exporter(options);
      return result.data as CloudFunctionResponse;
    } catch (error) {
      console.error('Data export error:', error);
      throw new Error('Failed to export user data');
    }
  }

  // Custom Model Training
  static async trainCustomModel(data: {
    trainingData: any[];
    modelName: string;
    modelType: 'sentiment' | 'classification' | 'emotion';
  }): Promise<CloudFunctionResponse> {
    try {
      const trainer = httpsCallable(functions, 'trainCustomModel');
      const result = await trainer(data);
      return result.data as CloudFunctionResponse;
    } catch (error) {
      console.error('Model training error:', error);
      throw new Error('Failed to train custom model');
    }
  }

  // Real-time Notifications
  static async sendNotification(data: {
    userId: string;
    type: 'analysis_complete' | 'quota_warning' | 'subscription_update';
    message: string;
    data?: any;
  }): Promise<CloudFunctionResponse> {
    try {
      const notifier = httpsCallable(functions, 'sendNotification');
      const result = await notifier(data);
      return result.data as CloudFunctionResponse;
    } catch (error) {
      console.error('Notification error:', error);
      throw new Error('Failed to send notification');
    }
  }

  // Webhook Management
  static async manageWebhook(action: 'create' | 'update' | 'delete', data: {
    url: string;
    events: string[];
    secret?: string;
  }): Promise<CloudFunctionResponse> {
    try {
      const webhookManager = httpsCallable(functions, 'manageWebhook');
      const result = await webhookManager({ action, ...data });
      return result.data as CloudFunctionResponse;
    } catch (error) {
      console.error('Webhook management error:', error);
      throw new Error('Failed to manage webhook');
    }
  }

  // Analytics Data Processing
  static async processAnalytics(data: {
    userId: string;
    eventType: string;
    timeRange: string;
    aggregationType: 'daily' | 'weekly' | 'monthly';
  }): Promise<CloudFunctionResponse> {
    try {
      const analyticsProcessor = httpsCallable(functions, 'processAnalytics');
      const result = await analyticsProcessor(data);
      return result.data as CloudFunctionResponse;
    } catch (error) {
      console.error('Analytics processing error:', error);
      throw new Error('Failed to process analytics');
    }
  }

  // Quota Management
  static async checkQuota(userId: string): Promise<CloudFunctionResponse> {
    try {
      const quotaChecker = httpsCallable(functions, 'checkUserQuota');
      const result = await quotaChecker({ userId });
      return result.data as CloudFunctionResponse;
    } catch (error) {
      console.error('Quota check error:', error);
      throw new Error('Failed to check user quota');
    }
  }

  // Subscription Management
  static async manageSubscription(action: 'upgrade' | 'downgrade' | 'cancel', data: {
    userId: string;
    planId?: string;
    billingCycle?: 'monthly' | 'yearly';
  }): Promise<CloudFunctionResponse> {
    try {
      const subscriptionManager = httpsCallable(functions, 'manageSubscription');
      const result = await subscriptionManager({ action, ...data });
      return result.data as CloudFunctionResponse;
    } catch (error) {
      console.error('Subscription management error:', error);
      throw new Error('Failed to manage subscription');
    }
  }

  // Health Check
  static async healthCheck(): Promise<CloudFunctionResponse> {
    try {
      const healthChecker = httpsCallable(functions, 'healthCheck');
      const result = await healthChecker({});
      return result.data as CloudFunctionResponse;
    } catch (error) {
      console.error('Health check error:', error);
      throw new Error('Failed to perform health check');
    }
  }
}

// Helper Functions
export class CloudFunctionHelpers {
  // Retry mechanism for failed function calls
  static async retryFunction<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError!;
  }

  // Batch function calls with concurrency control
  static async batchFunctionCalls<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    maxConcurrency: number = 5
  ): Promise<R[]> {
    const results: R[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const promise = fn(item).then((result) => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    await Promise.all(executing);
    return results;
  }

  // Function call with timeout
  static async callWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number = 30000
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Function call timeout')), timeoutMs)
      )
    ]);
  }

  // Monitor function performance
  static async monitorFunction<T>(
    functionName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const endTime = performance.now();
      
      console.log(`Cloud Function ${functionName} executed in ${endTime - startTime}ms`);
      
      // Log to analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'cloud_function_executed', {
          function_name: functionName,
          execution_time: Math.round(endTime - startTime),
          success: true
        });
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      console.error(`Cloud Function ${functionName} failed after ${endTime - startTime}ms:`, error);
      
      // Log error to analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'cloud_function_error', {
          function_name: functionName,
          execution_time: Math.round(endTime - startTime),
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      throw error;
    }
  }
}

// Connection to emulator in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    try {
      connectFunctionsEmulator(functions, 'localhost', 5001);
      console.log('🔧 Connected to Functions emulator');
    } catch (error) {
      console.log('Functions emulator not available:', error);
    }
  }
}

// Export singleton instance
export const cloudFunctions = CloudFunctionsService;
export const cloudHelpers = CloudFunctionHelpers;
