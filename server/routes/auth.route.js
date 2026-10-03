import express from 'express';
import { googleAuth, logout } from '../controllers/auth.controller.js';
import { authLimiter } from '../middlewares/rateLimit.js';

const authRouter = express.Router();

authRouter.post('/google', authLimiter, googleAuth);

authRouter.get('/logout', logout);

export default authRouter;
