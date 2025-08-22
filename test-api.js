// Test script for API-based sentiment analysis
// Run with: node test-api.js

const testSentimentAPI = async () => {
  console.log('🧪 Testing API-based Sentiment Analysis...\n');
  
  const testTexts = [
    "I absolutely love this product! It's amazing and works perfectly.",
    "This is terrible. I hate it and it's completely broken.",
    "The product is okay, nothing special but it works as expected."
  ];

  for (let i = 0; i < testTexts.length; i++) {
    const text = testTexts[i];
    console.log(`📝 Test ${i + 1}: "${text}"`);
    
    try {
      const response = await fetch('http://localhost:5173/api/sentiment/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, autoTranslate: false }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log(`✅ Response received in ${data.processingTimeMs}ms`);
      console.log(`🌍 Language: ${data.detectedLanguage.language} (${Math.round(data.detectedLanguage.confidence * 100)}%)`);
      console.log(`🎯 Primary Sentiment: ${data.primarySentiment.label} (${Math.round(data.primarySentiment.confidence * 100)}%)`);
      console.log(`📊 Scores: ${data.sentimentScores.map(s => `${s.label}: ${Math.round(s.score * 100)}%`).join(', ')}`);
      console.log(`💡 Summary: ${data.summary}`);
      console.log('─'.repeat(60));
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      console.log('─'.repeat(60));
    }
  }

  console.log('🎯 API Test Summary:');
  console.log('─'.repeat(60));
  console.log('✅ If you see "Calling Hugging Face sentiment analysis API..." in server logs:');
  console.log('   - API integration is working');
  console.log('   - You have HUGGINGFACE_API_KEY configured');
  console.log('');
  console.log('⚠️  If you see "No Hugging Face API key found, using local sentiment analysis":');
  console.log('   - API key not configured');
  console.log('   - See API-SETUP.md for setup instructions');
  console.log('');
  console.log('🔍 Check your server console for detailed API call information');
};

testSentimentAPI().catch(console.error);
