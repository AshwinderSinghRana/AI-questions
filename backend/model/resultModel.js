// import mongoose from "mongoose"

// // const resultModel = new mongoose.Schema({


// //   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
// //   configId: { type: mongoose.Schema.Types.ObjectId, ref: 'interview' },
// //   questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'question' }],
// //   totalScore: Number,
// //   feedback: {
// //     technicalAccuracy: String,
// //     communication: String,
// //     improvementAreas: [String],
// //     recommendation: String,
// //     totalScore: Number,
// //     rawFeedback: { type: String, default:"" } // Optional field
// //   }
// // }, { timestamps: true });

// const resultModel = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
//   configId: { type: mongoose.Schema.Types.ObjectId, ref: 'interview' },
//   questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'question' }],
//   responses: [{
//     questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'question' },
//     userAnswer: String,
//     isCorrect: Boolean,
//     score: Number
//   }],
//   totalScore: Number,
//   maxPossibleScore: Number,
//   feedback: {
//     technicalAccuracy: String,
//     communication: String,
//     improvementAreas: [String],
//     recommendation: String,
//     totalScore: Number,
//     rawFeedback: { type: String, default: "" }
//   }
// }, { timestamps: true });


// const resultSchema = mongoose.model("result", resultModel)

// export default resultSchema



import mongoose from 'mongoose';

const resultModel = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', index: true },
  configId: { type: mongoose.Schema.Types.ObjectId, ref: 'interview', index: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'question' }],
  responses: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'question' },
    userAnswer: String,
    isCorrect: Boolean,
    score: Number
  }],
  totalScore: Number,
  maxPossibleScore: Number,
  feedback: {
    technicalAccuracy: String,
    communication: String,
    improvementAreas: [String],
    recommendation: String,
    totalScore: Number,
    maxPossibleScore: Number,
    rawFeedback: { type: String, default: "" }
  }
}, { timestamps: true });

const resultSchema = mongoose.model("result", resultModel);
export default resultSchema;