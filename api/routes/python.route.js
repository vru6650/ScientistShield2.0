import express from 'express';
import { runPythonCode, visualizeCode } from '../controllers/python.controller.js';

const router = express.Router();

router.post('/run-python', runPythonCode);
router.post('/visualize-python', visualizeCode);
router.post('/visualize', visualizeCode);

export default router;