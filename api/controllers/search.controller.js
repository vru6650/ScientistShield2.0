import Post from '../models/post.model.js';
import Tutorial from '../models/tutorial.model.js';
import Problem from '../models/problem.model.js';
import { errorHandler } from '../utils/error.js';
import {
    SUPPORTED_SEARCH_TYPES,
    bulkReplaceDocuments,
    isSearchEnabled,
    searchDocuments,
    toSearchResult,
} from '../services/search.service.js';

const parseTypes = (typesParam) => {
    if (!typesParam) return [];
    return typesParam
        .split(',')
        .map((type) => type.trim().toLowerCase())
        .filter((type) => SUPPORTED_SEARCH_TYPES.includes(type));
};

const fallbackSearch = async ({ term, limit, sort, types, reason }) => {
    const regex = new RegExp(term, 'i');
    const searchTypes = types.length ? types : SUPPORTED_SEARCH_TYPES;
    const perTypeLimit = Math.max(3, Math.ceil(limit / searchTypes.length));
    const resultBuckets = [];

    for (const type of searchTypes) {
        if (type === 'post') {
            const docs = await Post.find({
                $or: [
                    { title: { $regex: regex } },
                    { content: { $regex: regex } },
                ],
            })
                .sort(sort === 'recent' ? { updatedAt: -1 } : { createdAt: -1 })
                .limit(perTypeLimit)
                .lean();
            resultBuckets.push(...docs.map((doc) => toSearchResult('post', doc)).filter(Boolean));
        } else if (type === 'tutorial') {
            const docs = await Tutorial.find({
                $or: [
                    { title: { $regex: regex } },
                    { description: { $regex: regex } },
                    { 'chapters.content': { $regex: regex } },
                ],
            })
                .sort(sort === 'recent' ? { updatedAt: -1 } : { createdAt: -1 })
                .limit(perTypeLimit)
                .lean();
            resultBuckets.push(...docs.map((doc) => toSearchResult('tutorial', doc)).filter(Boolean));
        } else if (type === 'problem') {
            const docs = await Problem.find({
                $or: [
                    { title: { $regex: regex } },
                    { description: { $regex: regex } },
                    { statement: { $regex: regex } },
                ],
            })
                .sort(sort === 'recent' ? { updatedAt: -1 } : { createdAt: -1 })
                .limit(perTypeLimit)
                .lean();
            resultBuckets.push(...docs.map((doc) => toSearchResult('problem', doc)).filter(Boolean));
        }
    }

    const sortedResults = sort === 'recent'
        ? resultBuckets.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
        : resultBuckets;

    return {
        query: term,
        total: sortedResults.length,
        took: null,
        results: sortedResults.slice(0, limit),
        fallbackUsed: true,
        message:
            reason ||
            'Elasticsearch is not configured. Results are provided via a MongoDB fallback search.',
    };
};

const resolveFallbackReason = (error) => {
    if (!error) {
        return 'Elasticsearch query failed. Results are provided via a MongoDB fallback search.';
    }

    if (error.code === 'ELASTICSEARCH_NETWORK_ERROR') {
        return 'Unable to reach Elasticsearch. Results are provided via a MongoDB fallback search.';
    }

    const message = String(error.message || '').toLowerCase();

    if (message.includes('index_not_found_exception') || message.includes('no such index')) {
        return 'The search index has not been created yet. Results are provided via a MongoDB fallback search.';
    }

    return 'Elasticsearch query failed. Results are provided via a MongoDB fallback search.';
};

export const globalSearch = async (req, res, next) => {
    const searchTerm = (req.query.q || req.query.searchTerm || '').toString().trim();
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const sort = req.query.sort === 'recent' ? 'recent' : 'relevance';
    const types = parseTypes(req.query.types);

    if (!searchTerm) {
        return res.status(200).json({
            query: '',
            total: 0,
            took: null,
            results: [],
            fallbackUsed: !isSearchEnabled(),
        });
    }

    try {
        if (isSearchEnabled()) {
            try {
                const data = await searchDocuments({ term: searchTerm, limit, sort, types });
                return res.status(200).json({
                    ...data,
                    sort,
                    types: types.length ? types : SUPPORTED_SEARCH_TYPES,
                    fallbackUsed: false,
                });
            } catch (error) {
                console.warn('Elasticsearch query failed. Falling back to MongoDB search:', error.message);
                const fallbackData = await fallbackSearch({
                    term: searchTerm,
                    limit,
                    sort,
                    types,
                    reason: resolveFallbackReason(error),
                });
                return res.status(200).json({
                    ...fallbackData,
                    sort,
                    types: types.length ? types : SUPPORTED_SEARCH_TYPES,
                });
            }
        }

        const fallbackData = await fallbackSearch({
            term: searchTerm,
            limit,
            sort,
            types,
            reason: 'Elasticsearch is not configured. Results are provided via a MongoDB fallback search.',
        });
        return res.status(200).json({
            ...fallbackData,
            sort,
            types: types.length ? types : SUPPORTED_SEARCH_TYPES,
        });
    } catch (error) {
        next(error);
    }
};

export const reindexSearchContent = async (req, res, next) => {
    if (!req.user?.isAdmin) {
        return next(errorHandler(403, 'Only administrators can reindex search content.'));
    }

    if (!isSearchEnabled()) {
        return next(errorHandler(503, 'Elasticsearch is not configured.'));
    }

    try {
        const [posts, tutorials, problems] = await Promise.all([
            Post.find({}).lean(),
            Tutorial.find({}).lean(),
            Problem.find({}).lean(),
        ]);

        const [postResult, tutorialResult, problemResult] = await Promise.all([
            bulkReplaceDocuments('post', posts),
            bulkReplaceDocuments('tutorial', tutorials),
            bulkReplaceDocuments('problem', problems),
        ]);

        res.status(200).json({
            success: true,
            indexed: {
                posts: postResult.indexed,
                tutorials: tutorialResult.indexed,
                problems: problemResult.indexed,
            },
        });
    } catch (error) {
        next(error);
    }
};
