import { useState, useCallback } from 'react';

// A mock API function to simulate a network request
const mockApiCall = (shouldSucceed) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (shouldSucceed) {
                resolve({ success: true });
            } else {
                reject(new Error('Failed to update like status.'));
            }
        }, 500); // 500ms delay
    });
};

export const useLike = (initialLikes, initialIsLiked = false) => {
    const [likeCount, setLikeCount] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLike = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        // Optimistic UI update: change state immediately
        const originalIsLiked = isLiked;
        const originalLikeCount = likeCount;

        setIsLiked(prev => !prev);
        setLikeCount(prev => (isLiked ? prev - 1 : prev + 1));

        try {
            // Make the API call
            // In a real app, you might pass a postId here.
            await mockApiCall(true); // Change to 'false' to test error handling

            // If API call is successful, do nothing, our state is already updated.

        } catch (err) {
            // If it fails, revert the state and set an error message
            setError(err.message);
            setIsLiked(originalIsLiked);
            setLikeCount(originalLikeCount);
            console.error(error); // Log the error for debugging
        } finally {
            setIsLoading(false);
        }
    }, [isLiked, likeCount, error]);

    return { likeCount, isLiked, isLoading, handleLike };
};