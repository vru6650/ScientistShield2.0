import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    baseDockItems,
    dashboardDockItem,
    quickAddDockItem,
    themeDockItem,
} from '../data/dockItems';
import { toggleTheme } from '../redux/theme/themeSlice';

const ICON_CONTAINER_BASE =
    'relative flex h-16 w-16 items-center justify-center rounded-[22px] transition-all duration-300 backdrop-blur-2xl will-change-transform';
const ACTIVE_CLASSES =
    'bg-white/80 shadow-[0_26px_45px_-20px_rgba(56,189,248,0.65)] ring-2 ring-white/60 dark:bg-slate-900/70 dark:ring-slate-100/20 dark:shadow-[0_26px_45px_-24px_rgba(148,163,184,0.65)]';
const INACTIVE_CLASSES =
    'bg-white/40 ring-1 ring-white/45 shadow-[0_24px_40px_-22px_rgba(15,23,42,0.55)] dark:bg-slate-900/55 dark:ring-slate-100/10 dark:shadow-[0_24px_40px_-24px_rgba(15,23,42,0.65)]';
// Stronger magnification for macOS-like feel
const DOCK_INFLUENCE_DISTANCE = 120;

// Default dock settings and storage helpers
const DEFAULT_DOCK_SETTINGS = {
    scale: 1.0, // overall dock scale
    influenceDistance: 120, // magnification radius
    magnifyBoost: 0.35, // base magnification boost
    magnifyBoostActive: 0.45, // additional boost when item is active
    stackStyle: 'grid', // 'grid' or 'fan' for Recents stack
    lockReorder: false, // when true, disable drag-reorder and removal
    magnifyEnabled: true, // macOS-like magnification toggle
    animateOnOpen: true, // bounce/animate on open
    showRecents: true, // show recent items section
};

const storage = {
    get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // ignore
        }
    },
};

const LS_KEYS = {
    settings: 'dock.settings.v1',
    order: 'dock.order.v1',
    hidden: 'dock.hidden.v1',
    recents: 'dock.recents.v1',
};

const ADMIN_QUICK_ADD_OPTIONS = [
    {
        to: '/create-post',
        label: 'New Post',
        description: 'Share a fresh insight or announcement with the community.',
        illustration: 'post',
    },
    {
        to: '/create-tutorial',
        label: 'New Tutorial',
        description: 'Design a guided learning journey in minutes.',
        illustration: 'tutorial',
    },
    {
        to: '/create-quiz',
        label: 'New Quiz',
        description: 'Build an interactive assessment for your learners.',
        illustration: 'quiz',
    },
    {
        to: '/create-problem',
        label: 'New Problem',
        description: 'Add a fresh coding challenge for practice.',
        illustration: 'problem',
    },
];

const BASE_QUICK_ADD_OPTIONS = [
    {
        to: '/quizzes',
        label: 'Practice Quiz',
        description: 'Jump straight into a timed knowledge check.',
        illustration: 'quiz',
    },
    {
        to: '/problems',
        label: 'Solve a Problem',
        description: 'Sharpen your skills with curated exercises.',
        illustration: 'problem',
    },
    {
        to: '/tools',
        label: 'Open Tools',
        description: 'Launch compilers, sandboxes, and utilities.',
        illustration: 'tools',
    },
];

const GUEST_QUICK_ADD_OPTION = {
    to: '/sign-up',
    label: 'Invite a Collaborator',
    description: 'Create an account to co-build alongside your team.',
    illustration: 'invite',
};

