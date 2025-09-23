import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Tooltip, Spinner } from 'flowbite-react';
import moment from 'moment';

// --- Icon and Hook Imports ---
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShareAlt } from 'react-icons/fa';
import { HiDotsHorizontal } from 'react-icons/hi';
import { useLike } from '../hooks/useLike';
import { useBookmark } from '../hooks/useBookmark';
import useUser from '../hooks/useUser';

// --- SUB-COMPONENTS for Instagram-style Layout ---

const CardHeader = ({ userId }) => {
    const { user, isLoading } = useUser(userId);
    if (isLoading) {
        return (
            <div className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3">
                    <Skeleton circle width={40} height={40} />
                    <Skeleton width={120} />
                </div>
                <Skeleton width={24} height={24} />
            </div>
        );
    }
    return (
        <div className="flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
                <img
                    src={user?.profilePicture}
                    alt={user?.username}
                    className='w-10 h-10 rounded-full object-cover border-2 border-gray-300 dark:border-gray-500'
                />
                <span className='font-bold text-sm text-gray-800 dark:text-gray-200'>{user?.username || 'Anonymous'}</span>
            </div>
            <button className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2">
                <HiDotsHorizontal size={20} />
            </button>
        </div>
    );
};
CardHeader.propTypes = { userId: PropTypes.string.isRequired };


