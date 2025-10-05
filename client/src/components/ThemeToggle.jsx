import { FaMoon, FaSun } from 'react-icons/fa';
import { HiOutlineComputerDesktop } from 'react-icons/hi2';
import { useDispatch, useSelector } from 'react-redux';
import { setThemePreference } from '../redux/theme/themeSlice';
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
  const { preference } = useSelector((state) => state.theme);

  const options = [
    { id: 'light', label: 'Light', icon: FaSun },
    { id: 'system', label: 'Auto', icon: HiOutlineComputerDesktop },
    { id: 'dark', label: 'Dark', icon: FaMoon },
  ];

  const activeIndex = Math.max(0, options.findIndex((item) => item.id === preference));

  return (
    <div
      className={`theme-toggle ${className}`.trim()}
      role="radiogroup"
      aria-label="Theme preference"
      style={{ '--toggle-count': options.length }}
      {...props}
    >
      <motion.span
        className="theme-toggle__indicator"
        initial={false}
        animate={{ x: `${activeIndex * 100}%` }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      />
      {options.map(({ id, label, icon: Icon }, index) => {
        const isActive = preference === id;
        return (
          <motion.button
            key={id}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => dispatch(setThemePreference(id))}
            className={`theme-toggle__option ${isActive ? 'is-active' : ''}`}
            aria-pressed={isActive}
            aria-label={`Use ${label.toLowerCase()} theme`}
            data-index={index}
          >
            <Icon className="theme-toggle__icon" />
            <span className="theme-toggle__text">{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