const QuickAddIllustration = ({ variant }) => {
    switch (variant) {
        case 'post':
            return (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                    <path
                        d="M4.75 5.75C4.75 4.7835 5.5335 4 6.5 4H13L18.75 9.75V18.25C18.75 19.2165 17.9665 20 17 20H6.5C5.5335 20 4.75 19.2165 4.75 18.25V5.75Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                    />
                    <path d="M13 4V8.5C13 9.32843 13.6716 10 14.5 10H18.75" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M7.5 13H15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M7.5 16H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            );
        case 'tutorial':
            return (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                    <path
                        d="M6.5 6H11.5C12.6046 6 13.5 6.89543 13.5 8V19C13.5 17.8954 12.6046 17 11.5 17H6.5V6Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M17.5 6H12.5C11.3954 6 10.5 6.89543 10.5 8V19C10.5 17.8954 11.3954 17 12.5 17H17.5V6Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                    />
                    <path d="M7.5 9.5H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M7.5 13H11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            );
        case 'quiz':
            return (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                    <path
                        d="M12 5.25C9.37665 5.25 7.25 7.37665 7.25 10C7.25 11.4255 7.93537 12.7261 9.0294 13.6031C10.3026 14.6152 10.75 15.3322 10.75 16.75V18"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                    <path
                        d="M12 19.75C11.3096 19.75 10.75 19.1904 10.75 18.5C10.75 17.8096 11.3096 17.25 12 17.25C12.6904 17.25 13.25 17.8096 13.25 18.5C13.25 19.1904 12.6904 19.75 12 19.75Z"
                        fill="currentColor"
                    />
                    <path
                        d="M12 5.25C14.6234 5.25 16.75 7.37665 16.75 10C16.75 11.5442 15.9958 12.7958 14.5 13.75"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                </svg>
            );
        case 'problem':
            return (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                    <path
                        d="M12 5C9.23858 5 7 7.23858 7 10C7 11.9952 8.16377 13.7349 9.92077 14.5565C10.6141 14.8798 11.031 15.5805 11.031 16.3418V17.25"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                    <path d="M10 19H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path
                        d="M13 16.5C13 15.6716 13.6716 15 14.5 15C16.433 15 18 13.433 18 11.5C18 9.567 16.433 8 14.5 8C14.0071 8 13.5418 8.12041 13.125 8.33579"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                </svg>
            );
        case 'tools':
            return (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                    <path
                        d="M8.75 5.75L7 7.5L9.25 9.75L7.75 11.25L4.75 8.25L6.5 6.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M13.5 7L18.25 11.75L14.75 15.25L10 10.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path d="M12 15.5L15 18.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            );
        case 'invite':
        default:
            return (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                    <path
                        d="M12 6.5C13.6569 6.5 15 7.84315 15 9.5C15 11.1569 13.6569 12.5 12 12.5C10.3431 12.5 9 11.1569 9 9.5C9 7.84315 10.3431 6.5 12 6.5Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                    />
                    <path
                        d="M7.5 17.5C7.5 15.2909 9.29086 13.5 11.5 13.5H12.5C14.7091 13.5 16.5 15.2909 16.5 17.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                    <path d="M19 9.25V12.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M20.75 11H17.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            );
    }
};

const ChevronRight = (props) => (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
        <path d="M6 3L10 8L6 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

QuickAddIllustration.propTypes = {
    variant: PropTypes.string,
};

export default function BottomNav() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentUser } = useSelector((state) => state.user);
    const { theme } = useSelector((state) => state.theme);
    const location = useLocation();
    const isAdmin = Boolean(currentUser?.isAdmin);

    // Settings / preferences
    const [settings, setSettings] = useState(() => storage.get(LS_KEYS.settings, DEFAULT_DOCK_SETTINGS));
    const updateSettings = useCallback((patch) => {
        setSettings((prev) => {
            const merged = { ...prev, ...patch };
            storage.set(LS_KEYS.settings, merged);
            return merged;
        });
    }, []);

    // Hidden keys and custom order (for primary items only)
    const [hiddenKeys, setHiddenKeys] = useState(() => storage.get(LS_KEYS.hidden, []));
    const [customOrder, setCustomOrder] = useState(() => storage.get(LS_KEYS.order, []));

    const setHidden = useCallback((nextHidden) => {
        setHiddenKeys(nextHidden);
        storage.set(LS_KEYS.hidden, nextHidden);
    }, []);

    const setOrder = useCallback((nextOrder) => {
        setCustomOrder(nextOrder);
        storage.set(LS_KEYS.order, nextOrder);
    }, []);

    // Build primary dock items, filter hidden, then apply custom order
    const basePlusAuth = useMemo(() => {
        const items = [...baseDockItems];
        if (currentUser) items.push(dashboardDockItem);
        return items.filter((it) => !hiddenKeys.includes(it.key));
    }, [currentUser, hiddenKeys]);

    const orderedNavItems = useMemo(() => {
        if (!customOrder?.length) return basePlusAuth;
        const byKey = new Map(basePlusAuth.map((it) => [it.key, it]));
        const ordered = [];
        customOrder.forEach((key) => {
            const item = byKey.get(key);
            if (item) {
                ordered.push(item);
                byKey.delete(key);
            }
        });
        byKey.forEach((item) => ordered.push(item));
        return ordered;
    }, [basePlusAuth, customOrder]);

    // Recents tracking
    const [recents, setRecents] = useState(() => storage.get(LS_KEYS.recents, []));
    useEffect(() => {
        const match = [...baseDockItems, dashboardDockItem].find((it) => it.match?.(location.pathname));
        if (!match) return;
        setRecents((prev) => {
            const next = [match.key, ...prev.filter((k) => k !== match.key)].slice(0, 6);
            storage.set(LS_KEYS.recents, next);
            return next;
        });
    }, [location.pathname]);

    // Final dock sequence (apps | recents | separator | quick actions)
    const dockItems = useMemo(() => {
        const items = [...orderedNavItems];
        const virtual = [];
        if (settings.showRecents && recents.length) virtual.push({ key: 'recents', type: 'recents', label: 'Recents' });
        virtual.push({ key: 'separator', type: 'separator' });
        return [...items, ...virtual, quickAddDockItem, themeDockItem];
    }, [orderedNavItems, recents, settings.showRecents]);

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
    const [isRecentsOpen, setIsRecentsOpen] = useState(false);
    const [bouncingIndex, setBouncingIndex] = useState(null);
    const iconRefs = useRef([]);
    const [iconCenters, setIconCenters] = useState([]);
    const quickAddTriggerRef = useRef(null);
    const quickAddMenuRef = useRef(null);
    const recentsTriggerRef = useRef(null);
    const recentsMenuRef = useRef(null);
    const focusRefs = useRef([]);

    // Dock container ref (focus/keyboard nav)
    const dockRef = useRef(null);

    // Reduced motion preference (respect OS setting)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    useEffect(() => {
        try {
            const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
            const apply = (e) => setPrefersReducedMotion(Boolean(e.matches));
            apply(mq);
            if (mq.addEventListener) mq.addEventListener('change', apply);
            else if (mq.addListener) mq.addListener(apply);
            return () => {
                if (mq.removeEventListener) mq.removeEventListener('change', apply);
                else if (mq.removeListener) mq.removeListener(apply);
            };
        } catch {
            setPrefersReducedMotion(false);
            return () => {};
        }
    }, []);

    // Auto-hide removed; dock remains visible

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

    useEffect(() => {
        if (!isRecentsOpen) return undefined;

        const handleClickOutside = (event) => {
            if (
                recentsTriggerRef.current?.contains(event.target) ||
                recentsMenuRef.current?.contains(event.target)
            ) {
                return;
            }
            setIsRecentsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isRecentsOpen]);

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
            const radius = settings.influenceDistance ?? DOCK_INFLUENCE_DISTANCE;
            const clamped = Math.max(0, 1 - distance / radius);
            const baseBoost = isActive ? (settings.magnifyBoostActive ?? 0.45) : (settings.magnifyBoost ?? 0.35);
            const enabledBoost = settings.magnifyEnabled ? baseBoost : 0;
            const scaleBoost = prefersReducedMotion ? Math.min(0.15, enabledBoost) : enabledBoost;
            const scale = (isActive ? 1.2 : 1) + clamped * scaleBoost;
            const lift = (isActive ? -10 : 0) - clamped * (prefersReducedMotion ? 12 : 26);
            const rotate = prefersReducedMotion ? 0 : (hoverX - center) / 100;

            return {
                scale,
                lift,
                proximity: clamped,
                rotate,
            };
        },
        [hoverX, iconCenters, settings.influenceDistance, settings.magnifyBoost, settings.magnifyBoostActive, settings.magnifyEnabled, prefersReducedMotion]
    );

    const handleFocus = (index) => setFocusedIndex(index);
    const handleBlur = () => setFocusedIndex(null);

    const triggerBounce = (index) => {
        if (!settings.animateOnOpen) return;
        setBouncingIndex(index);
        setTimeout(() => setBouncingIndex((prev) => (prev === index ? null : prev)), 520);
    };

    const handleThemeToggle = () => dispatch(toggleTheme());

    // Drag-to-reorder (for primary items only)
    const draggingKeyRef = useRef(null);
    const [dragOverKey, setDragOverKey] = useState(null);
    const isReorderable = (item) => item && !item.type && !settings.lockReorder; // only primary app links, unless locked
    const handleDragStart = (key) => (e) => {
        if (!isReorderable(orderedNavItems.find((it) => it.key === key))) return;
        draggingKeyRef.current = key;
        setDragOverKey(null);
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', key); } catch {}
    };
    const handleDragOver = (key) => (e) => {
        if (!draggingKeyRef.current) return;
        if (draggingKeyRef.current === key) return;
        e.preventDefault();
        setDragOverKey(key);
    };
    const handleDrop = (key) => (e) => {
        if (!draggingKeyRef.current) return;
        e.preventDefault();
        const fromKey = draggingKeyRef.current;
        const toKey = key;
        setDragOverKey(null);
        draggingKeyRef.current = null;
        if (fromKey === toKey) return;
        const keys = orderedNavItems.map((it) => it.key);
        const fromIdx = keys.indexOf(fromKey);
        const toIdx = keys.indexOf(toKey);
        if (fromIdx < 0 || toIdx < 0) return;
        keys.splice(toIdx, 0, keys.splice(fromIdx, 1)[0]);
        setOrder(keys);
    };
    const handleDragEnd = () => {
        setDragOverKey(null);
        draggingKeyRef.current = null;
    };

    // Context menu
    const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, item: null });
    const openContextMenuAt = (x, y, item) => {
        setContextMenu({ open: true, x, y, item });
    };
    const openContextMenu = (event, item) => {
        event.preventDefault();
        openContextMenuAt(event.clientX, event.clientY, item);
    };
    useEffect(() => {
        const close = () => setContextMenu((c) => (c.open ? { ...c, open: false } : c));
        window.addEventListener('click', close);
        window.addEventListener('contextmenu', close);
        return () => {
            window.removeEventListener('click', close);
            window.removeEventListener('contextmenu', close);
        };
    }, []);

    // Preferences modal
    const [showPrefs, setShowPrefs] = useState(false);
    const togglePrefs = () => setShowPrefs((s) => !s);

    // If overlays are open, include them in visibility logic (handled below)

    // Auto-hide keyboard shortcut removed

    // Long‑press (primary button) to open context menu like macOS
    const longPressTimerRef = useRef(null);
    const longPressTriggeredRef = useRef(false);
    const startLongPress = (e, item) => {
        if (e.button !== 0) return; // only primary button
        longPressTriggeredRef.current = false;
        const { clientX, clientY } = e;
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = setTimeout(() => {
            longPressTriggeredRef.current = true;
            openContextMenuAt(clientX, clientY, item);
        }, 500);
    };
    const cancelLongPress = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    // Keyboard navigation across dock items
    const focusItemAt = useCallback((idx) => {
        const el = focusRefs.current[idx];
        if (el && typeof el.focus === 'function') {
            el.focus();
        }
        setFocusedIndex(idx);
    }, []);

    const moveFocus = useCallback((delta) => {
        if (!dockItems?.length) return;
        let idx = focusedIndex ?? 0;
        // find next non-separator index
        for (let i = 0; i < dockItems.length; i += 1) {
            idx = (idx + delta + dockItems.length) % dockItems.length;
            const item = dockItems[idx];
            if (item && item.type !== 'separator') break;
        }
        focusItemAt(idx);
    }, [dockItems, focusedIndex, focusItemAt]);

    return (
        <nav className="fixed bottom-6 left-1/2 z-50 flex w-full max-w-4xl -translate-x-1/2 justify-center px-4">
            <motion.ul
                ref={dockRef}
                className="group relative flex items-end gap-4 overflow-visible rounded-[2.5rem] border border-white/40 bg-white/30 px-6 py-4 shadow-[0_45px_90px_-40px_rgba(14,116,144,0.55)] backdrop-blur-3xl before:absolute before:-top-6 before:left-1/2 before:h-12 before:w-[78%] before:-translate-x-1/2 before:rounded-[999px] before:bg-white/60 before:opacity-70 before:blur-2xl before:content-[''] after:absolute after:-bottom-8 after:left-1/2 after:h-10 after:w-[70%] after:-translate-x-1/2 after:rounded-full after:bg-cyan-500/10 after:blur-3xl after:content-[''] dark:border-slate-100/10 dark:bg-slate-900/40 dark:before:bg-slate-200/30 dark:after:bg-slate-500/20"
                style={{ scale: settings.scale, pointerEvents: 'auto' }}
                initial={{ opacity: 0, y: 45 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0.0 : 0.35, ease: 'easeOut' }}
                onMouseMove={(event) => setHoverX(event.clientX)}
                onMouseLeave={() => { setHoverX(null); }}
                onContextMenu={(e) => openContextMenu(e, null)}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); moveFocus(1); }
                    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); moveFocus(-1); }
                    else if (e.key === 'Escape') {
                        if (isQuickAddOpen) setIsQuickAddOpen(false);
                        if (isRecentsOpen) setIsRecentsOpen(false);
                    }
                }}
            >
                {dockItems.map((item, index) => {
                    if (item.type === 'separator') {
                        return (
                            <li key="separator" className="h-10 w-px -mb-2 self-stretch bg-gradient-to-b from-transparent via-slate-300/60 to-transparent dark:via-slate-600/60" aria-hidden />
                        );
                    }
                    const isTheme = item.type === 'theme';
                    const isQuickAdd = item.type === 'quick-add';
                    const isRecents = item.type === 'recents';
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
                            : isRecents
                                ? isRecentsOpen || proximity > 0.5 || focusedIndex === index
                                : proximity > 0.55 || isActive || focusedIndex === index;

                    const glowOpacity = Math.max(0, proximity - 0.25);
                    const baseRingOpacity = Math.max(0, proximity - 0.4);
                    const ringOpacity = isTheme || isQuickAdd || isRecents ? Math.max(0.25, baseRingOpacity) : baseRingOpacity;

                    const label = item.label;
                    const iconAlt = item.iconAlt ?? label;
                    const isRunning = !isTheme && !isRecents && (isActive || recents.includes(item.key));

                    return (
                        <motion.li
                            key={item.to ?? item.key ?? label}
                            className={`relative flex flex-col items-center ${(!item.type && !settings.lockReorder) ? 'cursor-move' : ''}`}
                            draggable={!item.type && !settings.lockReorder}
                            onDragStart={!item.type ? handleDragStart(item.key) : undefined}
                            onDragOver={!item.type ? handleDragOver(item.key) : undefined}
                            onDrop={!item.type ? handleDrop(item.key) : undefined}
                            onDragEnd={handleDragEnd}
                            onContextMenu={(e) => openContextMenu(e, item)}
                        >
                            <div
                                ref={(element) => {
                                    iconRefs.current[index] = element;
                                }}
                                className="relative flex flex-col items-center"
                            >
                                <motion.div
                                    className="relative flex flex-col items-center"
                                    initial={false}
                                    animate={{
                                        scale,
                                        y: prefersReducedMotion ? lift : (bouncingIndex === index ? [lift, lift - 18, lift, lift - 10, lift] : lift),
                                        rotate,
                                    }}
                                    transition={{
                                        type: 'spring', stiffness: 320, damping: 22,
                                        ...(bouncingIndex === index && !prefersReducedMotion ? { duration: 0.55, ease: 'easeOut' } : {}),
                                    }}
                                >
                                    <motion.span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-cyan-400/25 via-sky-400/15 to-blue-500/25 blur-xl"
                                        initial={false}
                                        animate={{ opacity: glowOpacity }}
                                        transition={{ duration: 0.18 }}
                                    />
                                    <motion.span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute left-1/2 top-full z-0 mt-1 h-6 w-12 -translate-x-1/2 rounded-b-[28px] bg-gradient-to-t from-white/60 via-white/10 to-transparent opacity-70 dark:from-slate-200/30"
                                        initial={false}
                                        animate={{ opacity: Math.max(0, proximity - 0.15), scaleY: 1 + proximity * 0.25 }}
                                        transition={{ duration: 0.2 }}
                                    />
                                    {isTheme ? (
                                        <button
                                            type="button"
                                            aria-label={label}
                                            aria-pressed={theme === 'dark'}
                                            onClick={() => { triggerBounce(index); handleThemeToggle(); }}
                                            onFocus={() => handleFocus(index)}
                                            onBlur={handleBlur}
                                            className="group relative flex flex-col items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
                                            ref={(el) => { focusRefs.current[index] = el; }}
                                        >
                                            <div className={`${ICON_CONTAINER_BASE} ${theme === 'dark' ? ACTIVE_CLASSES : INACTIVE_CLASSES}`}>
                                                <span className="pointer-events-none absolute inset-[2px] rounded-[20px] border border-white/40 bg-gradient-to-br from-white/40 via-white/10 to-transparent dark:border-white/10" />
                                                <span className="pointer-events-none absolute inset-x-3 top-1.5 h-1/3 rounded-[18px] bg-gradient-to-b from-white/90 via-white/20 to-transparent opacity-80 dark:from-white/40" />
                                                <span className="pointer-events-none absolute inset-x-2 bottom-1 h-1/3 rounded-b-[18px] bg-gradient-to-t from-white/20 via-transparent to-transparent opacity-60 dark:from-white/5" />
                                                <motion.img
                                                    src={item.iconSrc}
                                                    onError={(e) => {
                                                        if (e.currentTarget.dataset.fallbackApplied) return;
                                                        e.currentTarget.dataset.fallbackApplied = '1';
                                                        if (item.fallbackIconSrc) e.currentTarget.src = item.fallbackIconSrc;
                                                    }}
                                                    alt={iconAlt}
                                                    className="relative h-12 w-12 select-none object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,0.35)]"
                                                    initial={false}
                                                    animate={{ rotate: theme === 'dark' ? 180 : 0 }}
                                                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                                                    draggable={false}
                                                />
                                                {/* macOS-like reflection */}
                                                <motion.img
                                                    src={item.iconSrc}
                                                    onError={(e) => {
                                                        if (e.currentTarget.dataset.fallbackApplied) return;
                                                        e.currentTarget.dataset.fallbackApplied = '1';
                                                        if (item.fallbackIconSrc) e.currentTarget.src = item.fallbackIconSrc;
                                                    }}
                                                    alt=""
                                                    aria-hidden
                                                    className="pointer-events-none absolute top-full left-1/2 h-10 w-10 -translate-x-1/2 scale-y-[-1] opacity-30"
                                                    style={{ WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)', maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)' }}
                                                    initial={false}
                                                    animate={{ opacity: Math.max(0, proximity - 0.2) * 0.6 }}
                                                    transition={{ duration: 0.15 }}
                                                />
                                            </div>
                                        </button>
                                    ) : isQuickAdd ? (
                                        <button
                                            type="button"
                                            ref={quickAddTriggerRef}
                                            aria-label={label}
                                            aria-haspopup="menu"
                                            aria-expanded={isQuickAddOpen}
                                            className={`group relative flex flex-col items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent ${isQuickAddOpen ? 'scale-105' : ''}`}
                                            onClick={() => { triggerBounce(index); setIsQuickAddOpen((open) => !open); }}
                                            onFocus={() => handleFocus(index)}
                                            onBlur={(event) => {
                                                if (quickAddMenuRef.current?.contains(event.relatedTarget)) {
                                                    return;
                                                }
                                                handleBlur();
                                            }}
                                            ref={(el) => { focusRefs.current[index] = el; }}
                                        >
                                            <div className={`${ICON_CONTAINER_BASE} ${isQuickAddOpen ? ACTIVE_CLASSES : INACTIVE_CLASSES}`}>
                                                <span className="pointer-events-none absolute inset-[2px] rounded-[20px] border border-white/40 bg-gradient-to-br from-white/40 via-white/10 to-transparent dark:border-white/10" />
                                                <span className="pointer-events-none absolute inset-x-3 top-1.5 h-1/3 rounded-[18px] bg-gradient-to-b from-white/90 via-white/20 to-transparent opacity-80 dark:from-white/40" />
                                                <span className="pointer-events-none absolute inset-x-2 bottom-1 h-1/3 rounded-b-[18px] bg-gradient-to-t from-white/20 via-transparent to-transparent opacity-60 dark:from-white/5" />
                                                <motion.img
                                                    src={item.iconSrc}
                                                    onError={(e) => {
                                                        if (e.currentTarget.dataset.fallbackApplied) return;
                                                        e.currentTarget.dataset.fallbackApplied = '1';
                                                        if (item.fallbackIconSrc) e.currentTarget.src = item.fallbackIconSrc;
                                                    }}
                                                    alt={iconAlt}
                                                    className="relative h-12 w-12 select-none object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,0.35)]"
                                                    initial={false}
                                                    animate={{ scale: isQuickAddOpen ? 1.08 : 1 }}
                                                    transition={{ duration: 0.2 }}
                                                    draggable={false}
                                                />
                                                {/* macOS-like reflection */}
                                                <motion.img
                                                    src={item.iconSrc}
                                                    onError={(e) => {
                                                        if (e.currentTarget.dataset.fallbackApplied) return;
                                                        e.currentTarget.dataset.fallbackApplied = '1';
                                                        if (item.fallbackIconSrc) e.currentTarget.src = item.fallbackIconSrc;
                                                    }}
                                                    alt=""
                                                    aria-hidden
                                                    className="pointer-events-none absolute top-full left-1/2 h-10 w-10 -translate-x-1/2 scale-y-[-1] opacity-30"
                                                    style={{ WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)', maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)' }}
                                                    initial={false}
                                                    animate={{ opacity: Math.max(0, proximity - 0.2) * 0.6 }}
                                                    transition={{ duration: 0.15 }}
                                                />
                                            </div>
                                        </button>
                                    ) : isRecents ? (
                                        <button
                                            type="button"
                                            ref={recentsTriggerRef}
                                            aria-label={label}
                                            aria-haspopup="menu"
                                            aria-expanded={isRecentsOpen}
                                            className={`group relative flex flex-col items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent ${isRecentsOpen ? 'scale-105' : ''}`}
                                            onClick={() => { triggerBounce(index); setIsRecentsOpen((open) => !open); }}
                                            onFocus={() => handleFocus(index)}
                                            onBlur={(event) => {
                                                if (recentsMenuRef.current?.contains(event.relatedTarget)) {
                                                    return;
                                                }
                                                handleBlur();
                                            }}
                                            ref={(el) => { focusRefs.current[index] = el; }}
                                        >
                                            <div className={`${ICON_CONTAINER_BASE} ${isRecentsOpen ? ACTIVE_CLASSES : INACTIVE_CLASSES}`}>
                                                <span className="pointer-events-none absolute inset-[2px] rounded-[20px] border border-white/40 bg-gradient-to-br from-white/40 via-white/10 to-transparent dark:border-white/10" />
                                                <span className="pointer-events-none absolute inset-x-3 top-1.5 h-1/3 rounded-[18px] bg-gradient-to-b from-white/90 via-white/20 to-transparent opacity-80 dark:from-white/40" />
                                                <span className="pointer-events-none absolute inset-x-2 bottom-1 h-1/3 rounded-b-[18px] bg-gradient-to-t from-white/20 via-transparent to-transparent opacity-60 dark:from-white/5" />
                                                <motion.svg viewBox="0 0 24 24" className="h-8 w-8 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.6">
                                                    <path d="M12 8v5l3 1" strokeLinecap="round" />
                                                    <path d="M4 12a8 8 0 1 0 8-8" />
                                                    <path d="M3 3v5h5" strokeLinecap="round" />
                                                </motion.svg>
                                            </div>
                                        </button>
                                    ) : (
                                        <Link
                                            to={item.to}
                                            aria-label={label}
                                            aria-current={isActive ? 'page' : undefined}
                                            className="group relative flex flex-col items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
                                            onFocus={() => handleFocus(index)}
                                            onBlur={handleBlur}
                                            onMouseDown={(e) => { triggerBounce(index); startLongPress(e, item); }}
                                            onMouseUp={() => cancelLongPress()}
                                            onMouseLeave={() => cancelLongPress()}
                                            onClick={(e) => { if (longPressTriggeredRef.current) { e.preventDefault(); e.stopPropagation(); longPressTriggeredRef.current = false; } else { triggerBounce(index); } }}
                                            onAuxClick={(e) => { if (e.button === 1 && item.to) { e.preventDefault(); window.open(item.to, '_blank', 'noopener'); } }}
                                            ref={(el) => { focusRefs.current[index] = el; }}
                                        >
                                            <div className={`${ICON_CONTAINER_BASE} ${isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES}`}>
                                                <span className="pointer-events-none absolute inset-[2px] rounded-[20px] border border-white/40 bg-gradient-to-br from-white/40 via-white/10 to-transparent dark:border-white/10" />
                                                <span className="pointer-events-none absolute inset-x-3 top-1.5 h-1/3 rounded-[18px] bg-gradient-to-b from-white/90 via-white/20 to-transparent opacity-80 dark:from-white/40" />
                                                <span className="pointer-events-none absolute inset-x-2 bottom-1 h-1/3 rounded-b-[18px] bg-gradient-to-t from-white/20 via-transparent to-transparent opacity-60 dark:from-white/5" />
                                                <motion.img
                                                    src={item.iconSrc}
                                                    alt={iconAlt}
                                                    className="relative h-12 w-12 select-none object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,0.35)]"
                                                    initial={false}
                                                    animate={{ scale: isActive ? 1.05 : 1 }}
                                                    transition={{ duration: 0.2 }}
                                                    draggable={false}
                                                />
                                                {/* macOS-like reflection */}
                                                <motion.img
                                                    src={item.iconSrc}
                                                    alt=""
                                                    aria-hidden
                                                    className="pointer-events-none absolute top-full left-1/2 h-10 w-10 -translate-x-1/2 scale-y-[-1] opacity-30"
                                                    style={{ WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)', maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)' }}
                                                    initial={false}
                                                    animate={{ opacity: Math.max(0, proximity - 0.2) * 0.6 }}
                                                    transition={{ duration: 0.15 }}
                                                />
                                            </div>
                                        </Link>
                                    )}
                                    <motion.span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-0 rounded-[22px] ring-2 ring-sky-200/60 dark:ring-slate-400/40"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: isTheme ? ringOpacity : ringOpacity }}
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
                                    {isRunning ? (
                                        <motion.span
                                            layoutId={`dock-indicator-${item.key}`}
                                            className={`absolute -bottom-2 h-1.5 w-1.5 rounded-full ${isActive ? 'bg-gradient-to-r from-cyan-400 to-blue-400 dark:from-cyan-300 dark:to-sky-400' : 'bg-slate-400/80 dark:bg-slate-500/80'}`}
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
                                                    {quickAddOptions.map((option) => (
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
                                                                    <QuickAddIllustration variant={option.illustration} />
                                                                </span>
                                                                <span className="flex-1">
                                                                    <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                        {option.label}
                                                                    </span>
                                                                    <span className="mt-0.5 block text-xs text-slate-500 transition group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200">
                                                                        {option.description}
                                                                    </span>
                                                                </span>
                                                                <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-300" />
                                                            </Link>
                                                        </motion.li>
                                                    ))}
                                                </motion.ul>
                                            </motion.div>
                                        ) : isRecents && isRecentsOpen ? (
                                            settings.stackStyle === 'grid' ? (
                                                <motion.div
                                                    key="recents-grid"
                                                    ref={recentsMenuRef}
                                                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                                                    animate={{ opacity: 1, y: -14, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                                    className="absolute bottom-24 left-1/2 w-[19rem] max-w-xs -translate-x-1/2 rounded-3xl border border-white/60 bg-white/95 p-4 shadow-[0_35px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-800/60 dark:bg-slate-900/95"
                                                    role="menu"
                                                    aria-label="Recent items"
                                                >
                                                    <div className="mb-2 text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">Recents</div>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {recents.map((key) => {
                                                            const rItem = [...baseDockItems, dashboardDockItem].find((it) => it.key === key);
                                                            if (!rItem) return null;
                                                            return (
                                                                <button
                                                                    key={key}
                                                                    type="button"
                                                                    className="group flex flex-col items-center rounded-2xl border border-slate-200/60 bg-white/70 px-2 py-2 shadow-sm transition hover:border-cyan-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 dark:border-slate-700/70 dark:bg-slate-900/70 dark:hover:border-sky-500/40 dark:hover:bg-slate-900"
                                                                    onClick={() => { setIsRecentsOpen(false); navigate(rItem.to); }}
                                                                    onContextMenu={(e) => openContextMenu(e, rItem)}
                                                                >
                                                                    <img src={rItem.iconSrc} alt={rItem.label} className="h-8 w-8 drop-shadow" />
                                                                    <span className="mt-1 line-clamp-1 text-center text-[11px] font-medium text-slate-700 dark:text-slate-300">{rItem.label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="recents-fan"
                                                    ref={recentsMenuRef}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.18 }}
                                                    className="pointer-events-auto absolute bottom-20 left-1/2 -translate-x-1/2 select-none"
                                                    aria-label="Recent items fan"
                                                    role="menu"
                                                >
                                                    {recents.map((key, i) => {
                                                        const rItem = [...baseDockItems, dashboardDockItem].find((it) => it.key === key);
                                                        if (!rItem) return null;
                                                        const count = recents.length;
                                                        const t = (i + 1) / count; // 0..1
                                                        const angle = 18 + t * 42; // 18..60 degrees
                                                        const radius = 80 + t * 48; // distance from origin
                                                        const rad = (angle * Math.PI) / 180;
                                                        const x = Math.cos(rad) * radius * -1; // fan up-left
                                                        const y = Math.sin(rad) * radius * -1;
                                                        const z = i; // stacking
                                                        return (
                                                            <motion.button
                                                                key={key}
                                                                type="button"
                                                                className="absolute rounded-2xl border border-white/50 bg-white/80 p-2 shadow-lg backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/80"
                                                                style={{ zIndex: 60 + z }}
                                                                initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.85 }}
                                                                animate={{ opacity: 1, x, y, rotate: -angle + 10, scale: 1 }}
                                                                exit={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.85 }}
                                                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                                                onClick={() => { setIsRecentsOpen(false); navigate(rItem.to); }}
                                                                role="menuitem"
                                                                aria-label={rItem.label}
                                                                onContextMenu={(e) => openContextMenu(e, rItem)}
                                                            >
                                                                <img src={rItem.iconSrc} alt="" className="h-9 w-9 drop-shadow" onError={(e) => { if (!e.currentTarget.dataset.fallbackApplied) { e.currentTarget.dataset.fallbackApplied = '1'; if (rItem.fallbackIconSrc) e.currentTarget.src = rItem.fallbackIconSrc; } }} />
                                                            </motion.button>
                                                        );
                                                    })}
                                                </motion.div>
                                            )
                                        ) : null}
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        </motion.li>
                    );
                })}
            </motion.ul>

            {/* Auto-hide reveal strip removed */}

            {/* Context menu */}
            <AnimatePresence>
                {contextMenu.open ? (
                    <motion.ul
                        key="dock-context-menu"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.12 }}
                        className="fixed z-[60] min-w-[14rem] space-y-1 rounded-2xl border border-white/60 bg-white/95 p-2 text-sm shadow-xl backdrop-blur-2xl dark:border-slate-800/60 dark:bg-slate-900/95"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                        role="menu"
                        aria-label="Dock menu"
                    >
                        {contextMenu.item ? (
                            <>
                                {contextMenu.item.to && (
                                    <li>
                                        <button className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => navigate(contextMenu.item.to)}>
                                            Open
                                        </button>
                                    </li>
                                )}
                                {contextMenu.item.to && (
                                    <li>
                                        <button className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => window.open(contextMenu.item.to, '_blank', 'noopener') }>
                                            Open in New Tab
                                        </button>
                                    </li>
                                )}
                                {(!contextMenu.item.type) && (
                                    <li>
                                        {hiddenKeys.includes(contextMenu.item.key) ? (
                                            <button
                                                className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                                                onClick={() => setHidden(hiddenKeys.filter((k) => k !== contextMenu.item.key))}
                                            >
                                                Show in Dock
                                            </button>
                                        ) : (
                                            <button
                                                className={`w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 ${settings.lockReorder ? 'opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent' : ''}`}
                                                onClick={() => { if (!settings.lockReorder) setHidden([...hiddenKeys, contextMenu.item.key]); }}
                                                disabled={settings.lockReorder}
                                            >
                                                Remove from Dock
                                            </button>
                                        )}
                                    </li>
                                )}
                                <li className="my-1 h-px bg-slate-200/70 dark:bg-slate-700/60" aria-hidden />
                            </>
                        ) : null}
                        <li>
                            <button className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800" onClick={togglePrefs}>
                                Dock Preferences…
                            </button>
                        </li>
                        {/* Auto-hide toggle removed */}
                        <li>
                            <button
                                className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() => updateSettings({ showRecents: !settings.showRecents })}
                            >
                                {settings.showRecents ? 'Hide Recent Items' : 'Show Recent Items'}
                            </button>
                        </li>
                        <li>
                            <button
                                className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() => updateSettings({ lockReorder: !settings.lockReorder })}
                            >
                                {settings.lockReorder ? 'Unlock Dock' : 'Lock Dock'}
                            </button>
                        </li>
                        {(hiddenKeys?.length ?? 0) > 0 && (
                            <li>
                                <button className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setHidden([])}>
                                    Show All Items
                                </button>
                            </li>
                        )}
                        {(customOrder?.length ?? 0) > 0 && (
                            <li>
                                <button className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setOrder([])}>
                                    Reset Order
                                </button>
                            </li>
                        )}
                    </motion.ul>
                ) : null}
            </AnimatePresence>

            {/* Preferences modal */}
            <AnimatePresence>
                {showPrefs ? (
                    <motion.div
                        key="dock-prefs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[55] flex items-center justify-center bg-black/30 p-4"
                        onClick={() => setShowPrefs(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.98, y: 8 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.98, y: 8 }}
                            transition={{ duration: 0.15 }}
                            className="w-full max-w-md rounded-3xl border border-white/60 bg-white/95 p-5 shadow-2xl backdrop-blur-2xl dark:border-slate-800/60 dark:bg-slate-900/95"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Dock Preferences</div>
                            <div className="space-y-4 text-sm">
                                <label className="block">
                                    <span className="mb-1 block text-slate-600 dark:text-slate-300">Size</span>
                                    <input type="range" min="0.8" max="1.4" step="0.05" value={settings.scale} onChange={(e) => updateSettings({ scale: Number(e.target.value) })} className="w-full" />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-slate-600 dark:text-slate-300">Magnification Radius</span>
                                    <input type="range" min="60" max="180" step="5" value={settings.influenceDistance} onChange={(e) => updateSettings({ influenceDistance: Number(e.target.value) })} className="w-full" />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-slate-600 dark:text-slate-300">Magnification Intensity</span>
                                    <input type="range" min="0.1" max="0.7" step="0.05" value={settings.magnifyBoost} onChange={(e) => updateSettings({ magnifyBoost: Number(e.target.value) })} className="w-full" />
                                </label>
                                <label className="flex items-center gap-3">
                                    <input type="checkbox" checked={Boolean(settings.magnifyEnabled)} onChange={(e) => updateSettings({ magnifyEnabled: e.target.checked })} className="h-4 w-4" />
                                    <span className="text-slate-700 dark:text-slate-300">Enable Magnification</span>
                                </label>
                                <div className="block">
                                    <span className="mb-1 block text-slate-600 dark:text-slate-300">Recents Stack Style</span>
                                    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 p-1 dark:border-slate-700/60">
                                        <button
                                            type="button"
                                            className={`rounded-xl px-3 py-1.5 text-sm ${settings.stackStyle === 'grid' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-700 dark:text-slate-300'}`}
                                            onClick={() => updateSettings({ stackStyle: 'grid' })}
                                        >
                                            Grid
                                        </button>
                                        <button
                                            type="button"
                                            className={`rounded-xl px-3 py-1.5 text-sm ${settings.stackStyle === 'fan' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-700 dark:text-slate-300'}`}
                                            onClick={() => updateSettings({ stackStyle: 'fan' })}
                                        >
                                            Fan
                                        </button>
                                    </div>
                                </div>
                                <label className="flex items-center gap-3">
                                    <input type="checkbox" checked={Boolean(settings.showRecents)} onChange={(e) => updateSettings({ showRecents: e.target.checked })} className="h-4 w-4" />
                                    <span className="text-slate-700 dark:text-slate-300">Show Recent Items</span>
                                </label>
                                <label className="flex items-center gap-3">
                                    <input type="checkbox" checked={Boolean(settings.animateOnOpen)} onChange={(e) => updateSettings({ animateOnOpen: e.target.checked })} className="h-4 w-4" />
                                    <span className="text-slate-700 dark:text-slate-300">Animate Opening (bounce)</span>
                                </label>
                                {/* Auto-hide preferences removed */}
                                <label className="flex items-center gap-3">
                                    <input type="checkbox" checked={Boolean(settings.lockReorder)} onChange={(e) => updateSettings({ lockReorder: e.target.checked })} className="h-4 w-4" />
                                    <span className="text-slate-700 dark:text-slate-300">Lock Dock (prevent reordering/removal)</span>
                                </label>
                                {(hiddenKeys?.length ?? 0) > 0 || (customOrder?.length ?? 0) > 0 ? (
                                    <div className="pt-2">
                                        <button type="button" onClick={() => { setHidden([]); setOrder([]); updateSettings(DEFAULT_DOCK_SETTINGS); setShowPrefs(false); }} className="rounded-xl bg-slate-800 px-3 py-2 text-white shadow-sm hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">Reset Dock</button>
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </nav>
    );
}
