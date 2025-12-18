import mongoose from "mongoose"

const interviewModel = new mongoose.Schema({
  
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Pro'], default:"" },
  type: { type: String, enum: ['Technical', 'FaceToFace', 'Both'], default:"" },
  jobRole: { type: String, default:"" }, // e.g., MERN Stack, Python

}, { timestamps: true })

const intSchema = mongoose.model("interview", interviewModel)

export default intSchema