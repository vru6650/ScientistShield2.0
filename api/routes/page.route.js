import express from 'express';
import {
    createPage,
    deletePage,
    getPageById,
    getPages,
    getPublishedPageBySlug,
    updatePage,
} from '../controllers/page.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/pages', verifyToken, createPage);
router.get('/pages', verifyToken, getPages);
router.get('/pages/:pageId', verifyToken, getPageById);
router.patch('/pages/:pageId', verifyToken, updatePage);
router.delete('/pages/:pageId', verifyToken, deletePage);

router.get('/content/:slug', getPublishedPageBySlug);

export default router;
