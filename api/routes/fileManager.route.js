import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import FileNode from '../models/fileNode.model.js';
import {
    FILE_UPLOAD_LIMIT_BYTES,
    ensureStorageReady,
    getTmpDir,
} from '../utils/fileManagerUtils.js';
import {
    createFolder,
    deleteNode,
    downloadFile,
    getFolderTree,
    handleFileUpload,
    listDirectory,
    updateNode,
} from '../controllers/fileManager.controller.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            await ensureStorageReady();
            cb(null, getTmpDir());
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname || '');
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: FILE_UPLOAD_LIMIT_BYTES,
    },
});

const resolveUploadParent = async (req, res, next) => {
    try {
        const { parentId } = req.body ?? {};
        if (!parentId) {
            req.uploadParent = null;
            return next();
        }

        const parent = await FileNode.findById(parentId);
        if (!parent || parent.type !== 'folder') {
            if (req.file?.path) {
                await fs.unlink(req.file.path);
            }
            return res.status(400).json({ message: 'Target folder not found' });
        }
        req.uploadParent = parent;
        return next();
    } catch (error) {
        return next(error);
    }
};

router.get('/', listDirectory);
router.get('/tree', getFolderTree);
router.post('/folder', createFolder);
router.post('/upload', upload.single('file'), resolveUploadParent, handleFileUpload);
router.patch('/:id', updateNode);
router.delete('/:id', deleteNode);
router.get('/:id/download', downloadFile);

export default router;
