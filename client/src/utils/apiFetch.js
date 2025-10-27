const normalizeBaseUrl = (value) => {
    if (!value) {
        return '';
    }
    return value.endsWith('/') ? value.slice(0, -1) : value;
};

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);

const buildUrl = (input) => {
    if (/^https?:\/\//i.test(input)) {
        return input;
    }
    if (!API_BASE_URL) {
        return input;
    }
    return `${API_BASE_URL}${input.startsWith('/') ? input : `/${input}`}`;
};

export const apiFetch = (input, options = {}) => {
    const url = buildUrl(input);
    const { credentials, ...restOptions } = options;
    return fetch(url, {
        credentials: credentials ?? 'include',
        ...restOptions,
    });
};

export const getApiBaseUrl = () => API_BASE_URL;
