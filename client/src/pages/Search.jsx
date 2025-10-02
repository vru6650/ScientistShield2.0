import { Button, Select, Spinner, TextInput, Badge, Checkbox } from 'flowbite-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSearchResults } from '../services/searchService';

const TYPE_OPTIONS = [
    { value: 'post', label: 'Posts', description: 'Community updates, announcements, and deep dives.' },
    { value: 'tutorial', label: 'Tutorials', description: 'Step-by-step learning paths and guided lessons.' },
    { value: 'problem', label: 'Problems', description: 'Interview-style challenges to practice solving.' },
];

const ALL_TYPES = TYPE_OPTIONS.map((option) => option.value);

const SORT_OPTIONS = [
    { value: 'relevance', label: 'Best match' },
    { value: 'recent', label: 'Most recent' },
];

const TYPE_LABELS = {
    post: 'Post',
    tutorial: 'Tutorial',
    problem: 'Problem',
};

const parseTypesFromQuery = (param, { defaultToAll = true } = {}) => {
    if (!param) {
        return defaultToAll ? [...ALL_TYPES] : [];
    }

    const normalizedValues = param
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);

    if (!normalizedValues.length) {
        return defaultToAll ? [...ALL_TYPES] : [];
    }

    const normalizedSet = new Set(normalizedValues);
    const filtered = ALL_TYPES.filter((type) => normalizedSet.has(type));

    if (!filtered.length) {
        return defaultToAll ? [...ALL_TYPES] : [];
    }

    return filtered;
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
        contentTypes: [...ALL_TYPES],
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [metadata, setMetadata] = useState({ total: 0, took: null, fallbackUsed: false, message: null });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchTermFromUrl = params.get('searchTerm') || '';
        const sortFromUrl = params.get('sort') || 'relevance';
        const typeParam = params.get('types');
        const parsedTypes = parseTypesFromQuery(typeParam);
        const orderedTypes = parsedTypes.length ? parsedTypes : [...ALL_TYPES];

        setSidebarData({
            searchTerm: searchTermFromUrl,
            sort: SORT_OPTIONS.some((option) => option.value === sortFromUrl) ? sortFromUrl : 'relevance',
            contentTypes: orderedTypes.length ? orderedTypes : [...ALL_TYPES],
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
        const sort = params.get('sort') || 'relevance';
        const typeParam = params.get('types');
        const parsedTypes = parseTypesFromQuery(typeParam, { defaultToAll: false });

        const query = {
            searchTerm,
            sort,
            limit: 25,
        };

        if (parsedTypes.length) {
            query.types = parsedTypes;
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

    const toggleContentType = (type) => {
        setSidebarData((prev) => {
            const isSelected = prev.contentTypes.includes(type);
            if (isSelected) {
                if (prev.contentTypes.length === 1) {
                    return prev;
                }
                return {
                    ...prev,
                    contentTypes: prev.contentTypes.filter((item) => item !== type),
                };
            }

            const nextTypes = [...prev.contentTypes, type];
            const orderedTypes = ALL_TYPES.filter((item) => nextTypes.includes(item));
            return {
                ...prev,
                contentTypes: orderedTypes,
            };
        });
    };

    const handleSelectAllTypes = () => {
        setSidebarData((prev) => ({ ...prev, contentTypes: [...ALL_TYPES] }));
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

        if (sidebarData.contentTypes.length && sidebarData.contentTypes.length < ALL_TYPES.length) {
            params.set('types', sidebarData.contentTypes.join(','));
        }

        navigate({ pathname: '/search', search: params.toString() });
    };

    const handleClear = () => {
        setSidebarData({ searchTerm: '', sort: 'relevance', contentTypes: [...ALL_TYPES] });
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
        if (sidebarData.contentTypes.length && sidebarData.contentTypes.length < ALL_TYPES.length) {
            const labels = sidebarData.contentTypes
                .map((type) => TYPE_OPTIONS.find((option) => option.value === type)?.label)
                .filter(Boolean);
            if (labels.length) {
                pieces.push(`Filtered to ${labels.join(', ')}`);
            }
        }
        return pieces.join(' · ');
    }, [sidebarData.searchTerm, loading, error, metadata, sidebarData.contentTypes]);

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
                    <div className='flex flex-col gap-3'>
                        <div className='flex items-center justify-between gap-2'>
                            <span className='font-semibold'>Content types</span>
                            {sidebarData.contentTypes.length < ALL_TYPES.length && (
                                <button
                                    type='button'
                                    onClick={handleSelectAllTypes}
                                    className='text-xs font-medium text-purple-600 hover:text-purple-500'
                                >
                                    Select all
                                </button>
                            )}
                        </div>
                        <div className='flex flex-col gap-2'>
                            {TYPE_OPTIONS.map((option) => {
                                const checked = sidebarData.contentTypes.includes(option.value);
                                return (
                                    <label key={option.value} htmlFor={`type-${option.value}`} className='flex items-start gap-3'>
                                        <Checkbox
                                            id={`type-${option.value}`}
                                            checked={checked}
                                            onChange={() => toggleContentType(option.value)}
                                        />
                                        <div className='flex flex-col'>
                                            <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                                {option.label}
                                            </span>
                                            <span className='text-xs text-gray-500 dark:text-gray-400'>{option.description}</span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
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
                    <div className='flex flex-wrap gap-2'>
                        {sidebarData.contentTypes.length === ALL_TYPES.length ? (
                            <Badge color='gray' size='sm'>All content types</Badge>
                        ) : (
                            sidebarData.contentTypes.map((type) => (
                                <Badge key={type} color='purple' size='sm'>
                                    {TYPE_LABELS[type] || type}
                                </Badge>
                            ))
                        )}
                        <Badge color='info' size='sm'>
                            Sort: {SORT_OPTIONS.find((option) => option.value === sidebarData.sort)?.label || 'Best match'}
                        </Badge>
                    </div>
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
