
import intSchema from "../model/interviewSchema.js";
import questionSchema from "../model/questionModel.js";
import { getGeminiQuestions } from "../utilis/gemini.js";



import mongoose from "mongoose"

import { setTimeout } from 'timers/promises';

// Rate limiting control
let lastGenerationTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between generations

export const generateQuestions = async (req, res) => {
  try {
    // Rate limiting
    const now = Date.now();
    if (now - lastGenerationTime < MIN_REQUEST_INTERVAL) {
      await setTimeout(MIN_REQUEST_INTERVAL - (now - lastGenerationTime));
    }
    lastGenerationTime = Date.now();

    const { configId } = req.body;
    if (!configId || !mongoose.Types.ObjectId.isValid(configId)) {
      return res.status(400).json({ error: "Invalid config ID" });
    }

    const config = await intSchema.findById(configId);
    if (!config) {
      return res.status(404).json({ error: "Interview configuration not found" });
    }

    // Enhanced prompt with examples
    const prompt = `Generate exactly 5 multiple-choice questions for a ${config.level} level ${config.jobRole} interview in Python.

For each question, strictly follow this format:
---
Question: What is the purpose of the __name__ variable in a Python module?
Options:
A) It defines the version of the module
B) It holds the module's docstring
C) It specifies the file name of the script
D) It allows the module to determine if it is being run directly or imported
Correct Answer: D
---

Instructions:
1. Provide exactly 5 MCQs.
2. Each question must have **4 complete options** labeled A) B) C) D).
3. Each option must contain a **full descriptive sentence**, not just a single letter.
4. The correct answer must be a **single letter (A/B/C/D)**.
5. Do NOT skip any questions or answers.`;


    let aiResponse;
    try {
      aiResponse = await getGeminiQuestions(prompt);
    } catch (err) {
      console.error("API Error:", err);
      return await handleFallbackGeneration(config, res);
    }

    const questions = [];
    const blocks = aiResponse.split('---')
      .map(block => block.trim())
      .filter(block => block.length > 0);

    

    for (const block of blocks) {
      try {
        const lines = block.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        const questionLine = lines.find(line => line.startsWith('Question:'));
        const optionsLines = lines.filter(line => /^[A-D]\)/.test(line));
        const answerLine = lines.find(line => line.startsWith('Correct Answer:'));
        if (!questionLine || optionsLines.length !== 4 || !answerLine) {
          continue;
        }

        questions.push({
          configId,
          questionText: questionLine.replace('Question:', '').trim(),
          // Keep the full option text including the letter
          options: optionsLines.map(line => line.trim()),
          correctAnswer: answerLine.replace('Correct Answer:', '').trim(),
          answerType: 'mcq'
        });

      } catch (parseErr) {
        console.warn("Error parsing question block:", parseErr);
      }
    }

    // Final validation
    if (questions.length < 3) { // Allow some failures but require minimum
      return await handleFallbackGeneration(config, res);
    }

    const savedQuestions = await questionSchema.insertMany(questions);

    return res.json({
      success: true,
      status: 200,  // Add consistent status
      message: "Questions generated successfully",
      body: savedQuestions  // Change 'data' to 'body'
    });


  } catch (err) {
    console.error("Generation Error:", err);
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Invalid config ID",
      body: null
    });
  }
};

// Fallback generation handler
async function handleFallbackGeneration(config, res) {
  try {
    const fallbackQuestions = await generateLocalQuestions(config);
    return res.json({
      success: true,
      data: fallbackQuestions,
      warning: "Used fallback question bank"
    });
  } catch (fallbackErr) {
    console.error("Fallback failed:", fallbackErr);
    return res.status(503).json({
      error: "Service unavailable. Please try again later."
    });
  }
}

// Local question generator
async function generateLocalQuestions(config) {
  const localQuestions = [
    // Your local question bank here
    {
      questionText: "What is the purpose of React components?",
      options: [
        "To handle server-side rendering",
        "To create reusable UI elements",
        "To manage database connections",
        "To handle user authentication"
      ],
      correctAnswer: "B",
      answerType: "mcq"
    },
    // Add more questions...
  ].slice(0, 5); // Return first 5 questions

  return await questionSchema.insertMany(
    localQuestions.map(q => ({
      ...q,
      configId: config._id
    }))
  );
}