const CardMedia = ({ post, onDoubleClick, showLikeHeart }) => {
    const mediaUrl = post.mediaUrl || post.image;
    const mediaType = post.mediaType || 'image';
    return (
        <div onDoubleClick={onDoubleClick} className="relative w-full aspect-square bg-gray-200 dark:bg-gray-700 cursor-pointer">
            {mediaType === 'video' ? (
                <video src={mediaUrl} className='h-full w-full object-cover' loop autoPlay muted playsInline poster={post.image} />
            ) : (
                <img src={mediaUrl} alt={post.title} loading='lazy' className='h-full w-full object-cover' />
            )}
            <AnimatePresence>
                {showLikeHeart && (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <FaHeart className="text-white text-8xl drop-shadow-lg" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
CardMedia.propTypes = { post: PropTypes.object.isRequired, onDoubleClick: PropTypes.func, showLikeHeart: PropTypes.bool };


const CardActions = ({ post, likeProps, bookmarkProps, onActionClick, onShareClick }) => {
    // New state for share animation
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = (e) => {
        onShareClick(e);
        setIsSharing(true);
    };

    return (
        <div className="flex justify-between items-center px-3 py-2">
            <div className="flex items-center gap-4">
                <Tooltip content={likeProps.isLiked ? 'Unlike' : 'Like'}>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => onActionClick(e, likeProps.handleLike)}
                        disabled={likeProps.isLoading}
                        className='relative flex items-center gap-2 text-2xl text-gray-700 dark:text-gray-300'
                    >
                        {likeProps.isLoading ? <Spinner size="sm" /> :
                            <>
                                <AnimatePresence>
                                    {likeProps.isLiked && (
                                        <motion.div
                                            key="confetti"
                                            className="absolute inset-0"
                                            initial={{ opacity: 1 }}
                                            animate={{ opacity: [1, 0] }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                        >
                                            {[...Array(6)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="absolute"
                                                    initial={{ y: 0, scale: 0.5, opacity: 1 }}
                                                    animate={{
                                                        y: -40,
                                                        x: (Math.random() - 0.5) * 40,
                                                        scale: 0,
                                                        opacity: 0,
                                                        rotate: Math.random() * 360,
                                                    }}
                                                    transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                                                >
                                                    <FaHeart className="text-red-500" />
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <motion.span animate={{ scale: likeProps.isLiked ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.3 }}>
                                    {likeProps.isLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                                </motion.span>
                            </>
                        }
                    </motion.button>
                </Tooltip>
                <Tooltip content="Share">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={isSharing ? { rotate: [0, 15, -15, 15, 0], transition: { duration: 0.4 } } : {}}
                        onAnimationComplete={() => setIsSharing(false)}
                        onClick={handleShare}
                        className='text-2xl text-gray-700 dark:text-gray-300'
                    >
                        <FaShareAlt />
                    </motion.button>
                </Tooltip>
            </div>
            <Tooltip content={bookmarkProps.isBookmarked ? 'Remove Bookmark' : 'Bookmark'}>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => onActionClick(e, bookmarkProps.handleBookmark)}
                    disabled={bookmarkProps.isLoading}
                    className='text-2xl text-gray-700 dark:text-gray-300'
                >
                    {bookmarkProps.isLoading ? <Spinner size="sm" /> :
                        <motion.span
                            animate={{
                                rotateY: bookmarkProps.isBookmarked ? [0, 180, 0] : 0,
                                scale: bookmarkProps.isBookmarked ? [1, 1.2, 1] : 1
                            }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            style={{ display: 'inline-block' }}
                        >
                            {bookmarkProps.isBookmarked ? <FaBookmark className="text-professional-blue-500"/> : <FaRegBookmark />}
                        </motion.span>
                    }
                </motion.button>
            </Tooltip>
        </div>
    );
};
CardActions.propTypes = { post: PropTypes.object, likeProps: PropTypes.object, bookmarkProps: PropTypes.object, onActionClick: PropTypes.func, onShareClick: PropTypes.func };


const CardBody = ({ post, likeCount, authorUsername }) => {
    const getCaption = (htmlContent) => {
        if (!htmlContent) return post.title; // Fallback to title if content is empty
        const text = htmlContent.replace(/<[^>]*>?/gm, ''); // Simple HTML stripper
        return text.length > 100 ? text.substring(0, 100) + '...' : text;
    };

    const caption = getCaption(post.content);

    return (
        <div className="px-3 pb-3 text-sm text-gray-800 dark:text-gray-200">
            <p className="font-bold">{likeCount.toLocaleString()} likes</p>
            <p className="mt-1">
                <span className="font-bold mr-2">{authorUsername}</span>
                <span className="text-gray-700 dark:text-gray-300">{caption}</span>
                {caption.endsWith('...') && (
                    <Link to={`/post/${post.slug}`} className="text-gray-500 dark:text-gray-400 hover:underline ml-1">
                        more
                    </Link>
                )}
            </p>
            <Link to={`/post/${post.slug}#comments`} className="text-gray-500 dark:text-gray-400 block mt-2 hover:underline">
                View all comments
            </Link>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 uppercase">
                {moment(post.createdAt).fromNow()}
            </p>
        </div>
    );
};
CardBody.propTypes = { post: PropTypes.object, likeCount: PropTypes.number, authorUsername: PropTypes.string };


// --- Main PostCard Component ---
export default function PostCard({ post }) {
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const { user: author } = useUser(post.userId);

    const [showLikeHeart, setShowLikeHeart] = useState(false);

    const { likeCount, isLiked, isLoading: isLikeLoading, handleLike } = useLike(post.claps || 0, post.clappedBy?.includes(currentUser?._id), post._id);
    const { isBookmarked, isLoading: isBookmarkLoading, handleBookmark } = useBookmark(post.bookmarkedBy?.includes(currentUser?._id), post._id);

    const handleActionClick = (e, actionHandler) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser) { navigate('/sign-in'); return; }
        actionHandler();
    };

    const handleMediaDoubleClick = (e) => {
        e.preventDefault();
        if (!currentUser) { navigate('/sign-in'); return; }
        if (!isLiked) { // Only trigger like action, not unlike
            handleLike();
            setShowLikeHeart(true);
            setTimeout(() => setShowLikeHeart(false), 800);
        }
    };

    const handleShareClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({ title: post.title, text: post.title, url: `${window.location.origin}/post/${post.slug}` });
        } else {
            navigator.clipboard.writeText(`${window.location.origin}/post/${post.slug}`);
        }
    };

    return (
        <motion.div
            layoutId={`post-card-${post.slug}`}
            className='w-full border dark:border-slate-700 border-gray-200 rounded-xl sm:w-[420px] mx-auto shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col bg-white dark:bg-slate-800 overflow-hidden'
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
            <CardHeader userId={post.userId} />

            <CardMedia post={post} onDoubleClick={handleMediaDoubleClick} showLikeHeart={showLikeHeart} />

            <CardActions
                post={post}
                likeProps={{ isLiked, isLoading: isLikeLoading, handleLike }}
                bookmarkProps={{ isBookmarked, isLoading: isBookmarkLoading, handleBookmark }}
                onActionClick={handleActionClick}
                onShareClick={handleShareClick}
            />

            <CardBody
                post={post}
                likeCount={likeCount}
                authorUsername={author?.username || '...'}
            />
        </motion.div>
    );
}

PostCard.propTypes = {
    post: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        userId: PropTypes.string.isRequired,
        slug: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
        content: PropTypes.string,
        claps: PropTypes.number,
        clappedBy: PropTypes.arrayOf(PropTypes.string),
        bookmarkedBy: PropTypes.arrayOf(PropTypes.string),
        mediaUrl: PropTypes.string,
        image: PropTypes.string,
        mediaType: PropTypes.oneOf(['image', 'video']),
    }).isRequired,
};