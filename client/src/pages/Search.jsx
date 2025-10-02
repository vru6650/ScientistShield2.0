import { Button, Select, Spinner, Badge } from 'flowbite-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSearchResults } from '../services/searchService';
import {
    HiOutlineAdjustments,
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlineMicrophone,
    HiOutlineSearch,
    HiOutlineX,
} from 'react-icons/hi';

const TYPE_OPTIONS = [
    { value: 'post', label: 'Posts', description: 'Community updates, announcements, and deep dives.' },
    { value: 'tutorial', label: 'Tutorials', description: 'Step-by-step learning paths and guided lessons.' },
    { value: 'problem', label: 'Problems', description: 'Interview-style challenges to practice solving.' },
    { value: 'page', label: 'Pages', description: 'Published guides, landing pages, and documentation.' },
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
    page: 'Page',
};

const SUGGESTED_QUERIES = [
    'dynamic programming',
    'react hooks',
    'system design',
    'graph algorithms',
];

const DIFFICULTY_OPTIONS = ['Beginner', 'Easy', 'Medium', 'Hard', 'Advanced'];

const DATE_PRESETS = [
    { value: 'any', label: 'Any time' },
    { value: '24h', label: 'Past 24 hours', durationMs: 24 * 60 * 60 * 1000 },
    { value: '7d', label: 'Past week', durationMs: 7 * 24 * 60 * 60 * 1000 },
    { value: '30d', label: 'Past month', durationMs: 30 * 24 * 60 * 60 * 1000 },
    { value: '90d', label: 'Past 90 days', durationMs: 90 * 24 * 60 * 60 * 1000 },
    { value: '365d', label: 'Past year', durationMs: 365 * 24 * 60 * 60 * 1000 },
    { value: 'custom', label: 'Custom range' },
];

const PRESET_DURATION_LOOKUP = DATE_PRESETS.reduce((acc, preset) => {
    if (preset.durationMs) {
        acc[preset.value] = preset.durationMs;
    }
    return acc;
}, {});

const clampIsoDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString();
};

const derivePresetFromRange = (updatedAfter, updatedBefore) => {
    const afterIso = clampIsoDate(updatedAfter);
    const beforeIso = clampIsoDate(updatedBefore);

    if (!afterIso && !beforeIso) {
        return 'any';
    }

    if (!afterIso || beforeIso) {
        return 'custom';
    }

    const afterTime = new Date(afterIso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - afterTime);

    for (const [value, duration] of Object.entries(PRESET_DURATION_LOOKUP)) {
        const tolerance = Math.max(duration * 0.15, 60 * 60 * 1000);
        if (Math.abs(diff - duration) <= tolerance) {
            return value;
        }
    }

    if (diff <= PRESET_DURATION_LOOKUP['24h']) {
        return '24h';
    }

    return 'custom';
};

const computePresetRange = (preset) => {
    if (!preset || preset === 'any') {
        return { updatedAfter: null, updatedBefore: null };
    }

    if (preset === 'custom') {
        return { updatedAfter: null, updatedBefore: null };
    }

    const duration = PRESET_DURATION_LOOKUP[preset];
    if (!duration) {
        return { updatedAfter: null, updatedBefore: null };
    }

    const now = Date.now();
    const after = new Date(now - duration).toISOString();
    return { updatedAfter: after, updatedBefore: null };
};

const formatDateForInput = (isoValue) => {
    if (!isoValue) return '';
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 10);
};

const toIsoStartOfDay = (value) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString();
};

const toIsoEndOfDay = (value) => {
    if (!value) return null;
    const date = new Date(`${value}T23:59:59.999`);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString();
};

