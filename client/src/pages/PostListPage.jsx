// client/src/pages/PostListPage.jsx
import { useState, useEffect } from 'react';
import PostCard from '../components/PostCard';
import PostCardSkeleton from '../components/skeletons/PostCardSkeleton';

const fetchPosts = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { slug: 'post-1', title: 'First Amazing Post', content: '...' },
                { slug: 'post-2', title: 'A Video Post', content: '...' },
            ]);
        }, 2000);
    });
};

export default function PostListPage() {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const fetchedPosts = await fetchPosts();
            setPosts(fetchedPosts);
            setIsLoading(false);
        };

        loadData();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <PostCardSkeleton key={index} />
                ))
                : posts.map((post) => <PostCard key={post.slug} post={post} />)}
        </div>
    );
}