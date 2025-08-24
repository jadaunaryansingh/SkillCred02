// Test script to verify Google Cloud API key
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_KEY = process.env.GOOGLE_CLOUD_API_KEY || 'AIzaSyB-vZ2_WiLEBz0WuAcGpTIW8K2ZjfHLy1c';
const API_URL = "https://language.googleapis.com/v1/documents:analyzeSentiment";

async function testAPIKey() {
  console.log('Testing Google Cloud Natural Language API...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  
  const testText = "I love this product! It's absolutely amazing.";
  
  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document: {
          content: testText,
          type: 'PLAIN_TEXT'
        },
        encodingType: 'UTF8'
      }),
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Key is working!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ API Key failed');
      console.log('Error:', response.status, errorText);
      
      if (response.status === 400) {
        console.log('This usually means the API key is invalid or expired');
      } else if (response.status === 403) {
        console.log('This usually means the API key is invalid or quota exceeded');
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testAPIKey();
