import express from 'express';
import { globalSearch, reindexSearchContent } from '../controllers/search.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/', globalSearch);
router.post('/reindex', verifyToken, reindexSearchContent);

export default router;
