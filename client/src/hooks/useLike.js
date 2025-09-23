import { useState, useEffect } from 'react';
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

    const [likeCount, setLikeCount] = useState(initialLikes || 0);
    const [isLiked, setIsLiked] = useState(!!initialIsLiked);

    useEffect(() => {
        setLikeCount(initialLikes || 0);
    }, [initialLikes]);

    useEffect(() => {
        setIsLiked(!!initialIsLiked);
    }, [initialIsLiked]);

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

            const previousLikeCount = likeCount;
            const previousIsLiked = isLiked;

            const optimisticIsLiked = !previousIsLiked;
            const optimisticLikeCount = previousLikeCount + (optimisticIsLiked ? 1 : -1);

            setIsLiked(optimisticIsLiked);
            setLikeCount(optimisticLikeCount);

            queryClient.setQueryData(['post', postId], (oldData) => {
                if (!oldData) return;
                return {
                    ...oldData,
                    claps: optimisticLikeCount,
                    clappedBy: optimisticIsLiked
                        ? [...(oldData.clappedBy || []), currentUser._id]
                        : (oldData.clappedBy || []).filter(id => id !== currentUser._id),
                };
            });

            return { previousPost, previousLikeCount, previousIsLiked };
        },
        onError: (err, _variables, context) => {
            queryClient.setQueryData(['post', postId], context.previousPost);
            setLikeCount(context.previousLikeCount);
            setIsLiked(context.previousIsLiked);
            console.error(err);
        },
        onSuccess: (data) => {
            if (!data) return;
            setLikeCount(data.claps || 0);
            setIsLiked(data.clappedBy?.includes(currentUser?._id) || false);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
        },
    });

    return {
        likeCount,
        isLiked,
        isLoading,
        handleLike: mutate
    };
};