import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Tooltip, Spinner } from 'flowbite-react';
import moment from 'moment';

// --- Icon and Hook Imports ---
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShareAlt, FaUserCircle } from 'react-icons/fa';
import { HiDotsHorizontal } from 'react-icons/hi';
import { useLike } from '../hooks/useLike';
import { useBookmark } from '../hooks/useBookmark';
import useUser from '../hooks/useUser';

// --- SUB-COMPONENTS for Instagram-style Layout ---

const CardHeader = ({ userId, fallbackUsername }) => {
    const { user, isLoading, error } = useUser(userId);
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
    const displayName = user?.username || fallbackUsername || 'Anonymous';
    const avatarSrc = user?.profilePicture;
    const showFallbackAvatar = !avatarSrc || error;

    return (
        <div className="flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
                {showFallbackAvatar ? (
                    <FaUserCircle className='w-10 h-10 text-gray-400 dark:text-gray-500' aria-hidden />
                ) : (
                    <img
                        src={avatarSrc}
                        alt={displayName}
                        className='w-10 h-10 rounded-full object-cover border-2 border-gray-300 dark:border-gray-500'
                    />
                )}
                <span className='font-bold text-sm text-gray-800 dark:text-gray-200'>{displayName}</span>
            </div>
            <button className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2">
                <HiDotsHorizontal size={20} />
            </button>
        </div>
    );
};
CardHeader.propTypes = { userId: PropTypes.string, fallbackUsername: PropTypes.string };


