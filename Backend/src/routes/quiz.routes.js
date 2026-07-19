import { Router } from 'express';
import { generateQuiz, saveQuiz , getLeaderBoard , getMyScore } from '../controllers/quiz.controller.js';
import { verifyJWT } from '../middlewares/verifyJWT.middleware.js';

const router = Router();

router.route('/generate').post(verifyJWT,generateQuiz);

router.route('/save-quiz').post(verifyJWT,saveQuiz);
router.route('/leaderboard/:quizId').get(verifyJWT , getLeaderBoard);
router.route('/myScore/:quizId').get(verifyJWT , getMyScore);
export default router;