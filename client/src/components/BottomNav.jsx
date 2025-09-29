import { Link, useLocation } from 'react-router-dom';
import {
    FaBook,
    FaHome,
    FaQuestionCircle,
    FaUser,
    FaLaptopCode,
    FaLightbulb,
    FaTools,
    FaPlus,
    FaPenFancy,
    FaLayerGroup,
    FaUserPlus,
    FaChevronRight,
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ThemeToggle from './ThemeToggle.jsx';

const baseItems = [
    { to: '/', label: 'Home', icon: FaHome, match: (path) => path === '/' },
    { to: '/tutorials', label: 'Tutorials', icon: FaBook, match: (path) => path.startsWith('/tutorials') },
    { to: '/quizzes', label: 'Quizzes', icon: FaQuestionCircle, match: (path) => path.startsWith('/quizzes') },
    { to: '/tools', label: 'Tools', icon: FaTools, match: (path) => path.startsWith('/tools') },
    { to: '/problems', label: 'Problems', icon: FaLightbulb, match: (path) => path.startsWith('/problems') },
    { to: '/visualizer', label: 'Code Visualizer', icon: FaLaptopCode, match: (path) => path.startsWith('/visualizer') },
];

const ACTIVE_CLASSES =
    'bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-white shadow-[0_22px_45px_-18px_rgba(14,165,233,0.65)] ring-2 ring-white/70 dark:ring-slate-100/15';
const INACTIVE_CLASSES =
    'bg-white/80 text-slate-600 shadow-[0_24px_40px_-20px_rgba(15,23,42,0.45)] ring-1 ring-white/70 backdrop-blur-xl dark:bg-slate-900/70 dark:text-slate-200 dark:shadow-[0_24px_40px_-22px_rgba(148,163,184,0.45)] dark:ring-slate-100/15';

const DOCK_INFLUENCE_DISTANCE = 160;

const ADMIN_QUICK_ADD_OPTIONS = [
    {
        to: '/create-post',
        label: 'New Post',
        description: 'Share a fresh insight or announcement with the community.',
        icon: FaPenFancy,
    },
    {
        to: '/create-tutorial',
        label: 'New Tutorial',
        description: 'Design a guided learning journey in minutes.',
        icon: FaLayerGroup,
    },
    {
        to: '/create-quiz',
        label: 'New Quiz',
        description: 'Build an interactive assessment for your learners.',
        icon: FaQuestionCircle,
    },
    {
        to: '/create-problem',
        label: 'New Problem',
        description: 'Add a fresh coding challenge for practice.',
        icon: FaLightbulb,
    },
];

const BASE_QUICK_ADD_OPTIONS = [
    {
        to: '/quizzes',
        label: 'Practice Quiz',
        description: 'Jump straight into a timed knowledge check.',
        icon: FaQuestionCircle,
    },
    {
        to: '/problems',
        label: 'Solve a Problem',
        description: 'Sharpen your skills with curated exercises.',
        icon: FaLightbulb,
    },
    {
        to: '/tools',
        label: 'Open Tools',
        description: 'Launch compilers, sandboxes, and utilities.',
        icon: FaTools,
    },
];

const GUEST_QUICK_ADD_OPTION = {
    to: '/sign-up',
    label: 'Invite a Collaborator',
    description: 'Create an account to co-build alongside your team.',
    icon: FaUserPlus,
};

export default function BottomNav() {
    const { currentUser } = useSelector((state) => state.user);
    const location = useLocation();
    const isAdmin = Boolean(currentUser?.isAdmin);

    const navItems = [...baseItems];
    if (currentUser) {
        navItems.push({
            to: '/dashboard',
            label: 'Dashboard',
            icon: FaUser,
            match: (path) => path.startsWith('/dashboard'),
        });
    }

    const dockItems = [
        ...navItems,
        { type: 'quick-add', label: 'Quick Add', key: 'quick-add' },
        { type: 'theme', label: 'Theme', key: 'theme-toggle' },
    ];

    const quickAddOptions = useMemo(() => {
        const options = [...BASE_QUICK_ADD_OPTIONS];

        if (isAdmin) {
            options.unshift(...ADMIN_QUICK_ADD_OPTIONS);
        } else if (!currentUser) {
            options.push(GUEST_QUICK_ADD_OPTION);
        }

        return options;
    }, [isAdmin, currentUser]);

    const [hoverX, setHoverX] = useState(null);
    const [focusedIndex, setFocusedIndex] = useState(null);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const iconRefs = useRef([]);
    const [iconCenters, setIconCenters] = useState([]);
    const quickAddTriggerRef = useRef(null);
    const quickAddMenuRef = useRef(null);

    const updateIconCenters = useCallback(() => {
        const centers = iconRefs.current.map((element) => {
            if (!element) return null;
            const rect = element.getBoundingClientRect();
            return rect.left + rect.width / 2;
        });
        setIconCenters(centers);
    }, []);

    useEffect(() => {
        iconRefs.current = Array.from({ length: dockItems.length }, (_, index) => iconRefs.current[index] ?? null);

        const frame = requestAnimationFrame(updateIconCenters);
        window.addEventListener('resize', updateIconCenters);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', updateIconCenters);
        };
    }, [updateIconCenters, dockItems.length]);

    useEffect(() => {
        setHoverX(null);
        setIsQuickAddOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!isQuickAddOpen) return undefined;

        const handleClickOutside = (event) => {
            if (
                quickAddTriggerRef.current?.contains(event.target) ||
                quickAddMenuRef.current?.contains(event.target)
            ) {
                return;
            }
            setIsQuickAddOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isQuickAddOpen]);

    const getMetrics = useCallback(
        (index, isActive) => {
            const center = iconCenters[index];
            if (hoverX === null || center == null) {
                return {
                    scale: isActive ? 1.35 : 1,
                    lift: isActive ? -15 : 0,
                    proximity: 0,
                    rotate: 0,
                };
            }

            const distance = Math.abs(hoverX - center);
            const clamped = Math.max(0, 1 - distance / DOCK_INFLUENCE_DISTANCE);
            const scaleBoost = isActive ? 0.45 : 0.35;
            const scale = (isActive ? 1.2 : 1) + clamped * scaleBoost;
            const lift = (isActive ? -10 : 0) - clamped * 24;
            const rotate = (hoverX - center) / 100; // Rotation based on mouse hover position

            return {
                scale,
                lift,
                proximity: clamped,
                rotate,
            };
        },
        [hoverX, iconCenters]
    );

    const handleFocus = (index) => setFocusedIndex(index);
    const handleBlur = () => setFocusedIndex(null);

    return (
        <nav className="fixed bottom-6 left-1/2 z-50 flex w-full max-w-4xl -translate-x-1/2 justify-center px-4">
            <motion.ul
                className="group relative flex items-end gap-4 overflow-visible rounded-[2.5rem] border border-white/40 bg-white/30 px-6 py-4 shadow-[0_45px_90px_-40px_rgba(14,116,144,0.55)] backdrop-blur-3xl before:absolute before:-top-6 before:left-1/2 before:h-12 before:w-[78%] before:-translate-x-1/2 before:rounded-[999px] before:bg-white/60 before:opacity-70 before:blur-2xl before:content-[''] after:absolute after:-bottom-8 after:left-1/2 after:h-10 after:w-[70%] after:-translate-x-1/2 after:rounded-full after:bg-cyan-500/10 after:blur-3xl after:content-[''] dark:border-slate-100/10 dark:bg-slate-900/40 dark:before:bg-slate-200/30 dark:after:bg-slate-500/20"
                initial={{ opacity: 0, y: 45 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                onMouseMove={(event) => setHoverX(event.clientX)}
                onMouseLeave={() => setHoverX(null)}
            >
                {dockItems.map((item, index) => {
                    const isTheme = item.type === 'theme';
                    const Icon = item.icon;
                    const isQuickAdd = item.type === 'quick-add';
                    const isActive = !isTheme && !isQuickAdd && item.match ? item.match(location.pathname) : false;
                    let { scale, lift, proximity, rotate } = getMetrics(index, isActive);

                    if (focusedIndex === index) {
                        scale = Math.max(scale, 1.3);
                        lift = Math.min(lift, -18);
                        proximity = Math.max(proximity, 1);
                    }

                    const showLabel = isTheme
                        ? proximity > 0.6 || focusedIndex === index
                        : isQuickAdd
                            ? isQuickAddOpen || proximity > 0.5 || focusedIndex === index
                            : proximity > 0.55 || isActive || focusedIndex === index;

                    const glowOpacity = Math.max(0, proximity - 0.25);
                    const ringOpacity = Math.max(0, proximity - 0.4);

                    const label = item.label;

                    return (
                        <motion.li key={item.to ?? item.key ?? label} className="relative flex flex-col items-center">
                            <div
                                ref={(element) => {
                                    iconRefs.current[index] = element;
                                }}
                                className="relative flex flex-col items-center"
                            >
                                <motion.div
                                    className="relative flex flex-col items-center"
                                    initial={false}
                                    animate={{ scale, y: lift, rotate }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                                >
                                    <motion.span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-cyan-400/25 via-sky-400/15 to-blue-500/25 blur-xl"
                                        initial={false}
                                        animate={{ opacity: glowOpacity }}
                                        transition={{ duration: 0.18 }}
                                    />
                                    {isTheme ? (
                                        <div className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 ${INACTIVE_CLASSES}`}>
                                            <ThemeToggle
                                                className="h-12 w-12 rounded-full !bg-transparent !p-0 !text-slate-600 dark:!text-slate-200"
                                                onFocus={() => handleFocus(index)}
                                                onBlur={handleBlur}
                                            />
                                        </div>
                                    ) : isQuickAdd ? (
                                        <button
                                            type="button"
                                            ref={quickAddTriggerRef}
                                            aria-label={label}
                                            aria-haspopup="menu"
                                            aria-expanded={isQuickAddOpen}
                                            className={`group relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 dark:focus-visible:ring-sky-400 ${
                                                isQuickAddOpen ? ACTIVE_CLASSES : INACTIVE_CLASSES
                                            }`}
                                            onClick={() => setIsQuickAddOpen((open) => !open)}
                                            onFocus={() => handleFocus(index)}
                                            onBlur={(event) => {
                                                if (quickAddMenuRef.current?.contains(event.relatedTarget)) {
                                                    return;
                                                }
                                                handleBlur();
                                            }}
                                        >
                                            <FaPlus className="text-3xl" />
                                        </button>
                                    ) : (
                                        <Link
                                            to={item.to}
                                            aria-label={label}
                                            aria-current={isActive ? 'page' : undefined}
                                            className="group relative flex flex-col items-center"
                                            onFocus={() => handleFocus(index)}
                                            onBlur={handleBlur}
                                        >
                                            <div
                                                className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 ${
                                                    isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES
                                                }`}
                                            >
                                                {Icon ? <Icon className="text-[1.75rem]" /> : null}
                                            </div>
                                        </Link>
                                    )}
                                    <motion.span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-sky-200/60 dark:ring-slate-400/40"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: isTheme ? 0 : ringOpacity }}
                                        transition={{ duration: 0.2 }}
                                    />
                                    <AnimatePresence>
                                        {showLabel ? (
                                            <motion.span
                                                key="label"
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: -4 }}
                                                exit={{ opacity: 0, y: 4 }}
                                                transition={{ duration: 0.18 }}
                                                className="absolute -top-10 whitespace-nowrap rounded-full bg-slate-900/95 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-slate-900/40 ring-1 ring-white/20 dark:bg-slate-200/95 dark:text-slate-900 dark:shadow-none"
                                            >
                                                {label}
                                            </motion.span>
                                        ) : null}
                                    </AnimatePresence>
                                    {!isTheme && isActive ? (
                                        <motion.span
                                            layoutId="dock-indicator"
                                            className="absolute -bottom-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 shadow-lg dark:from-cyan-300 dark:to-sky-400"
                                            initial={{ opacity: 0, scale: 0.4 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.4 }}
                                            transition={{ duration: 0.2 }}
                                        />
                                    ) : null}
                                    <AnimatePresence>
                                        {isQuickAdd && isQuickAddOpen ? (
                                            <motion.div
                                                key="quick-add-menu"
                                                ref={quickAddMenuRef}
                                                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                                                animate={{ opacity: 1, y: -14, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                                className="absolute bottom-24 left-1/2 w-[19rem] max-w-xs -translate-x-1/2 rounded-3xl border border-white/60 bg-white/95 p-4 shadow-[0_35px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-800/60 dark:bg-slate-900/95"
                                                role="menu"
                                                aria-label="Quick add shortcuts"
                                            >
                                                <motion.ul initial={false} className="space-y-2">
                                                    {quickAddOptions.map((option) => {
                                                        const OptionIcon = option.icon;
                                                        return (
                                                            <motion.li
                                                                key={option.to}
                                                                initial={{ opacity: 0, x: -8 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                exit={{ opacity: 0, x: -6 }}
                                                                transition={{ duration: 0.18 }}
                                                            >
                                                                <Link
                                                                    to={option.to}
                                                                    className="group flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/80 px-3 py-3 text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 hover:border-cyan-200 hover:bg-white dark:border-slate-700/70 dark:bg-slate-900/70 dark:hover:border-sky-500/40 dark:hover:bg-slate-900"
                                                                    role="menuitem"
                                                                    onClick={() => setIsQuickAddOpen(false)}
                                                                >
                                                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 via-sky-500/20 to-blue-500/20 text-sky-500 shadow-inner shadow-white/40 dark:text-sky-300">
                                                                        {OptionIcon ? <OptionIcon className="text-lg" /> : null}
                                                                    </span>
                                                                    <span className="flex-1">
                                                                        <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                            {option.label}
                                                                        </span>
                                                                        <span className="mt-0.5 block text-xs text-slate-500 transition group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200">
                                                                            {option.description}
                                                                        </span>
                                                                    </span>
                                                                    <FaChevronRight className="text-slate-300 transition group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-300" />
                                                                </Link>
                                                            </motion.li>
                                                        );
                                                    })}
                                                </motion.ul>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        </motion.li>
                    );
                })}
            </motion.ul>
        </nav>
    );
}
