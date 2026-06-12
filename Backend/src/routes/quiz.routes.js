import { Router } from 'express';
import { generateQuiz, saveQuiz } from '../controllers/quiz.controller';
import { verifyJWT } from '../middlewares/verifyJWT.middleware';

const router = Router();

router.route('/generate',verifyJWT,generateQuiz);

router.route('/save-quiz',verifyJWT,saveQuiz);

export default router;