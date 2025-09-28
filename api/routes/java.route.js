import express from 'express';
import { runJavaCode } from '../controllers/java.controller.js';

const router = express.Router();

router.post('/run-java', runJavaCode);

export default router;