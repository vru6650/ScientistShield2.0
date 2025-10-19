import Page from '../models/page.model.js';
import { indexSearchDocument, removeSearchDocument } from '../services/search.service.js';
import { errorHandler } from '../utils/error.js';
import slugify from '../utils/slugify.js';
import { normalizePagination } from '../utils/pagination.js';

const allowedSectionTypes = new Set(['hero', 'rich-text', 'feature-grid', 'cta', 'custom']);
const allowedAlignments = new Set(['left', 'center', 'right']);

const sanitizeSections = (sections = []) => {
    if (!Array.isArray(sections)) {
        return [];
    }

    const sanitized = sections
        .map((section, index) => {
            if (!section || typeof section !== 'object') {
                return null;
            }

            const type = allowedSectionTypes.has(section.type) ? section.type : 'rich-text';
            const title = section.title?.toString().trim() ?? '';
            const subtitle = section.subtitle?.toString().trim() ?? '';
            const body = section.body?.toString().trim() ?? '';
            const alignment = allowedAlignments.has(section.alignment) ? section.alignment : 'left';
            const background = section.background?.toString().trim() || 'default';
            const order = Number.isFinite(Number(section.order)) ? Number(section.order) : index;

            const mediaUrl = section.media?.url ?? section.mediaUrl;
            const mediaAlt = section.media?.alt ?? section.mediaAlt;

            const ctaLabel = section.cta?.label ?? section.ctaLabel;
            const ctaUrl = section.cta?.url ?? section.ctaUrl;

            const items = Array.isArray(section.items)
                ? section.items
                    .map((item) => ({
                        title: item?.title?.toString().trim() ?? '',
                        body: item?.body?.toString().trim() ?? '',
                        icon: item?.icon?.toString().trim() ?? '',
                    }))
                    .filter((item) => item.title || item.body || item.icon)
                : [];

            const shouldKeep =
                title ||
                subtitle ||
                body ||
                items.length > 0 ||
                ctaLabel ||
                ctaUrl ||
                mediaUrl;

            if (!shouldKeep) {
                return null;
            }

            const sanitizedSection = {
                type,
                title,
                subtitle,
                body,
                alignment,
                background,
                order,
            };

            if (items.length > 0) {
                sanitizedSection.items = items;
            }

            if (mediaUrl || mediaAlt) {
                sanitizedSection.media = {
                    url: mediaUrl?.toString().trim() ?? '',
                    alt: mediaAlt?.toString().trim() ?? '',
                };
            }

            if (ctaLabel || ctaUrl) {
                sanitizedSection.cta = {
                    label: ctaLabel?.toString().trim() ?? '',
                    url: ctaUrl?.toString().trim() ?? '',
                };
            }

            return sanitizedSection;
        })
        .filter(Boolean)
        .sort((a, b) => a.order - b.order)
        .map((section, index) => ({ ...section, order: index }));

    return sanitized;
};

const normalizeKeywords = (keywords) => {
    if (Array.isArray(keywords)) {
        return keywords.map((keyword) => keyword?.toString().trim()).filter(Boolean);
    }

    if (typeof keywords === 'string') {
        return keywords
            .split(',')
            .map((keyword) => keyword.trim())
            .filter(Boolean);
    }

    return [];
};

const sortSections = (sections = []) =>
    [...sections].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

export const createPage = async (req, res, next) => {
    try {
        if (!req.user?.isAdmin) {
            return next(errorHandler(403, 'Only administrators can create content pages.'));
        }

        const { title, slug, description, sections, status = 'draft', seo = {} } = req.body;

        if (!title?.toString().trim()) {
            return next(errorHandler(400, 'Title is required.'));
        }

        const normalizedSlug = slugify(slug || title);
        const existingPage = await Page.findOne({ slug: normalizedSlug });

        if (existingPage) {
            return next(errorHandler(409, 'A page with this slug already exists.'));
        }

        const sanitizedSections = sanitizeSections(sections);
        const normalizedStatus = status === 'published' ? 'published' : 'draft';

        const page = await Page.create({
            title: title.trim(),
            slug: normalizedSlug,
            description: description?.toString().trim() ?? '',
            status: normalizedStatus,
            publishedAt: normalizedStatus === 'published' ? new Date() : undefined,
            sections: sanitizedSections,
            seo: {
                metaTitle: seo.metaTitle?.toString().trim() || title.trim(),
                metaDescription: seo.metaDescription?.toString().trim() || description?.toString().trim() || '',
                keywords: normalizeKeywords(seo.keywords),
            },
            createdBy: req.user.id,
            updatedBy: req.user.id,
        });

        const pageObject = page.toObject();
        pageObject.sections = sortSections(pageObject.sections);

        if (normalizedStatus === 'published') {
            await indexSearchDocument('page', page);
        }

        res.status(201).json(pageObject);
    } catch (error) {
        next(error);
    }
};

