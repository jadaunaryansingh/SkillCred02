// Simple test for sentiment analysis
console.log('Starting simple test...');

try {
  const sentimentModule = require('./server/utils/sentiment-analysis.js');
  console.log('Module loaded successfully:', Object.keys(sentimentModule));
  
  // Test the local sentiment analysis directly
  const localResult = sentimentModule.localSentimentAnalysis("I love this product!");
  console.log('Local sentiment result:', localResult);
  
} catch (error) {
  console.error('Error loading module:', error.message);
  console.error('Stack:', error.stack);
}
