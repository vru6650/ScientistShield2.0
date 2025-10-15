import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler } from '../utils/error.js';

const __dirname = path.resolve();
const TEMP_DIR = path.join(__dirname, 'temp');

const execFileAsync = promisify(execFile);

const runExecFile = (...args) => execFileAsync(...args);

export const createRunJavaCode = ({ execFile: exec = runExecFile } = {}) => {
    return async (req, res, next) => {
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

            await exec('javac', [fileName], {
                cwd: workDir,
                timeout: 7000,
            });

            const { stdout } = await exec('java', [className], {
                cwd: workDir,
                timeout: 7000,
            });

            res.status(200).json({ output: stdout, error: false });
        } catch (err) {
            let output;
            if (err?.code === 'ENOENT') {
                output = 'Java runtime or compiler is not available. Please install a JDK to run Java code.';
            } else {
                output = err?.stderr || err?.stdout || err?.message || String(err);
            }
            res.status(200).json({ output, error: true });
        } finally {
            try {
                await fs.promises.rm(workDir, { recursive: true, force: true });
            } catch (cleanupError) {
                // Ignore cleanup errors
            }
        }
    };
};

export const runJavaCode = createRunJavaCode();