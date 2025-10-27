// api/controllers/quiz.controller.js
import Quiz from '../models/quiz.model.js';
import { errorHandler } from '../utils/error.js';
import { generateSlug } from '../utils/slug.js';
import { normalizePagination } from '../utils/pagination.js';

export const createQuiz = async (req, res, next) => {
    if (!req.user.isAdmin) {
        return next(errorHandler(403, 'You are not allowed to create a quiz'));
    }
    const { title, description, category, questions, relatedTutorials } = req.body;

    if (!title || !Array.isArray(questions) || questions.length === 0) {
        return next(errorHandler(400, 'Please provide quiz title and at least one question.'));
    }

    const slug = generateSlug(String(title));

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
        const { startIndex, limit } = normalizePagination(req.query, {
            defaultLimit: 9,
            maxLimit: 50,
        });
        const sortDirection = req.query.sort === 'asc' ? 1 : -1;

        const filters = {
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
        };

        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const quizzesQuery = Quiz.find(filters)
            .sort({ updatedAt: sortDirection })
            .skip(startIndex)
            .limit(limit)
            .populate('createdBy', 'username profilePicture') // Populate user info
            .populate('relatedTutorials', 'title slug') // Populate related tutorial basic info
            .lean();

        const [quizzes, totalQuizzes, lastMonthQuizzes] = await Promise.all([
            quizzesQuery,
            Quiz.countDocuments(filters),
            Quiz.countDocuments({
                ...filters,
                createdAt: { $gte: oneMonthAgo },
            }),
        ]);

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
        updateFields.slug = generateSlug(String(title));
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

            const options = Array.isArray(question.options) ? question.options : [];
            const correctOptionTexts = options
                .filter((opt) => opt && opt.isCorrect)
                .map((opt) => (typeof opt.text === 'string' ? opt.text : String(opt.text)))
                .filter((text) => text !== undefined && text !== null);
            const sortedCorrectOptions = [...correctOptionTexts].sort();

            const rawCorrectAnswer = typeof question.correctAnswer === 'string' ? question.correctAnswer : '';
            const trimmedCorrectAnswer = rawCorrectAnswer.trim();
            const hasManualAnswer = trimmedCorrectAnswer.length > 0;

            let isCorrect = false;
            let feedback = '';
            let correctAnswerForResult = null;

            if (question.questionType === 'mcq') {
                // For MCQ, userAnswer should be an array of selected option texts or a single string
                const userSelectedTexts = Array.isArray(submittedAnswer.userAnswer)
                    ? submittedAnswer.userAnswer
                        .filter((value) => value !== undefined && value !== null)
                        .map((value) => String(value))
                    : submittedAnswer.userAnswer !== undefined && submittedAnswer.userAnswer !== null
                        ? [String(submittedAnswer.userAnswer)]
                        : [];

                const sortedUserSelections = [...userSelectedTexts].sort();

                correctAnswerForResult = sortedCorrectOptions.length > 0 ? correctOptionTexts : [];

                if (sortedCorrectOptions.length === 0) {
                    feedback = 'Correct options are not configured for this question yet.';
                } else if (
                    sortedUserSelections.length === sortedCorrectOptions.length &&
                    sortedUserSelections.every((val, i) => val === sortedCorrectOptions[i])
                ) {
                    isCorrect = true;
                    feedback = 'Correct!';
                } else {
                    feedback = `Incorrect. Correct answer(s): ${correctOptionTexts.join(', ')}.`;
                }
            } else if (question.questionType === 'fill-in-the-blank') {
                correctAnswerForResult = hasManualAnswer ? trimmedCorrectAnswer : null;

                if (!hasManualAnswer) {
                    feedback = 'Incorrect. This question is not configured with an expected answer yet.';
                } else if (
                    typeof submittedAnswer.userAnswer === 'string' &&
                    submittedAnswer.userAnswer.trim().toLowerCase() === trimmedCorrectAnswer.toLowerCase()
                ) {
                    isCorrect = true;
                    feedback = 'Correct!';
                } else {
                    feedback = `Incorrect. Expected: "${trimmedCorrectAnswer}".`;
                }
            } else if (question.questionType === 'code-output') {
                // For code-output, you'd typically run the code in a sandbox and compare output.
                // For this example, we'll just compare the string output.
                correctAnswerForResult = hasManualAnswer ? rawCorrectAnswer : null;

                if (!hasManualAnswer) {
                    feedback = 'Incorrect Output. This question is not configured with an expected output yet.';
                } else if (
                    typeof submittedAnswer.userAnswer === 'string' &&
                    submittedAnswer.userAnswer.trim() === trimmedCorrectAnswer
                ) {
                    isCorrect = true;
                    feedback = 'Correct Output!';
                } else {
                    feedback = `Incorrect Output. Expected: \n"${rawCorrectAnswer}"\nYour output:\n"${submittedAnswer.userAnswer ?? ''}"`;
                }
            } else {
                correctAnswerForResult = hasManualAnswer
                    ? trimmedCorrectAnswer
                    : correctOptionTexts.length > 0
                        ? correctOptionTexts
                        : null;
            }

            if (isCorrect) {
                correctCount++;
            }

            results.push({
                questionId: question._id,
                questionText: question.questionText,
                userAnswer: submittedAnswer.userAnswer,
                correctAnswer: correctAnswerForResult,
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
