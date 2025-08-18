import { RequestHandler } from "express";
import { generateSummaryInsight } from "../utils/gemini-ai";

export const handleGeminiTest: RequestHandler = async (req, res) => {
  try {
    console.log('Testing Gemini API...');
    
    const testSummary = await generateSummaryInsight(
      "This is a test message to verify the AI is working properly.",
      "English",
      "POSITIVE",
      0.85
    );
    
    res.json({
      success: true,
      message: "Gemini API test completed",
      summary: testSummary,
      hasApiKey: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY?.length || 0
    });
  } catch (error) {
    console.error('Gemini test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY?.length || 0
    });
  }
};
