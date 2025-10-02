import Post from '../models/post.model.js';
import Tutorial from '../models/tutorial.model.js';
import Problem from '../models/problem.model.js';
import Page from '../models/page.model.js';
import { errorHandler } from '../utils/error.js';
import {
    SUPPORTED_SEARCH_TYPES,
    bulkReplaceDocuments,
    isSearchEnabled,
    searchDocuments,
    toSearchResult,
} from '../services/search.service.js';

const stripHtml = (value = '') => String(value).replace(/<[^>]*>/g, ' ');

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const tokenizeSearchTerm = (term) => {
    return Array.from(
        new Set(
            term
                .split(/\s+/)
                .map((token) => token.trim().toLowerCase())
                .filter(Boolean),
        ),
    );
};

const computeFieldScore = (text, { term, tokens, exactWeight, tokenWeight, prefixWeight }) => {
    if (!text) return 0;

    const normalized = stripHtml(text).toLowerCase();
    if (!normalized) return 0;

    let score = 0;

    if (term && normalized.includes(term)) {
        score += exactWeight;
        if (normalized.startsWith(term)) {
            score += exactWeight * 0.4;
        }
    }

    for (const token of tokens) {
        if (!token) continue;
        if (normalized.includes(token)) {
            score += tokenWeight;
        }

        const prefixRegex = new RegExp(`\\b${escapeRegExp(token)}`, 'i');
        if (prefixRegex.test(normalized)) {
            score += prefixWeight;
        }
    }

    return score;
};

const computeRecencyBoost = (doc) => {
    const rawDate = doc?.updatedAt || doc?.createdAt;
    if (!rawDate) return 0;

    const timestamp = new Date(rawDate).getTime();
    if (Number.isNaN(timestamp)) return 0;

    const ageInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);

    if (ageInDays <= 1) return 1.5;
    if (ageInDays <= 7) return 1.1;
    if (ageInDays <= 30) return 0.8;
    if (ageInDays <= 180) return 0.4;

    return 0;
};

const createSnippetFromText = (text, { term, tokens, snippetLength = 160 }) => {
    if (!text) return null;

    const cleaned = stripHtml(text).replace(/\s+/g, ' ').trim();
    if (!cleaned) return null;

    const lower = cleaned.toLowerCase();
    const candidates = [term, ...tokens].filter(Boolean);

    let matchIndex = -1;
    let matchLength = 0;

    for (const candidate of candidates) {
        if (!candidate) continue;
        const index = lower.indexOf(candidate);
        if (index !== -1) {
            matchIndex = index;
            matchLength = candidate.length;
            break;
        }
    }

    if (matchIndex === -1) {
        const snippet = cleaned.slice(0, snippetLength).trim();
        return snippet.length === cleaned.length ? snippet : `${snippet}…`;
    }

    const halfWindow = Math.max(0, Math.floor((snippetLength - matchLength) / 2));
    const start = Math.max(0, matchIndex - halfWindow);
    const end = Math.min(cleaned.length, start + snippetLength);
    const snippet = cleaned.slice(start, end).trim();

    const uniqueTokens = Array.from(new Set(candidates)).sort((a, b) => b.length - a.length);
    const highlighted = uniqueTokens.reduce((acc, token) => {
        if (!token) return acc;
        const regex = new RegExp(`(${escapeRegExp(token)})`, 'gi');
        return acc.replace(regex, '<mark>$1</mark>');
    }, snippet);

    const prefix = start > 0 ? '…' : '';
    const suffix = end < cleaned.length ? '…' : '';

    return `${prefix}${highlighted}${suffix}`;
};

const createHighlightSnippet = (fields, context) => {
    for (const field of fields) {
        const snippet = createSnippetFromText(field, context);
        if (snippet && /<mark>/.test(snippet)) {
            return snippet;
        }
    }

    for (const field of fields) {
        const snippet = createSnippetFromText(field, context);
        if (snippet) {
            return snippet;
        }
    }

    return null;
};

