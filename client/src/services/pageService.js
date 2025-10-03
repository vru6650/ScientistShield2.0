import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '',
    withCredentials: true,
});

export const createPage = async (payload) => {
    const { data } = await API.post('/api/pages', payload);
    return data;
};

export const updatePage = async ({ pageId, payload }) => {
    const { data } = await API.patch(`/api/pages/${pageId}`, payload);
    return data;
};

export const deletePage = async (pageId) => {
    const { data } = await API.delete(`/api/pages/${pageId}`);
    return data;
};

export const getPages = async ({ queryKey, pageParam = 0 }) => {
    const [, filters = {}] = queryKey;
    const params = new URLSearchParams();

    params.set('startIndex', pageParam.toString());
    params.set('limit', (filters.limit ?? 10).toString());

    if (filters.status && filters.status !== 'all') {
        params.set('status', filters.status);
    }

    if (filters.search) {
        params.set('searchTerm', filters.search);
    }

    const { data } = await API.get(`/api/pages?${params.toString()}`);
    return data;
};

export const getPageById = async (pageId) => {
    const { data } = await API.get(`/api/pages/${pageId}`);
    return data;
};

export const getPageContent = async (slug) => {
    const { data } = await API.get(`/api/content/${slug}`);
    return data;
};

export default {
    createPage,
    updatePage,
    deletePage,
    getPages,
    getPageById,
    getPageContent,
};
