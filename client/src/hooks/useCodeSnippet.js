// client/src/hooks/useCodeSnippet.js
import { useState, useEffect } from 'react';

export default function useCodeSnippet(snippetId) {
    const [snippet, setSnippet] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!snippetId) {
            setSnippet(null);
            return;
        }

        const fetchSnippet = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/code-snippet/${snippetId}`);
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || 'Failed to fetch code snippet');
                }
                setSnippet(data);
            } catch (err) {
                setError(err.message);
                setSnippet(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSnippet();
    }, [snippetId]);

    return { snippet, isLoading, error };
}