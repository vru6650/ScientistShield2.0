import test from 'node:test';
import assert from 'node:assert/strict';

import { createQuiz, submitQuiz } from './quiz.controller.js';
import Quiz from '../models/quiz.model.js';

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

const createResponseDouble = () => {
    return {
        statusCode: 0,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.payload = data;
            return this;
        },
    };
};

test('submitQuiz returns correct answers for fill-in-the-blank questions without options array', async () => {
    const originalFindById = Quiz.findById;

    const question = {
        _id: 'question-1',
        questionType: 'fill-in-the-blank',
        questionText: 'Name the JavaScript runtime used by Node.js.',
        correctAnswer: undefined,
        explanation: 'Node.js uses the V8 engine under the hood.',
    };

    const questions = [question];
    questions.id = (id) => questions.find((item) => String(item._id) === String(id));

    Quiz.findById = () => Promise.resolve({
        questions,
    });

    const req = {
        params: { quizId: 'quiz-123' },
        body: {
            answers: [
                {
                    questionId: 'question-1',
                    userAnswer: 'v8',
                },
            ],
        },
    };
    const res = createResponseDouble();

    let forwardedError;
    try {
        await submitQuiz(req, res, (err) => {
            forwardedError = err;
        });
    } finally {
        Quiz.findById = originalFindById;
    }

    assert.strictEqual(forwardedError, undefined);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.payload, 'Expected response payload to be set');
    assert.strictEqual(res.payload.score, 0);
    assert.strictEqual(res.payload.totalQuestions, 1);
    assert.deepEqual(res.payload.results[0].correctAnswer, null);
    assert.strictEqual(res.payload.results[0].isCorrect, false);
    assert.match(res.payload.results[0].feedback, /not configured/i);
});
