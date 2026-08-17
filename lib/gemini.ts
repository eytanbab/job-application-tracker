import { GoogleGenAI } from "@google/genai";

// Client for job posting scraping and application extraction
export const geminiExtractionClient = new GoogleGenAI({
  apiKey:
    process.env.GEMINI_EXTRACTION_API_KEY || process.env.GEMINI_API_KEY,
});

// Client for ATS Resume Compatibility and bullet point optimization
export const geminiAtsClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_ATS_API_KEY || process.env.GEMINI_API_KEY,
});

// Default client alias for backward compatibility
export const geminiClient = geminiExtractionClient;
