import express from "express"
import { createInterviewConfig } from "../controller/interviewController.js"
import { middleware } from "../utilis/middleware.js"


const intRouter = express.Router()

intRouter.post("/createInterviewConfig",middleware, createInterviewConfig)



export default intRouter