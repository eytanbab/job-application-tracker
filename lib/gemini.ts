import { GoogleGenAI } from '@google/genai';

export const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
