// api/controllers/python.controller.js
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler } from '../utils/error.js';

// Get the current directory name and define the temporary directory
const __dirname = path.resolve();
const TEMP_DIR = path.join(__dirname, 'temp');
const PYTHON_VISUALIZER_SCRIPT = path.join(__dirname, 'api', 'utils', 'python_visualizer.py');
const PYTHON_TUTOR_ENDPOINT = 'https://pythontutor.com/webexec';

const REMOTE_LANGUAGE_BACKENDS = {
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    javascript: 'js',
    typescript: 'ts',
};

const SUPPORTED_LANGUAGES = new Set(['python', ...Object.keys(REMOTE_LANGUAGE_BACKENDS)]);

const execFileAsync = promisify(execFile);

// Function to check for available python executable
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
        // 1. Write the code to a temporary Python file
        await fs.promises.writeFile(filePath, code);

        // 2. Execute the Python script using a child process without shell
        const { stdout } = await execFileAsync(pythonCommand, [filePath], {
            timeout: 5000,
        });

        // 3. Send the output back to the client
        res.status(200).json({ output: stdout, error: false });
    } catch (err) {
        const output = err?.stderr || err?.message || String(err);
        res.status(200).json({ output, error: true });
    } finally {
        // 4. Clean up the temporary Python file
        try {
            await fs.promises.unlink(filePath);
        } catch (e) {
            // Ignore cleanup errors
        }
    }
};

const parseVisualizerPayload = (raw) => {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (error) {
        console.error('Failed to parse python visualizer output:', error);
        return null;
    }
};

const sanitizeLanguage = (language) => {
    if (!language || typeof language !== 'string') {
        return 'python';
    }
    const lower = language.toLowerCase();
    if (SUPPORTED_LANGUAGES.has(lower)) {
        return lower;
    }
    return 'python';
};

const buildTutorRequestBody = (code, backend) => {
    const params = new URLSearchParams();
    params.set('user_script', code);
    params.set('raw_input_json', '[]');
    params.set(
        'options_json',
        JSON.stringify({
            cumulative_mode: false,
            heap_primitives: false,
            show_only_outputs: false,
            origin: 'scientistshield-visualizer',
            backend,
        }),
    );
    return params;
};

const formatTutorHeapEntry = (entry, heap, seen = new Set()) => {
    if (!Array.isArray(entry) || entry.length === 0) {
        return JSON.stringify(entry ?? null);
    }

    const [tag, ...rest] = entry;
    const normalized = typeof tag === 'string' ? tag.toLowerCase() : '';

    if (normalized === 'list' || normalized === 'tuple' || normalized === 'set') {
        const open = normalized === 'tuple' ? '(' : normalized === 'set' ? '{' : '[';
        const close = normalized === 'tuple' ? ')' : normalized === 'set' ? '}' : ']';
        const values = rest.map((item) => formatTutorValue(item, heap, new Set(seen)));
        return `${open}${values.join(', ')}${close}`;
    }

    if (normalized === 'dict') {
        const pairs = rest
            .map((pair) => {
                if (!Array.isArray(pair) || pair.length < 2) {
                    return JSON.stringify(pair);
                }
                const [key, value] = pair;
                const keyText = formatTutorValue(key, heap, new Set(seen));
                const valueText = formatTutorValue(value, heap, new Set(seen));
                return `${keyText}: ${valueText}`;
            })
            .filter(Boolean);
        return `{${pairs.join(', ')}}`;
    }

    if (normalized === 'instance') {
        const className = rest[0] ?? 'instance';
        const attributes = rest[1];
        if (attributes && typeof attributes === 'object') {
            const attrPairs = Object.entries(attributes).map(([name, value]) => {
                const valueText = formatTutorValue(value, heap, new Set(seen));
                return `${name}=${valueText}`;
            });
            return `${className}(${attrPairs.join(', ')})`;
        }
        return String(className);
    }

    return JSON.stringify(entry);
};

const formatTutorValue = (value, heap, seen = new Set()) => {
    if (!Array.isArray(value)) {
        if (typeof value === 'string') {
            return value;
        }
        if (value === null) {
            return 'null';
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }
        return JSON.stringify(value);
    }

    if (value.length === 0) {
        return '';
    }

    const [tag, ...rest] = value;
    const normalized = typeof tag === 'string' ? tag.toLowerCase() : '';

    if (normalized === 'ref') {
        const refId = String(rest[0]);
        if (seen.has(refId)) {
            return `[ref ${refId}]`;
        }
        seen.add(refId);
        const referenced = heap?.[refId];
        if (!referenced) {
            return `[ref ${refId}]`;
        }
        return formatTutorHeapEntry(referenced, heap, seen);
    }

    if (normalized === 'str' || normalized === 'string') {
        return rest[0] ?? '';
    }

    if (['num', 'int', 'float', 'number'].includes(normalized)) {
        return String(rest[0]);
    }

    if (normalized === 'bool') {
        return rest[0] ? 'true' : 'false';
    }

    if (normalized === 'none') {
        return 'None';
    }

    if (normalized === 'undefined') {
        return 'undefined';
    }

    if (normalized === 'null') {
        return 'null';
    }

    return JSON.stringify(value);
};

