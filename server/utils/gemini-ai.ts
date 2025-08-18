import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
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
    console.log('Gemini AI not initialized, using fallback summary');
    return getFallbackSummary(sentimentLabel, confidence, detectedLanguage);
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
      return getFallbackSummary(sentimentLabel, confidence, detectedLanguage);
    }
  } catch (error) {
    console.error('Gemini AI error:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      console.error('Invalid API key detected');
    }
    return getFallbackSummary(sentimentLabel, confidence, detectedLanguage);
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

function getFallbackSummary(sentimentLabel: string, confidence: number, language: string): string {
  const descriptions = {
    POSITIVE: "an optimistic and favorable view",
    NEGATIVE: "concerns or dissatisfaction",
    NEUTRAL: "a balanced or objective perspective"
  };
  
  return `This ${language} text expresses ${sentimentLabel.toLowerCase()} sentiment with ${Math.round(confidence * 100)}% confidence, indicating ${descriptions[sentimentLabel as keyof typeof descriptions] || "mixed emotions"}.`;
}

function getSentimentDescription(sentiment: string): string {
  switch (sentiment.toUpperCase()) {
    case 'POSITIVE': return 'an upbeat and favorable';
    case 'NEGATIVE': return 'a critical or unfavorable';
    case 'NEUTRAL': return 'a balanced and objective';
    default: return 'a mixed';
  }
}
