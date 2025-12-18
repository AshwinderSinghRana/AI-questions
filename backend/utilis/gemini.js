import { GoogleGenerativeAI } from '@google/generative-ai';
import { setTimeout } from 'timers/promises';
import dotenv from 'dotenv';

dotenv.config();

// Initialize with API key validation
if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing Gemini API key in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rate limiting control
let lastRequestTime = 0;
const REQUEST_DELAY = 1500; // 1.5 seconds between requests

export const getGeminiQuestions = async (prompt) => {
  try {
    // Enforce rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < REQUEST_DELAY) {
      await setTimeout(REQUEST_DELAY - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    // Try models in order of preference with fallback
    const modelsToTry = [
      'gemini-1.5-flash-latest', // Newest and most efficient
      'gemini-1.5-pro-latest',
      'gemini-pro'
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          // model: 'gemini-1.5-pro' ,
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7, // Slightly more focused than 0.9
          },
        });

        const result = await model.generateContent({
          contents: [{
            parts: [{ text: prompt }]
          }]
        });

        const response = await result.response;
        return response.text();

      } catch (err) {
        lastError = err;
        console.warn(`Attempt with model ${modelName} failed:`, err.message);
        
        // If rate limited, wait before trying next model
        if (err.status === 429) {
          const retryDelay = err.errorDetails?.[2]?.retryDelay || '30s';
          const delayMs = parseInt(retryDelay) * 1000;
          console.log(`Rate limited. Waiting ${retryDelay} before next attempt...`);
          await setTimeout(delayMs);
        }
      }
    }

    throw lastError || new Error('All model attempts failed');

  } catch (err) {
    console.error('Final Gemini API Error:', err);
    
    // More specific error messages
    if (err.status === 429) {
      throw new Error('API quota exceeded. Please wait or upgrade your plan.');
    } else if (err.message.includes('404')) {
      throw new Error('Model not available. Please check your model name.');
    } else {
      throw new Error('Failed to generate content. Please check your API configuration.');
    }
  }
};