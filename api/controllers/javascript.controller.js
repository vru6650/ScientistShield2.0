import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler } from '../utils/error.js';

const __dirname = path.resolve();
const TEMP_DIR = path.join(__dirname, 'temp');

const execFileAsync = promisify(execFile);

export const runJavascriptCode = async (req, res, next) => {
    const { code } = req?.body ?? {};

    if (typeof code !== 'string' || code.length === 0) {
        return next(errorHandler(400, 'JavaScript code is required.'));
    }

    await fs.promises.mkdir(TEMP_DIR, { recursive: true });

    const uniqueId = uuidv4();
    const filePath = path.join(TEMP_DIR, `${uniqueId}.mjs`);

    try {
        await fs.promises.writeFile(filePath, code);

        const { stdout } = await execFileAsync('node', ['--no-warnings', filePath], {
            timeout: 5000,
            encoding: 'utf8',
        });

        res.status(200).json({ output: stdout, error: false });
    } catch (err) {
        const rawOutput = err?.stderr || err?.stdout || err?.message || String(err);
        const output = Buffer.isBuffer(rawOutput) ? rawOutput.toString('utf8') : rawOutput;
        res.status(200).json({ output, error: true });
    } finally {
        try {
            await fs.promises.unlink(filePath);
        } catch (cleanupError) {
            // Ignore cleanup errors
        }
    }
};
