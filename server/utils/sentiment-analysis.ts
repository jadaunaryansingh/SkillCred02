import { SentimentScore } from "@shared/api";

// Google Cloud Natural Language API for sentiment analysis
const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;
const GOOGLE_CLOUD_API_URL = "https://language.googleapis.com/v1/documents:analyzeSentiment";

export async function analyzeSentiment(text: string): Promise<SentimentScore[]> {
  try {
    // Check if API key is available
    if (!GOOGLE_CLOUD_API_KEY) {
      console.log('Google Cloud API key not found, using local sentiment analysis');
      return localSentimentAnalysis(text);
    }

    console.log('Calling Google Cloud Natural Language API...');
    console.log('Text length:', text.length);
    console.log('Text preview:', text.substring(0, 100) + '...');
    
    const response = await fetch(`${GOOGLE_CLOUD_API_URL}?key=${GOOGLE_CLOUD_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://skillcred02.netlify.app/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
      const errorText = await response.text();
      console.error('Google Cloud API error response:', response.status, errorText);
      
      if (response.status === 400) {
        console.error('Bad request - likely invalid text content');
        return localSentimentAnalysis(text);
      } else if (response.status === 403) {
        console.error('API key blocked or quota exceeded, using local sentiment analysis');
        return localSentimentAnalysis(text);
      } else if (response.status === 429) {
        console.error('Rate limit exceeded, using local sentiment analysis');
        return localSentimentAnalysis(text);
      }
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Google Cloud API response received:', JSON.stringify(data, null, 2));

    // Parse Google Cloud Natural Language response
    if (data.documentSentiment) {
      const sentiment = data.documentSentiment;
      const magnitude = sentiment.magnitude || 0;
      const score = sentiment.score || 0;
      
      console.log('Raw sentiment data:', { score, magnitude });
      
      // Google Cloud returns score from -1 (negative) to 1 (positive)
      // We need to convert this to our 0-1 scale for each sentiment category
      
      let positiveScore = 0;
      let negativeScore = 0;
      let neutralScore = 0;
      
      if (score > 0.1) {
        // Positive sentiment
        positiveScore = Math.min(score, 1.0);
        negativeScore = 0;
        neutralScore = Math.max(0, 1 - positiveScore);
      } else if (score < -0.1) {
        // Negative sentiment
        negativeScore = Math.min(Math.abs(score), 1.0);
        positiveScore = 0;
        neutralScore = Math.max(0, 1 - negativeScore);
      } else {
        // Neutral sentiment
        neutralScore = 1.0;
        positiveScore = 0;
        negativeScore = 0;
      }
      
      // Normalize scores to sum to 1
      const totalScore = positiveScore + negativeScore + neutralScore;
      if (totalScore > 0) {
        positiveScore = positiveScore / totalScore;
        negativeScore = negativeScore / totalScore;
        neutralScore = neutralScore / totalScore;
      }
      
      const scores: SentimentScore[] = [
        { label: 'POSITIVE', score: positiveScore },
        { label: 'NEUTRAL', score: neutralScore },
        { label: 'NEGATIVE', score: negativeScore }
      ];
      
      console.log('Calculated sentiment scores:', scores);
      return scores;
    }

    // If no document sentiment, check for sentence-level sentiments
    if (data.sentences && data.sentences.length > 0) {
      console.log('Using sentence-level sentiment analysis');
      return analyzeSentenceLevelSentiment(data.sentences);
    }

    console.log('No sentiment data found in API response, using local analysis');
    return localSentimentAnalysis(text);
    
  } catch (error) {
    console.error('Google Cloud API sentiment analysis failed:', error);
    console.log('Falling back to local sentiment analysis');
    return localSentimentAnalysis(text);
  }
}

// Analyze sentiment based on sentence-level data
function analyzeSentenceLevelSentiment(sentences: any[]): SentimentScore[] {
  let totalPositive = 0;
  let totalNegative = 0;
  let totalNeutral = 0;
  let validSentences = 0;
  
  for (const sentence of sentences) {
    if (sentence.sentiment && sentence.sentiment.score !== undefined) {
      const score = sentence.sentiment.score;
      const magnitude = sentence.sentiment.magnitude || 0;
      
      if (score > 0.1) {
        totalPositive += score * (magnitude + 1);
      } else if (score < -0.1) {
        totalNegative += Math.abs(score) * (magnitude + 1);
      } else {
        totalNeutral += 1;
      }
      validSentences++;
    }
  }
  
  if (validSentences === 0) {
    return localSentimentAnalysis('');
  }
  
  // Normalize scores
  const total = totalPositive + totalNegative + totalNeutral;
  if (total === 0) {
    return [
      { label: 'POSITIVE', score: 0.33 },
      { label: 'NEUTRAL', score: 0.34 },
      { label: 'NEGATIVE', score: 0.33 }
    ];
  }
  
  return [
    { label: 'POSITIVE', score: totalPositive / total },
    { label: 'NEUTRAL', score: totalNeutral / total },
    { label: 'NEGATIVE', score: totalNegative / total }
  ];
}

// Fallback local sentiment analysis (kept as backup)
function localSentimentAnalysis(text: string): SentimentScore[] {
  if (!text || text.trim().length === 0) {
    return [
      { label: 'POSITIVE', score: 0.33 },
      { label: 'NEUTRAL', score: 0.34 },
      { label: 'NEGATIVE', score: 0.33 }
    ];
  }

  const sentimentKeywords = {
    positive: [
      'excellent', 'amazing', 'great', 'wonderful', 'fantastic', 'awesome', 'brilliant',
      'perfect', 'outstanding', 'superb', 'magnificent', 'incredible', 'remarkable',
      'good', 'nice', 'beautiful', 'lovely', 'happy', 'excited', 'pleased', 'satisfied',
      'delighted', 'thrilled', 'love', 'adore', 'enjoy', 'recommend', 'impressive',
      'stunning', 'marvelous', 'spectacular', 'exceptional', 'phenomenal', 'best',
      'favorite', 'amazing', 'wonderful', 'fantastic', 'terrific', 'super', 'top',
      'premium', 'quality', 'excellent', 'outstanding', 'brilliant', 'genius',
      'innovative', 'creative', 'inspiring', 'motivating', 'encouraging', 'supportive'
    ],
    negative: [
      'terrible', 'awful', 'horrible', 'disgusting', 'worst', 'hate', 'disappointing',
      'pathetic', 'useless', 'garbage', 'trash', 'bad', 'poor', 'sad', 'angry',
      'frustrated', 'annoying', 'irritating', 'boring', 'stupid', 'ridiculous',
      'expensive', 'overpriced', 'slow', 'broken', 'defective', 'faulty', 'reject',
      'regret', 'waste', 'nightmare', 'disaster', 'catastrophe', 'awful', 'dreadful',
      'miserable', 'depressing', 'upsetting', 'concerning', 'worried', 'anxious',
      'stressful', 'difficult', 'challenging', 'problematic', 'troublesome', 'annoying'
    ],
    neutral: [
      'okay', 'fine', 'average', 'normal', 'standard', 'typical', 'regular',
      'moderate', 'fair', 'adequate', 'acceptable', 'reasonable', 'ordinary',
      'usual', 'common', 'general', 'basic', 'simple', 'straightforward', 'clear',
      'understandable', 'logical', 'rational', 'practical', 'functional'
    ]
  };

  const cleanText = text.toLowerCase();
  const words = cleanText.split(/\W+/);
  
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  
  // Count sentiment words with intensity
  for (const word of words) {
    if (sentimentKeywords.positive.includes(word)) {
      positiveScore += 1;
    } else if (sentimentKeywords.negative.includes(word)) {
      negativeScore += 1;
    } else if (sentimentKeywords.neutral.includes(word)) {
      neutralScore += 0.5; // Neutral words have less impact
    }
  }
  
  // Check for negation words that can flip sentiment
  const negationWords = ['not', 'no', 'never', 'none', 'neither', 'nor', 'hardly', 'barely', 'scarcely'];
  const negationCount = words.filter(word => negationWords.includes(word)).length;
  
  // Apply negation logic
  if (negationCount > 0) {
    // If there are negation words, reduce the impact of positive/negative words
    positiveScore = Math.max(0, positiveScore - negationCount * 0.5);
    negativeScore = Math.max(0, negativeScore - negationCount * 0.5);
    neutralScore += negationCount * 0.3;
  }
  
  // Check for intensifiers
  const intensifiers = ['very', 'really', 'extremely', 'absolutely', 'completely', 'totally', 'incredibly'];
  const intensifierCount = words.filter(word => intensifiers.includes(word)).length;
  
  if (intensifierCount > 0) {
    positiveScore *= (1 + intensifierCount * 0.2);
    negativeScore *= (1 + intensifierCount * 0.2);
  }
  
  const totalSentimentWords = positiveScore + negativeScore + neutralScore;
  
  // If no sentiment words found, analyze text patterns
  if (totalSentimentWords === 0) {
    // Check for punctuation and capitalization patterns
    const exclamationCount = (text.match(/!/g) || []).length;
    const questionCount = (text.match(/\?/g) || []).length;
    const capsCount = (text.match(/[A-Z]/g) || []).length;
    
    if (exclamationCount > 0 || capsCount > text.length * 0.3) {
      // Likely positive or negative with emphasis
      return [
        { label: 'POSITIVE', score: 0.4 },
        { label: 'NEUTRAL', score: 0.3 },
        { label: 'NEGATIVE', score: 0.3 }
      ];
    } else if (questionCount > 0) {
      // Likely neutral/inquisitive
      return [
        { label: 'POSITIVE', score: 0.25 },
        { label: 'NEUTRAL', score: 0.5 },
        { label: 'NEGATIVE', score: 0.25 }
      ];
    } else {
      // Truly neutral
      return [
        { label: 'POSITIVE', score: 0.33 },
        { label: 'NEUTRAL', score: 0.34 },
        { label: 'NEGATIVE', score: 0.33 }
      ];
    }
  }
  
  // Calculate normalized scores
  const total = positiveScore + negativeScore + neutralScore;
  return [
    { label: 'POSITIVE', score: positiveScore / total },
    { label: 'NEUTRAL', score: neutralScore / total },
    { label: 'NEGATIVE', score: negativeScore / total }
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