const transformTutorTrace = (traceEntries) => {
    if (!Array.isArray(traceEntries)) {
        return [];
    }

    return traceEntries.map((entry) => {
        const stackFrames = Array.isArray(entry.stack_to_render)
            ? entry.stack_to_render.map((frame) => ({
                  function: frame?.func_name || frame?.name || '<module>',
                  line: typeof frame?.line === 'number' ? frame.line : entry.line ?? null,
              }))
            : [];

        const activeFrame = Array.isArray(entry.stack_to_render)
            ? entry.stack_to_render.find((frame) => frame?.is_highlighted) || entry.stack_to_render[0] || null
            : null;

        const frameLocals = (activeFrame && activeFrame.locals) || entry.locals || {};
        const heap = entry.heap || {};
        const locals = {};
        if (frameLocals && typeof frameLocals === 'object') {
            Object.entries(frameLocals).forEach(([name, value]) => {
                locals[name] = formatTutorValue(value, heap);
            });
        }

        const stdout =
            entry.stdout ||
            entry.stdOut ||
            entry.std_out ||
            entry.output ||
            (typeof entry.print_output === 'string' ? entry.print_output : '');

        const transformed = {
            event: entry.event || 'line',
            line: typeof entry.line === 'number' ? entry.line : null,
            function: entry.func_name || activeFrame?.func_name || '<module>',
            locals,
            stack: stackFrames,
            stdout,
            memory: { frames: [], objects: [] },
        };

        const returnValue = entry.return_val ?? entry.retval ?? entry.returnvalue;
        if (returnValue !== undefined) {
            transformed.returnValue = formatTutorValue(returnValue, heap);
        }

        const exceptionMessage = entry.exception_msg || entry.exception || entry.exceptionMessage;
        if (exceptionMessage) {
            transformed.exception = {
                type: 'Exception',
                message: String(exceptionMessage),
            };
        }

        return transformed;
    });
};

const visualizeWithPythonTutor = async (code, language) => {
    const backend = REMOTE_LANGUAGE_BACKENDS[language];
    if (!backend) {
        throw errorHandler(400, 'Unsupported language for visualization.');
    }

    const body = buildTutorRequestBody(code, backend);
    const response = await fetch(PYTHON_TUTOR_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
    });

    if (!response.ok) {
        throw errorHandler(response.status, 'Python Tutor returned an error response.');
    }

    const payload = await response.json();
    const events = transformTutorTrace(payload.trace || payload.event_trace || []);
    const stdout =
        payload.stdout ||
        payload.stdOut ||
        payload.std_out ||
        payload.output ||
        (typeof payload.code_output === 'string' ? payload.code_output : '');

    const exceptionMessage = payload.exception_msg || payload.error;

    return {
        success: !exceptionMessage,
        events,
        stdout,
        stderr: payload.stderr || '',
        error: exceptionMessage ? { message: String(exceptionMessage) } : null,
    };
};

export const visualizeCode = async (req, res, next) => {
    const { code, language: requestedLanguage } = req.body;
    if (!code) {
        return next(errorHandler(400, 'Code is required.'));
    }

    const language = sanitizeLanguage(requestedLanguage);

    if (language !== 'python') {
        try {
            const result = await visualizeWithPythonTutor(code, language);
            return res.status(200).json(result);
        } catch (error) {
            return next(error);
        }
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

        let stdout;
        try {
            const result = await execFileAsync(
                pythonCommand,
                [PYTHON_VISUALIZER_SCRIPT, filePath],
                {
                    timeout: 7000,
                    maxBuffer: 10 * 1024 * 1024,
                }
            );
            stdout = result.stdout;
        } catch (error) {
            stdout = error?.stdout;
            if (!stdout) {
                const message = error?.stderr || error?.message || 'Python visualization failed.';
                return res.status(200).json({
                    success: false,
                    events: [],
                    stdout: '',
                    stderr: error?.stderr || '',
                    error: { message },
                });
            }
        }

        const payload = parseVisualizerPayload(stdout);
        if (!payload) {
            return next(errorHandler(500, 'Unable to parse visualizer output.'));
        }

        return res.status(200).json({
            success: Boolean(payload.success),
            events: Array.isArray(payload.events) ? payload.events : [],
            stdout: payload.stdout || '',
            stderr: payload.stderr || '',
            error: payload.error || null,
        });
    } catch (error) {
        return next(error);
    } finally {
        try {
            await fs.promises.unlink(filePath);
        } catch (cleanupError) {
            // Ignore cleanup errors
        }
    }
};
