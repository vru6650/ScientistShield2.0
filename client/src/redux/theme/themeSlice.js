import { createSlice } from '@reduxjs/toolkit';

/**
 * Determines the initial theme by checking the following, in order:
 * 1. The value stored in localStorage.
 * 2. The user's OS-level preference ('prefers-color-scheme').
 * 3. A default value of 'light'.
 *
 * @returns {'light' | 'dark'} The calculated initial theme.
 */
const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        return savedTheme;
    }
    const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return userPrefersDark ? 'dark' : 'light';
};

const initialState = {
    theme: getInitialTheme(),
};

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        toggleTheme: (state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', state.theme);
        },
        setTheme: (state, action) => {
            const newTheme = action.payload;
            if (newTheme === 'light' || newTheme === 'dark') { // Basic validation
                state.theme = newTheme;
                localStorage.setItem('theme', newTheme);
            } else {
                console.warn(`Attempted to set invalid theme: ${newTheme}`);
            }
        },
    },
});

export const { toggleTheme, setTheme } = themeSlice.actions;

export default themeSlice.reducer;