// Test script for the specific problematic text
const testText = "i hate it";

async function testSpecific() {
  try {
    console.log('Testing problematic text: "' + testText + '"');
    
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
      console.log('✅ API Response:');
      console.log('Text analyzed:', testText);
      console.log('Sentiment Scores:', data.sentimentScores);
      console.log('Primary Sentiment:', data.primarySentiment);
      console.log('Summary:', data.summary);
      console.log('Processing Time:', data.processingTimeMs + 'ms');
      
      // Check if the analysis is correct
      if (data.primarySentiment.label === 'NEGATIVE' && data.primarySentiment.confidence > 0.7) {
        console.log('🎯 CORRECT: Text "i hate it" properly identified as NEGATIVE');
      } else {
        console.log('❌ INCORRECT: Text "i hate it" should be NEGATIVE with high confidence');
        console.log('   Expected: NEGATIVE with >70% confidence');
        console.log('   Got:', data.primarySentiment.label, 'with', Math.round(data.primarySentiment.confidence * 100) + '% confidence');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testSpecific();
