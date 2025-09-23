import { useQuery } from '@tanstack/react-query';
import { Post } from '../types'; // Assuming you have a types file, or define it here

// --- API Fetch Function ---
const fetchPostBySlug = async (slug: string): Promise<Post> => {
    const res = await fetch(`/api/post/getposts?slug=${slug}`);

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch the post.');
    }

    const data = await res.json();
    if (data.posts.length === 0) {
        throw new Error('Post not found.');
    }

    return data.posts[0];
};

// --- Custom Hook ---
export function usePost(postSlug: string) {
    return useQuery<Post, Error>({
        queryKey: ['post', postSlug], // A unique key for this query
        queryFn: () => fetchPostBySlug(postSlug), // The function that fetches the data
        staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
    });
}