// In api/controllers/javascript.controller.js

import { spawn } from 'child_process';
import { errorHandler } from '../utils/error.js';

export const runJavascriptCode = async (req, res, next) => {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
        return next(errorHandler(400, 'JavaScript code is required.'));
    }

    // Use spawn for a more secure and robust execution
    const child = spawn('node', ['-e', code]);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
        stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    child.on('close', (code) => {
        if (code !== 0 || stderr) {
            // If the process exits with a non-zero code or there's an error message
            return next(errorHandler(400, stderr || `Execution failed with exit code ${code}`));
        }
        // Success
        res.status(200).json({ output: stdout });
    });

    child.on('error', (err) => {
        // This catches errors in spawning the process itself
        return next(errorHandler(500, `Failed to start process: ${err.message}`));
    });
};