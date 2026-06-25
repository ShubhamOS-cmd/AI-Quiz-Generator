import { Router } from 'express';
import { generateQuiz, saveQuiz } from '../controllers/quiz.controller.js';
import { verifyJWT } from '../middlewares/verifyJWT.middleware.js';

const router = Router();

router.route('/generate',verifyJWT,generateQuiz);

router.route('/save-quiz',verifyJWT,saveQuiz);

export default router;