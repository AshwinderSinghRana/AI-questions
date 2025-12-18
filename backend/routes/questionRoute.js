import express from "express"
import { middleware } from "../utilis/middleware.js"
import { generateQuestions } from "../controller/questionController.js"


const questionRoutee = express.Router()

questionRoutee.post("/generateQuestions",middleware, generateQuestions)



export default questionRoutee