import Problem from '../models/problem.model.js';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';

const generateSlug = (text = '') =>
    text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '');

const buildProblemQuery = (query, allowDrafts) => {
    const filters = {};

    if (!allowDrafts) {
        filters.isPublished = true;
    }

    if (query.difficulty && query.difficulty !== 'all') {
        filters.difficulty = query.difficulty;
    }

    if (query.topic) {
        filters.topics = { $regex: query.topic, $options: 'i' };
    }

    if (query.tag) {
        filters.tags = { $regex: query.tag, $options: 'i' };
    }

    if (query.company) {
        filters.companies = { $regex: query.company, $options: 'i' };
    }

    if (query.searchTerm) {
        filters.$or = [
            { title: { $regex: query.searchTerm, $options: 'i' } },
            { description: { $regex: query.searchTerm, $options: 'i' } },
            { statement: { $regex: query.searchTerm, $options: 'i' } },
        ];
    }

    return Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined)
    );
};

const canPreviewDrafts = (req) => {
    const token = req.cookies?.access_token;
    if (!token) {
        return false;
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        return Boolean(payload?.isAdmin);
    } catch (error) {
        return false;
    }
};

const mapProblemSummary = (problem) => {
    const { stats } = problem;
    const submissionCount = stats?.submissions ?? 0;
    const acceptedCount = stats?.accepted ?? 0;
    const successRate = submissionCount > 0 ? Math.round((acceptedCount / submissionCount) * 100) : null;

    return {
        _id: problem._id,
        title: problem.title,
        slug: problem.slug,
        description: problem.description,
        difficulty: problem.difficulty,
        topics: problem.topics,
        tags: problem.tags,
        companies: problem.companies,
        estimatedTime: problem.estimatedTime,
        stats: {
            submissions: problem.stats?.submissions ?? 0,
            accepted: problem.stats?.accepted ?? 0,
            likes: problem.stats?.likes ?? 0,
        },
        successRate,
        updatedAt: problem.updatedAt,
        createdAt: problem.createdAt,
        isPublished: problem.isPublished,
    };
};

export const createProblem = async (req, res, next) => {
    if (!req.user?.isAdmin) {
        return next(errorHandler(403, 'You are not allowed to create a problem.'));
    }

    const {
        title,
        description,
        statement,
        difficulty = 'Easy',
        topics = [],
        tags = [],
        companies = [],
        inputFormat = '',
        outputFormat = '',
        constraints = [],
        samples = [],
        hints = [],
        solutionApproach = '',
        editorial = '',
        solutionSnippets = [],
        resources = [],
        estimatedTime = 0,
        isPublished = true,
        stats = {},
    } = req.body;

    if (!title || !statement || !description) {
        return next(errorHandler(400, 'Title, description, and problem statement are required.'));
    }

    const slug = generateSlug(title);

    try {
        const problem = new Problem({
            title,
            description,
            statement,
            difficulty,
            topics,
            tags,
            companies,
            inputFormat,
            outputFormat,
            constraints,
            samples,
            hints,
            solutionApproach,
            editorial,
            solutionSnippets,
            resources,
            estimatedTime,
            isPublished,
            createdBy: req.user.id,
            slug,
            stats,
        });

        const savedProblem = await problem.save();
        res.status(201).json(savedProblem);
    } catch (error) {
        next(error);
    }
};

export const getProblems = async (req, res, next) => {
    try {
        const startIndex = parseInt(req.query.startIndex, 10) || 0;
        const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
        const sort = req.query.sort || 'newest';

        const allowDrafts = req.query.includeDrafts === 'true' && canPreviewDrafts(req);
        const filters = buildProblemQuery(req.query, allowDrafts);

        const sortOptions = {
            newest: { updatedAt: -1 },
            oldest: { updatedAt: 1 },
            popular: { 'stats.submissions': -1 },
            challenging: { difficulty: -1, 'stats.accepted': 1 },
        };

        const problems = await Problem.find(filters)
            .sort(sortOptions[sort] || sortOptions.newest)
            .skip(startIndex)
            .limit(limit)
            .lean();

        const totalProblems = await Problem.countDocuments(filters);

        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const lastMonthProblems = await Problem.countDocuments({
            ...filters,
            createdAt: { $gte: oneMonthAgo },
        });

        const topicCounts = await Problem.aggregate([
            { $match: filters },
            { $unwind: { path: '$topics', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$topics', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 12 },
        ]);

        const difficultyCounts = await Problem.aggregate([
            { $match: filters },
            {
                $group: {
                    _id: '$difficulty',
                    count: { $sum: 1 },
                },
            },
        ]);

        res.status(200).json({
            problems: problems.map(mapProblemSummary),
            totalProblems,
            lastMonthProblems,
            meta: {
                topicCounts,
                difficultyCounts,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getProblemBySlug = async (req, res, next) => {
    try {
        const problem = await Problem.findOne({ slug: req.params.problemSlug })
            .populate('createdBy', 'username profilePicture role');

        const allowDraft = canPreviewDrafts(req);

        if (!problem || (!problem.isPublished && !allowDraft)) {
            return next(errorHandler(404, 'Problem not found.'));
        }

        const submissionCount = problem.stats?.submissions ?? 0;
        const acceptedCount = problem.stats?.accepted ?? 0;
        const successRate = submissionCount > 0 ? Math.round((acceptedCount / submissionCount) * 100) : null;

        res.status(200).json({
            ...problem.toObject(),
            successRate,
        });
    } catch (error) {
        next(error);
    }
};

export const getProblemById = async (req, res, next) => {
    if (!req.user?.isAdmin) {
        return next(errorHandler(403, 'You are not allowed to view this problem.'));
    }

    try {
        const problem = await Problem.findById(req.params.problemId)
            .populate('createdBy', 'username profilePicture role');

        if (!problem) {
            return next(errorHandler(404, 'Problem not found.'));
        }

        res.status(200).json(problem);
    } catch (error) {
        next(error);
    }
};

export const updateProblem = async (req, res, next) => {
    if (!req.user?.isAdmin && req.user?.id !== req.params.userId) {
        return next(errorHandler(403, 'You are not allowed to update this problem.'));
    }

    const updatePayload = { ...req.body };

    if (updatePayload.title) {
        updatePayload.slug = generateSlug(updatePayload.title);
    }

    try {
        const updatedProblem = await Problem.findByIdAndUpdate(
            req.params.problemId,
            { $set: updatePayload },
            { new: true, runValidators: true }
        );

        if (!updatedProblem) {
            return next(errorHandler(404, 'Problem not found.'));
        }

        res.status(200).json(updatedProblem);
    } catch (error) {
        next(error);
    }
};

export const deleteProblem = async (req, res, next) => {
    if (!req.user?.isAdmin && req.user?.id !== req.params.userId) {
        return next(errorHandler(403, 'You are not allowed to delete this problem.'));
    }

    try {
        await Problem.findByIdAndDelete(req.params.problemId);
        res.status(200).json('The problem has been deleted');
    } catch (error) {
        next(error);
    }
};
