import { Button, Select, Spinner, TextInput, Badge } from 'flowbite-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSearchResults } from '../services/searchService';

const TYPE_OPTIONS = [
    { value: 'all', label: 'All content' },
    { value: 'post', label: 'Posts' },
    { value: 'tutorial', label: 'Tutorials' },
    { value: 'problem', label: 'Problems' },
];

const SORT_OPTIONS = [
    { value: 'relevance', label: 'Best match' },
    { value: 'recent', label: 'Most recent' },
];

const TYPE_LABELS = {
    post: 'Post',
    tutorial: 'Tutorial',
    problem: 'Problem',
};

const buildResultPath = (result) => {
    switch (result.type) {
        case 'post':
            return `/post/${result.slug}`;
        case 'tutorial':
            return `/tutorials/${result.slug}`;
        case 'problem':
            return `/problems/${result.slug}`;
        default:
            return '#';
    }
};

const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toLocaleDateString();
};

export default function Search() {
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarData, setSidebarData] = useState({
        searchTerm: '',
        sort: 'relevance',
        contentType: 'all',
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [metadata, setMetadata] = useState({ total: 0, took: null, fallbackUsed: false, message: null });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchTermFromUrl = params.get('searchTerm') || '';
        const sortFromUrl = params.get('sort') || 'relevance';
        const typeFromUrl = params.get('types') || 'all';

        setSidebarData({
            searchTerm: searchTermFromUrl,
            sort: SORT_OPTIONS.some((option) => option.value === sortFromUrl) ? sortFromUrl : 'relevance',
            contentType: TYPE_OPTIONS.some((option) => option.value === typeFromUrl) ? typeFromUrl : 'all',
        });
    }, [location.search]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchTerm = params.get('searchTerm') || '';

        if (!searchTerm.trim()) {
            setResults([]);
            setMetadata({ total: 0, took: null, fallbackUsed: false, message: null });
            setError(null);
            return () => {};
        }

        const controller = new AbortController();
        const contentType = params.get('types') || 'all';
        const sort = params.get('sort') || 'relevance';

        const query = {
            searchTerm,
            sort,
            limit: 25,
        };

        if (contentType && contentType !== 'all') {
            query.types = contentType;
        }

        setLoading(true);
        setError(null);

        getSearchResults(query, { signal: controller.signal })
            .then((data) => {
                setResults(Array.isArray(data.results) ? data.results : []);
                setMetadata({
                    total: data.total ?? 0,
                    took: data.took ?? null,
                    fallbackUsed: Boolean(data.fallbackUsed),
                    message: data.message || null,
                });
            })
            .catch((err) => {
                if (err.name === 'AbortError') return;
                setError(err.message || 'Unable to fetch search results.');
                setResults([]);
                setMetadata({ total: 0, took: null, fallbackUsed: false, message: null });
            })
            .finally(() => {
                setLoading(false);
            });

        return () => controller.abort();
    }, [location.search]);

    const handleChange = (event) => {
        const { id, value } = event.target;
        setSidebarData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const params = new URLSearchParams();

        if (sidebarData.searchTerm.trim()) {
            params.set('searchTerm', sidebarData.searchTerm.trim());
        }

        if (sidebarData.sort !== 'relevance') {
            params.set('sort', sidebarData.sort);
        }

        if (sidebarData.contentType !== 'all') {
            params.set('types', sidebarData.contentType);
        }

        navigate({ pathname: '/search', search: params.toString() });
    };

    const handleClear = () => {
        setSidebarData({ searchTerm: '', sort: 'relevance', contentType: 'all' });
        navigate('/search');
    };

    const headerMeta = useMemo(() => {
        if (!sidebarData.searchTerm.trim()) {
            return 'Start typing to search across posts, tutorials, and coding problems.';
        }

        if (loading) {
            return 'Searching across the knowledge base…';
        }

        if (error) {
            return error;
        }

        const pieces = [];
        pieces.push(`${metadata.total} result${metadata.total === 1 ? '' : 's'}`);
        if (metadata.took != null) {
            pieces.push(`${metadata.took} ms`);
        }
        if (metadata.fallbackUsed) {
            pieces.push('MongoDB fallback');
        }
        return pieces.join(' · ');
    }, [sidebarData.searchTerm, loading, error, metadata]);

    return (
        <div className='flex flex-col md:flex-row'>
            <aside className='p-7 border-b md:border-r md:min-h-screen border-gray-500 w-full md:w-80'>
                <form className='flex flex-col gap-6' onSubmit={handleSubmit}>
                    <div className='flex items-center gap-2'>
                        <label className='whitespace-nowrap font-semibold' htmlFor='searchTerm'>
                            Search term
                        </label>
                        <TextInput
                            id='searchTerm'
                            placeholder='Try "dynamic programming"'
                            type='search'
                            value={sidebarData.searchTerm}
                            onChange={handleChange}
                        />
                    </div>
                    <div className='flex items-center gap-2'>
                        <label className='font-semibold' htmlFor='contentType'>
                            Content type
                        </label>
                        <Select id='contentType' value={sidebarData.contentType} onChange={handleChange}>
                            {TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className='flex items-center gap-2'>
                        <label className='font-semibold' htmlFor='sort'>
                            Sort by
                        </label>
                        <Select id='sort' value={sidebarData.sort} onChange={handleChange}>
                            {SORT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className='flex items-center gap-3'>
                        <Button type='submit' gradientDuoTone='purpleToPink' className='flex-1'>
                            Update results
                        </Button>
                        <Button type='button' color='light' onClick={handleClear}>
                            Clear
                        </Button>
                    </div>
                </form>
            </aside>
            <main className='w-full'>
                <header className='border-b border-gray-500 p-7 flex flex-col gap-2'>
                    <h1 className='text-3xl font-semibold'>Search results</h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>{headerMeta}</p>
                    {metadata.message && (
                        <p className='text-xs text-amber-600 dark:text-amber-400'>{metadata.message}</p>
                    )}
                </header>
                <section className='p-7 flex flex-col gap-4'>
                    {loading && (
                        <div className='flex justify-center items-center py-12'>
                            <Spinner size='xl' />
                        </div>
                    )}

                    {!loading && !error && results.length === 0 && sidebarData.searchTerm.trim() && (
                        <p className='text-lg text-gray-500 dark:text-gray-400'>
                            No matching content yet. Try a different keyword or expand the content filter.
                        </p>
                    )}

                    {!loading && !sidebarData.searchTerm.trim() && (
                        <p className='text-lg text-gray-500 dark:text-gray-400'>
                            Use the filters on the left to discover posts, tutorials, and coding problems instantly.
                        </p>
                    )}

                    {!loading && !error && (
                        <div className='flex flex-col gap-3'>
                            {results.map((result) => {
                                const path = buildResultPath(result);
                                const snippet = result.highlight?.[0] || result.summary;
                                const updated = formatDate(result.updatedAt || result.createdAt);

                                return (
                                    <Link
                                        key={`${result.type}-${result.id}`}
                                        to={path}
                                        className='block rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-purple-400 dark:hover:border-purple-400 transition-colors'
                                    >
                                        <div className='flex flex-col gap-3'>
                                            <div className='flex items-center gap-3 justify-between'>
                                                <Badge color='indigo' size='sm'>
                                                    {TYPE_LABELS[result.type] || 'Content'}
                                                </Badge>
                                                {updated && (
                                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                                        Updated {updated}
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
                                                {result.title}
                                            </h2>
                                            {snippet && (
                                                <p
                                                    className='text-sm text-gray-600 dark:text-gray-300'
                                                    dangerouslySetInnerHTML={{ __html: snippet }}
                                                />
                                            )}
                                            <div className='flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400'>
                                                {result.category && (
                                                    <span className='px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800'>
                                                        {result.category}
                                                    </span>
                                                )}
                                                {result.difficulty && (
                                                    <span className='px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800'>
                                                        Difficulty: {result.difficulty}
                                                    </span>
                                                )}
                                                {result.topics?.slice(0, 3).map((topic) => (
                                                    <span key={topic} className='px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800'>
                                                        {topic}
                                                    </span>
                                                ))}
                                                {result.tags?.slice(0, 3).map((tag) => (
                                                    <span key={tag} className='px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800'>
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {!loading && error && (
                        <p className='text-lg text-red-500'>{error}</p>
                    )}
                </section>
            </main>
        </div>
    );
}
