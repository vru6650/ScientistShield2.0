import express from 'express';
import { runPythonCode } from '../controllers/python.controller.js';

const router = express.Router();

router.post('/run-python', runPythonCode);

export default router;
