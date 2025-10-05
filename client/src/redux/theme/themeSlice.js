import { createSlice } from '@reduxjs/toolkit';

// Determine initial user preference: 'system' | 'light' | 'dark'
const getInitialPreference = () => {
  const saved = localStorage.getItem('themePreference');
  if (saved === 'system' || saved === 'light' || saved === 'dark') return saved;
  return 'system';
};

// Resolve a concrete theme ('light' | 'dark') from a preference
const resolveThemeFromPreference = (preference) => {
  if (preference === 'light' || preference === 'dark') return preference;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

const initialPreference = getInitialPreference();
const initialTheme = (() => {
  // Keep previously applied theme for no-flash hydration if present
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  return resolveThemeFromPreference(initialPreference);
})();

const initialState = {
  // The concrete, applied theme class
  theme: initialTheme, // 'light' | 'dark'
  // The user preference for resolving theme
  preference: initialPreference, // 'system' | 'light' | 'dark'
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    // Toggle explicitly between light/dark and set preference accordingly
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      state.preference = state.theme; // exit system mode on manual toggle
      localStorage.setItem('theme', state.theme);
      localStorage.setItem('themePreference', state.preference);
    },
    // Explicitly set to light/dark and update preference
    setTheme: (state, action) => {
      const next = action.payload;
      if (next === 'light' || next === 'dark') {
        state.theme = next;
        state.preference = next;
        localStorage.setItem('theme', state.theme);
        localStorage.setItem('themePreference', state.preference);
      } else {
        console.warn(`Attempted to set invalid theme: ${next}`);
      }
    },
    // Set user preference, resolving actual theme if 'system'
    setThemePreference: (state, action) => {
      const pref = action.payload;
      if (pref !== 'system' && pref !== 'light' && pref !== 'dark') return;
      state.preference = pref;
      const resolved = resolveThemeFromPreference(pref);
      state.theme = resolved;
      localStorage.setItem('themePreference', pref);
      localStorage.setItem('theme', resolved);
    },
    // Internal: update applied theme without changing preference (used for system change listeners)
    setResolvedTheme: (state, action) => {
      const resolved = action.payload;
      if (resolved === 'light' || resolved === 'dark') {
        state.theme = resolved;
        localStorage.setItem('theme', resolved);
      }
    },
  },
});

export const { toggleTheme, setTheme, setThemePreference, setResolvedTheme } = themeSlice.actions;

export default themeSlice.reducer;
