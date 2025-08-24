import { RequestHandler } from "express";
import { SentimentAnalysisResponse } from "@shared/api";
import { detectLanguage } from "../utils/language-detection";
import { analyzeSentiment, getPrimarySentiment } from "../utils/sentiment-analysis";
import { generateSummaryInsight, translateText } from "../utils/gemini-ai";
import { processFile, extractTextFromURL, validateExtractedText, upload } from "../utils/file-processing";

// File upload analysis endpoint
export const handleFileAnalysis: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }

    // Process file to extract text
    const extractedText = await processFile(req.file);
    
    // Validate extracted text
    const validation = validateExtractedText(extractedText);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.error 
      });
    }

    const text = validation.cleanText;
    const autoTranslate = req.body.autoTranslate !== 'false';

    // Step 1: Detect language
    const detectedLanguage = detectLanguage(text);
    
    // Step 2: Translate if needed
    let translatedText: string | undefined;
    if (autoTranslate && detectedLanguage.iso639_1 !== 'en' && detectedLanguage.confidence > 0.3) {
      translatedText = await translateText(text, detectedLanguage.language, 'English');
    }
    
    // Step 3: Analyze sentiment
    const textToAnalyze = translatedText || text;
    console.log('Analyzing sentiment for text:', {
      originalLength: text.length,
      translatedLength: translatedText?.length || 0,
      textToAnalyzeLength: textToAnalyze.length,
      preview: textToAnalyze.substring(0, 200) + '...'
    });
    
    const sentimentScores = await analyzeSentiment(textToAnalyze);
    const primarySentiment = getPrimarySentiment(sentimentScores);
    
    console.log('Sentiment analysis results:', {
      scores: sentimentScores,
      primary: primarySentiment,
      textLength: textToAnalyze.length
    });
    
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
      summary: `File Analysis: ${summary}`,
      processingTimeMs
    };
    
    res.json(response);
  } catch (error) {
    console.error('File analysis error:', error);
    
    // Provide more specific error messages for common issues
    let errorMessage = 'An error occurred during file analysis';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorDetails.includes('corrupted') || errorDetails.includes('unreadable')) {
      errorMessage = 'PDF Text Extraction Failed';
      errorDetails = 'The PDF appears to be a scanned document or image-based PDF that cannot be processed as text. Try converting the PDF to text format or using an image file instead.';
    } else if (errorDetails.includes('No readable text found')) {
      errorMessage = 'No Text Found in PDF';
      errorDetails = 'This PDF appears to contain no extractable text. It might be a scanned document, image-based PDF, or password-protected file.';
    } else if (errorDetails.includes('Failed to extract text from PDF')) {
      errorMessage = 'PDF Processing Error';
      errorDetails = 'Unable to extract text from this PDF. The file might be corrupted, password-protected, or in an unsupported format.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: errorDetails,
      suggestions: [
        'Try converting the PDF to text format using a PDF reader',
        'Use an image file instead (JPEG, PNG)',
        'Check if the PDF is password-protected',
        'Ensure the PDF contains actual text, not just scanned images'
      ]
    });
  }
};