const CardMedia = ({ post, onDoubleClick, showLikeHeart }) => {
    const mediaType = post.mediaType || 'image';
    const fallbackImage = post.image || null;
    const mediaUrl = post.mediaUrl || fallbackImage;
    const shouldRenderVideo = mediaType === 'video' && !!post.mediaUrl;

    const [mediaOrientation, setMediaOrientation] = useState('landscape');
    const [isMediaLoading, setIsMediaLoading] = useState(Boolean(mediaUrl));

    const handleOrientationUpdate = useCallback((width, height) => {
        if (!width || !height) return;
        const ratio = width / height;
        if (Math.abs(ratio - 1) < 0.08) {
            setMediaOrientation('square');
            return;
        }
        setMediaOrientation(ratio > 1 ? 'landscape' : 'portrait');
    }, []);

    const handleImageLoad = useCallback((event) => {
        const { naturalWidth, naturalHeight } = event.target || {};
        handleOrientationUpdate(naturalWidth, naturalHeight);
        setIsMediaLoading(false);
    }, [handleOrientationUpdate]);

    const handleVideoMetadata = useCallback((event) => {
        const { videoWidth, videoHeight } = event.target || {};
        handleOrientationUpdate(videoWidth, videoHeight);
        setIsMediaLoading(false);
    }, [handleOrientationUpdate]);

    const handleMediaError = useCallback(() => {
        setIsMediaLoading(false);
    }, []);

    const baseClass = 'relative w-full overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer';

    const orientationClasses = useMemo(() => {
        if (!mediaUrl) {
            return 'flex items-center justify-center py-12';
        }

        if (shouldRenderVideo) {
            return 'aspect-video max-h-[520px]';
        }

        if (isMediaLoading) {
            return 'aspect-[4/3] sm:aspect-[3/2] lg:aspect-[16/9] max-h-[420px]';
        }

        switch (mediaOrientation) {
            case 'portrait':
                return 'aspect-[3/4] sm:aspect-[4/5] lg:aspect-[9/16] max-h-[560px]';
            case 'square':
                return 'aspect-square max-h-[520px]';
            default:
                return 'aspect-[4/3] sm:aspect-[3/2] lg:aspect-[16/9] max-h-[460px]';
        }
    }, [isMediaLoading, mediaOrientation, mediaUrl, shouldRenderVideo]);

    return (
        <div onDoubleClick={onDoubleClick} className={`${baseClass} ${orientationClasses}`}>
            {isMediaLoading && mediaUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 animate-pulse">
                    <Spinner aria-hidden size="lg" />
                </div>
            )}
            {mediaUrl ? (
                shouldRenderVideo ? (
                    <video
                        src={mediaUrl}
                        className='h-full w-full object-cover'
                        loop
                        autoPlay
                        muted
                        playsInline
                        poster={fallbackImage || undefined}
                        onLoadedMetadata={handleVideoMetadata}
                        onError={handleMediaError}
                    />
                ) : (
                    <img
                        src={mediaUrl}
                        alt={post.title}
                        loading='lazy'
                        onLoad={handleImageLoad}
                        onError={handleMediaError}
                        className='h-full w-full object-cover transition-opacity duration-300'
                        style={{ opacity: isMediaLoading ? 0 : 1 }}
                    />
                )
            ) : (
                <div className='text-gray-500 dark:text-gray-300 text-sm text-center px-6'>
                    Media unavailable
                </div>
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


const CardActions = ({ likeProps, bookmarkProps, onActionClick, onShareClick, shareTooltip, disableLikes, disableBookmarks, disableShare }) => {
    // New state for share animation
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async (e) => {
        if (disableShare) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        setIsSharing(true);
        try {
            await onShareClick(e);
        } catch (error) {
            console.error('Share handler failed:', error);
        }
    };

    return (
        <div className="flex justify-between items-center px-3 py-2">
            <div className="flex items-center gap-4">
                <Tooltip content={disableLikes ? 'Likes unavailable' : (likeProps.isLiked ? 'Unlike' : 'Like')}>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => !disableLikes && onActionClick(e, likeProps.handleLike)}
                        disabled={likeProps.isLoading || disableLikes}
                        className={`relative flex items-center gap-2 text-2xl text-gray-700 dark:text-gray-300 ${disableLikes ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                <Tooltip content={shareTooltip}>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={isSharing ? { rotate: [0, 15, -15, 15, 0], transition: { duration: 0.4 } } : {}}
                        onAnimationComplete={() => setIsSharing(false)}
                        onClick={handleShare}
                        disabled={disableShare}
                        aria-disabled={disableShare}
                        className={`text-2xl text-gray-700 dark:text-gray-300 ${disableShare ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <FaShareAlt />
                    </motion.button>
                </Tooltip>
            </div>
            <Tooltip content={disableBookmarks ? 'Bookmarks unavailable' : (bookmarkProps.isBookmarked ? 'Remove Bookmark' : 'Bookmark')}>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => !disableBookmarks && onActionClick(e, bookmarkProps.handleBookmark)}
                    disabled={bookmarkProps.isLoading || disableBookmarks}
                    className={`text-2xl text-gray-700 dark:text-gray-300 ${disableBookmarks ? 'opacity-50 cursor-not-allowed' : ''}`}
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
CardActions.propTypes = { likeProps: PropTypes.object, bookmarkProps: PropTypes.object, onActionClick: PropTypes.func, onShareClick: PropTypes.func, shareTooltip: PropTypes.string, disableLikes: PropTypes.bool, disableBookmarks: PropTypes.bool, disableShare: PropTypes.bool };


const CardBody = ({ post, likeCount, authorUsername }) => {
    const getCaption = (htmlContent) => {
        if (!htmlContent) return post.title; // Fallback to title if content is empty
        const text = htmlContent.replace(/<[^>]*>?/gm, ''); // Simple HTML stripper
        return text.length > 100 ? text.substring(0, 100) + '...' : text;
    };

    const caption = getCaption(post.content);
    const safeCaption = caption || 'Untitled post';
    const likeTotal = Number.isFinite(likeCount) ? likeCount : 0;
    const hasSlug = Boolean(post?.slug);
    const publishedLabel = post?.createdAt ? moment(post.createdAt).fromNow() : 'Recently';
    const showMoreLink = safeCaption.endsWith('...') && hasSlug;

    return (
        <div className="px-3 pb-3 text-sm text-gray-800 dark:text-gray-200">
            <p className="font-bold">{likeTotal.toLocaleString()} likes</p>
            <p className="mt-1">
                <span className="font-bold mr-2">{authorUsername}</span>
                <span className="text-gray-700 dark:text-gray-300">{safeCaption}</span>
                {showMoreLink && (
                    <Link to={`/post/${post.slug}`} className="text-gray-500 dark:text-gray-400 hover:underline ml-1">
                        more
                    </Link>
                )}
            </p>
            {hasSlug ? (
                <Link to={`/post/${post.slug}#comments`} className="text-gray-500 dark:text-gray-400 block mt-2 hover:underline">
                    View all comments
                </Link>
            ) : (
                <span className="text-gray-400 dark:text-gray-500 block mt-2">Comments unavailable</span>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 uppercase">
                {publishedLabel}
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
    const hasShareTarget = Boolean(post?.slug);
    const [shareTooltip, setShareTooltip] = useState(hasShareTarget ? 'Share' : 'Link unavailable');
    const shareResetTimeoutRef = useRef(null);

    const navigationTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (shareResetTimeoutRef.current) {
                clearTimeout(shareResetTimeoutRef.current);
            }
            if (navigationTimeoutRef.current) {
                clearTimeout(navigationTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setShareTooltip(post?.slug ? 'Share' : 'Link unavailable');
    }, [post?.slug]);

    const scheduleShareTooltipReset = () => {
        if (shareResetTimeoutRef.current) {
            clearTimeout(shareResetTimeoutRef.current);
        }
        shareResetTimeoutRef.current = setTimeout(() => setShareTooltip(post?.slug ? 'Share' : 'Link unavailable'), 2000);
    };

    const updateShareTooltip = (message) => {
        setShareTooltip(message);
        scheduleShareTooltipReset();
    };

    const copyToClipboard = async (text) => {
        if (!text) return false;
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch (error) {
            console.warn('Async clipboard copy failed, falling back to execCommand.', error);
        }

        if (typeof document === 'undefined') return false;

        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.setAttribute('readonly', '');
            textArea.style.position = 'absolute';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (error) {
            console.error('Clipboard copy via execCommand failed:', error);
            return false;
        }
    };

    const postId = post?._id;
    const canInteractWithPost = Boolean(postId);
    const { likeCount, isLiked, isLoading: isLikeLoading, handleLike } = useLike(post.claps || 0, post.clappedBy?.includes(currentUser?._id), postId);
    const { isBookmarked, isLoading: isBookmarkLoading, handleBookmark } = useBookmark(post.bookmarkedBy?.includes(currentUser?._id), postId);

    const handleActionClick = (e, actionHandler) => {
        e.preventDefault();
        e.stopPropagation();
        if (!canInteractWithPost) { return; }
        if (!currentUser) { navigate('/sign-in'); return; }
        actionHandler();
    };

    const handleCardClick = (event) => {
        if (event?.defaultPrevented) return;

        const interactiveElement = event?.target?.closest('button, a, input, textarea, select, label');
        if (interactiveElement) return;

        if (!post?.slug) return;

        if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
        }

        navigationTimeoutRef.current = setTimeout(() => {
            navigationTimeoutRef.current = null;
            navigate(`/post/${post.slug}`);
        }, 180);
    };

    const handleMediaDoubleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
            navigationTimeoutRef.current = null;
        }

        if (!canInteractWithPost) { return; }
        if (!currentUser) { navigate('/sign-in'); return; }
        if (!isLiked) { // Only trigger like action, not unlike
            handleLike();
            setShowLikeHeart(true);
            setTimeout(() => setShowLikeHeart(false), 800);
        }
    };

    const handleShareClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!post?.slug) {
            updateShareTooltip('Link unavailable');
            return;
        }

        const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${post.slug}` : '';
        const shareData = { title: post.title, text: post.title, url: shareUrl };

        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share(shareData);
                updateShareTooltip('Shared!');
                return;
            } catch (error) {
                if (error?.name === 'AbortError') {
                    // User cancelled the native share sheet; keep tooltip as-is.
                    return;
                }
                console.warn('Native share failed; falling back to clipboard copy.', error);
            }
        }

        const copied = await copyToClipboard(shareData.url);
        updateShareTooltip(copied ? 'Link copied!' : 'Copy failed');
    };

    return (
        <motion.div
            layoutId={`post-card-${post.slug || post._id || 'unknown'}`}
            className='w-full border dark:border-slate-700 border-gray-200 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col bg-white dark:bg-slate-800 overflow-hidden'
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            onClick={handleCardClick}
        >
            <CardHeader userId={post.userId} fallbackUsername={post?.authorName || post?.username || post?.author} />

            <CardMedia post={post} onDoubleClick={canInteractWithPost ? handleMediaDoubleClick : undefined} showLikeHeart={showLikeHeart} />

            <CardActions
                likeProps={{ isLiked, isLoading: isLikeLoading, handleLike }}
                bookmarkProps={{ isBookmarked, isLoading: isBookmarkLoading, handleBookmark }}
                onActionClick={handleActionClick}
                onShareClick={handleShareClick}
                shareTooltip={shareTooltip}
                disableLikes={!canInteractWithPost}
                disableBookmarks={!canInteractWithPost}
                disableShare={!post?.slug}
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
        _id: PropTypes.string,
        userId: PropTypes.string,
        slug: PropTypes.string,
        title: PropTypes.string,
        createdAt: PropTypes.string,
        content: PropTypes.string,
        claps: PropTypes.number,
        clappedBy: PropTypes.arrayOf(PropTypes.string),
        bookmarkedBy: PropTypes.arrayOf(PropTypes.string),
        mediaUrl: PropTypes.string,
        image: PropTypes.string,
        mediaType: PropTypes.oneOf(['image', 'video']),
        authorName: PropTypes.string,
        username: PropTypes.string,
        author: PropTypes.string,
    }).isRequired,
};