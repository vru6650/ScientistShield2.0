import express from 'express';
import { runJavascriptCode } from '../controllers/javascript.controller.js';

const router = express.Router();

router.post('/run-js', runJavascriptCode);

export default router;