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
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
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
    'bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-500 text-white shadow-lg shadow-cyan-500/40 ring-2 ring-white/50 dark:ring-white/20';
const INACTIVE_CLASSES =
    'bg-white/90 text-gray-700 shadow-[0_12px_30px_-15px_rgba(15,23,42,0.45)] dark:bg-slate-900/80 dark:text-gray-200 dark:shadow-[0_12px_30px_-15px_rgba(148,163,184,0.35)]';

const DOCK_INFLUENCE_DISTANCE = 160;

export default function BottomNav() {
    const { currentUser } = useSelector((state) => state.user);
    const location = useLocation();

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
                className="flex items-end gap-3 rounded-[50px] border border-white/40 bg-white/70 px-5 py-3 backdrop-blur-2xl shadow-[0_18px_40px_-25px_rgba(15,23,42,0.75)] dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_18px_40px_-25px_rgba(15,118,110,0.55)]"
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
                                    {isTheme ? (
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-3xl transition-colors duration-300 ${INACTIVE_CLASSES}`}>
                                            <ThemeToggle
                                                className="h-10 w-10 rounded-[18px] !bg-transparent !p-0 !text-gray-700 dark:!text-gray-200"
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
                                            className={`group relative flex h-12 w-12 items-center justify-center rounded-3xl transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
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
                                            <FaPlus className="text-2xl" />
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
                                                className={`flex h-12 w-12 items-center justify-center rounded-3xl transition-colors duration-300 ${
                                                    isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES
                                                }`}
                                            >
                                                {Icon ? <Icon className="text-2xl" /> : null}
                                            </div>
                                        </Link>
                                    )}
                                    <AnimatePresence>
                                        {showLabel ? (
                                            <motion.span
                                                key="label"
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: -4 }}
                                                exit={{ opacity: 0, y: 4 }}
                                                transition={{ duration: 0.18 }}
                                                className="absolute -top-9 whitespace-nowrap rounded-full bg-slate-900/95 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-slate-900/40 ring-1 ring-white/20 dark:bg-slate-200/95 dark:text-slate-900 dark:shadow-none"
                                            >
                                                {label}
                                            </motion.span>
                                        ) : null}
                                    </AnimatePresence>
                                    {!isTheme && isActive ? (
                                        <motion.span
                                            layoutId="dock-indicator"
                                            className="absolute -bottom-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 shadow-[0_0_0_3px_rgba(255,255,255,0.65)] dark:from-cyan-300 dark:to-sky-400 dark:shadow-[0_0_0_3px_rgba(14,116,144,0.35)]"
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
                                                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                                animate={{ opacity: 1, y: -12, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                                className="pointer-events-auto absolute bottom-20 left-1/2 w-72 -translate-x-1/2 rounded-3xl border border-white/60 bg-white/95 p-4 shadow-[0_28px_65px_-30px_rgba(15,23,42,0.65)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/95 dark:shadow-[0_28px_65px_-30px_rgba(15,118,110,0.45)]"
                                            >
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                                                    Quick Actions
                                                </p>
                                                <ul className="mt-3 space-y-2">
                                                    {quickAddOptions.map((option) => {
                                                        const OptionIcon = option.icon;
                                                        return (
                                                            <li key={option.to}>
                                                                <Link
                                                                    to={option.to}
                                                                    className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 transition-all hover:border-slate-200 hover:bg-slate-100/90 hover:shadow-sm focus:outline-none focus-visible:border-cyan-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-cyan-400 dark:hover:border-slate-700 dark:hover:bg-slate-800/70"
                                                                    onClick={() => {
                                                                        setIsQuickAddOpen(false);
                                                                        handleBlur();
                                                                    }}
                                                                    onFocus={() => handleFocus(index)}
                                                                    onBlur={(event) => {
                                                                        if (quickAddTriggerRef.current?.contains(event.relatedTarget)) {
                                                                            return;
                                                                        }
                                                                        handleBlur();
                                                                    }}
                                                                >
                                                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-600 transition group-hover:bg-gradient-to-br group-hover:from-cyan-500 group-hover:to-blue-500 group-hover:text-white dark:bg-white/5 dark:text-slate-200">
                                                                        <OptionIcon className="text-lg" />
                                                                    </span>
                                                                    <span className="flex flex-col">
                                                                        <span className="text-sm font-semibold text-slate-800 transition group-hover:text-slate-900 dark:text-slate-100">
                                                                            {option.label}
                                                                        </span>
                                                                        <span className="text-xs font-medium text-slate-500 transition group-hover:text-slate-600 dark:text-slate-400">
                                                                            {option.description}
                                                                        </span>
                                                                    </span>
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
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
