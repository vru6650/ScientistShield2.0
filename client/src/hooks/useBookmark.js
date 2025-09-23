// src/hooks/useBookmark.js
import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';

// This would be your API service function
const toggleBookmarkStatus = async (postId) => {
    // This assumes you have an endpoint like PUT /api/posts/:postId/bookmark
    const res = await fetch(`/api/post/${postId}/bookmark`, { method: 'PUT' });
    if (!res.ok) throw new Error('Failed to update bookmark status.');
    return res.json();
};

export const useBookmark = (initialIsBookmarked, postId) => {
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
    const queryClient = useQueryClient();

    const { mutate, isLoading } = useMutation({
        mutationFn: () => toggleBookmarkStatus(postId),
        onSuccess: (data) => {
            setIsBookmarked(data.isBookmarked); // Update state from backend response
        },
        onError: (error) => {
            // Revert optimistic update if you implement one
            console.error(error);
            // Optionally show a toast notification for the error
        },
        onSettled: () => {
            // Invalidate queries to refetch post data across the app
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
        }
    });

    return { isBookmarked, isLoading, handleBookmark: mutate };
};