import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI (optional - will use fallback if not available)
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

console.log('Gemini AI initialized:', !!genAI, 'API Key length:', process.env.GEMINI_API_KEY?.length || 0);

export async function generateSummaryInsight(
  originalText: string,
  detectedLanguage: string,
  sentimentLabel: string,
  confidence: number
): Promise<string> {
  if (!genAI) {
    console.log('Gemini AI not initialized, using enhanced fallback summary');
    return generateEnhancedFallbackSummary(originalText, sentimentLabel, confidence, detectedLanguage);
  }

  try {
    console.log('Generating AI summary with Gemini...');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
    Analyze this text and provide a brief, insightful summary about its sentiment and emotional context:

    Text: "${originalText.substring(0, 500)}" ${originalText.length > 500 ? '...' : ''}
    Detected Language: ${detectedLanguage}
    Primary Sentiment: ${sentimentLabel} (${Math.round(confidence * 100)}% confidence)

    Please provide a concise 1-2 sentence insight about:
    1. The emotional tone and context
    2. What this sentiment suggests about the user's experience or opinion

    Keep it professional and analytical.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (text && text.trim().length > 10) {
      console.log('AI summary generated successfully');
      return text.trim();
    } else {
      console.log('Empty AI response, using fallback');
      return generateEnhancedFallbackSummary(originalText, sentimentLabel, confidence, detectedLanguage);
    }
  } catch (error) {
    console.error('Gemini AI error:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      console.error('Invalid API key detected');
    }
    return generateEnhancedFallbackSummary(originalText, sentimentLabel, confidence, detectedLanguage);
  }
}

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string = 'en'
): Promise<string> {
  if (!genAI || sourceLanguage.toLowerCase() === targetLanguage.toLowerCase()) {
    return text;
  }

  try {
    console.log(`Translating from ${sourceLanguage} to ${targetLanguage}...`);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
    Translate the following text from ${sourceLanguage} to ${targetLanguage}.
    Provide only the translation, no explanations:

    "${text.substring(0, 1000)}" ${text.length > 1000 ? '...' : ''}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text();

    if (translatedText && translatedText.trim().length > 0 && translatedText !== text) {
      console.log('Translation completed successfully');
      return translatedText.trim();
    } else {
      console.log('Translation returned same text, using original');
      return text;
    }
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// Enhanced fallback summary generator that doesn't require external APIs
function generateEnhancedFallbackSummary(
  originalText: string, 
  sentimentLabel: string, 
  confidence: number, 
  language: string
): string {
  const textLength = originalText.length;
  const confidencePercent = Math.round(confidence * 100);
  
  const sentimentDescriptions = {
    POSITIVE: {
      high: "This text conveys a strongly positive and optimistic tone",
      medium: "The content shows a positive and favorable perspective",
      low: "There are positive elements present in this text"
    },
    NEGATIVE: {
      high: "This text expresses significant negative sentiment and concerns",
      medium: "The content indicates dissatisfaction or negative feelings",
      low: "There are some negative aspects in this text"
    },
    NEUTRAL: {
      high: "This text maintains a balanced and objective tone throughout",
      medium: "The content presents a neutral and factual perspective",
      low: "The text appears to be relatively neutral in tone"
    }
  };
  
  const confidenceLevel = confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low';
  const baseDescription = sentimentDescriptions[sentimentLabel as keyof typeof sentimentDescriptions]?.[confidenceLevel] || 
                         sentimentDescriptions.NEUTRAL.medium;
  
  const languageNote = language !== 'en' ? ` (detected language: ${language})` : '';
  const lengthNote = textLength > 200 ? " The analysis covers substantial content." : 
                    textLength > 50 ? " The analysis covers moderate content." : 
                    " The analysis covers brief content.";
  
  return `${baseDescription}.${languageNote}${lengthNote} Confidence level: ${confidencePercent}%.`;
}
