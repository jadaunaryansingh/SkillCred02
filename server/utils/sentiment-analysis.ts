import { SentimentScore } from "@shared/api";

// API-based sentiment analysis using Hugging Face Inference API
// You can also use other services like OpenAI, Google Cloud Natural Language, etc.

const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest";
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

export async function analyzeSentiment(text: string): Promise<SentimentScore[]> {
  // If no API key, fall back to local analysis
  if (!HUGGINGFACE_API_KEY) {
    console.log('No Hugging Face API key found, using local sentiment analysis');
    return localSentimentAnalysis(text);
  }

  try {
    console.log('Calling Hugging Face sentiment analysis API...');
    
    const response = await fetch(HUGGINGFACE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API response received:', data);

    // Parse Hugging Face response format
    if (Array.isArray(data) && data.length > 0) {
      const scores = data[0];
      return [
        { label: 'NEGATIVE', score: scores[0]?.score || 0 },
        { label: 'NEUTRAL', score: scores[1]?.score || 0 },
        { label: 'POSITIVE', score: scores[2]?.score || 0 }
      ];
    }

    throw new Error('Invalid API response format');
  } catch (error) {
    console.error('API sentiment analysis failed:', error);
    console.log('Falling back to local sentiment analysis');
    return localSentimentAnalysis(text);
  }
}

// Fallback local sentiment analysis (original implementation)
function localSentimentAnalysis(text: string): SentimentScore[] {
  const sentimentKeywords = {
    positive: [
      'excellent', 'amazing', 'great', 'wonderful', 'fantastic', 'awesome', 'brilliant',
      'perfect', 'outstanding', 'superb', 'magnificent', 'incredible', 'remarkable',
      'good', 'nice', 'beautiful', 'lovely', 'happy', 'excited', 'pleased', 'satisfied',
      'delighted', 'thrilled', 'love', 'adore', 'enjoy', 'recommend', 'impressive',
      'stunning', 'marvelous', 'spectacular', 'exceptional', 'phenomenal'
    ],
    negative: [
      'terrible', 'awful', 'horrible', 'disgusting', 'worst', 'hate', 'disappointing',
      'pathetic', 'useless', 'garbage', 'trash', 'bad', 'poor', 'sad', 'angry',
      'frustrated', 'annoying', 'irritating', 'boring', 'stupid', 'ridiculous',
      'expensive', 'overpriced', 'slow', 'broken', 'defective', 'faulty', 'reject',
      'regret', 'waste', 'nightmare', 'disaster', 'catastrophe'
    ],
    neutral: [
      'okay', 'fine', 'average', 'normal', 'standard', 'typical', 'regular',
      'moderate', 'fair', 'adequate', 'acceptable', 'reasonable', 'ordinary'
    ]
  };

  const cleanText = text.toLowerCase();
  const words = cleanText.split(/\W+/);
  
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  
  // Count sentiment words
  for (const word of words) {
    if (sentimentKeywords.positive.includes(word)) {
      positiveScore++;
    } else if (sentimentKeywords.negative.includes(word)) {
      negativeScore++;
    } else if (sentimentKeywords.neutral.includes(word)) {
      neutralScore++;
    }
  }
  
  const totalSentimentWords = positiveScore + negativeScore + neutralScore;
  
  // If no sentiment words found, assume neutral
  if (totalSentimentWords === 0) {
    return [
      { label: 'POSITIVE', score: 0.3 },
      { label: 'NEGATIVE', score: 0.2 },
      { label: 'NEUTRAL', score: 0.5 }
    ];
  }
  
  // Normalize scores
  const normalizedPositive = positiveScore / totalSentimentWords;
  const normalizedNegative = negativeScore / totalSentimentWords;
  const normalizedNeutral = neutralScore / totalSentimentWords;
  
  // Add base probability and normalize to sum to 1
  const scores = [
    { label: 'POSITIVE', score: normalizedPositive + 0.1 },
    { label: 'NEGATIVE', score: normalizedNegative + 0.1 },
    { label: 'NEUTRAL', score: normalizedNeutral + 0.1 }
  ];
  
  const total = scores.reduce((sum, score) => sum + score.score, 0);
  return scores.map(score => ({
    ...score,
    score: Math.round((score.score / total) * 100) / 100
  }));
}

export function getPrimarySentiment(scores: SentimentScore[]) {
  const primary = scores.reduce((max, current) => 
    current.score > max.score ? current : max
  );
  
  return {
    label: primary.label,
    confidence: Math.round(primary.score * 100) / 100
  };
}
