import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
// --- NEW --- Make sure to import clapPost from your controller
import {
    create,
    deletepost,
    getposts,
    updatepost,
    clapPost,
    bookmarkPost,
} from '../controllers/post.controller.js';

const router = express.Router();

router.post('/create', verifyToken, create);
router.get('/getposts', getposts);
router.delete('/deletepost/:postId/:userId', verifyToken, deletepost);
router.put('/updatepost/:postId/:userId', verifyToken, updatepost);

// --- NEW --- This is the new route for handling claps.
// It uses a PUT method because a clap "updates" the post's clap count.
// It is protected by verifyToken to ensure only logged-in users can clap.
router.put('/clap/:postId', verifyToken, clapPost);
// ... other routes
router.put('/:postId/bookmark', verifyToken, bookmarkPost);

export default router;
