import test from 'node:test';
import assert from 'node:assert/strict';

import { createQuiz } from './quiz.controller.js';

const mockResponse = () => {
    const res = {};
    res.status = function status() {
        return this;
    };
    res.json = function json() {
        return this;
    };
    return res;
};

test('createQuiz returns 400 error when questions are missing', async () => {
    const req = {
        user: { isAdmin: true, id: 'user-id' },
        body: { title: 'Sample Quiz' },
    };
    const res = mockResponse();

    let nextCalledWith;
    const next = (err) => {
        nextCalledWith = err;
    };

    await createQuiz(req, res, next);

    assert.ok(nextCalledWith instanceof Error, 'Expected next to be called with an error');
    assert.equal(nextCalledWith.statusCode, 400);
    assert.equal(
        nextCalledWith.message,
        'Please provide quiz title and at least one question.'
    );
});

test('createQuiz returns 400 error when questions array is empty', async () => {
    const req = {
        user: { isAdmin: true, id: 'user-id' },
        body: { title: 'Sample Quiz', questions: [] },
    };
    const res = mockResponse();

    let nextCalledWith;
    const next = (err) => {
        nextCalledWith = err;
    };

    await createQuiz(req, res, next);

    assert.ok(nextCalledWith instanceof Error, 'Expected next to be called with an error');
    assert.equal(nextCalledWith.statusCode, 400);
    assert.equal(
        nextCalledWith.message,
        'Please provide quiz title and at least one question.'
    );
});
