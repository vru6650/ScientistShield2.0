export const getSearchResults = async (params = {}, options = {}) => {
    const searchParams = new URLSearchParams();

    if (params.searchTerm) {
        searchParams.set('searchTerm', params.searchTerm);
    }

    if (params.types) {
        if (Array.isArray(params.types)) {
            const filteredTypes = params.types.map((type) => type.trim()).filter(Boolean);
            if (filteredTypes.length) {
                searchParams.set('types', filteredTypes.join(','));
            }
        } else if (typeof params.types === 'string' && params.types.trim()) {
            searchParams.set('types', params.types.trim());
        }
    }

    if (params.difficulties) {
        if (Array.isArray(params.difficulties)) {
            const filteredDifficulties = params.difficulties.map((value) => value.trim()).filter(Boolean);
            if (filteredDifficulties.length) {
                searchParams.set('difficulty', filteredDifficulties.join(','));
            }
        } else if (typeof params.difficulties === 'string' && params.difficulties.trim()) {
            searchParams.set('difficulty', params.difficulties.trim());
        }
    }

    if (params.limit) {
        searchParams.set('limit', String(params.limit));
    }

    if (params.sort) {
        searchParams.set('sort', params.sort);
    }

    if (params.updatedAfter) {
        searchParams.set('updatedAfter', params.updatedAfter);
    }

    if (params.updatedBefore) {
        searchParams.set('updatedBefore', params.updatedBefore);
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/api/search?${queryString}` : '/api/search';

    const res = await fetch(url, { signal: options.signal });
    if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: 'Failed to fetch search results' }));
        throw new Error(message || 'Failed to fetch search results');
    }

    return res.json();
};
