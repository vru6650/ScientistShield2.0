import Post from '../models/post.model.js';
import { errorHandler } from '../utils/error.js';
import { generateSlug } from '../utils/slug.js';
import { normalizePagination } from '../utils/pagination.js';
import { indexSearchDocument, removeSearchDocument } from '../services/search.service.js';

// --- CREATE, DELETEPOST, UPDATEPOST functions are here ---
// (Your existing code for these functions remains unchanged)

export const create = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return next(errorHandler(403, 'You are not allowed to create a post'));
  }
  if (!req.body.title || !req.body.content) {
    return next(errorHandler(400, 'Please provide all required fields'));
  }
  const slug = generateSlug(String(req.body.title));
  const newPost = new Post({
    ...req.body,
    slug,
    userId: req.user.id,
  });
  try {
    const savedPost = await newPost.save();
    await indexSearchDocument('post', savedPost);
    res.status(201).json(savedPost);
  } catch (error) {
    next(error);
  }
};

export const getposts = async (req, res, next) => {
    try {
        const { startIndex, limit } = normalizePagination(req.query, {
            defaultLimit: 9,
            maxLimit: 50,
        });

        // Determine sort direction: 1 for 'asc', -1 for 'desc'
        const sortDirection = req.query.order === 'asc' ? 1 : -1;

        // Determine the field to sort by (defaults to updatedAt)
        const sortBy = req.query.sort || 'updatedAt';

        // Construct the sort object
        const sortOptions = sortBy === 'claps' ? { claps: -1 } : { [sortBy]: sortDirection };

        const filters = {
            ...(req.query.userId && { userId: req.query.userId }),
            ...(req.query.category && { category: req.query.category }),
            ...(req.query.slug && { slug: req.query.slug }),
            ...(req.query.postId && { _id: req.query.postId }),
            ...(req.query.searchTerm && {
                $or: [
                    { title: { $regex: req.query.searchTerm, $options: 'i' } },
                    { content: { $regex: req.query.searchTerm, $options: 'i' } },
                ],
            }),
        };

        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const postsQuery = Post.find(filters)
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limit)
            .lean();

        const [posts, totalPosts, lastMonthPosts] = await Promise.all([
            postsQuery,
            Post.countDocuments(filters),
            Post.countDocuments({
                ...filters,
                createdAt: { $gte: oneMonthAgo },
            }),
        ]);

        res.status(200).json({
            posts,
            totalPosts,
            lastMonthPosts,
        });
    } catch (error) {
        next(error);
    }
};

export const deletepost = async (req, res, next) => {
  if (!req.user.isAdmin && req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'You are not allowed to delete this post'));
  }
  try {
    await Post.findByIdAndDelete(req.params.postId);
    await removeSearchDocument('post', req.params.postId);
    res.status(200).json('The post has been deleted');
  } catch (error) {
    next(error);
  }
};

export const updatepost = async (req, res, next) => {
  if (!req.user.isAdmin && req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'You are not allowed to update this post'));
  }
  try {
    const slug = req.body.title ? generateSlug(String(req.body.title)) : undefined;

    const updatedPost = await Post.findByIdAndUpdate(
        req.params.postId,
        {
          $set: {
            title: req.body.title,
            content: req.body.content,
            category: req.body.category,
            ...(slug && { slug }),
            mediaUrl: req.body.mediaUrl,
            mediaType: req.body.mediaType,
            image: req.body.image,
          },
        },
        { new: true }
    );
    if (updatedPost) {
        await indexSearchDocument('post', updatedPost);
    }
    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};

export const clapPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return next(errorHandler(404, 'Post not found'));
    }

    const userId = req.user.id;
    const userIndex = post.clappedBy.indexOf(userId);

    if (userIndex === -1) {
      post.claps += 1;
      post.clappedBy.push(userId);
    } else {
      post.claps -= 1;
      post.clappedBy.splice(userIndex, 1);
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

export const bookmarkPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return next(errorHandler(404, 'Post not found'));
    }

    if (!post.bookmarkedBy) {
      post.bookmarkedBy = [];
    }

    const userId = req.user.id;
    const userIndex = post.bookmarkedBy.indexOf(userId);

    let isBookmarked;

    if (userIndex === -1) {
      post.bookmarkedBy.push(userId);
      isBookmarked = true;
    } else {
      post.bookmarkedBy.splice(userIndex, 1);
      isBookmarked = false;
    }

    await post.save();
    res.status(200).json({ isBookmarked });
  } catch (error) {
    next(error);
  }
};
