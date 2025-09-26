import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRunCSharpCode, missingRuntimeMessage } from './csharp.controller.js';

const createResponseDouble = () => {
    const response = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };
    return response;
};

test('runCSharpCode returns 400 when request body is missing', async () => {
    let receivedError;
    const req = {};
    const res = createResponseDouble();
    const runCSharpCode = createRunCSharpCode({
        findRunner: async () => {
            throw new Error('should not reach runner detection');
        },
    });

    await runCSharpCode(req, res, (err) => {
        receivedError = err;
    });

    assert.ok(receivedError instanceof Error, 'expected an error to be forwarded to next');
    assert.equal(receivedError.statusCode, 400);
    assert.equal(receivedError.message, 'C# code is required.');
});

test('runCSharpCode returns 400 when code is not a string', async () => {
    let receivedError;
    const req = { body: { code: 12345 } };
    const res = createResponseDouble();
    const runCSharpCode = createRunCSharpCode({
        findRunner: async () => {
            throw new Error('should not reach runner detection');
        },
    });

    await runCSharpCode(req, res, (err) => {
        receivedError = err;
    });

    assert.ok(receivedError instanceof Error, 'expected an error to be forwarded to next');
    assert.equal(receivedError.statusCode, 400);
    assert.equal(receivedError.message, 'C# code is required.');
});

test('runCSharpCode returns helpful message when no C# runtime is detected', async () => {
    let mkdirCalled = false;
    const fsStub = {
        promises: {
            mkdir: async () => {
                mkdirCalled = true;
            },
        },
    };

    const runCSharpCode = createRunCSharpCode({
        findRunner: async () => null,
        fs: fsStub,
    });

    const req = { body: { code: 'Console.WriteLine("Hello");' } };
    const res = createResponseDouble();

    await runCSharpCode(req, res, () => {});

    assert.equal(mkdirCalled, true, 'expected temporary directory to be created');
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { output: missingRuntimeMessage, error: true });
});

test('runCSharpCode executes provided C# via custom runner', async () => {
    let capturedCode;
    let capturedId;
    const runStub = async (code, uniqueId) => {
        capturedCode = code;
        capturedId = uniqueId;
        return { stdout: 'Hello from C#\n' };
    };

    const runCSharpCode = createRunCSharpCode({
        findRunner: async () => ({ run: runStub }),
        fs: {
            promises: {
                mkdir: async () => {},
            },
        },
    });

    const req = { body: { code: 'Console.WriteLine("Hello");' } };
    const res = createResponseDouble();

    await runCSharpCode(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { output: 'Hello from C#\n', error: false });
    assert.equal(capturedCode, 'Console.WriteLine("Hello");');
    assert.equal(typeof capturedId, 'string');
    assert.ok(capturedId.length > 0, 'expected generated id to be non-empty');
});

test('runCSharpCode executes fallback command runner and cleans up temp file', async () => {
    const writes = [];
    const unlinks = [];
    const execCalls = [];
    const fsStub = {
        promises: {
            mkdir: async () => {},
            writeFile: async (filePath, content) => {
                writes.push({ filePath, content });
            },
            unlink: async (filePath) => {
                unlinks.push(filePath);
            },
        },
    };

    const execStub = async (command, args, options) => {
        execCalls.push({ command, args, options });
        return { stdout: 'Hello from script runner' };
    };

    const tempDir = '/virtual-temp';
    const runCSharpCode = createRunCSharpCode({
        findRunner: async () => ({
            command: 'dotnet-script',
            buildArgs: (filePath) => ['--no-cache', filePath],
            extension: '.csx',
        }),
        fs: fsStub,
        execFile: execStub,
        tempDir,
    });

    const req = { body: { code: 'Console.WriteLine("Hello from fallback");' } };
    const res = createResponseDouble();

    await runCSharpCode(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { output: 'Hello from script runner', error: false });
    assert.equal(writes.length, 1);
    assert.equal(unlinks.length, 1);
    assert.equal(execCalls.length, 1);
    assert.equal(execCalls[0].command, 'dotnet-script');
    assert.deepEqual(execCalls[0].args.slice(0, 1), ['--no-cache']);
    assert.equal(execCalls[0].options.encoding, 'utf8');
    assert.equal(execCalls[0].options.timeout, 5000);
    assert.equal(execCalls[0].options.maxBuffer, 1024 * 1024);
    assert.equal(writes[0].content, 'Console.WriteLine("Hello from fallback");');
    assert.ok(writes[0].filePath.startsWith(`${tempDir}${path.sep}`));
    assert.equal(unlinks[0], writes[0].filePath);
});

test('runCSharpCode returns helpful message when fallback runner is missing', async () => {
    const fsStub = {
        promises: {
            mkdir: async () => {},
            writeFile: async () => {},
            unlink: async () => {},
        },
    };

    const execStub = async () => {
        const error = new Error('spawn dotnet-script ENOENT');
        error.code = 'ENOENT';
        throw error;
    };

    const runCSharpCode = createRunCSharpCode({
        findRunner: async () => ({
            command: 'dotnet-script',
            buildArgs: (filePath) => [filePath],
            extension: '.csx',
        }),
        fs: fsStub,
        execFile: execStub,
    });

    const req = { body: { code: 'Console.WriteLine("Hello");' } };
    const res = createResponseDouble();

    await runCSharpCode(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { output: missingRuntimeMessage, error: true });
});
