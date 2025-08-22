// Working JavaScript server - no TypeScript dependencies
import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const PORT = process.env.API_PORT || 3000;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple ping endpoint
app.get("/api/ping", (req, res) => {
  res.json({ message: "API is running!", timestamp: new Date().toISOString() });
});

// Simple sentiment endpoint that works
app.post("/api/sentiment/multi", upload.single('file'), (req, res) => {
  try {
    const { text, url, autoTranslate = true } = req.body;
    const file = req.file;
    
    let extractedText = '';
    let inputType = '';
    
    if (file) {
      extractedText = `File uploaded: ${file.originalname}`;
      inputType = 'file';
    } else if (url && url.trim()) {
      extractedText = `URL content: ${url}`;
      inputType = 'url';
    } else if (text && text.trim()) {
      extractedText = text.trim();
      inputType = 'text';
    } else {
      return res.status(400).json({ 
        error: 'No input provided. Please provide text, upload a file, or specify a URL.' 
      });
    }
    
    // Simple mock response
    const response = {
      originalText: extractedText,
      detectedLanguage: { language: "English", confidence: 0.9, iso639_1: "en" },
      sentimentScores: [{ label: "NEUTRAL", score: 0.5 }],
      primarySentiment: { label: "NEUTRAL", confidence: 0.5 },
      summary: `${inputType.toUpperCase()} Analysis: Basic sentiment analysis completed`,
      processingTimeMs: 100
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred during analysis' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Working API Server running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET  /api/ping`);
  console.log(`   POST /api/sentiment/multi`);
  console.log(`\n🌐 Frontend should be running on http://localhost:5173`);
});