// URL analysis endpoint
export const handleURLAnalysis: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { url, autoTranslate = true } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        error: 'URL is required and must be a string' 
      });
    }

    // Extract text from URL
    const extractedText = await extractTextFromURL(url);
    
    // Validate extracted text
    const validation = validateExtractedText(extractedText);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.error 
      });
    }

    const text = validation.cleanText;

    // Step 1: Detect language
    const detectedLanguage = detectLanguage(text);
    
    // Step 2: Translate if needed
    let translatedText: string | undefined;
    if (autoTranslate && detectedLanguage.iso639_1 !== 'en' && detectedLanguage.confidence > 0.3) {
      translatedText = await translateText(text, detectedLanguage.language, 'English');
    }
    
    // Step 3: Analyze sentiment
    const textToAnalyze = translatedText || text;
    console.log('Analyzing sentiment for text:', {
      originalLength: text.length,
      translatedLength: translatedText?.length || 0,
      textToAnalyzeLength: textToAnalyze.length,
      preview: textToAnalyze.substring(0, 200) + '...'
    });
    
    const sentimentScores = await analyzeSentiment(textToAnalyze);
    const primarySentiment = getPrimarySentiment(sentimentScores);
    
    console.log('Sentiment analysis results:', {
      scores: sentimentScores,
      primary: primarySentiment,
      textLength: textToAnalyze.length
    });
    
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
      summary: `URL Analysis (${url}): ${summary}`,
      processingTimeMs
    };
    
    res.json(response);
  } catch (error) {
    console.error('URL analysis error:', error);
    res.status(500).json({ 
      error: 'An error occurred during URL analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Multi-input analysis endpoint (supports text, file, and URL)
export const handleMultiInputAnalysis: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('Multi-input analysis request received:', {
      body: req.body,
      file: req.file ? `${req.file.originalname} (${req.file.mimetype})` : 'No file',
      contentType: req.headers['content-type']
    });

    const { text, url, autoTranslate = true } = req.body;
    const file = req.file;
    
    let extractedText = '';
    let inputType = '';
    let sourceInfo = '';

    // Determine input type and extract text
    if (file) {
      try {
        extractedText = await processFile(file);
        inputType = 'file';
        sourceInfo = `${file.originalname} (${file.mimetype})`;
      } catch (fileError) {
        console.error('File processing error:', fileError);
        return res.status(400).json({ 
          error: 'Failed to process uploaded file',
          details: fileError instanceof Error ? fileError.message : 'Unknown file error'
        });
      }
    } else if (url && url.trim()) {
      try {
        extractedText = await extractTextFromURL(url.trim());
        inputType = 'url';
        sourceInfo = url.trim();
      } catch (urlError) {
        console.error('URL processing error:', urlError);
        return res.status(400).json({ 
          error: 'Failed to process URL',
          details: urlError instanceof Error ? urlError.message : 'Unknown URL error'
        });
      }
    } else if (text && text.trim()) {
      extractedText = text.trim();
      inputType = 'text';
      sourceInfo = 'direct input';
    } else {
      return res.status(400).json({ 
        error: 'No input provided. Please provide text, upload a file, or specify a URL.' 
      });
    }

    // Validate extracted text
    const validation = validateExtractedText(extractedText);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.error 
      });
    }

    const finalText = validation.cleanText;

    // Step 1: Detect language
    const detectedLanguage = detectLanguage(finalText);
    
    // Step 2: Translate if needed
    let translatedText: string | undefined;
    if (autoTranslate && detectedLanguage.iso639_1 !== 'en' && detectedLanguage.confidence > 0.3) {
      translatedText = await translateText(finalText, detectedLanguage.language, 'English');
    }
    
    // Step 3: Analyze sentiment
    const textToAnalyze = translatedText || finalText;
    console.log('Analyzing sentiment for text:', {
      originalLength: finalText.length,
      translatedLength: translatedText?.length || 0,
      textToAnalyzeLength: textToAnalyze.length,
      preview: textToAnalyze.substring(0, 200) + '...'
    });
    
    const sentimentScores = await analyzeSentiment(textToAnalyze);
    const primarySentiment = getPrimarySentiment(sentimentScores);
    
    console.log('Sentiment analysis results:', {
      scores: sentimentScores,
      primary: primarySentiment,
      textLength: textToAnalyze.length
    });
    
    // Step 4: Generate AI summary
    const summary = await generateSummaryInsight(
      finalText,
      detectedLanguage.language,
      primarySentiment.label,
      primarySentiment.confidence
    );
    
    const processingTimeMs = Date.now() - startTime;
    
    const response: SentimentAnalysisResponse = {
      originalText: finalText,
      detectedLanguage,
      translatedText,
      sentimentScores,
      primarySentiment,
      summary: `${inputType.toUpperCase()} Analysis (${sourceInfo}): ${summary}`,
      processingTimeMs
    };
    
    console.log('Multi-input analysis completed successfully:', {
      inputType,
      sourceInfo,
      textLength: finalText.length,
      processingTimeMs
    });
    
    res.json(response);
  } catch (error) {
    console.error('Multi-input analysis error:', error);
    res.status(500).json({ 
      error: 'An error occurred during analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Middleware to handle file uploads
export const uploadMiddleware = upload.single('file');
