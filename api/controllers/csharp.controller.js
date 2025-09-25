// api/controllers/csharp.controller.js
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler } from '../utils/error.js';

const execFileAsync = promisify(execFile);
const __dirname = path.resolve();
const TEMP_DIR = path.join(__dirname, 'temp');

const runnerCandidates = [
    {
        name: 'dotnet-script',
        async detect() {
            await execFileAsync('dotnet-script', ['--version']);
            return {
                command: 'dotnet-script',
                buildArgs: (filePath) => [filePath],
                extension: '.csx',
            };
        },
    },
    {
        name: 'dotnet-script (via dotnet CLI)',
        async detect() {
            await execFileAsync('dotnet', ['script', '--version']);
            return {
                command: 'dotnet',
                buildArgs: (filePath) => ['script', filePath],
                extension: '.csx',
            };
        },
    },
    {
        name: 'csi',
        async detect() {
            await execFileAsync('csi', ['-help']);
            return {
                command: 'csi',
                buildArgs: (filePath) => [filePath],
                extension: '.csx',
            };
        },
    },
    {
        name: 'scriptcs',
        async detect() {
            await execFileAsync('scriptcs', ['-help']);
            return {
                command: 'scriptcs',
                buildArgs: (filePath) => [filePath],
                extension: '.csx',
            };
        },
    },
];

let cachedRunner = null;

const findCSharpRunner = async () => {
    if (cachedRunner) {
        return cachedRunner;
    }

    for (const candidate of runnerCandidates) {
        try {
            const runner = await candidate.detect();
            cachedRunner = runner;
            return runner;
        } catch (error) {
            if (error?.code !== 'ENOENT') {
                console.warn(`C# runner detection failed for ${candidate.name}: ${error.message}`);
            }
        }
    }

    return null;
};

const missingRuntimeMessage =
    'C# runtime is not available on the server. Install dotnet-script, dotnet script, or csi to enable C# execution.';

export const runCSharpCode = async (req, res, next) => {
    const { code } = req.body;

    if (typeof code !== 'string' || !code.trim()) {
        return next(errorHandler(400, 'C# code is required.'));
    }

    await fs.promises.mkdir(TEMP_DIR, { recursive: true });

    const runner = await findCSharpRunner();
    if (!runner) {
        return res.status(200).json({ output: missingRuntimeMessage, error: true });
    }

    const uniqueId = uuidv4();
    const filePath = path.join(TEMP_DIR, `${uniqueId}${runner.extension || '.csx'}`);

    try {
        await fs.promises.writeFile(filePath, code);

        const { stdout } = await execFileAsync(runner.command, runner.buildArgs(filePath), {
            timeout: 5000,
        });

        res.status(200).json({ output: stdout, error: false });
    } catch (error) {
        if (error?.code === 'ENOENT') {
            cachedRunner = null;
            return res.status(200).json({ output: missingRuntimeMessage, error: true });
        }

        const output = error?.stderr || error?.stdout || error?.message || String(error);
        res.status(200).json({ output, error: true });
    } finally {
        try {
            await fs.promises.unlink(filePath);
        } catch {
            // Ignore cleanup errors
        }
    }
};
