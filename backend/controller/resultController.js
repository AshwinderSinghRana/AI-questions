import questionSchema from "../model/questionModel.js";
import resultSchema from "../model/resultModel.js";
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const CURRENT_MODEL = 'gemini-1.5-flash';

export const submitInterview = async (req, res) => {
  try {
    const { configId, answers, jobRole = 'Developer', level = 'Junior', type = 'Technical' } = req.body;

    let totalScore = 0;
    const questionDocs = [];
    const questionsText = [];
    const answersText = [];

    for (const ans of answers) {
      const question = await questionSchema.findById(ans.questionId);
      if (!question) continue;

      question.userAnswer = ans.userAnswer;
      question.score = Math.floor(Math.random() * 10) + 1; // Placeholder scoring
      await question.save();

      totalScore += question.score;
      questionDocs.push(question._id);
      questionsText.push(question.text); // Assuming question.text is the question string
      answersText.push(ans.userAnswer || "No answer");
    }

    // Generate AI feedback
    const prompt = `Provide detailed interview feedback for a ${level} ${jobRole} candidate (${type} interview):\n\n${
      questionsText.map((q, i) => `Q: ${q}\nA: ${answersText[i]}`).join('\n\n')
    }\n\nEvaluate:\n1. Technical accuracy\n2. Communication\n3. Improvement areas\n4. Recommendation.\n\nReturn result in JSON:\n{\n  "technicalAccuracy": "",\n  "communication": "",\n  "improvementAreas": "",\n  "recommendation": ""\n}`;

    const model = genAI.getGenerativeModel({ 
      model: CURRENT_MODEL,
      generationConfig: { maxOutputTokens: 1000 }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const feedbackRaw = response.text();

    let feedback = `Your performance score is ${totalScore}. Keep practicing!`;
    try {
      const parsed = JSON.parse(feedbackRaw);
      feedback = `
Technical Accuracy: ${parsed.technicalAccuracy}
Communication: ${parsed.communication}
Improvement Areas: ${parsed.improvementAreas}
Recommendation: ${parsed.recommendation}
      `.trim();
    } catch (err) {
      console.warn('Feedback JSON parse failed, using raw text.');
      feedback = feedbackRaw;
    }

    // Save result to DB
    const newResult = new resultSchema({
      userId: req.user._id,
      configId,
      questions: questionDocs,
      totalScore,
      feedback
    });

    const savedResult = await newResult.save();

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Interview result submitted successfully",
      body: savedResult
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      status: 500,
      message: 'Error submitting interview result',
      body: null
    });
  }
};
