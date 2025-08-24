// Test script for the sentiment analysis API
const testTexts = [
  "I love this product! It's absolutely amazing!",
  "This is terrible. I hate it and it's completely broken.",
  "The product is okay, nothing special but it works as expected.",
  "I'm not sure how I feel about this. It has some good and bad aspects."
];

async function testAPI() {
  for (let i = 0; i < testTexts.length; i++) {
    const testText = testTexts[i];
    console.log(`\n🧪 Test ${i + 1}: "${testText}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testText
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Response:');
        console.log(`   Scores: ${data.sentimentScores.map(s => `${s.label}: ${Math.round(s.score * 100)}%`).join(', ')}`);
        console.log(`   Primary: ${data.primarySentiment.label} (${Math.round(data.primarySentiment.confidence * 100)}%)`);
        console.log(`   Summary: ${data.summary}`);
        console.log(`   Time: ${data.processingTimeMs}ms`);
      } else {
        const errorText = await response.text();
        console.log('❌ API Error:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Network Error:', error.message);
    }
  }
}

testAPI();
