import mongoose from "mongoose"

const questionModel = new mongoose.Schema({
  configId: { type: mongoose.Schema.Types.ObjectId, ref: 'interview' },
  questionText: String,
  answerType: { type: String, enum: ['text', 'mcq'], default: 'text' },
  correctAnswer: String, // optional if AI evaluates
  options: [{ type: String, default: "" }], // optional if AI evaluates
  userAnswer: String,
  score: Number, // optional if evaluated
}
  , { timestamps: true })

const questionSchema = mongoose.model("question", questionModel)

export default questionSchema