export interface DemoResponse {
  message: string;
}

export interface SentimentAnalysisRequest {
  text: string;
  autoTranslate?: boolean;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  iso639_1: string;
}

export interface SentimentScore {
  label: string;
  score: number;
}

export interface SentimentAnalysisResponse {
  originalText: string;
  detectedLanguage: LanguageDetectionResult;
  translatedText?: string;
  sentimentScores: SentimentScore[];
  primarySentiment: {
    label: string;
    confidence: number;
  };
  summary: string;
  processingTimeMs: number;
}

export interface TranslationRequest {
  text: string;
  targetLanguage?: string;
  sourceLanguage?: string;
}

export interface TranslationResponse {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface BatchAnalysisRequest {
  texts: string[];
  autoTranslate?: boolean;
}

export interface BatchAnalysisResponse {
  results: SentimentAnalysisResponse[];
  totalProcessed: number;
  averageProcessingTimeMs: number;
}
