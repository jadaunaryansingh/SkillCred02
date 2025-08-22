import { RequestHandler } from "express";
import { 
  SentimentAnalysisRequest, 
  SentimentAnalysisResponse,
  BatchAnalysisRequest,
  BatchAnalysisResponse,
  TranslationRequest,
  TranslationResponse
} from "@shared/api";
import { detectLanguage } from "../utils/language-detection";
import { analyzeSentiment, getPrimarySentiment } from "../utils/sentiment-analysis";
import { generateSummaryInsight, translateText } from "../utils/gemini-ai";

export const handleSentimentAnalysis: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { text, autoTranslate = true } = req.body as SentimentAnalysisRequest;
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Text is required and must be a non-empty string' 
      });
    }

    // Step 1: Detect language
    const detectedLanguage = detectLanguage(text);
    
    // Step 2: Translate if needed
    let translatedText: string | undefined;
    if (autoTranslate && detectedLanguage.iso639_1 !== 'en' && detectedLanguage.confidence > 0.3) {
      translatedText = await translateText(text, detectedLanguage.language, 'English');
    }
    
    // Step 3: Analyze sentiment (use translated text if available)
    const textToAnalyze = translatedText || text;
    const sentimentScores = await analyzeSentiment(textToAnalyze);
    const primarySentiment = getPrimarySentiment(sentimentScores);
    
    // Step 4: Generate AI summary
    const summary = await generateSummaryInsight(
      text,
      detectedLanguage.language,
      primarySentiment.label,
      primarySentiment.confidence
    );
    
    const processingTimeMs = Date.now() - startTime;
    
    const response: SentimentAnalysisResponse = {
      originalText: text,
      detectedLanguage,
      translatedText,
      sentimentScores,
      primarySentiment,
      summary,
      processingTimeMs
    };
    
    res.json(response);
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ 
      error: 'An error occurred during sentiment analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleBatchAnalysis: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { texts, autoTranslate = true } = req.body as BatchAnalysisRequest;
    
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ 
        error: 'Texts must be a non-empty array' 
      });
    }

    if (texts.length > 50) {
      return res.status(400).json({ 
        error: 'Maximum 50 texts allowed per batch' 
      });
    }

    const results: SentimentAnalysisResponse[] = [];
    
    for (const text of texts) {
      if (typeof text !== 'string' || text.trim().length === 0) {
        continue; // Skip invalid texts
      }
      
      const analysisStartTime = Date.now();
      
      const detectedLanguage = detectLanguage(text);
      
      let translatedText: string | undefined;
      if (autoTranslate && detectedLanguage.iso639_1 !== 'en' && detectedLanguage.confidence > 0.3) {
        translatedText = await translateText(text, detectedLanguage.language, 'English');
      }
      
      const textToAnalyze = translatedText || text;
      const sentimentScores = await analyzeSentiment(textToAnalyze);
      const primarySentiment = getPrimarySentiment(sentimentScores);
      
      const summary = await generateSummaryInsight(
        text,
        detectedLanguage.language,
        primarySentiment.label,
        primarySentiment.confidence
      );
      
      const processingTimeMs = Date.now() - analysisStartTime;
      
      results.push({
        originalText: text,
        detectedLanguage,
        translatedText,
        sentimentScores,
        primarySentiment,
        summary,
        processingTimeMs
      });
    }
    
    const totalProcessingTime = Date.now() - startTime;
    const averageProcessingTime = results.length > 0 ? totalProcessingTime / results.length : 0;
    
    const response: BatchAnalysisResponse = {
      results,
      totalProcessed: results.length,
      averageProcessingTimeMs: Math.round(averageProcessingTime)
    };
    
    res.json(response);
  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({ 
      error: 'An error occurred during batch analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleTranslation: RequestHandler = async (req, res) => {
  try {
    const { text, targetLanguage = 'en', sourceLanguage } = req.body as TranslationRequest;
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Text is required and must be a non-empty string' 
      });
    }

    let detectedSourceLanguage = sourceLanguage;
    if (!detectedSourceLanguage) {
      const detection = detectLanguage(text);
      detectedSourceLanguage = detection.language;
    }
    
    const translatedText = await translateText(text, detectedSourceLanguage, targetLanguage);
    
    const response: TranslationResponse = {
      originalText: text,
      translatedText,
      sourceLanguage: detectedSourceLanguage,
      targetLanguage
    };
    
    res.json(response);
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ 
      error: 'An error occurred during translation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
