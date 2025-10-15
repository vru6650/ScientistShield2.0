import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPosts } from '../services/postService';

export const usePostSearch = () => {
    const location = useLocation();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const [error, setError] = useState(null);

    // Effect for fetching posts when the URL search query changes
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);
            setPosts([]); // Clear previous results on a new search
            try {
                const urlParams = new URLSearchParams(location.search);
                const searchQuery = urlParams.toString();
                const data = await getPosts(searchQuery);

                setPosts(data.posts);
                setShowMore(data.posts.length === 9); // Assuming 9 is the page size
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [location.search]);

    // Function to fetch the next page of posts
    const fetchMorePosts = async () => {
        const urlParams = new URLSearchParams(location.search);
        urlParams.set('startIndex', posts.length);
        const searchQuery = urlParams.toString();

        try {
            const data = await getPosts(searchQuery);
            setPosts((prevPosts) => [...prevPosts, ...data.posts]);
            setShowMore(data.posts.length === 9);
        } catch (err) {
            // You could set an error state specific to the "show more" action if needed
            console.error('Failed to fetch more posts:', err);
        }
    };

    return { posts, loading, showMore, error, fetchMorePosts };
};