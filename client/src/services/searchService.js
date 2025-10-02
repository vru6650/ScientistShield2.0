export const getSearchResults = async (params = {}, options = {}) => {
    const searchParams = new URLSearchParams();

    if (params.searchTerm) {
        searchParams.set('searchTerm', params.searchTerm);
    }

    if (params.types) {
        searchParams.set('types', params.types);
    }

    if (params.limit) {
        searchParams.set('limit', String(params.limit));
    }

    if (params.sort) {
        searchParams.set('sort', params.sort);
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
