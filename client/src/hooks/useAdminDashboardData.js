import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../utils/apiFetch';

const defaultDashboardState = Object.freeze({
    users: [],
    posts: [],
    comments: [],
    pages: [],
    tutorials: [],
    quizzes: [],
    problems: [],
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalPages: 0,
    totalTutorials: 0,
    totalQuizzes: 0,
    totalProblems: 0,
    lastMonthUsers: 0,
    lastMonthPosts: 0,
    lastMonthComments: 0,
    lastMonthPages: 0,
    lastMonthTutorials: 0,
    lastMonthQuizzes: 0,
    lastMonthProblems: 0,
});

export default function useAdminDashboardData(isEnabled) {
    const [data, setData] = useState(defaultDashboardState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastSynced, setLastSynced] = useState(null);

    const fetchData = useCallback(async () => {
        if (!isEnabled) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [userRes, postRes, commentRes, pageRes, tutorialRes, quizRes, problemRes] = await Promise.all([
                apiFetch('/api/user/getusers?limit=5'),
                apiFetch('/api/post/getposts?limit=5'),
                apiFetch('/api/comment/getcomments?limit=5'),
                apiFetch('/api/pages?limit=5'),
                apiFetch('/api/tutorial/gettutorials?limit=5'),
                apiFetch('/api/quizzes?limit=5'),
                apiFetch('/api/problems?limit=5&includeDrafts=true'),
            ]);

            const [userData, postData, commentData, pageData, tutorialData, quizData, problemData] = await Promise.all([
                userRes.json(),
                postRes.json(),
                commentRes.json(),
                pageRes.json(),
                tutorialRes.json(),
                quizRes.json(),
                problemRes.json(),
            ]);

            if (!userRes.ok || !postRes.ok || !commentRes.ok || !pageRes.ok || !tutorialRes.ok || !quizRes.ok || !problemRes.ok) {
                const message =
                    userData.message ||
                    postData.message ||
                    commentData.message ||
                    pageData.message ||
                    tutorialData.message ||
                    quizData.message ||
                    problemData.message ||
                    'Failed to fetch admin metrics. Please try again.';
                throw new Error(message);
            }

            setData({
                users: userData.users || [],
                posts: postData.posts || [],
                comments: commentData.comments || [],
                pages: pageData.pages || [],
                tutorials: tutorialData.tutorials || [],
                quizzes: quizData.quizzes || [],
                problems: problemData.problems || [],
                totalUsers: userData.totalUsers || 0,
                totalPosts: postData.totalPosts || 0,
                totalComments: commentData.totalComments || 0,
                totalPages: pageData.totalCount || 0,
                totalTutorials: tutorialData.totalTutorials || 0,
                totalQuizzes: quizData.totalQuizzes || 0,
                totalProblems: problemData.totalProblems || 0,
                lastMonthUsers: userData.lastMonthUsers || 0,
                lastMonthPosts: postData.lastMonthPosts || 0,
                lastMonthComments: commentData.lastMonthComments || 0,
                lastMonthPages: pageData.lastMonthCount || 0,
                lastMonthTutorials: tutorialData.lastMonthTutorials || 0,
                lastMonthQuizzes: quizData.lastMonthQuizzes || 0,
                lastMonthProblems: problemData.lastMonthProblems || 0,
            });
            setLastSynced(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unexpected error while loading admin data.');
        } finally {
            setLoading(false);
        }
    }, [isEnabled]);

    useEffect(() => {
        if (isEnabled) {
            fetchData();
        }
    }, [isEnabled, fetchData]);

    return useMemo(
        () => ({
            data,
            loading,
            error,
            refetch: fetchData,
            lastSynced,
        }),
        [data, error, fetchData, lastSynced, loading],
    );
}
