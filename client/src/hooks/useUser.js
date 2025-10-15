import { useState, useEffect } from 'react';

// A simple in-memory cache to store fetched user data
const userCache = new Map();

export default function useUser(userId) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        const getUser = async () => {
            // 1. Check if user is already in our cache
            if (userCache.has(userId)) {
                setUser(userCache.get(userId));
                setIsLoading(false);
                return;
            }

            // 2. If not in cache, fetch from the API
            try {
                setIsLoading(true);
                setError(null);
                const res = await fetch(`/api/user/${userId}`);
                const data = await res.json();

                if (res.ok) {
                    // 3. Store the new user data in the cache
                    userCache.set(userId, data);
                    setUser(data);
                } else {
                    throw new Error(data.message || 'Failed to fetch user');
                }
            } catch (error) {
                setError(error.message);
                console.error("Failed to fetch user:", error.message);
            } finally {
                setIsLoading(false);
            }
        };

        getUser();
    }, [userId]); // This effect re-runs only if the userId prop changes

    return { user, isLoading, error };
}