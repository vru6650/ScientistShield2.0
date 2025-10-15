import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import {
    createProblem,
    getProblems,
    getProblemBySlug,
    getProblemById,
    updateProblem,
    deleteProblem,
} from '../controllers/problem.controller.js';

const router = express.Router();

router.post('/problems', verifyToken, createProblem);
router.get('/problems', getProblems);
router.get('/problems/slug/:problemSlug', getProblemBySlug);
router.get('/problems/:problemId([a-fA-F0-9]{24})', verifyToken, getProblemById);
router.put('/problems/:problemId/:userId', verifyToken, updateProblem);
router.delete('/problems/:problemId/:userId', verifyToken, deleteProblem);

export default router;
