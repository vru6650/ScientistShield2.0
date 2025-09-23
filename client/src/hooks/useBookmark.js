import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

// API function to bookmark/unbookmark a post
const bookmarkPost = async (postId, token) => {
    const res = await fetch(`/api/post/${postId}/bookmark`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to bookmark post.');
    }
    return res.json();
};

export const useBookmark = (initialIsBookmarked, postId) => {
    const { currentUser } = useSelector((state) => state.user);
    const queryClient = useQueryClient();

    const { mutate, isLoading } = useMutation({
        mutationFn: () => bookmarkPost(postId, currentUser?.token),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['posts'] });
            const previousPosts = queryClient.getQueryData(['posts']);

            queryClient.setQueryData(['posts'], (oldData) => {
                return oldData.map(p =>
                    p._id === postId
                        ? {
                            ...p,
                            bookmarkedBy: p.bookmarkedBy.includes(currentUser._id)
                                ? p.bookmarkedBy.filter(id => id !== currentUser._id)
                                : [...p.bookmarkedBy, currentUser._id],
                        }
                        : p
                );
            });

            return { previousPosts };
        },
        onError: (err, variables, context) => {
            if (context.previousPosts) {
                queryClient.setQueryData(['posts'], context.previousPosts);
            }
            console.error("Bookmark failed:", err);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });

    const posts = queryClient.getQueryData(['posts']) || [];
    const currentPostState = posts.find(p => p._id === postId);

    const isBookmarked = currentPostState?.bookmarkedBy?.includes(currentUser?._id) ?? initialIsBookmarked;

    return { isBookmarked, isLoading, handleBookmark: mutate };
};