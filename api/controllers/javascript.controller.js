// In api/controllers/javascript.controller.js

import { spawn } from 'child_process';
import { errorHandler } from '../utils/error.js';

export const runJavascriptCode = async (req, res, next) => {
    const { code } = req.body ?? {};

    if (!code || typeof code !== 'string') {
        return next(errorHandler(400, 'JavaScript code is required.'));
    }

    // Use spawn for a more secure and robust execution
    const child = spawn('node', ['-e', code]);

    let stdout = '';
    let stderr = '';

    return new Promise((resolve) => {
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (exitCode) => {
            if (exitCode !== 0 || stderr) {
                next(errorHandler(400, stderr || `Execution failed with exit code ${exitCode}`));
                return resolve();
            }

            res.status(200).json({ output: stdout, error: false });
            resolve();
        });

        child.on('error', (err) => {
            next(errorHandler(500, `Failed to start process: ${err.message}`));
            resolve();
        });
    });
};