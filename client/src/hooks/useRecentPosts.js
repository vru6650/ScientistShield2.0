import { useQuery } from '@tanstack/react-query';
import { Post } from '../types'; // Reuse the Post type

// --- API Fetch Function ---
const fetchRecentPosts = async (): Promise<Post[]> => {
    const res = await fetch(`/api/post/getposts?limit=3`);

    if (!res.ok) {
        // We can choose to not throw an error for recent posts
        // and just return an empty array if they fail to load.
        return [];
    }

    const data = await res.json();
    return data.posts;
};

// --- Custom Hook ---
export function useRecentPosts() {
    return useQuery<Post[], Error>({
        queryKey: ['posts', 'recent'],
        queryFn: fetchRecentPosts,
        staleTime: 1000 * 60 * 10, // Recent posts don't change as often
    });
}