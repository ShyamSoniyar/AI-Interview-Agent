import express from 'express';
import isAuth from '../middlewares/isAuth.js';
import { upload } from '../middlewares/multer.js';
import { analyzeResume, finishInterview, generateQuestions, getInterviewReport, getMyInterviews, submitAnswer } from '../controllers/interview.controller.js';
import { aiLimiter } from '../middlewares/rateLimit.js';

const interviewRouter = express.Router();

// aiLimiter sits after isAuth so it can key on req.userId
interviewRouter.post("/resume", isAuth, aiLimiter, upload.single("resume"), analyzeResume);
interviewRouter.post("/generate-questions", isAuth, aiLimiter, generateQuestions);
interviewRouter.post("/submit-answer", isAuth, aiLimiter, submitAnswer);
interviewRouter.post("/finish", isAuth, finishInterview);

interviewRouter.get("/get-interview", isAuth, getMyInterviews);
interviewRouter.get("/report/:id", isAuth, getInterviewReport);

export default interviewRouter