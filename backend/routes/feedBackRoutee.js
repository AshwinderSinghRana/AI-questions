import express from 'express';
import { generateFeedback, getFeedback } from '../controller/feedBackController.js';
import { middleware } from '../utilis/middleware.js';

const feedBackRoutee = express.Router();

feedBackRoutee.post('/feedback',middleware, generateFeedback);
feedBackRoutee.get('/getFeedback',middleware, getFeedback);

export default feedBackRoutee;
