// api/models/quiz.model.js
import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
});

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
    },
    questionType: {
        type: String,
        enum: ['mcq', 'fill-in-the-blank', 'code-output'], // Multiple Choice, Fill-in-the-blank, Code Output comparison
        default: 'mcq',
    },
    options: [optionSchema], // For MCQ type questions
    correctAnswer: { // For fill-in-the-blank or expected 'code-output'
        type: String,
    },
    codeSnippet: { // Optional: for 'code-output' type questions
        type: String,
    },
    explanation: { // Optional: explanation for the answer
        type: String,
    },
});

const quizSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
        },
        category: { // e.g., 'JavaScript', 'React'
            type: String,
            default: 'uncategorized',
        },
        questions: [questionSchema],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        relatedTutorials: [{ // Array of tutorial IDs this quiz is related to
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tutorial',
        }],
    },
    { timestamps: true }
);

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;