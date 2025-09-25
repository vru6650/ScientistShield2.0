// api/controllers/quiz.controller.js
import Quiz from '../models/quiz.model.js';
import { errorHandler } from '../utils/error.js';

// Helper to generate a slug (can be reused from your post/tutorial controller)
const generateSlug = (text) => {
    return text
        .split(' ')
        .join('-')
        .toLowerCase()
        .replace(/[^a-zA-Z0-9-]/g, '');
};

export const createQuiz = async (req, res, next) => {
    if (!req.user.isAdmin) {
        return next(errorHandler(403, 'You are not allowed to create a quiz'));
    }
    const { title, description, category, questions, relatedTutorials } = req.body;

    if (!title || !Array.isArray(questions) || questions.length === 0) {
        return next(errorHandler(400, 'Please provide quiz title and at least one question.'));
    }

    const slug = generateSlug(title);

    const newQuiz = new Quiz({
        title,
        slug,
        description,
        category,
        questions,
        createdBy: req.user.id,
        relatedTutorials,
    });

    try {
        const savedQuiz = await newQuiz.save();
        res.status(201).json(savedQuiz);
    } catch (error) {
        next(error);
    }
};

export const getQuizzes = async (req, res, next) => {
    try {
        const startIndex = parseInt(req.query.startIndex) || 0;
        const limit = parseInt(req.query.limit) || 9;
        const sortDirection = req.query.sort === 'asc' ? 1 : -1;

        const quizzes = await Quiz.find({
            ...(req.query.quizId && { _id: req.query.quizId }),
            ...(req.query.slug && { slug: req.query.slug }),
            ...(req.query.category && { category: req.query.category }),
            ...(req.query.searchTerm && {
                $or: [
                    { title: { $regex: req.query.searchTerm, $options: 'i' } },
                    { description: { $regex: req.query.searchTerm, $options: 'i' } },
                ],
            }),
            ...(req.query.relatedTutorialId && { relatedTutorials: req.query.relatedTutorialId }),
        })
            .sort({ updatedAt: sortDirection })
            .skip(startIndex)
            .limit(limit)
            .populate('createdBy', 'username profilePicture') // Populate user info
            .populate('relatedTutorials', 'title slug'); // Populate related tutorial basic info

        const totalQuizzes = await Quiz.countDocuments();

        const now = new Date();
        const oneMonthAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate()
        );
        const lastMonthQuizzes = await Quiz.countDocuments({
            createdAt: { $gte: oneMonthAgo },
        });

        res.status(200).json({
            quizzes,
            totalQuizzes,
            lastMonthQuizzes,
        });
    } catch (error) {
        next(error);
    }
};

// NEW: Function to get a single quiz by its ID
export const getSingleQuizById = async (req, res, next) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId)
            .populate('createdBy', 'username')
            .populate('relatedTutorials', 'title slug');
        if (!quiz) {
            return next(errorHandler(404, 'Quiz not found'));
        }
        res.status(200).json(quiz);
    } catch (error) {
        next(error);
    }
};

// RENAMED: Old `getSingleQuiz` is now `getSingleQuizBySlug`
export const getSingleQuizBySlug = async (req, res, next) => {
    try {
        const quiz = await Quiz.findOne({ slug: req.params.quizSlug })
            .populate('createdBy', 'username')
            .populate('relatedTutorials', 'title slug');
        if (!quiz) {
            return next(errorHandler(404, 'Quiz not found'));
        }
        res.status(200).json(quiz);
    } catch (error) {
        next(error);
    }
};

export const updateQuiz = async (req, res, next) => {
    if (!req.user.isAdmin && req.user.id !== req.params.userId) {
        return next(errorHandler(403, 'You are not allowed to update this quiz'));
    }
    const { title, description, category, questions, relatedTutorials } = req.body;
    const updateFields = {
        title,
        description,
        category,
        questions,
        relatedTutorials,
    };
    if (title) {
        updateFields.slug = generateSlug(title);
    }

    try {
        const updatedQuiz = await Quiz.findByIdAndUpdate(
            req.params.quizId,
            { $set: updateFields },
            { new: true }
        );
        if (!updatedQuiz) {
            return next(errorHandler(404, 'Quiz not found'));
        }
        res.status(200).json(updatedQuiz);
    } catch (error) {
        next(error);
    }
};

export const deleteQuiz = async (req, res, next) => {
    if (!req.user.isAdmin && req.user.id !== req.params.userId) {
        return next(errorHandler(403, 'You are not allowed to delete this quiz'));
    }
    try {
        await Quiz.findByIdAndDelete(req.params.quizId);
        res.status(200).json('The quiz has been deleted');
    } catch (error) {
        next(error);
    }
};

export const submitQuiz = async (req, res, next) => {
    const { quizId } = req.params;
    const { answers } = req.body; // answers is an array of { questionId: string, userAnswer: any }

    if (!Array.isArray(answers)) {
        return next(errorHandler(400, 'Answers must be an array.'));
    }

    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return next(errorHandler(404, 'Quiz not found.'));
        }

        let correctCount = 0;
        const results = [];

        for (const submittedAnswer of answers) {
            const question = quiz.questions.id(submittedAnswer.questionId);
            if (!question) {
                // Ignore answers for non-existent questions or handle as error
                continue;
            }

            let isCorrect = false;
            let feedback = '';

            if (question.questionType === 'mcq') {
                // For MCQ, userAnswer should be an array of selected option texts or a single string
                const userSelectedTexts = Array.isArray(submittedAnswer.userAnswer)
                    ? submittedAnswer.userAnswer.sort()
                    : [submittedAnswer.userAnswer].sort();
                const correctOptionTexts = question.options
                    .filter(opt => opt.isCorrect)
                    .map(opt => opt.text)
                    .sort();

                if (userSelectedTexts.length === correctOptionTexts.length &&
                    userSelectedTexts.every((val, i) => val === correctOptionTexts[i])) {
                    isCorrect = true;
                    feedback = 'Correct!';
                } else {
                    feedback = `Incorrect. Correct answer(s): ${correctOptionTexts.join(', ')}.`;
                }
            } else if (question.questionType === 'fill-in-the-blank') {
                if (typeof submittedAnswer.userAnswer === 'string' &&
                    submittedAnswer.userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()) {
                    isCorrect = true;
                    feedback = 'Correct!';
                } else {
                    feedback = `Incorrect. Expected: "${question.correctAnswer}".`;
                }
            } else if (question.questionType === 'code-output') {
                // For code-output, you'd typically run the code in a sandbox and compare output.
                // For this example, we'll just compare the string output.
                if (typeof submittedAnswer.userAnswer === 'string' &&
                    submittedAnswer.userAnswer.trim() === question.correctAnswer.trim()) {
                    isCorrect = true;
                    feedback = 'Correct Output!';
                } else {
                    feedback = `Incorrect Output. Expected: \n"${question.correctAnswer}"\nYour output:\n"${submittedAnswer.userAnswer}"`;
                }
            }

            if (isCorrect) {
                correctCount++;
            }

            results.push({
                questionId: question._id,
                questionText: question.questionText,
                userAnswer: submittedAnswer.userAnswer,
                correctAnswer: question.correctAnswer || question.options.filter(opt => opt.isCorrect).map(opt => opt.text),
                isCorrect,
                explanation: question.explanation,
                feedback,
            });
        }

        res.status(200).json({
            score: correctCount,
            totalQuestions: quiz.questions.length,
            results,
            message: `You scored ${correctCount} out of ${quiz.questions.length}.`
        });

    } catch (error) {
        next(error);
    }
};