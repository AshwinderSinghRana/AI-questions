import express from "express"
import { middleware } from "../utilis/middleware.js"
import { submitInterview } from "../controller/resultController.js"


const resultRoutee = express.Router()

resultRoutee.post("/submitInterview",middleware, submitInterview)



export default resultRoutee