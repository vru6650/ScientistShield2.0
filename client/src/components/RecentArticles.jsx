import { useRecentPosts } from '../hooks/useRecentPosts';
import PostCard from './PostCard';
import PostCardSkeleton from './skeletons/PostCardSkeleton'; // Import the PostCardSkeleton
import { Spinner, Alert } from 'flowbite-react'; // Import Alert

// This component is now self-contained. It fetches its own data.
export default function RecentArticles({ currentPostId }) {
    const { data: recentPosts, isLoading, isError, error } = useRecentPosts(); // Capture the error object

    // --- Enhanced Loading State ---
    if (isLoading) {
        return (
            <div className='flex flex-col items-center my-8'>
                <h2 className='text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6'>Loading Recent Articles</h2>
                <div className='flex flex-wrap gap-5 justify-center'>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <PostCardSkeleton key={index} />
                    ))}
                </div>
                <Spinner size='xl' className='mt-8' /> {/* Keep a spinner as a central indicator */}
            </div>
        );
    }

    // --- Enhanced Error State ---
    if (isError) {
        return (
            <div className='flex justify-center my-8'>
                <Alert color='failure' className='text-center max-w-lg'>
                    Failed to load recent articles. <span className='font-medium'>{error?.message || 'Please try again later.'}</span>
                </Alert>
            </div>
        );
    }

    // Filter out the current post from the "recent" list
    // Ensure recentPosts is an array before filtering
    const filteredPosts = Array.isArray(recentPosts)
        ? recentPosts.filter(p => p._id !== currentPostId)
        : [];

    // --- Handle No Posts Found State ---
    if (filteredPosts.length === 0) {
        return (
            <div className='flex flex-col items-center my-8 p-4 text-center text-gray-600 dark:text-gray-400'>
                <h2 className='text-2xl font-semibold mb-3'>No Other Recent Articles Available</h2>
                <p className='text-md'>It looks like this is the only recent article, or there aren't many yet. Check back soon for more!</p>
            </div>
        );
    }

    return (
        <div className='flex flex-col justify-center items-center mb-5 mt-10'> {/* Added more top margin */}
            <h1 className='text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100 drop-shadow-sm'>
                More Articles You Might Like
            </h1>
            <div className='flex flex-wrap gap-6 mt-5 justify-center'> {/* Increased gap */}
                {filteredPosts.map((p) => (
                    <PostCard key={p._id} post={p} />
                ))}
            </div>
        </div>
    );
}