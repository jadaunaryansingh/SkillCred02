import { SentimentScore } from "@shared/api";

// Google Cloud Natural Language API for sentiment analysis
const GOOGLE_CLOUD_API_KEY = "AIzaSyB-vZ2_WiLEBz0WuAcGpTIW8K2ZjfHLy1c";
const GOOGLE_CLOUD_API_URL = "https://language.googleapis.com/v1/documents:analyzeSentiment";

export async function analyzeSentiment(text: string): Promise<SentimentScore[]> {
  try {
    console.log('Calling Google Cloud Natural Language API...');
    
    const response = await fetch(`${GOOGLE_CLOUD_API_URL}?key=${GOOGLE_CLOUD_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document: {
          content: text,
          type: 'PLAIN_TEXT'
        },
        encodingType: 'UTF8'
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Google Cloud API response received:', data);

    // Parse Google Cloud Natural Language response
    if (data.documentSentiment) {
      const sentiment = data.documentSentiment;
      const magnitude = sentiment.magnitude || 0;
      const score = sentiment.score || 0;
      
      // Convert Google's -1 to 1 scale to our 0 to 1 scale
      const normalizedScore = (score + 1) / 2;
      
      // Determine primary sentiment based on score
      let primaryLabel: string;
      if (score > 0.1) {
        primaryLabel = 'POSITIVE';
      } else if (score < -0.1) {
        primaryLabel = 'NEGATIVE';
      } else {
        primaryLabel = 'NEUTRAL';
      }
      
      // Create sentiment scores array
      const scores: SentimentScore[] = [
        { label: 'NEGATIVE', score: score < 0 ? Math.abs(score) : 0 },
        { label: 'NEUTRAL', score: Math.abs(score) < 0.1 ? 1 - Math.abs(score) : 0 },
        { label: 'POSITIVE', score: score > 0 ? score : 0 }
      ];
      
      // Normalize scores to sum to 1
      const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
      if (totalScore > 0) {
        scores.forEach(s => s.score = s.score / totalScore);
      }
      
      return scores;
    }

    throw new Error('Invalid API response format');
  } catch (error) {
    console.error('Google Cloud API sentiment analysis failed:', error);
    console.log('Falling back to local sentiment analysis');
    return localSentimentAnalysis(text);
  }
}

// Fallback local sentiment analysis (kept as backup)
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
  
  // Calculate normalized scores
  const total = positiveScore + negativeScore + neutralScore;
  return [
    { label: 'POSITIVE', score: positiveScore / total },
    { label: 'NEGATIVE', score: negativeScore / total },
    { label: 'NEUTRAL', score: neutralScore / total }
  ];
}

export function getPrimarySentiment(scores: SentimentScore[]): { label: string; confidence: number } {
  if (!scores || scores.length === 0) {
    return { label: 'NEUTRAL', confidence: 0.5 };
  }
  
  // Find the highest scoring sentiment
  const primary = scores.reduce((max, current) => 
    current.score > max.score ? current : max
  );
  
  return {
    label: primary.label,
    confidence: primary.score
  };
}