const collectPageSectionText = (sections = []) => {
    if (!Array.isArray(sections)) {
        return [];
    }

    return sections.flatMap((section) => {
        if (!section || typeof section !== 'object') {
            return [];
        }

        const entries = [section.title, section.subtitle, section.body];

        if (Array.isArray(section.items)) {
            for (const item of section.items) {
                entries.push(item?.title, item?.body);
            }
        }

        if (section.cta) {
            entries.push(section.cta.label, section.cta.url);
        }

        return entries.filter(Boolean);
    });
};

const buildFallbackResult = (type, doc, context) => {
    const baseResult = toSearchResult(type, doc);
    if (!baseResult) {
        return null;
    }

    const { term, tokens } = context;

    const fieldConfigs = [];
    const highlightFields = [];

    if (type === 'post') {
        fieldConfigs.push(
            { text: doc.title, exactWeight: 12, tokenWeight: 4, prefixWeight: 2 },
            { text: doc.excerpt || doc.summary, exactWeight: 8, tokenWeight: 3, prefixWeight: 1.5 },
            { text: doc.content, exactWeight: 5, tokenWeight: 2, prefixWeight: 1 },
            { text: Array.isArray(doc.tags) ? doc.tags.join(' ') : '', exactWeight: 2, tokenWeight: 1, prefixWeight: 0.8 },
        );
        highlightFields.push(doc.content, doc.summary, doc.excerpt, baseResult.summary, doc.title);
    } else if (type === 'tutorial') {
        const chapterContent = Array.isArray(doc.chapters) ? doc.chapters.map((chapter) => chapter?.content || '') : [];
        fieldConfigs.push(
            { text: doc.title, exactWeight: 12, tokenWeight: 4, prefixWeight: 2 },
            { text: doc.description, exactWeight: 8, tokenWeight: 3, prefixWeight: 1.5 },
            { text: chapterContent.join(' '), exactWeight: 5, tokenWeight: 2, prefixWeight: 1 },
            { text: Array.isArray(doc.topics) ? doc.topics.join(' ') : '', exactWeight: 2, tokenWeight: 1, prefixWeight: 0.8 },
        );
        highlightFields.push(doc.description, chapterContent.join(' '), baseResult.summary, doc.title);
    } else if (type === 'problem') {
        const combinedContent = [
            doc.description,
            doc.statement,
            doc.solutionApproach,
            doc.editorial,
            Array.isArray(doc.hints) ? doc.hints.join(' ') : '',
            Array.isArray(doc.constraints) ? doc.constraints.join(' ') : '',
        ].join(' ');

        fieldConfigs.push(
            { text: doc.title, exactWeight: 12, tokenWeight: 4, prefixWeight: 2 },
            { text: doc.description, exactWeight: 8, tokenWeight: 3, prefixWeight: 1.5 },
            { text: combinedContent, exactWeight: 5, tokenWeight: 2, prefixWeight: 1 },
            { text: Array.isArray(doc.topics) ? doc.topics.join(' ') : '', exactWeight: 2, tokenWeight: 1, prefixWeight: 0.8 },
        );
        highlightFields.push(doc.statement, doc.description, combinedContent, baseResult.summary, doc.title);
    } else if (type === 'page') {
        const sectionText = collectPageSectionText(doc.sections);
        const combinedContent = [
            doc.description,
            ...sectionText,
            doc.seo?.metaTitle,
            doc.seo?.metaDescription,
        ]
            .filter(Boolean)
            .join(' ');
        const keywordText = Array.isArray(doc.seo?.keywords) ? doc.seo.keywords.join(' ') : '';
        const metaDescription = doc.seo?.metaDescription || '';

        fieldConfigs.push(
            { text: doc.title, exactWeight: 12, tokenWeight: 4, prefixWeight: 2 },
            { text: doc.description, exactWeight: 8, tokenWeight: 3, prefixWeight: 1.5 },
            { text: combinedContent, exactWeight: 5, tokenWeight: 2, prefixWeight: 1 },
            { text: keywordText, exactWeight: 2, tokenWeight: 1, prefixWeight: 0.8 },
            { text: metaDescription, exactWeight: 3, tokenWeight: 1.5, prefixWeight: 0.8 },
        );
        highlightFields.push(
            combinedContent,
            doc.description,
            metaDescription,
            keywordText,
            baseResult.summary,
            doc.title,
        );
    }

    const score = fieldConfigs.reduce(
        (total, config) =>
            total +
            computeFieldScore(config.text, {
                term,
                tokens,
                exactWeight: config.exactWeight,
                tokenWeight: config.tokenWeight,
                prefixWeight: config.prefixWeight,
            }),
        0,
    ) + computeRecencyBoost(doc);

    const highlight = createHighlightSnippet(highlightFields, context);

    return {
        ...baseResult,
        score,
        highlight: highlight ? [highlight] : baseResult.highlight || [],
    };
};

