// Development server for API endpoints
// Run with: node dev-server.mjs

import express from 'express';
import cors from 'cors';
import { handleFileAnalysis, handleURLAnalysis, handleMultiInputAnalysis, uploadMiddleware } from './server/routes/enhanced-sentiment.js';
import { uploadMultiInput } from './server/utils/file-processing.js';
import { handleSentimentAnalysis } from './server/routes/sentiment.js';
import { handleGeminiTest } from './server/routes/test-gemini.js';
import { handleDemo } from './server/routes/demo.js';

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/api/ping", (req, res) => {
  res.json({ message: "API is running!", timestamp: new Date().toISOString() });
});

app.post("/api/sentiment", handleSentimentAnalysis);
app.post("/api/sentiment/file", uploadMiddleware, handleFileAnalysis);
app.post("/api/sentiment/url", handleURLAnalysis);
app.post("/api/sentiment/multi", uploadMultiInput, handleMultiInputAnalysis);
app.post("/api/test-gemini", handleGeminiTest);
app.post("/api/demo", handleDemo);

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET  /api/ping`);
  console.log(`   GET  /api/demo`);
  console.log(`   POST /api/sentiment`);
  console.log(`   POST /api/sentiment/file`);
  console.log(`   POST /api/sentiment/url`);
  console.log(`   POST /api/sentiment/multi`);
  console.log(`   POST /api/test-gemini`);
  console.log(`\n🌐 Frontend should be running on http://localhost:5173`);
  console.log(`🔌 API requests will be proxied from Vite to this server`);
});
