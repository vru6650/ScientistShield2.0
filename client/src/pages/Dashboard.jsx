// client/src/pages/Dashboard.jsx
import { useEffect, useState, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { Spinner } from 'flowbite-react';
import { useSelector } from 'react-redux';

// Dynamically import components using React.lazy
const DashProfile = lazy(() => import('../components/DashProfile'));
const DashPosts = lazy(() => import('../components/DashPosts'));
const DashUsers = lazy(() => import('../components/DashUsers'));
const DashComments = lazy(() => import('../components/DashComments'));
const DashboardComp = lazy(() => import('../components/DashboardComp'));
const DashTutorials = lazy(() => import('../components/DashTutorials'));
const DashQuizzes = lazy(() => import('../components/DashQuizzes'));
const DashPages = lazy(() => import('../components/DashPages'));
const DashProblems = lazy(() => import('../components/DashProblems'));

// Create a map to associate tab names with their components.
const componentMap = {
    profile: DashProfile,
    posts: DashPosts,
    users: DashUsers,
    comments: DashComments,
    dash: DashboardComp,
    tutorials: DashTutorials,
    quizzes: DashQuizzes,
    content: DashPages,
    problems: DashProblems,
};

export default function Dashboard() {
    const location = useLocation();
    const [tab, setTab] = useState('');
    const { currentUser } = useSelector((state) => state.user);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const tabFromUrl = urlParams.get('tab');
        const defaultTab = currentUser?.isAdmin ? 'dash' : 'profile';
        setTab(tabFromUrl || defaultTab);
    }, [location.search, currentUser]);

    const ActiveComponent = componentMap[tab];

    return (
        <div className='min-h-screen w-full'>
            <Suspense
                fallback={
                    <div className='flex justify-center items-center min-h-screen w-full'>
                        <Spinner size='xl' />
                    </div>
                }
            >
                {ActiveComponent && <ActiveComponent />}
            </Suspense>
        </div>
    );
}
