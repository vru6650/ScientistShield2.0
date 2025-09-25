import express from 'express';
import { runCppCode } from '../controllers/cpp.controller.js';

const router = express.Router();

router.post('/run-cpp', runCppCode);

export default router;