const describeDateFilter = (preset, updatedAfter, updatedBefore) => {
    if (preset && preset !== 'custom') {
        const presetOption = DATE_PRESETS.find((option) => option.value === preset);
        if (presetOption) {
            return `Updated within the ${presetOption.label.toLowerCase()}`;
        }
    }

    const formatter = new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    const afterDate = clampIsoDate(updatedAfter);
    const beforeDate = clampIsoDate(updatedBefore);

    if (afterDate && beforeDate) {
        return `Updated between ${formatter.format(new Date(afterDate))} and ${formatter.format(new Date(beforeDate))}`;
    }

    if (afterDate) {
        return `Updated after ${formatter.format(new Date(afterDate))}`;
    }

    if (beforeDate) {
        return `Updated before ${formatter.format(new Date(beforeDate))}`;
    }

    return null;
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
        case 'page':
            return `/content/${result.slug}`;
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
        difficulties: [],
        updatedAfter: null,
        updatedBefore: null,
        datePreset: 'any',
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [metadata, setMetadata] = useState({ total: 0, took: null, fallbackUsed: false, message: null });
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchTermFromUrl = params.get('searchTerm') || '';
        const sortFromUrl = params.get('sort') || 'relevance';
        const typeParam = params.get('types');
        const parsedTypes = parseTypesFromQuery(typeParam);
        const orderedTypes = parsedTypes.length ? parsedTypes : [...ALL_TYPES];
        const difficultyParam = params.get('difficulty') || params.get('difficulties');
        const difficulties = difficultyParam
            ? difficultyParam
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean)
            : [];
        const updatedAfterParam = clampIsoDate(params.get('updatedAfter'));
        const updatedBeforeParam = clampIsoDate(params.get('updatedBefore'));
        const datePreset = derivePresetFromRange(updatedAfterParam, updatedBeforeParam);

        setSidebarData({
            searchTerm: searchTermFromUrl,
            sort: SORT_OPTIONS.some((option) => option.value === sortFromUrl) ? sortFromUrl : 'relevance',
            contentTypes: orderedTypes.length ? orderedTypes : [...ALL_TYPES],
            difficulties,
            updatedAfter: updatedAfterParam,
            updatedBefore: updatedBeforeParam,
            datePreset,
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
        const difficultyParam = params.get('difficulty') || params.get('difficulties');
        const difficulties = difficultyParam
            ? difficultyParam
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean)
            : [];
        const updatedAfter = clampIsoDate(params.get('updatedAfter'));
        const updatedBefore = clampIsoDate(params.get('updatedBefore'));

        const query = {
            searchTerm,
            sort,
            limit: 25,
        };

        if (parsedTypes.length) {
            query.types = parsedTypes;
        }

        if (difficulties.length) {
            query.difficulties = difficulties;
        }

        if (updatedAfter) {
            query.updatedAfter = updatedAfter;
        }

        if (updatedBefore) {
            query.updatedBefore = updatedBefore;
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

    const hasAdvancedFilters = useMemo(
        () =>
            sidebarData.difficulties.length > 0 ||
            Boolean(sidebarData.updatedAfter) ||
            Boolean(sidebarData.updatedBefore),
        [sidebarData.difficulties, sidebarData.updatedAfter, sidebarData.updatedBefore],
    );

    useEffect(() => {
        if (hasAdvancedFilters) {
            setIsAdvancedOpen(true);
        }
    }, [hasAdvancedFilters]);

    const handleSearchInputChange = (event) => {
        const { value } = event.target;
        setSidebarData((prev) => ({ ...prev, searchTerm: value }));
    };

    const handleSortChange = (event) => {
        const { value } = event.target;
        setSidebarData((prev) => ({ ...prev, sort: value }));
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

    const toggleDifficulty = (difficulty) => {
        setSidebarData((prev) => {
            const isSelected = prev.difficulties.includes(difficulty);
            if (isSelected) {
                return {
                    ...prev,
                    difficulties: prev.difficulties.filter((value) => value !== difficulty),
                };
            }

            return {
                ...prev,
                difficulties: [...prev.difficulties, difficulty],
            };
        });
    };

    const handleDatePresetChange = (event) => {
        const { value } = event.target;
        setSidebarData((prev) => {
            const nextRange = computePresetRange(value);
            return {
                ...prev,
                datePreset: value,
                updatedAfter: nextRange.updatedAfter,
                updatedBefore: nextRange.updatedBefore,
            };
        });
    };

    const handleCustomDateChange = (field, value) => {
        setSidebarData((prev) => {
            const next = {
                ...prev,
                datePreset: 'custom',
            };

            if (field === 'start') {
                next.updatedAfter = value ? toIsoStartOfDay(value) : null;
            } else {
                next.updatedBefore = value ? toIsoEndOfDay(value) : null;
            }

            return next;
        });
    };

    const buildSearchParams = (data) => {
        const params = new URLSearchParams();

        if (data.searchTerm.trim()) {
            params.set('searchTerm', data.searchTerm.trim());
        }

        if (data.sort !== 'relevance') {
            params.set('sort', data.sort);
        }

        if (data.contentTypes.length && data.contentTypes.length < ALL_TYPES.length) {
            params.set('types', data.contentTypes.join(','));
        }

        if (data.difficulties.length) {
            params.set('difficulty', data.difficulties.join(','));
        }

        if (data.updatedAfter) {
            params.set('updatedAfter', data.updatedAfter);
        }

        if (data.updatedBefore) {
            params.set('updatedBefore', data.updatedBefore);
        }

        return params;
    };

    const commitSearchToUrl = (data) => {
        const params = buildSearchParams(data);
        navigate({ pathname: '/search', search: params.toString() });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        commitSearchToUrl(sidebarData);
    };

    const handleSuggestionClick = (query) => {
        const nextData = { ...sidebarData, searchTerm: query };
        setSidebarData(nextData);
        commitSearchToUrl(nextData);
    };

    const handleInputClear = () => {
        const nextData = { ...sidebarData, searchTerm: '' };
        setSidebarData(nextData);
        if (
            sidebarData.contentTypes.length === ALL_TYPES.length &&
            sidebarData.sort === 'relevance' &&
            !hasAdvancedFilters
        ) {
            navigate('/search');
        } else {
            commitSearchToUrl(nextData);
        }
    };

    const handleClear = () => {
        const defaults = {
            searchTerm: '',
            sort: 'relevance',
            contentTypes: [...ALL_TYPES],
            difficulties: [],
            updatedAfter: null,
            updatedBefore: null,
            datePreset: 'any',
        };
        setSidebarData(defaults);
        navigate('/search');
    };

    const headerMeta = useMemo(() => {
        if (!sidebarData.searchTerm.trim()) {
            return 'Start typing to search across posts, tutorials, coding problems, and knowledge pages.';
        }

        if (loading) {
            return 'Searching across the knowledge base…';
        }

        if (error) {
            return error;
        }

        const pieces = [];
        const formattedTotal = new Intl.NumberFormat().format(metadata.total ?? 0);

        if (metadata.took != null) {
            const seconds = metadata.took / 1000;
            const formattedTime = seconds < 0.1
                ? `${metadata.took} ms`
                : `${seconds.toFixed(seconds < 1 ? 2 : 1)} seconds`;
            pieces.push(`About ${formattedTotal} result${metadata.total === 1 ? '' : 's'} (${formattedTime})`);
        } else {
            pieces.push(`About ${formattedTotal} result${metadata.total === 1 ? '' : 's'}`);
        }

        if (metadata.fallbackUsed) {
            pieces.push('Showing results via our intelligent fallback');
        }

        if (sidebarData.contentTypes.length && sidebarData.contentTypes.length < ALL_TYPES.length) {
            const labels = sidebarData.contentTypes
                .map((type) => TYPE_OPTIONS.find((option) => option.value === type)?.label)
                .filter(Boolean);
            if (labels.length) {
                pieces.push(`Filtered to ${labels.join(', ')}`);
            }
        }

        if (sidebarData.difficulties.length) {
            pieces.push(`Difficulty: ${sidebarData.difficulties.join(', ')}`);
        }

        const dateDescription = describeDateFilter(
            sidebarData.datePreset,
            sidebarData.updatedAfter,
            sidebarData.updatedBefore,
        );
        if (dateDescription) {
            pieces.push(dateDescription);
        }
        return pieces.join(' · ');
    }, [
        sidebarData.searchTerm,
        loading,
        error,
        metadata,
        sidebarData.contentTypes,
        sidebarData.difficulties,
        sidebarData.datePreset,
        sidebarData.updatedAfter,
        sidebarData.updatedBefore,
    ]);

    const hasCustomTypes = sidebarData.contentTypes.length && sidebarData.contentTypes.length < ALL_TYPES.length;
    const customStartValue = formatDateForInput(sidebarData.updatedAfter);
    const customEndValue = formatDateForInput(sidebarData.updatedBefore);

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-950'>
            <div className='border-b border-gray-200 dark:border-gray-800 bg-gradient-to-b from-white to-gray-100 dark:from-gray-950 dark:to-gray-900'>
                <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8'>
                    <div className='flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400'>
                        <Link to='/' className='font-semibold tracking-tight text-gray-900 dark:text-gray-100'>
                            ScientistShield
                        </Link>
                        <div className='flex items-center gap-2'>
                            <span className='hidden text-xs uppercase tracking-wide text-gray-400 sm:block'>Jump back</span>
                            <Button as={Link} to='/' color='light' size='xs'>
                                Home
                            </Button>
                        </div>
                    </div>
                    <div className='text-center'>
                        <h1 className='text-3xl font-semibold text-gray-900 dark:text-gray-100 sm:text-4xl'>
                            Search the ScientistShield library
                        </h1>
                        <p className='mt-2 text-base text-gray-500 dark:text-gray-400'>
                            Instantly surface posts, tutorials, coding problems, and documentation pages with a Google-inspired experience.
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className='mx-auto flex w-full max-w-3xl flex-col gap-4'>
                        <div className='flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm transition focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-200 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:border-purple-300'>
                            <HiOutlineSearch className='h-5 w-5 text-gray-400' />
                            <input
                                id='searchTerm'
                                type='search'
                                value={sidebarData.searchTerm}
                                onChange={handleSearchInputChange}
                                placeholder='Ask anything...'
                                className='flex-1 border-none bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:text-gray-100'
                            />
                            {sidebarData.searchTerm && (
                                <button
                                    type='button'
                                    onClick={handleInputClear}
                                    className='rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800'
                                    aria-label='Clear search input'
                                >
                                    <HiOutlineX className='h-5 w-5' />
                                </button>
                            )}
                            <HiOutlineMicrophone className='hidden h-5 w-5 text-purple-500 sm:block' />
                            <Button type='submit' color='light' size='sm' className='hidden sm:inline-flex rounded-full border border-gray-200 bg-gray-100 px-4 font-semibold text-gray-700 shadow-none hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'>
                                Search
                            </Button>
                        </div>
                        <div className='flex flex-wrap items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400'>
                            <span className='text-xs uppercase tracking-wide text-gray-400'>Popular now:</span>
                            {SUGGESTED_QUERIES.map((query) => (
                                <button
                                    key={query}
                                    type='button'
                                    onClick={() => handleSuggestionClick(query)}
                                    className='rounded-full border border-transparent bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-purple-400 dark:hover:bg-purple-400/10 dark:hover:text-purple-300'
                                >
                                    {query}
                                </button>
                            ))}
                        </div>
                    </form>
                    <div className='flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400'>
                        <div className='flex flex-wrap items-center gap-2'>
                            <button
                                type='button'
                                onClick={handleSelectAllTypes}
                                className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                                    hasCustomTypes
                                        ? 'border border-transparent bg-gray-100 text-gray-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-purple-400 dark:hover:bg-purple-400/10 dark:hover:text-purple-300'
                                        : 'border border-purple-500 bg-purple-50 text-purple-600 dark:border-purple-400 dark:bg-purple-500/10 dark:text-purple-200'
                                }`}
                            >
                                All
                            </button>
                            {TYPE_OPTIONS.map((option) => {
                                const isActive = sidebarData.contentTypes.includes(option.value);
                                return (
                                    <button
                                        key={option.value}
                                        type='button'
                                        onClick={() => toggleContentType(option.value)}
                                        className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                                            isActive
                                                ? 'border border-purple-500 bg-purple-50 text-purple-600 shadow-sm dark:border-purple-400 dark:bg-purple-500/10 dark:text-purple-200'
                                                : 'border border-transparent bg-gray-100 text-gray-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-purple-400 dark:hover:bg-purple-400/10 dark:hover:text-purple-300'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className='flex items-center gap-2'>
                            <span className='text-xs uppercase tracking-wide text-gray-400'>Sort by</span>
                            <Select id='sort' value={sidebarData.sort} onChange={handleSortChange} size='sm'>
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                            <Button type='button' color='light' size='xs' onClick={handleClear}>
                                Reset all
                            </Button>
                        </div>
                    </div>
                    <div className='flex flex-col gap-4'>
                        <div className='flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900'>
                            <div className='flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200'>
                                <HiOutlineAdjustments className='h-5 w-5 text-purple-500' />
                                <span>Advanced filters</span>
                                {hasAdvancedFilters && (
                                    <Badge color='purple' size='sm' className='ml-1'>
                                        Applied
                                    </Badge>
                                )}
                            </div>
                            <button
                                type='button'
                                onClick={() => setIsAdvancedOpen((prev) => !prev)}
                                className='flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-sm font-medium text-purple-600 transition hover:border-purple-300 hover:bg-purple-50 dark:text-purple-300 dark:hover:border-purple-500 dark:hover:bg-purple-500/10'
                                aria-expanded={isAdvancedOpen}
                                aria-controls='advanced-filter-panel'
                            >
                                {isAdvancedOpen ? (
                                    <>
                                        Hide <HiOutlineChevronUp className='h-4 w-4' />
                                    </>
                                ) : (
                                    <>
                                        Show <HiOutlineChevronDown className='h-4 w-4' />
                                    </>
                                )}
                            </button>
                        </div>
                        {isAdvancedOpen && (
                            <div
                                id='advanced-filter-panel'
                                className='grid gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900'
                            >
                                <div className='flex flex-col gap-3'>
                                    <span className='text-xs uppercase tracking-wide text-gray-400'>Difficulty</span>
                                    <div className='flex flex-wrap gap-2'>
                                        {DIFFICULTY_OPTIONS.map((difficulty) => {
                                            const isSelected = sidebarData.difficulties.includes(difficulty);
                                            return (
                                                <label
                                                    key={difficulty}
                                                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition ${
                                                        isSelected
                                                            ? 'border-purple-500 bg-purple-50 text-purple-600 dark:border-purple-400 dark:bg-purple-500/10 dark:text-purple-200'
                                                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-purple-400 dark:hover:bg-purple-500/10 dark:hover:text-purple-200'
                                                    }`}
                                                >
                                                    <input
                                                        type='checkbox'
                                                        checked={isSelected}
                                                        onChange={() => toggleDifficulty(difficulty)}
                                                        className='h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800'
                                                    />
                                                    <span>{difficulty}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <p className='text-xs text-gray-500 dark:text-gray-400'>Refine problem results based on challenge level.</p>
                                </div>
                                <div className='flex flex-col gap-3'>
                                    <span className='text-xs uppercase tracking-wide text-gray-400'>Updated</span>
                                    <div className='flex flex-wrap gap-3'>
                                        <Select
                                            id='date-preset'
                                            value={sidebarData.datePreset}
                                            onChange={handleDatePresetChange}
                                            className='w-full max-w-xs'
                                        >
                                            {DATE_PRESETS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </Select>
                                        {sidebarData.datePreset === 'custom' && (
                                            <div className='flex flex-wrap gap-3 text-sm'>
                                                <label className='flex flex-col gap-1 text-left text-gray-600 dark:text-gray-300'>
                                                    <span className='text-xs uppercase tracking-wide text-gray-400'>From</span>
                                                    <input
                                                        type='date'
                                                        value={customStartValue}
                                                        onChange={(event) => handleCustomDateChange('start', event.target.value)}
                                                        className='rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-purple-400 dark:focus:ring-purple-400/30'
                                                    />
                                                </label>
                                                <label className='flex flex-col gap-1 text-left text-gray-600 dark:text-gray-300'>
                                                    <span className='text-xs uppercase tracking-wide text-gray-400'>To</span>
                                                    <input
                                                        type='date'
                                                        value={customEndValue}
                                                        onChange={(event) => handleCustomDateChange('end', event.target.value)}
                                                        className='rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-purple-400 dark:focus:ring-purple-400/30'
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                    <p className='text-xs text-gray-500 dark:text-gray-400'>Limit results to recent updates or choose a custom date window.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <main className='mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8'>
                <div className='flex flex-col gap-2'>
                    <p className='text-xs uppercase tracking-wide text-gray-400'>Search insights</p>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>{headerMeta}</p>
                    {metadata.message && (
                        <Badge color='warning' size='sm' className='w-fit'>
                            {metadata.message}
                        </Badge>
                    )}
                </div>

                {loading && (
                    <div className='flex items-center justify-center py-16'>
                        <Spinner size='xl' />
                    </div>
                )}

                {!loading && !error && results.length === 0 && sidebarData.searchTerm.trim() && (
                    <div className='rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-lg text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'>
                        No matching content yet. Try a different keyword or expand the content filter.
                    </div>
                )}

                {!loading && !sidebarData.searchTerm.trim() && (
                    <div className='rounded-2xl border border-transparent bg-white p-10 text-center text-lg text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'>
                        Start typing above to explore the latest knowledge from our community.
                    </div>
                )}

                {!loading && !error && results.length > 0 && (
                    <div className='flex flex-col gap-8'>
                        {results.map((result) => {
                            const path = buildResultPath(result);
                            const snippet = result.highlight?.[0] || result.summary;
                            const updated = formatDate(result.updatedAt || result.createdAt);

                            return (
                                <article key={`${result.type}-${result.id}`} className='group flex flex-col gap-2'>
                                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                                        <span className='font-medium text-gray-600 dark:text-gray-300'>
                                            {TYPE_LABELS[result.type] || 'Content'}
                                        </span>
                                        {result.category && (
                                            <>
                                                <span className='px-2 text-gray-300 dark:text-gray-600'>•</span>
                                                <span>{result.category}</span>
                                            </>
                                        )}
                                        {updated && (
                                            <>
                                                <span className='px-2 text-gray-300 dark:text-gray-600'>•</span>
                                                <span>Updated {updated}</span>
                                            </>
                                        )}
                                    </div>
                                    <Link
                                        to={path}
                                        className='text-xl font-semibold text-blue-700 transition hover:text-purple-600 dark:text-blue-300 dark:hover:text-purple-300'
                                    >
                                        {result.title}
                                    </Link>
                                    {snippet && (
                                        <p
                                            className='text-sm leading-relaxed text-gray-600 dark:text-gray-300'
                                            dangerouslySetInnerHTML={{ __html: snippet }}
                                        />
                                    )}
                                    <div className='flex flex-wrap gap-2 pt-1 text-xs text-gray-500 dark:text-gray-400'>
                                        {result.difficulty && (
                                            <span className='rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800'>
                                                Difficulty: {result.difficulty}
                                            </span>
                                        )}
                                        {result.topics?.slice(0, 3).map((topic) => (
                                            <span key={topic} className='rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800'>
                                                {topic}
                                            </span>
                                        ))}
                                        {result.tags?.slice(0, 3).map((tag) => (
                                            <span key={tag} className='rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800'>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {!loading && error && (
                    <div className='rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600 dark:border-red-700 dark:bg-red-900/40 dark:text-red-300'>
                        {error}
                    </div>
                )}
            </main>
        </div>
    );
}
