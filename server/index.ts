import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSentimentAnalysis, handleBatchAnalysis, handleTranslation } from "./routes/sentiment";
import { handleFileAnalysis, handleURLAnalysis, handleMultiInputAnalysis, uploadMiddleware } from "./routes/enhanced-sentiment";
import { handleGeminiTest } from "./routes/test-gemini";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Sentiment analysis routes
  app.post("/api/sentiment/analyze", handleSentimentAnalysis);
  app.post("/api/sentiment/batch", handleBatchAnalysis);
  app.post("/api/sentiment/translate", handleTranslation);

  // Enhanced sentiment analysis routes with file support
  app.post("/api/sentiment/file", uploadMiddleware, handleFileAnalysis);
  app.post("/api/sentiment/url", handleURLAnalysis);
  app.post("/api/sentiment/multi", uploadMiddleware, handleMultiInputAnalysis);

  // Test routes
  app.get("/api/test/gemini", handleGeminiTest);

  return app;
}
