import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useState, useRef, useEffect } from 'react';

// --- Icon and Hook Imports ---
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShareAlt } from 'react-icons/fa'; // Added FaShareAlt
import { useLike } from '../hooks/useLike';
import { useBookmark } from '../hooks/useBookmark';

// --- Helper function to calculate reading time ---
const calculateReadingTime = (content) => {
    if (!content) return 1;
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
};

// --- Media sub-component for handling image/video with hover-to-play ---
const CardMedia = ({ post, isHovering }) => {
    const mediaUrl = post.mediaUrl || post.image;
    const mediaType = post.mediaType || 'image';
    const videoRef = useRef(null);

    // Effect to control video playback
    useEffect(() => {
        if (videoRef.current) {
            if (isHovering) {
                videoRef.current.play().catch(error => console.log('Video play failed:', error));
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0; // Rewind video on mouse leave
            }
        }
    }, [isHovering]);

    if (mediaType === 'video') {
        return (
            <video
                ref={videoRef}
                src={mediaUrl}
                className='h-full w-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out' // Added subtle zoom on hover
                loop
                muted
                playsInline
                poster={post.image} // Fallback image for video
            />
        );
    }
    return <img src={mediaUrl} alt={post.title} loading='lazy' className='h-full w-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out' />; // Added subtle zoom on hover
};

