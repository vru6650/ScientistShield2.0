// api/routes/quiz.route.js
import express from 'express';
import { verifyToken } from '../utils/verifyUser.js'; // Ensure path is correct
import {
    createQuiz,
    getQuizzes,
    getSingleQuizById,
    getSingleQuizBySlug,
    updateQuiz,
    deleteQuiz,
    submitQuiz,
} from '../controllers/quiz.controller.js';

const router = express.Router();

// -- RESTful API Routes for Quizzes --

// CREATE a new quiz (Admin-only)
router.post('/quizzes', verifyToken, createQuiz);

// GET all quizzes (Public)
router.get('/quizzes', getQuizzes);

// GET a single quiz by ID (Public)
router.get('/quizzes/:quizId', getSingleQuizById);

// GET a single quiz by slug (Public)
router.get('/quizzes/slug/:quizSlug', getSingleQuizBySlug);

// UPDATE a quiz (Admin-only)
router.put('/quizzes/:quizId/:userId', verifyToken, updateQuiz);

// DELETE a quiz (Admin-only)
router.delete('/quizzes/:quizId/:userId', verifyToken, deleteQuiz);

// SUBMIT quiz answers (User-only)
router.post('/quizzes/submit/:quizId', verifyToken, submitQuiz);

export default router;