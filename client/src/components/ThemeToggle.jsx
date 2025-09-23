import { FaMoon, FaSun } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../redux/theme/themeSlice';
import { motion } from 'framer-motion';

/**
 * Small reusable button that toggles the application's theme.
 * The current theme is persisted in localStorage via the redux slice.
 *
 * Usage:
 * <ThemeToggle className="w-10 h-10" />
 */
export default function ThemeToggle({ className = '' }) {
    const dispatch = useDispatch();
    const { theme } = useSelector((state) => state.theme);

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => dispatch(toggleTheme())}
            className={`flex items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 focus:outline-none ${className}`}
            aria-label="Toggle theme"
        >
            {theme === 'light' ? <FaMoon /> : <FaSun />}
        </motion.button>
    );
}