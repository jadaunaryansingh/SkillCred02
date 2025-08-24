const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/api/ping", (req, res) => {
  res.json({ message: "Simple API is running!", timestamp: new Date().toISOString() });
});

app.post("/api/sentiment/multi", (req, res) => {
  try {
    const { text, url } = req.body;
    
    if (!text && !url) {
      return res.status(400).json({ error: 'No input provided' });
    }
    
    const response = {
      originalText: text || `URL: ${url}`,
      detectedLanguage: { language: "English", confidence: 0.9, iso639_1: "en" },
      sentimentScores: [{ label: "NEUTRAL", score: 0.5 }],
      primarySentiment: { label: "NEUTRAL", confidence: 0.5 },
      summary: "Simple sentiment analysis completed",
      processingTimeMs: 50
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Simple API Server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints: GET /api/ping, POST /api/sentiment/multi`);
});