export const getPages = async (req, res, next) => {
    try {
        if (!req.user?.isAdmin) {
            return next(errorHandler(403, 'Only administrators can view content pages.'));
        }

        const { startIndex, limit } = normalizePagination(req.query, {
            defaultLimit: 10,
            maxLimit: 50,
        });
        const status = req.query.status;
        const searchTerm = req.query.searchTerm?.toString().trim();

        const filters = {};

        if (status && status !== 'all') {
            filters.status = status;
        }

        if (searchTerm) {
            filters.$or = [
                { title: { $regex: searchTerm, $options: 'i' } },
                { slug: { $regex: searchTerm, $options: 'i' } },
            ];
        }

        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

        const [pages, totalCount, lastMonthCount] = await Promise.all([
            Page.find(filters)
                .sort({ updatedAt: -1 })
                .skip(startIndex)
                .limit(limit)
                .lean(),
            Page.countDocuments(filters),
            Page.countDocuments({ ...filters, createdAt: { $gte: lastMonthDate } }),
        ]);

        const normalizedPages = pages.map((page) => ({
            ...page,
            sections: sortSections(page.sections ?? []),
        }));

        res.status(200).json({
            pages: normalizedPages,
            totalCount,
            lastMonthCount,
            limit,
            nextIndex: startIndex + normalizedPages.length,
            hasMore: startIndex + normalizedPages.length < totalCount,
        });
    } catch (error) {
        next(error);
    }
};

export const getPageById = async (req, res, next) => {
    try {
        if (!req.user?.isAdmin) {
            return next(errorHandler(403, 'Only administrators can view content pages.'));
        }

        const page = await Page.findById(req.params.pageId).lean();

        if (!page) {
            return next(errorHandler(404, 'Page not found.'));
        }

        page.sections = sortSections(page.sections ?? []);

        res.status(200).json(page);
    } catch (error) {
        next(error);
    }
};

export const updatePage = async (req, res, next) => {
    try {
        if (!req.user?.isAdmin) {
            return next(errorHandler(403, 'Only administrators can update content pages.'));
        }

        const page = await Page.findById(req.params.pageId);

        if (!page) {
            return next(errorHandler(404, 'Page not found.'));
        }

        const { title, slug, description, sections, status, seo = {} } = req.body;

        if (!title?.toString().trim()) {
            return next(errorHandler(400, 'Title is required.'));
        }

        const normalizedSlug = slugify(slug || title);

        if (normalizedSlug !== page.slug) {
            const slugExists = await Page.findOne({ slug: normalizedSlug, _id: { $ne: page._id } });
            if (slugExists) {
                return next(errorHandler(409, 'A page with this slug already exists.'));
            }
        }

        const sanitizedSections = sanitizeSections(sections);
        const normalizedStatus = status === 'published' ? 'published' : 'draft';
        const previousStatus = page.status;

        page.title = title.trim();
        page.slug = normalizedSlug;
        page.description = description?.toString().trim() ?? '';
        page.status = normalizedStatus;
        page.sections = sanitizedSections;
        page.seo = {
            metaTitle: seo.metaTitle?.toString().trim() || title.trim(),
            metaDescription: seo.metaDescription?.toString().trim() || description?.toString().trim() || '',
            keywords: normalizeKeywords(seo.keywords),
        };
        page.updatedBy = req.user.id;

        if (normalizedStatus === 'published' && !page.publishedAt) {
            page.publishedAt = new Date();
        }

        if (normalizedStatus === 'draft') {
            page.publishedAt = undefined;
        }

        await page.save();

        const pageObject = page.toObject();
        pageObject.sections = sortSections(pageObject.sections);

        if (normalizedStatus === 'published') {
            await indexSearchDocument('page', page);
        } else if (previousStatus === 'published') {
            await removeSearchDocument('page', page._id.toString());
        }

        res.status(200).json(pageObject);
    } catch (error) {
        next(error);
    }
};

export const deletePage = async (req, res, next) => {
    try {
        if (!req.user?.isAdmin) {
            return next(errorHandler(403, 'Only administrators can delete content pages.'));
        }

        const page = await Page.findById(req.params.pageId);

        if (!page) {
            return next(errorHandler(404, 'Page not found.'));
        }

        const pageId = page._id.toString();
        const wasPublished = page.status === 'published';

        await page.deleteOne();

        if (wasPublished) {
            await removeSearchDocument('page', pageId);
        }

        res.status(200).json({ message: 'Page deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

export const getPublishedPageBySlug = async (req, res, next) => {
    try {
        const slugParam = req.params.slug?.toString().trim();

        if (!slugParam) {
            return next(errorHandler(400, 'A page slug is required.'));
        }

        const normalizedSlug = slugify(slugParam);
        const page = await Page.findOne({ slug: normalizedSlug, status: 'published' }).lean();

        if (!page) {
            return next(errorHandler(404, 'Page not found.'));
        }

        page.sections = sortSections(page.sections ?? []);

        res.status(200).json(page);
    } catch (error) {
        next(error);
    }
};