// --- Main PostCard Component ---
export default function PostCard({ post }) {
    // --- State and Hooks ---
    // MOCK: Replace with your actual authentication state from context or Redux
    const { currentUser } = { currentUser: { _id: 'sampleUserId123' } };
    const navigate = useNavigate();
    const [isHovering, setIsHovering] = useState(false);
    const [showShareTooltip, setShowShareTooltip] = useState(false); // New state for share tooltip

    // Custom hooks for like and bookmark functionality
    const { likeCount, isLiked, isLoading: isLikeLoading, handleLike } = useLike(post.likes || 0, post.clappedBy?.includes(currentUser?._id), post._id);
    const { isBookmarked, isLoading: isBookmarkLoading, handleBookmark } = useBookmark(post.bookmarkedBy?.includes(currentUser?._id), post._id);

    // --- Event Handlers ---
    const handleActionClick = (e, actionHandler) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser) {
            navigate('/sign-in');
            return;
        }
        actionHandler();
    };

    const handleShareClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: post.title,
                url: window.location.origin + `/post/${post.slug}`,
            }).catch(error => console.log('Error sharing:', error));
        } else {
            // Fallback for browsers that don't support Web Share API
            // You might implement a custom share modal here, or just copy link
            navigator.clipboard.writeText(window.location.origin + `/post/${post.slug}`)
                .then(() => {
                    setShowShareTooltip(true);
                    setTimeout(() => setShowShareTooltip(false), 2000); // Hide tooltip after 2 seconds
                })
                .catch(error => console.log('Could not copy link:', error));
        }
    };

    const readingTime = calculateReadingTime(post.content);

    return (
        <motion.div
            layoutId={`post-card-${post.slug}`}
            className='group relative w-full border dark:border-slate-700 border-gray-200 h-[460px] overflow-hidden rounded-xl sm:w-[380px] mx-auto shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col'
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            whileHover={{ scale: 1.03 }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* --- Buttons Container --- */}
            <div className='absolute top-3 right-3 z-20 flex items-center gap-3 bg-white/70 dark:bg-black/50 backdrop-blur-sm p-2 rounded-full transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg'>
                {/* Bookmark Button */}
                <motion.button
                    onClick={(e) => handleActionClick(e, handleBookmark)}
                    disabled={isBookmarkLoading}
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
                    className='text-professional-blue-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-professional-blue-500 focus:ring-offset-2 rounded-full p-1' // Added p-1 for consistent icon size
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                >
                    {isBookmarked ? <FaBookmark size={16} /> : <FaRegBookmark size={16} />}
                </motion.button>

                {/* Like Button */}
                <div className='flex items-center gap-1 border-l border-gray-400 dark:border-gray-600 pl-2'>
                    <motion.button
                        onClick={(e) => handleActionClick(e, handleLike)}
                        disabled={isLikeLoading}
                        aria-label={isLiked ? 'Unlike post' : 'Like post'}
                        className='text-red-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-full p-1' // Added p-1
                        whileHover={{ scale: 1.2, rotate: -5 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {isLiked ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
                    </motion.button>
                    <span className='text-xs font-semibold dark:text-gray-200'>{likeCount}</span>
                </div>

                {/* Share Button */}
                <div className='relative flex items-center gap-1 border-l border-gray-400 dark:border-gray-600 pl-2'>
                    <motion.button
                        onClick={handleShareClick}
                        aria-label="Share post"
                        className='text-gray-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-full p-1' // Added p-1
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <FaShareAlt size={16} />
                    </motion.button>
                    {showShareTooltip && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className='absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-700 text-white text-xs rounded py-1 px-2 pointer-events-none'
                        >
                            Link copied!
                        </motion.div>
                    )}
                </div>
            </div>

            {/* --- Media Link --- */}
            <Link to={`/post/${post.slug}`} className='block h-[220px] w-full overflow-hidden'>
                <motion.div layoutId={`post-image-${post.slug}`} className='h-full w-full'>
                    <CardMedia post={post} isHovering={isHovering} />
                </motion.div>
            </Link>

            {/* --- Content Section --- */}
            <div className='p-4 flex flex-col gap-2 bg-white dark:bg-slate-800 flex-grow'>
                <div className='flex justify-between items-center text-xs'>
                    <span className='px-2 py-1 bg-professional-blue-100 dark:bg-professional-blue-900 text-professional-blue-700 dark:text-professional-blue-300 rounded-full self-start font-medium tracking-wide shadow-sm'> {/* Added shadow-sm */}
                        {post.category}
                    </span>
                    <span className='text-gray-500 dark:text-gray-400 text-sm italic'>{readingTime} min read</span>
                </div>

                <h3 className='text-xl font-bold line-clamp-2 dark:text-gray-100 mt-1 hover:text-professional-blue-500 transition-colors duration-200'>{post.title}</h3>

                <div className='flex items-center gap-2 mt-2'>
                    {post.author?.profilePicture ? (
                        <img
                            src={post.author.profilePicture}
                            alt={post.author.name || 'Author'}
                            className='w-8 h-8 rounded-full object-cover border-2 border-professional-blue-400 shadow-md' // Added shadow-md
                        />
                    ) : (
                        <div className='w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse'></div>
                    )}
                    <span className='text-sm text-gray-600 dark:text-gray-300 font-medium hover:text-professional-blue-500 transition-colors duration-200'>{post.author?.name || 'Anonymous'}</span>
                </div>

                <Link
                    to={`/post/${post.slug}`}
                    className='mt-auto w-full text-center border-2 border-professional-blue-500 text-professional-blue-500 font-bold py-2 rounded-lg'
                    as={motion.a}
                    whileHover={{
                        scale: 1.05,
                        backgroundColor: '#3a8adf',
                        color: 'white',
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)' // Slightly stronger shadow
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                    Read Article
                </Link>
            </div>
        </motion.div>
    );
}

// --- PropType Definitions ---
PostCard.propTypes = {
    post: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        slug: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        likes: PropTypes.number,
        clappedBy: PropTypes.arrayOf(PropTypes.string),
        bookmarkedBy: PropTypes.arrayOf(PropTypes.string),
        mediaUrl: PropTypes.string,
        image: PropTypes.string,
        mediaType: PropTypes.oneOf(['image', 'video']),
        author: PropTypes.shape({
            name: PropTypes.string,
            profilePicture: PropTypes.string,
        }),
    }).isRequired,
};