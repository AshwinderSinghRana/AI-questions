


// controller/generateFeedback.js
import questionModel from "../model/questionModel.js";
import resultModel from "../model/resultModel.js";
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const CURRENT_MODEL = 'gemini-1.5-flash';

export const generateFeedback = async (req, res) => {
  try {
    const { configId, responses } = req.body;
    const userId = req.user._id;

    if (!configId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        body: null
      });
    }

    const questionIds = responses.map(r => r.questionId);
    const questionDocs = await questionModel.find({ _id: { $in: questionIds } });

    if (questionDocs.length !== responses.length) {
      return res.status(400).json({
        success: false,
        message: 'Mismatch between questions and responses',
        body: null
      });
    }

    // let totalScore = 0;
    // const scoredResponses = responses.map(response => {
    //   const question = questionDocs.find(q => q._id.equals(response.questionId));
    //   console.log(question,"question")
    //   const isCorrect = String(question.correctAnswer).trim().toLowerCase() === String(response.answer).trim().toLowerCase();
    //   console.log(isCorrect,"isCorrect")
    //   console.log(String(question.correctAnswer).trim().toLowerCase(),"String(question.correctAnswer).trim().toLowerCase()")
    //   console.log(String(response.answer).trim().toLowerCase(),"String(response.answer).trim().toLowerCase()")
    //   const score = isCorrect ? 1 : 0;
    //   totalScore += score;
    //   console.warn('Question not found for response:', response);

    //   return {
    //     ...response,
    //     isCorrect,
    //     score
    //   };
    // });

    let totalScore = 0;

    const scoredResponses = responses.map(response => {
      const question = questionDocs.find(q => q._id.equals(response.questionId));

      if (!question) {
        return {
          ...response,
          isCorrect: false,
          score: 0
        };
      }

      // Extract user selected option label (e.g., 'B')
      const matchedOption = question.options.find(opt =>
        opt.trim().toLowerCase() === String(response.answer).trim().toLowerCase()
      );

      const userAnswerLabel = matchedOption ? matchedOption.trim()[0].toUpperCase() : null;
      const correctAnswerLabel = question.correctAnswer.toUpperCase();

      const isCorrect = userAnswerLabel === correctAnswerLabel;
      const score = isCorrect ? 1 : 0;
      totalScore += score;

     

      return {
        ...response,
        isCorrect,
        score
      };
    });



    // Generate AI feedback
    const feedbackPrompt = `
Analyze the following multiple-choice technical interview. For each question, the user selected an answer (no free-text explanation was provided).

Provide structured feedback in JSON format:
- technicalAccuracy: Evaluation of correctness (1–10), based on right/wrong answers
- communication: Inferred clarity from consistency and alignment of answers (1–10)
- improvementAreas: Areas the user should focus on
- recommendation: Brief recommendation for further improvement

Questions and answers:
${questionDocs.map((q, i) => {
  const userAnswer = responses[i].answer;
  const correctFull = q.options.find(opt => opt.startsWith(q.correctAnswer));
  return `
Question: ${q.questionText}
Options:
${q.options.map(opt => `- ${opt}`).join('\n')}
Correct Answer: ${correctFull}
User Answer: ${userAnswer}
${scoredResponses[i].isCorrect ? '✅ Correct' : '❌ Incorrect'}`.trim();
}).join('\n\n')}

Provide feedback in this exact JSON format:
{
  "technicalAccuracy": number,
  "communication": number,
  "improvementAreas": string[],
  "recommendation": string
}
`;

    const model = genAI.getGenerativeModel({ model: CURRENT_MODEL });
    const result = await model.generateContent(feedbackPrompt);
    let feedbackRaw = result.response.text().trim();

    let feedbackObj;
    try {
      feedbackRaw = feedbackRaw.replace(/```json|```/g, '').trim();
      feedbackObj = JSON.parse(feedbackRaw);

      feedbackObj.technicalAccuracy = Number(feedbackObj.technicalAccuracy);
      feedbackObj.communication = Number(feedbackObj.communication);

      if (!Array.isArray(feedbackObj.improvementAreas)) {
        if (typeof feedbackObj.improvementAreas === 'string') {
          feedbackObj.improvementAreas = feedbackObj.improvementAreas
            .split('\n')
            .map(item => item.trim())
            .filter(Boolean);
        } else {
          feedbackObj.improvementAreas = [];
        }
      }

      if (typeof feedbackObj.recommendation !== 'string') {
        feedbackObj.recommendation = '';
      }

      const requiredFields = ['technicalAccuracy', 'communication', 'improvementAreas', 'recommendation'];
      for (const field of requiredFields) {
        if (!(field in feedbackObj)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      feedbackObj.totalScore = totalScore;
      feedbackObj.maxPossibleScore = questionDocs.length;

    } catch (err) {
      console.warn('Feedback parsing error:', err);
      feedbackObj = {
        technicalAccuracy: 5,
        communication: 5,
        improvementAreas: ['Parsing failed - please review manually'],
        recommendation: 'Unable to generate recommendation',
        totalScore,
        maxPossibleScore: questionDocs.length,
        rawFeedback: feedbackRaw
      };
    }

    const newResult = new resultModel({
      userId,
      configId,
      questions: questionDocs.map(q => q._id),
      responses: scoredResponses,
      totalScore,
      maxPossibleScore: questionDocs.length,
      feedback: feedbackObj
    });

    const savedResult = await newResult.save();

    return res.status(200).json({
      success: true,
      message: "Interview result submitted successfully",
      body: savedResult
    });

  } catch (err) {
    console.error('Error in generateFeedback:', err);
    res.status(500).json({
      success: false,
      message: 'Error submitting interview result',
      body: null
    });
  }
};


export const getFeedback=async(req,res)=>{
try {
  const dataaa=await resultModel.find({userId:req.user._id})
  return  res.json({
      success: true,
      message: 'Here is all data',
      body: dataaa
    });
} catch (error) {
  console.log(error)
}
}