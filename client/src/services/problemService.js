// client/src/services/problemService.js
import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '',
    withCredentials: true,
});

export const getProblems = async (searchQuery = '') => {
    const { data } = await API.get(`/api/problems?${searchQuery}`);
    return data;
};

export const getProblemBySlug = async (problemSlug) => {
    const { data } = await API.get(`/api/problems/slug/${problemSlug}`);
    return data;
};

export const getProblemById = async (problemId) => {
    const { data } = await API.get(`/api/problems/${problemId}`);
    return data;
};

export const createProblem = async (payload) => {
    const { data } = await API.post('/api/problems', payload);
    return data;
};

export const updateProblem = async ({ problemId, userId, payload }) => {
    const { data } = await API.put(`/api/problems/${problemId}/${userId}`, payload);
    return data;
};

export const deleteProblem = async ({ problemId, userId }) => {
    const { data } = await API.delete(`/api/problems/${problemId}/${userId}`);
    return data;
};
