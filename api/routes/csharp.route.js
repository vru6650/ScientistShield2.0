import express from 'express';
import { runCSharpCode } from '../controllers/csharp.controller.js';

const router = express.Router();

router.post('/run-csharp', runCSharpCode);

export default router;