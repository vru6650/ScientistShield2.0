import { Link } from 'react-router-dom';
import { Button, Alert } from 'flowbite-react';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { getPosts } from '../services/postService';

// Lazy-load heavy UI chunks for faster first paint
const Hero = lazy(() => import('../components/Hero'));
const CategoryCard = lazy(() => import('../components/CategoryCard'));
const CodeEditor = lazy(() => import('../components/CodeEditor'));
const PostCard = lazy(() => import('../components/PostCard'));

// Simple skeletons (no extra deps)
function CategoryCardSkeleton() {
    return (
        <div className="rounded-2xl p-6 bg-white/60 dark:bg-gray-800/60 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
            <div className="h-8 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
            <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-1.5" />
            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
    );
}

function PostCardSkeleton() {
    return (
        <div className="rounded-2xl overflow-hidden bg-white/60 dark:bg-gray-800/60 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
            <div className="h-40 bg-gray-200 dark:bg-gray-700" />
            <div className="p-4">
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
        </div>
    );
}

function EditorSkeleton() {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 shadow-sm p-4 animate-pulse">
            <div className="h-8 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
    );
}

export default function Home() {
    const [latestPosts, setLatestPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Centralize category config
    const categories = useMemo(
        () => [
            {
                title: 'HTML',
                description: 'The language for building web pages',
                linkTo: '/tutorials?category=html',
                gradient: 'bg-gradient-to-br from-orange-400 to-rose-500',
                delay: '0.1s',
            },
            {
                title: 'CSS',
                description: 'The language for styling web pages',
                linkTo: '/tutorials?category=css',
                gradient: 'bg-gradient-to-br from-sky-500 to-indigo-600',
                delay: '0.2s',
            },
            {
                title: 'JavaScript',
                description: 'The language for programming web pages',
                linkTo: '/tutorials?category=javascript',
                gradient: 'bg-gradient-to-br from-yellow-400 to-amber-600',
                delay: '0.3s',
            },
            {
                title: 'React.js',
                description: 'A library for building user interfaces',
                linkTo: '/tutorials?category=reactjs',
                gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',
                delay: '0.4s',
            },
            {
                title: 'Node.js',
                description: "JS runtime built on Chrome's V8 engine",
                linkTo: '/tutorials?category=node.js',
                gradient: 'bg-gradient-to-br from-lime-500 to-emerald-600',
                delay: '0.5s',
            },
            {
                title: 'C',
                description: 'A powerful general-purpose language',
                linkTo: '/tutorials?category=c',
                gradient: 'bg-gradient-to-br from-slate-500 to-gray-700',
                delay: '0.6s',
            },
        ],
        []
    );

    // Fetch posts with an unmount guard
    useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const postsData = await getPosts('limit=6'); // grab a few more
                if (!active) return;
                setLatestPosts(postsData?.posts ?? []);
            } catch (err) {
                console.error('Failed to fetch data:', err);
                if (!active) return;
                setError('Failed to load content. Please try again.');
            } finally {
                if (!active) return;
                setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    const retry = async () => {
        setError(null);
        setLoading(true);
        try {
            const postsData = await getPosts('limit=6');
            setLatestPosts(postsData?.posts ?? []);
        } catch (err) {
            console.error('Retry failed:', err);
            setError('Still having trouble. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen">
            {/* Soft gradient glow background */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-32 -z-10 blur-3xl opacity-30 dark:opacity-20"
            >
                <div className="mx-auto h-64 w-3/4 rounded-full bg-gradient-to-tr from-purple-500 via-indigo-500 to-sky-500" />
            </div>

            {/* Error banner (non-blocking) */}
            {error && (
                <div className="px-4 pt-4 max-w-7xl mx-auto">
                    <Alert color="failure" onDismiss={() => setError(null)}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <span>{error}</span>
                            <Button size="sm" gradientDuoTone="purpleToBlue" onClick={retry}>
                                Retry
                            </Button>
                        </div>
                    </Alert>
                </div>
            )}

            {/* Hero */}
            <Suspense fallback={<div className="h-72 sm:h-80 lg:h-96" />}>
                <Hero />
            </Suspense>

            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                {/* Categories */}
                <section className="my-16" aria-labelledby="learn-tech">
                    <h2
                        id="learn-tech"
                        className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-800 dark:text-gray-200"
                    >
                        Learn Technology for Free
                    </h2>

                    <Suspense
                        fallback={
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <CategoryCardSkeleton key={i} />
                                ))}
                            </div>
                        }
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {categories.map((c, idx) => (
                                <div
                                    key={c.title}
                                    className="animate-card-fade-in"
                                    style={{ animationDelay: c.delay || `${0.1 + idx * 0.1}s` }}
                                >
                                    <CategoryCard
                                        title={c.title}
                                        description={c.description}
                                        linkTo={c.linkTo}
                                        gradient={c.gradient}
                                        className="hover:scale-[1.02] transition-transform duration-300"
                                    />
                                </div>
                            ))}
                        </div>
                    </Suspense>

                    <div className="flex justify-center mt-10">
                        <Link to="/tutorials">
                            <Button pill gradientDuoTone="purpleToBlue">
                                Explore All Categories
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* Code Playground */}
                <section className="my-16" aria-labelledby="playground">
                    <h2
                        id="playground"
                        className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-800 dark:text-gray-200"
                    >
                        Interactive Code Playground
                    </h2>
                    <Suspense fallback={<EditorSkeleton />}>
                        <CodeEditor />
                    </Suspense>
                </section>

                {/* Recent Posts */}
                <section className="my-16" aria-labelledby="recent-articles">
                    <h2
                        id="recent-articles"
                        className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-800 dark:text-gray-200"
                    >
                        Recently Published Articles
                    </h2>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <PostCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : latestPosts.length > 0 ? (
                        <Suspense
                            fallback={
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <PostCardSkeleton key={i} />
                                    ))}
                                </div>
                            }
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {latestPosts.map((post, index) => (
                                    <div
                                        key={post._id || index}
                                        className="animate-card-fade-in"
                                        style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                                    >
                                        <PostCard post={post} />
                                    </div>
                                ))}
                            </div>
                        </Suspense>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400">
                            No articles found yet. Check back soon!
                        </div>
                    )}

                    <div className="flex justify-center mt-10">
                        <Link to="/search">
                            <Button pill outline gradientDuoTone="purpleToBlue">
                                View All Articles
                            </Button>
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}