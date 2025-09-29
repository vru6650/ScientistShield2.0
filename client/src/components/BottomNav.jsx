import { Link, useLocation } from 'react-router-dom';
import { FaBook, FaHome, FaQuestionCircle, FaUser, FaLaptopCode, FaLightbulb, FaTools } from 'react-icons/fa';
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

    const dockItems = [...navItems, { type: 'theme', label: 'Theme', key: 'theme-toggle' }];

    const [hoverX, setHoverX] = useState(null);
    const [focusedIndex, setFocusedIndex] = useState(null);
    const iconRefs = useRef([]);
    const [iconCenters, setIconCenters] = useState([]);

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
    }, [location.pathname]);

    const getMetrics = useCallback(
        (index, isActive) => {
            const center = iconCenters[index];
            if (hoverX === null || center == null) {
                return {
                    scale: isActive ? 1.15 : 1,
                    lift: isActive ? -10 : 0,
                    proximity: 0,
                };
            }

            const distance = Math.abs(hoverX - center);
            const clamped = Math.max(0, 1 - distance / DOCK_INFLUENCE_DISTANCE);
            const scaleBoost = isActive ? 0.45 : 0.35;
            const scale = (isActive ? 1.1 : 1) + clamped * scaleBoost;
            const lift = (isActive ? -8 : 0) - clamped * 22;

            return {
                scale,
                lift,
                proximity: clamped,
            };
        },
        [hoverX, iconCenters]
    );

    const handleFocus = (index) => setFocusedIndex(index);
    const handleBlur = () => setFocusedIndex(null);

    return (
        <nav className="fixed bottom-6 left-1/2 z-50 flex w-full max-w-4xl -translate-x-1/2 justify-center px-4">
            <motion.ul
                className="flex items-end gap-3 rounded-[28px] border border-white/40 bg-white/70 px-5 py-3 backdrop-blur-2xl shadow-[0_18px_40px_-25px_rgba(15,23,42,0.75)] dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_18px_40px_-25px_rgba(15,118,110,0.55)]"
                initial={{ opacity: 0, y: 45 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                onMouseMove={(event) => setHoverX(event.clientX)}
                onMouseLeave={() => setHoverX(null)}
            >
                {dockItems.map((item, index) => {
                    const isTheme = item.type === 'theme';
                    const Icon = item.icon;
                    const isActive = !isTheme && item.match ? item.match(location.pathname) : false;
                    let { scale, lift, proximity } = getMetrics(index, isActive);

                    if (focusedIndex === index) {
                        scale = Math.max(scale, 1.2);
                        lift = Math.min(lift, -18);
                        proximity = Math.max(proximity, 1);
                    }

                    const showLabel = isTheme ? proximity > 0.6 || focusedIndex === index : proximity > 0.55 || isActive || focusedIndex === index;

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
                                    animate={{ scale, y: lift }}
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
                                </motion.div>
                            </div>
                        </motion.li>
                    );
                })}
            </motion.ul>
        </nav>
    );
}