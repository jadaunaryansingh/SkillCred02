// Test script for sentiment analysis
import { analyzeSentiment, getPrimarySentiment } from './server/utils/sentiment-analysis.js';

const testTexts = [
  "I absolutely love this product! It's amazing and works perfectly.",
  "This is the worst experience ever. I hate it and want a refund.",
  "The product is okay, nothing special but it works as expected.",
  "I'm not sure how I feel about this. It has some good and bad aspects.",
  "This is incredible! Best purchase I've ever made!",
  "Terrible quality, broken on arrival, complete waste of money.",
  "It's fine, I guess. Does what it's supposed to do.",
  "I'm really excited about this new feature!",
  "I'm disappointed with the results. Not what I expected.",
  "The service was adequate but could be improved."
];

async function testSentimentAnalysis() {
  console.log('Testing Sentiment Analysis...\n');
  
  for (let i = 0; i < testTexts.length; i++) {
    const text = testTexts[i];
    console.log(`Test ${i + 1}: "${text}"`);
    
    try {
      const scores = await analyzeSentiment(text);
      const primary = getPrimarySentiment(scores);
      
      console.log('  Scores:', scores);
      console.log('  Primary:', primary);
      console.log('  ---');
    } catch (error) {
      console.error('  Error:', error.message);
      console.log('  ---');
    }
  }
}

// Run the test
testSentimentAnalysis().catch(console.error);
