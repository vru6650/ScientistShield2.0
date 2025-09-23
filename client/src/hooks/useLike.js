import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const toggleLikeStatus = async (postId) => {
    const res = await fetch(`/api/post/clap/${postId}`, {
        method: 'PUT',
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update like status.');
    }

    return res.json();
};

export const useLike = (initialLikes, initialIsLiked, postId) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.user);

    const { mutate, isLoading } = useMutation({
        mutationFn: () => {
            if (!currentUser) {
                navigate('/sign-in');
                return Promise.reject(new Error('You must be logged in to like a post.'));
            }
            return toggleLikeStatus(postId);
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['post', postId] });
            const previousPost = queryClient.getQueryData(['post', postId]);

            queryClient.setQueryData(['post', postId], (oldData) => {
                if (!oldData) return;
                const newIsLiked = !initialIsLiked;
                const newLikeCount = newIsLiked ? (oldData.claps || 0) + 1 : (oldData.claps || 0) - 1;

                return {
                    ...oldData,
                    claps: newLikeCount,
                    clappedBy: newIsLiked
                        ? [...(oldData.clappedBy || []), currentUser._id]
                        : (oldData.clappedBy || []).filter(id => id !== currentUser._id),
                };
            });

            return { previousPost };
        },
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(['post', postId], context.previousPost);
            console.error(err);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
        },
    });

    return {
        likeCount: initialLikes,
        isLiked: initialIsLiked,
        isLoading,
        handleLike: mutate
    };
};