import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler } from '../utils/error.js';

const __dirname = path.resolve();
const TEMP_DIR = path.join(__dirname, 'temp');

const execFileAsync = promisify(execFile);

export const runJavaCode = async (req, res, next) => {
    const { code } = req.body ?? {};

    if (!code || typeof code !== 'string') {
        return next(errorHandler(400, 'Java code is required.'));
    }

    const uniqueId = uuidv4();
    const workDir = path.join(TEMP_DIR, uniqueId);
    const fileName = 'Main.java';
    const className = 'Main';

    try {
        await fs.promises.mkdir(workDir, { recursive: true });
        const filePath = path.join(workDir, fileName);
        await fs.promises.writeFile(filePath, code);

        await execFileAsync('javac', [fileName], {
            cwd: workDir,
            timeout: 7000,
        });

        const { stdout } = await execFileAsync('java', [className], {
            cwd: workDir,
            timeout: 7000,
        });

        res.status(200).json({ output: stdout, error: false });
    } catch (err) {
        const output = err?.stderr || err?.stdout || err?.message || String(err);
        res.status(200).json({ output, error: true });
    } finally {
        try {
            await fs.promises.rm(workDir, { recursive: true, force: true });
        } catch (cleanupError) {
            // Ignore cleanup errors
        }
    }
};
