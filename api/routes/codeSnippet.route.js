import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { createCodeSnippet, getCodeSnippet } from '../controllers/codeSnippet.controller.js';

const router = express.Router();

router.post('/create', verifyToken, createCodeSnippet);
router.get('/:snippetId', getCodeSnippet);

export default router;