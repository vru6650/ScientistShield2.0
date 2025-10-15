// api/index.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import postRoutes from './routes/post.route.js';
import commentRoutes from './routes/comment.route.js';
import tutorialRoutes from './routes/tutorial.route.js';
import quizRoutes from './routes/quiz.route.js';
import codeSnippetRoutes from './routes/codeSnippet.route.js';
import cppRoutes from './routes/cpp.route.js';
import pythonRoutes from './routes/python.route.js';
import javascriptRoutes from './routes/javascript.route.js';
import javaRoutes from './routes/java.route.js';
import csharpRoutes from './routes/csharp.route.js';
import pageRoutes from './routes/page.route.js';
import problemRoutes from './routes/problem.route.js';
import searchRoutes from './routes/search.route.js';
import fileManagerRoutes from './routes/fileManager.route.js';

import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
import { setupVisualizerSocket } from './services/visualizerSocket.js';

dotenv.config();

// Provide sensible defaults for optional environment variables so the
// development server can start without a custom .env file. Only the JWT
// secret is required for authentication to work correctly.
let {
    MONGO_URI = 'mongodb://0.0.0.0:27017/myappp',
    CORS_ORIGIN = 'http://localhost:5173',
    PORT = '3000',
    JWT_SECRET,
} = process.env;

if (!JWT_SECRET) {
    console.warn(
        'JWT_SECRET is not set. Falling back to a non-secure default. Set JWT_SECRET in production environments.'
    );
    JWT_SECRET = 'viren';
}

process.env.MONGO_URI = MONGO_URI;
process.env.CORS_ORIGIN = CORS_ORIGIN;
process.env.PORT = PORT;
process.env.JWT_SECRET = JWT_SECRET;

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('db');
    })
    .catch((err) => {
        console.log(err);
    });

const __dirname = path.resolve();

const app = express();

const server = http.createServer(app);

app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

setupVisualizerSocket(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}!`);
});

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/tutorial', tutorialRoutes);
app.use('/api/code-snippet', codeSnippetRoutes);
app.use('/api', quizRoutes);
app.use('/api', problemRoutes);
app.use('/api/code', cppRoutes); // NEW: Use the new C++ route
app.use('/api/code', pythonRoutes); // NEW: Use the new Python route
app.use('/api/code', javascriptRoutes);
app.use('/api/code', javaRoutes);
app.use('/api/code', csharpRoutes);
app.use('/api', pageRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/files', fileManagerRoutes);

app.use(express.static(path.join(__dirname, '/client/dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

app.use((err, req, res, next) => {
    // ==========================================================
    // UPDATED: Log the full stack trace to the server console
    // ==========================================================
    console.error('SERVER ERROR:', err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
});