const parseTypes = (typesParam) => {
    if (!typesParam) return [];
    return typesParam
        .split(',')
        .map((type) => type.trim().toLowerCase())
        .filter((type) => SUPPORTED_SEARCH_TYPES.includes(type));
};

const DIFFICULTY_LOOKUP = new Map(
    ['Beginner', 'Easy', 'Medium', 'Hard', 'Advanced'].map((value) => [value.toLowerCase(), value]),
);

const parseDifficulties = (param) => {
    if (!param) return [];
    return Array.from(
        new Set(
            param
                .split(',')
                .map((value) => DIFFICULTY_LOOKUP.get(value.trim().toLowerCase()))
                .filter(Boolean),
        ),
    );
};

const sanitizeIsoDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString();
};

const fallbackSearch = async ({ term, limit, sort, types, difficulties, updatedAfter, updatedBefore, reason }) => {
    const startedAt = Date.now();
    const regex = new RegExp(escapeRegExp(term), 'i');
    const searchTypes = types.length ? types : SUPPORTED_SEARCH_TYPES;
    const perTypeLimit = Math.max(3, Math.ceil(limit / searchTypes.length));
    const resultBuckets = [];
    const searchContext = { term: term.toLowerCase(), tokens: tokenizeSearchTerm(term) };
    const afterDate = sanitizeIsoDate(updatedAfter);
    const beforeDate = sanitizeIsoDate(updatedBefore);
    const afterTimestamp = afterDate ? new Date(afterDate).getTime() : null;
    const beforeTimestamp = beforeDate ? new Date(beforeDate).getTime() : null;

    const matchesDocFilters = (type, doc) => {
        const referenceDate = doc?.updatedAt || doc?.createdAt;
        const referenceTimestamp = referenceDate ? new Date(referenceDate).getTime() : null;

        if (afterTimestamp != null || beforeTimestamp != null) {
            if (referenceTimestamp == null || Number.isNaN(referenceTimestamp)) {
                return false;
            }

            if (afterTimestamp != null && referenceTimestamp < afterTimestamp) {
                return false;
            }

            if (beforeTimestamp != null && referenceTimestamp > beforeTimestamp) {
                return false;
            }
        }

        if (Array.isArray(difficulties) && difficulties.length) {
            if (type !== 'problem') {
                return false;
            }

            if (!doc?.difficulty || !difficulties.includes(doc.difficulty)) {
                return false;
            }
        }

        return true;
    };

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
            const filteredDocs = docs.filter((doc) => matchesDocFilters('post', doc));
            resultBuckets.push(
                ...filteredDocs
                    .map((doc) => buildFallbackResult('post', doc, searchContext))
                    .filter(Boolean),
            );
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
            const filteredDocs = docs.filter((doc) => matchesDocFilters('tutorial', doc));
            resultBuckets.push(
                ...filteredDocs
                    .map((doc) => buildFallbackResult('tutorial', doc, searchContext))
                    .filter(Boolean),
            );
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
            const filteredDocs = docs.filter((doc) => matchesDocFilters('problem', doc));
            resultBuckets.push(
                ...filteredDocs
                    .map((doc) => buildFallbackResult('problem', doc, searchContext))
                    .filter(Boolean),
            );
        } else if (type === 'page') {
            const docs = await Page.find({
                status: 'published',
                $or: [
                    { title: { $regex: regex } },
                    { description: { $regex: regex } },
                    { 'seo.metaDescription': { $regex: regex } },
                    { 'seo.metaTitle': { $regex: regex } },
                    { 'seo.keywords': { $regex: regex } },
                    { 'sections.title': { $regex: regex } },
                    { 'sections.subtitle': { $regex: regex } },
                    { 'sections.body': { $regex: regex } },
                    { 'sections.items.title': { $regex: regex } },
                    { 'sections.items.body': { $regex: regex } },
                ],
            })
                .sort(sort === 'recent' ? { updatedAt: -1 } : { createdAt: -1 })
                .limit(perTypeLimit)
                .lean();
            const filteredDocs = docs.filter((doc) => matchesDocFilters('page', doc));
            resultBuckets.push(
                ...filteredDocs
                    .map((doc) => buildFallbackResult('page', doc, searchContext))
                    .filter(Boolean),
            );
        }
    }

    const sortedResults = sort === 'recent'
        ? resultBuckets.sort(
            (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0),
        )
        : resultBuckets.sort((a, b) => {
            if (a.score === b.score) {
                return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
            }
            return (b.score ?? 0) - (a.score ?? 0);
        });

    return {
        query: term,
        total: sortedResults.length,
        took: Date.now() - startedAt,
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
    const difficulties = parseDifficulties(req.query.difficulty || req.query.difficulties);
    const updatedAfter = sanitizeIsoDate(req.query.updatedAfter);
    const updatedBefore = sanitizeIsoDate(req.query.updatedBefore);

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
                const data = await searchDocuments({
                    term: searchTerm,
                    limit,
                    sort,
                    types,
                    difficulties,
                    updatedAfter,
                    updatedBefore,
                });
                return res.status(200).json({
                    ...data,
                    sort,
                    types: types.length ? types : SUPPORTED_SEARCH_TYPES,
                    difficulties,
                    updatedAfter,
                    updatedBefore,
                    fallbackUsed: false,
                });
            } catch (error) {
                console.warn('Elasticsearch query failed. Falling back to MongoDB search:', error.message);
                const fallbackData = await fallbackSearch({
                    term: searchTerm,
                    limit,
                    sort,
                    types,
                    difficulties,
                    updatedAfter,
                    updatedBefore,
                    reason: resolveFallbackReason(error),
                });
                return res.status(200).json({
                    ...fallbackData,
                    sort,
                    types: types.length ? types : SUPPORTED_SEARCH_TYPES,
                    difficulties,
                    updatedAfter,
                    updatedBefore,
                });
            }
        }

        const fallbackData = await fallbackSearch({
            term: searchTerm,
            limit,
            sort,
            types,
            difficulties,
            updatedAfter,
            updatedBefore,
            reason: 'Elasticsearch is not configured. Results are provided via a MongoDB fallback search.',
        });
        return res.status(200).json({
            ...fallbackData,
            sort,
            types: types.length ? types : SUPPORTED_SEARCH_TYPES,
            difficulties,
            updatedAfter,
            updatedBefore,
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
        const [posts, tutorials, problems, pages] = await Promise.all([
            Post.find({}).lean(),
            Tutorial.find({}).lean(),
            Problem.find({}).lean(),
            Page.find({ status: 'published' }).lean(),
        ]);

        const [postResult, tutorialResult, problemResult, pageResult] = await Promise.all([
            bulkReplaceDocuments('post', posts),
            bulkReplaceDocuments('tutorial', tutorials),
            bulkReplaceDocuments('problem', problems),
            bulkReplaceDocuments('page', pages),
        ]);

        res.status(200).json({
            success: true,
            indexed: {
                posts: postResult.indexed,
                tutorials: tutorialResult.indexed,
                problems: problemResult.indexed,
                pages: pageResult.indexed,
            },
        });
    } catch (error) {
        next(error);
    }
};
