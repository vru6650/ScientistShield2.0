// api/controllers/python.controller.js
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler } from '../utils/error.js';

const __dirname = path.resolve();
const TEMP_DIR = path.join(__dirname, 'temp');

const execFileAsync = promisify(execFile);

const getPythonCommand = async () => {
    try {
        await execFileAsync('python3', ['--version']);
        return 'python3';
    } catch {
        try {
            await execFileAsync('python', ['--version']);
            return 'python';
        } catch {
            return null;
        }
    }
};

export const runPythonCode = async (req, res, next) => {
    const { code } = req.body;
    if (!code) {
        return next(errorHandler(400, 'Python code is required.'));
    }

    await fs.promises.mkdir(TEMP_DIR, { recursive: true });

    const pythonCommand = await getPythonCommand();
    if (!pythonCommand) {
        return next(errorHandler(500, 'Python executable not found on the server.'));
    }

    const uniqueId = uuidv4();
    const filePath = path.join(TEMP_DIR, `${uniqueId}.py`);

    try {
        await fs.promises.writeFile(filePath, code);

        const { stdout } = await execFileAsync(pythonCommand, [filePath], {
            timeout: 5000,
        });

        res.status(200).json({ output: stdout, error: false });
    } catch (err) {
        const output = err?.stderr || err?.message || String(err);
        res.status(200).json({ output, error: true });
    } finally {
        try {
            await fs.promises.unlink(filePath);
        } catch (e) {
            // Ignore cleanup errors
        }
    }
};
