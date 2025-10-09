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
export default function ThemeToggle({ className = '', ...props }) {
    const dispatch = useDispatch();
    const { theme } = useSelector((state) => state.theme);

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => dispatch(toggleTheme())}
            className={`flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 shadow-soft hover:shadow-elevated transition-all
                       bg-white/80 text-ink-700 backdrop-blur dark:bg-ink-800/80 dark:text-ink-100 ${className}`}
            aria-label="Toggle theme"
            {...props}
        >
            {theme === 'light' ? <FaMoon /> : <FaSun />}
        </motion.button>
    );
}
