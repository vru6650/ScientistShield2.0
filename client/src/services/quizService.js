// client/src/services/quizService.js
import axios from 'axios';

// Create an Axios instance with a base URL and credentials
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '',
    // CRITICAL FIX: This sends cookies with every request
    withCredentials: true,
});

/**
 * Fetches quizzes based on query parameters.
 */
export const getQuizzes = async (searchQuery = '') => {
    // Use the configured API instance
    const { data } = await API.get(`/api/quizzes?${searchQuery}`);
    return data;
};

/**
 * Fetches a single quiz by its slug.
 */
export const getSingleQuizBySlug = async (quizSlug) => {
    // Use the configured API instance
    const { data } = await API.get(`/api/quizzes/slug/${quizSlug}`);
    return data;
};

/**
 * Fetches a single quiz by its ID.
 */
export const getSingleQuizById = async (quizId) => {
    // Use the configured API instance
    const { data } = await API.get(`/api/quizzes/${quizId}`);
    return data;
};

/**
 * Creates a new quiz.
 */
export const createQuiz = async (formData) => {
    // Use the configured API instance
    const { data } = await API.post('/api/quizzes', formData);
    return data;
};

/**
 * Updates an existing quiz.
 */
export const updateQuiz = async ({ quizId, userId, formData }) => {
    // Use the configured API instance
    const { data } = await API.put(`/api/quizzes/${quizId}/${userId}`, formData);
    return data;
};

/**
 * Deletes a quiz.
 */
export const deleteQuiz = async ({ quizId, userId }) => {
    // Use the configured API instance
    const { data } = await API.delete(`/api/quizzes/${quizId}/${userId}`);
    return data;
};

/**
 * Submits quiz answers for grading.
 */
export const submitQuiz = async (quizId, answers) => {
    // Use the configured API instance
    const { data } = await API.post(`/api/quizzes/submit/${quizId}`, { answers });
    return data;
};