import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
    HiOutlineCpuChip,
    HiOutlineMusicalNote,
    HiOutlinePencilSquare,
    HiOutlinePlay,
    HiOutlineShieldCheck,
    HiOutlineSparkles,
    HiOutlineListBullet,
    HiOutlineSquares2X2,
} from 'react-icons/hi2';

import MacWindow from './MacWindow';

const WINDOW_STORAGE_VERSION = 2;
const WINDOW_STORAGE_KEY = 'scientistshield.desktop.windowState.v2';
const MAIN_WINDOW_ID = 'main-window';
const MAC_STAGE_MARGIN = 72;
const MAC_HEADER_HEIGHT = 82;

const WINDOW_TYPES = {
    MAIN: 'main',
    SCRATCHPAD: 'scratchpad',
    NOW_PLAYING: 'now-playing',
    STATUS: 'status',
    QUEUE: 'queue',
};

const DEFAULT_TODOS = [
    { id: 'todo-1', label: 'Review latest tutorial drafts', done: false },
    { id: 'todo-2', label: 'Ship UI polish branch', done: true },
    { id: 'todo-3', label: 'Prep upcoming webinar outline', done: false },
];

export default function MacWindowManager({ windowTitle, renderMainContent }) {
    const [windows, setWindows] = useState([]);
    const [closedTypes, setClosedTypes] = useState([]);
    const [scratchpadText, setScratchpadText] = useState(() => {
        if (typeof window === 'undefined') return '';
        return localStorage.getItem('scientistshield.desktop.scratchpad') ?? '';
    });
    const [currentTrackTime, setCurrentTrackTime] = useState(() => ({
        elapsed: 72,
        total: 245,
    }));
    const [todos, setTodos] = useState(DEFAULT_TODOS);
    const [isCompact, setIsCompact] = useState(
        typeof window === 'undefined' ? true : window.innerWidth < 1024
    );
    const [missionControlOpen, setMissionControlOpen] = useState(false);
    const [focusMode, setFocusMode] = useState(false);

    const zRef = useRef(20);
    const dragRef = useRef(null);
    const windowsRef = useRef([]);
    const hydrationRef = useRef(false);
    const focusMemoryRef = useRef(null);
    const persistedClosedTypesRef = useRef(null);

    useEffect(() => {
        windowsRef.current = windows;
    }, [windows]);

    const clampPosition = useCallback((x, y, width, height) => {
        if (typeof window === 'undefined') {
            return { x, y };
        }
        return clampWindowCoords(x, y, width, height, window.innerWidth, window.innerHeight);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        const handleResize = () => {
            const compact = window.innerWidth < 1024;
            setIsCompact(compact);
            if (!compact) {
                setWindows((wins) =>
                    wins.map((win) => {
                        const maxWidth = Math.max(window.innerWidth - 64, 360);
                        const maxHeight = Math.max(window.innerHeight - 140, 260);
                        const width = clampNumber(win.width ?? 420, 320, maxWidth);
                        const height = clampNumber(win.height ?? 320, 260, maxHeight);
                        const { x, y } = clampPosition(win.x, win.y, width, height);
                        return { ...win, width, height, x, y };
                    })
                );
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [clampPosition]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTrackTime((time) => {
                if (time.elapsed >= time.total) {
                    return { ...time, elapsed: 0 };
                }
                return { ...time, elapsed: Math.min(time.total, time.elapsed + 4) };
            });
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('scientistshield.desktop.scratchpad', scratchpadText);
    }, [scratchpadText]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let persistedPayload = null;
        if (!hydrationRef.current) {
            try {
                persistedPayload = JSON.parse(localStorage.getItem(WINDOW_STORAGE_KEY) || 'null');
            } catch {
                persistedPayload = null;
            }
            if (
                persistedPayload &&
                typeof persistedPayload === 'object' &&
                persistedPayload.version === WINDOW_STORAGE_VERSION
            ) {
                persistedClosedTypesRef.current = Array.isArray(persistedPayload.closedTypes)
                    ? persistedPayload.closedTypes
                    : [];
                setFocusMode(Boolean(persistedPayload.focusMode));
            } else {
                persistedPayload = null;
                persistedClosedTypesRef.current = null;
            }
        }

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        setWindows((prev) => {
            if (prev.length > 0) {
                return prev.map((win) =>
                    win.type === WINDOW_TYPES.MAIN ? { ...win, title: windowTitle } : win
                );
            }

            let initialWindows;
            if (
                !hydrationRef.current &&
                persistedPayload &&
                Array.isArray(persistedPayload.windows) &&
                persistedPayload.windows.length > 0
            ) {
                initialWindows = persistedPayload.windows
                    .map((entry) => sanitizeWindowEntry(entry, viewportWidth, viewportHeight))
                    .filter(Boolean);
            } else {
                initialWindows = createDefaultWindows(windowTitle, viewportWidth, viewportHeight);
            }

            const normalized = ensureMainWindow(
                initialWindows,
                windowTitle,
                viewportWidth,
                viewportHeight
            ).map((win) => ({
                ...win,
                minimized:
                    win.isMain || !focusMode ? win.minimized : true,
            }));

            hydrationRef.current = true;

            const maxZ = normalized.reduce((acc, win) => Math.max(acc, win.z || 0), 20);
            zRef.current = Math.max(maxZ, 20);

            return normalized;
        });

        if (!hydrationRef.current && persistedClosedTypesRef.current) {
            setClosedTypes(persistedClosedTypesRef.current);
            persistedClosedTypesRef.current = null;
        }
    }, [windowTitle, focusMode]);

    useEffect(() => {
        if (typeof window === 'undefined' || windows.length === 0) return;
        const payload = {
            version: WINDOW_STORAGE_VERSION,
            focusMode,
            closedTypes,
            windows: windows.map(serializeWindowEntry),
        };
        try {
            localStorage.setItem(WINDOW_STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // ignore persistence errors
        }
    }, [windows, closedTypes, focusMode]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const metaOrCtrl = event.metaKey || event.ctrlKey;
            if (metaOrCtrl && event.key === 'ArrowUp') {
                event.preventDefault();
                setMissionControlOpen(true);
            }
            if (metaOrCtrl && event.key === 'ArrowDown') {
                event.preventDefault();
                setMissionControlOpen(false);
            }
            if (event.key === 'Escape') {
                setMissionControlOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const bringToFront = useCallback((id) => {
        setWindows((prev) => {
            const newZ = zRef.current + 1;
            zRef.current = newZ;
            return prev.map((win) =>
                win.id === id ? { ...win, z: newZ, minimized: false } : win
            );
        });
    }, []);

    const handlePointerDown = useCallback(
        (event, id) => {
            event.preventDefault();
            event.stopPropagation();

            bringToFront(id);

            const windowData = windowsRef.current.find((win) => win.id === id);
            if (!windowData) return;

            const offsetX = event.clientX - windowData.x;
            const offsetY = event.clientY - windowData.y;

            dragRef.current = {
                id,
                pointerId: event.pointerId,
                target: event.currentTarget,
                offsetX,
                offsetY,
            };

            event.currentTarget.setPointerCapture(event.pointerId);

            const handleMove = (moveEvent) => {
                if (!dragRef.current || dragRef.current.id !== id) return;
                const { offsetX: oX, offsetY: oY } = dragRef.current;
                const desiredX = moveEvent.clientX - oX;
                const desiredY = moveEvent.clientY - oY;
                const windowMeta = windowsRef.current.find((win) => win.id === id);
                if (!windowMeta) return;
                const { x: clampedX, y: clampedY } = clampPosition(
                    desiredX,
                    desiredY,
                    windowMeta.width,
                    windowMeta.height
                );
                setWindows((wins) =>
                    wins.map((win) =>
                        win.id === id
                            ? {
                                  ...win,
                                  x: clampedX,
                                  y: clampedY,
                                  isZoomed: false,
                              }
                            : win
                    )
                );
            };

            const stopDrag = () => {
                if (!dragRef.current) return;
                const target = dragRef.current.target;
                try {
                    target.releasePointerCapture(dragRef.current.pointerId);
                } catch {
                    // ignore
                }
                target.removeEventListener('pointermove', handleMove);
                target.removeEventListener('pointerup', stopDrag);
                target.removeEventListener('pointercancel', stopDrag);
                dragRef.current = null;
            };

            event.currentTarget.addEventListener('pointermove', handleMove);
            event.currentTarget.addEventListener('pointerup', stopDrag);
            event.currentTarget.addEventListener('pointercancel', stopDrag);
        },
        [bringToFront, clampPosition]
    );

    const handleFocus = useCallback(
        (id) => {
            bringToFront(id);
        },
        [bringToFront]
    );

    const handleClose = useCallback((id) => {
        const closingWindow = windowsRef.current.find((win) => win.id === id);
        if (!closingWindow || closingWindow.isMain) return;
        setClosedTypes((prev) =>
            prev.includes(closingWindow.type) ? prev : [...prev, closingWindow.type]
        );
        setWindows((wins) => wins.filter((win) => win.id !== id));
    }, []);

    const handleMinimize = useCallback((id) => {
        setWindows((wins) =>
            wins.map((win) =>
                win.id === id ? { ...win, minimized: true } : win
            )
        );
    }, []);

    const handleZoom = useCallback((id) => {
        if (typeof window === 'undefined') return;
        setWindows((wins) =>
            wins.map((win) => {
                if (win.id !== id) return win;
                if (win.isZoomed) {
                    if (!win.snapshot) return win;
                    return {
                        ...win,
                        x: win.snapshot.x,
                        y: win.snapshot.y,
                        width: win.snapshot.width,
                        height: win.snapshot.height,
                        isZoomed: false,
                        snapshot: null,
                    };
                }
                const margin = 32;
                const snapshot = {
                    x: win.x,
                    y: win.y,
                    width: win.width,
                    height: win.height,
                };
                return {
                    ...win,
                    x: margin,
                    y: MAC_STAGE_MARGIN,
                    width: Math.max(window.innerWidth - margin * 2, 360),
                    height: Math.max(window.innerHeight - MAC_STAGE_MARGIN - margin * 2, 320),
                    isZoomed: true,
                    snapshot,
                };
            })
        );
    }, []);

    const reopenWindow = useCallback(
        (type) => {
            if (typeof window === 'undefined') return;
            setClosedTypes((prev) => prev.filter((item) => item !== type));
            setWindows((wins) => {
                if (wins.some((win) => win.type === type)) return wins;

                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const nextZ = zRef.current + 1;
                zRef.current = nextZ;

                const base = {
                    type,
                    z: nextZ,
                    minimized: focusMode,
                    isZoomed: false,
                    snapshot: null,
                    allowClose: true,
                    allowMinimize: true,
                    allowZoom: true,
                    isMain: false,
                };

                if (type === WINDOW_TYPES.SCRATCHPAD) {
                    return [
                        ...wins,
                        clampWindowToViewport(
                            {
                                ...base,
                                id: WINDOW_TYPES.SCRATCHPAD,
                                title: 'Scratchpad',
                                width: Math.min(380, viewportWidth - 120),
                                height: Math.min(320, viewportHeight - 180),
                                x: Math.max(36, viewportWidth / 2 - 420),
                                y: Math.max(MAC_STAGE_MARGIN + 32, viewportHeight / 2 - 160),
                            },
                            viewportWidth,
                            viewportHeight
                        ),
                    ];
                }
                if (type === WINDOW_TYPES.NOW_PLAYING) {
                    return [
                        ...wins,
                        clampWindowToViewport(
                            {
                                ...base,
                                allowZoom: false,
                                id: WINDOW_TYPES.NOW_PLAYING,
                                title: 'Now Playing',
                                width: Math.min(320, viewportWidth - 120),
                                height: Math.min(280, viewportHeight - 200),
                                x: Math.min(viewportWidth - 360, viewportWidth / 2 + 260),
                                y: Math.max(MAC_STAGE_MARGIN + 24, viewportHeight / 2 - 200),
                            },
                            viewportWidth,
                            viewportHeight
                        ),
                    ];
                }
                if (type === WINDOW_TYPES.STATUS) {
                    return [
                        ...wins,
                        clampWindowToViewport(
                            {
                                ...base,
                                id: WINDOW_TYPES.STATUS,
                                title: 'System Status',
                                width: Math.min(420, viewportWidth - 140),
                                height: Math.min(360, viewportHeight - 200),
                                x: Math.max(40, viewportWidth / 2 - 520),
                                y: MAC_STAGE_MARGIN + 24,
                            },
                            viewportWidth,
                            viewportHeight
                        ),
                    ];
                }
                if (type === WINDOW_TYPES.QUEUE) {
                    return [
                        ...wins,
                        clampWindowToViewport(
                            {
                                ...base,
                                allowZoom: false,
                                id: WINDOW_TYPES.QUEUE,
                                title: 'Action Queue',
                                width: Math.min(320, viewportWidth - 120),
                                height: Math.min(300, viewportHeight - 180),
                                x: Math.min(viewportWidth - 360, viewportWidth / 2 + 260),
                                y: Math.min(viewportHeight - 360, MAC_STAGE_MARGIN + 320),
                            },
                            viewportWidth,
                            viewportHeight
                        ),
                    ];
                }
                return wins;
            });
        },
        [focusMode]
    );

    const restoreWindow = useCallback(
        (type) => {
            setFocusMode(false);
            setWindows((wins) =>
                wins.map((win) =>
                    win.type === type ? { ...win, minimized: false } : win
                )
            );
            const match = windowsRef.current.find((win) => win.type === type);
            if (match) {
                bringToFront(match.id);
            }
        },
        [bringToFront]
    );

    const handleMissionControlSelect = useCallback(
        (win) => {
            if (win.minimized) {
                restoreWindow(win.type);
            } else {
                bringToFront(win.id);
            }
            setMissionControlOpen(false);
        },
        [bringToFront, restoreWindow]
    );

    const toggleFocusMode = useCallback(() => {
        setWindows((wins) => {
            if (!focusMode) {
                focusMemoryRef.current = wins
                    .filter((win) => !win.isMain)
                    .map((win) => ({ id: win.id, minimized: win.minimized }));
                return wins.map((win) =>
                    win.isMain ? { ...win, minimized: false } : { ...win, minimized: true }
                );
            }
            const memory = focusMemoryRef.current ?? [];
            focusMemoryRef.current = null;
            return wins.map((win) => {
                if (win.isMain) return { ...win, minimized: false };
                const record = memory.find((entry) => entry.id === win.id);
                return { ...win, minimized: record ? record.minimized : false };
            });
        });
        setFocusMode((value) => !value);
    }, [focusMode]);

    const renderMainContentMemo = useCallback(() => renderMainContent(), [renderMainContent]);

    const renderWindowContent = useCallback(
        (win) => {
            switch (win.type) {
                case WINDOW_TYPES.MAIN:
                    return renderMainContentMemo();
                case WINDOW_TYPES.SCRATCHPAD:
                    return (
                        <div className="flex h-full flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100">Quick ideas</h3>
                                <span className="text-xs uppercase tracking-[0.4em] text-slate-400">Draft</span>
                            </div>
                            <textarea
                                value={scratchpadText}
                                onChange={(event) => setScratchpadText(event.target.value)}
                                placeholder="Jot down thoughts, todos, or snippets..."
                                className="h-full min-h-[160px] resize-none rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-700 shadow-inner focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300/50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-brand-500 dark:focus:ring-brand-500/40"
                            />
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                Auto-saved locally while you type.
                            </p>
                        </div>
                    );
                case WINDOW_TYPES.NOW_PLAYING: {
                    const { elapsed, total } = currentTrackTime;
                    const progress = Math.min(1, Math.max(0, elapsed / total));
                    return (
                        <div className="flex h-full flex-col gap-5">
                            <div className="flex items-center gap-3">
                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-brand-500/80 to-purple-500/80 shadow-[0_20px_45px_-25px_rgba(10,132,255,0.45)]" />
                                <div>
                                    <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Now Playing</p>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Ambient Beats · Focus Mode</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Scientist Shield Radio</p>
                                </div>
                            </div>
                            <div>
                                <div className="relative h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-400 via-brand-500 to-accent-teal"
                                        style={{ width: `${progress * 100}%` }}
                                    />
                                </div>
                                <div className="mt-2 flex justify-between text-[0.68rem] font-mono text-slate-500 dark:text-slate-400">
                                    <span>{formatDuration(elapsed)}</span>
                                    <span>-{formatDuration(total - elapsed)}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    type="button"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 transition hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-brand-400 dark:hover:text-brand-400"
                                    aria-label="Previous track"
                                >
                                    <HiOutlinePlay className="h-4 w-4 rotate-180" />
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 via-brand-600 to-purple-500 text-white shadow-[0_25px_55px_-30px_rgba(10,132,255,0.55)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                    aria-label="Play or pause"
                                >
                                    <HiOutlinePlay className="h-5 w-5 translate-x-0.5" />
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 transition hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-brand-400 dark:hover:text-brand-400"
                                    aria-label="Next track"
                                >
                                    <HiOutlinePlay className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                                <h4 className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 mb-2">Listening mode</h4>
                                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                                    <span>Deep focus</span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[0.65rem] font-semibold text-brand-600 dark:text-brand-300">
                                        <HiOutlineSparkles className="h-3.5 w-3.5" />
                                        Adaptive
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                }
                case WINDOW_TYPES.STATUS:
                    return (
                        <div className="flex h-full flex-col gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Studio Status</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Live metrics across your Scientist Shield workspace.</p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <StatusCard label="Active sessions" value="128" trend="+12%" />
                                <StatusCard label="Build pipeline" value="Green" trend="96% pass" emphasize />
                                <StatusCard label="Realtime collabs" value="18" trend="+6 open" />
                                <StatusCard label="Support response" value="12m" trend="SLA met" />
                            </div>
                            <div className="rounded-xl border border-slate-200/60 bg-white/70 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                                <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Highlights</h4>
                                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                    <li>• Tutorials ship pipeline clear.</li>
                                    <li>• Quiz analytics syncing to dashboard.</li>
                                    <li>• Community engagement up 18% week over week.</li>
                                </ul>
                            </div>
                        </div>
                    );
                case WINDOW_TYPES.QUEUE:
                    return (
                        <div className="flex h-full flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Action Queue</h3>
                                <button
                                    type="button"
                                    className="text-xs uppercase tracking-[0.4em] text-brand-500 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60"
                                    onClick={() => setTodos((items) => items.map((item) => ({ ...item, done: true })))}
                                >
                                    Complete all
                                </button>
                            </div>
                            <ul className="space-y-2">
                                {todos.map((todo) => (
                                    <li key={todo.id}>
                                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/60 bg-white/70 p-3 text-sm text-slate-600 shadow-sm transition hover:border-brand-300/60 hover:bg-white/90 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-300/50 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-brand-400/60">
                                            <input
                                                type="checkbox"
                                                checked={todo.done}
                                                onChange={() => {
                                                    setTodos((items) =>
                                                        items.map((item) =>
                                                            item.id === todo.id ? { ...item, done: !item.done } : item
                                                        )
                                                    );
                                                }}
                                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400 dark:border-slate-600"
                                            />
                                            <span className={`flex-1 ${todo.done ? 'text-slate-400 line-through' : ''}`}>
                                                {todo.label}
                                            </span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-full border border-dashed border-brand-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-500 transition hover:border-brand-400 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-brand-400/40 dark:text-brand-300"
                                onClick={() => {
                                    const suffix = todos.length + 1;
                                    setTodos((items) => [
                                        ...items,
                                        { id: `todo-${suffix}`, label: `New reminder ${suffix}`, done: false },
                                    ]);
                                }}
                            >
                                Add Action
                            </button>
                        </div>
                    );
                default:
                    return null;
            }
        },
        [currentTrackTime, renderMainContentMemo, scratchpadText, todos]
    );

    const minimisedWindows = useMemo(
        () => windows.filter((win) => win.minimized),
        [windows]
    );

    const focusedWindow = useMemo(() => {
        if (windows.length === 0) return null;
        return windows.reduce((top, current) =>
            !top || current.z > top.z ? current : top
        , null);
    }, [windows]);

    const stageEntries = useMemo(() => {
        const activeEntries = windows
            .filter((win) => !win.isMain)
            .map((win) => ({
                type: win.type,
                title: win.title,
                status: win.minimized ? 'minimized' : 'open',
            }));

        const missingEntries = closedTypes
            .filter((type) => !activeEntries.some((entry) => entry.type === type))
            .map((type) => ({
                type,
                title: typeToTitle(type),
                status: 'closed',
            }));

        return [...activeEntries, ...missingEntries];
    }, [closedTypes, windows]);

    if (isCompact) {
        return (
            <div className="container max-w-5xl">
                <div className="macos-window">
                    <div className="macos-window__titlebar">
                        <div className="macos-traffic-lights" aria-hidden="true">
                            <span className="macos-traffic-light macos-traffic-light--close opacity-40" />
                            <span className="macos-traffic-light macos-traffic-light--minimize opacity-40" />
                            <span className="macos-traffic-light macos-traffic-light--zoom opacity-40" />
                        </div>
                        <div className="macos-window__title">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/40 text-brand-600 shadow-inner">
                                <HiOutlineShieldCheck className="h-4 w-4" />
                            </span>
                            <span>{windowTitle}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-slate-400 dark:text-slate-300">
                            Compact Mode
                        </div>
                    </div>
                    <div className="macos-window__content">
                        <div className="macos-window__body">
                            {renderMainContentMemo()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <AnimatePresence>
                {missionControlOpen ? (
                    <motion.div
                        key="mission-control"
                        className="fixed inset-0 z-[65] bg-slate-900/35 backdrop-blur-2xl dark:bg-slate-950/55"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mission Control"
                    >
                        <div className="mx-auto flex h-full max-w-6xl flex-col gap-6 px-6 py-12">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.32em] text-slate-300/80 dark:text-slate-200/80">Mission Control</p>
                                    <h2 className="text-2xl font-semibold text-white">Window overview</h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-200/80">Press Esc to exit</span>
                                    <button
                                        type="button"
                                        onClick={() => setMissionControlOpen(false)}
                                        className="rounded-full border border-white/40 bg-white/30 px-4 py-2 text-sm font-medium text-white backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                            <div className="grid flex-1 content-start gap-6 overflow-y-auto pb-4 md:grid-cols-2 xl:grid-cols-3">
                                {windows.map((win) => (
                                    <motion.button
                                        key={`mission-${win.id}`}
                                        type="button"
                                        onClick={() => handleMissionControlSelect(win)}
                                        className={`relative flex h-48 flex-col rounded-3xl border border-white/35 bg-white/15 p-4 text-left text-white shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/10 dark:bg-slate-900/40 ${win.minimized ? 'opacity-75' : 'opacity-100'}`}
                                        whileHover={{ translateY: -4, scale: 1.01 }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-lg">
                                                    {windowIconForType(win.type)}
                                                </span>
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.32em] text-white/80">
                                                        {win.isMain ? 'Primary' : 'Utility'}
                                                    </p>
                                                    <p className="text-sm font-semibold text-white leading-tight">
                                                        {win.title}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="rounded-full border border-white/30 px-2 py-1 text-[0.65rem] uppercase tracking-[0.28em] text-white/70">
                                                {win.minimized ? 'Minimized' : 'Active'}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex-1 rounded-2xl border border-dashed border-white/20 bg-white/5 p-3 text-xs text-white/70">
                                            {missionControlPreview(win)}
                                        </div>
                                        <div className="mt-4 flex items-center justify-between text-[0.7rem] text-white/75">
                                            <span>{Math.round(win.width)} × {Math.round(win.height)}</span>
                                            <div className="flex items-center gap-2">
                                                {!win.isMain ? (
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleClose(win.id);
                                                            setMissionControlOpen(false);
                                                        }}
                                                        className="rounded-full border border-white/30 px-2 py-1 text-[0.65rem] uppercase tracking-[0.28em] text-white/80 hover:border-red-300/60 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                                    >
                                                        Close
                                                    </button>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setMissionControlOpen(false);
                                                        if (win.minimized) {
                                                            restoreWindow(win.type);
                                                        } else {
                                                            handleMinimize(win.id);
                                                        }
                                                    }}
                                                    className="rounded-full border border-white/30 px-2 py-1 text-[0.65rem] uppercase tracking-[0.28em] text-white/80 hover:border-brand-200/60 hover:text-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                                >
                                                    {win.minimized ? 'Show' : 'Hide'}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                                {closedTypes
                                    .filter((type) => !windows.some((win) => win.type === type))
                                    .map((type) => (
                                        <motion.button
                                            key={`mission-closed-${type}`}
                                            type="button"
                                            onClick={() => {
                                                reopenWindow(type);
                                                setMissionControlOpen(false);
                                            }}
                                            className="flex h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-white/35 bg-white/10 text-white transition hover:border-brand-200/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200/60 dark:border-white/15 dark:bg-slate-900/30 dark:hover:border-brand-300/60"
                                            whileHover={{ translateY: -3, scale: 1.02 }}
                                        >
                                            <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-xl">
                                                {windowIconForType(type)}
                                            </span>
                                            <p className="text-sm font-semibold">{typeToTitle(type)}</p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.32em] text-white/70">Reopen</p>
                                        </motion.button>
                                    ))}
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <div className="pointer-events-none fixed inset-0 z-[45] hidden lg:block">
                <AnimatePresence>
                    {windows.filter((win) => !win.minimized).map((win) => (
                        <MacWindow
                            key={win.id}
                            windowData={{
                                ...win,
                                icon: windowIconForType(win.type),
                            }}
                            isFocused={focusedWindow ? focusedWindow.id === win.id : false}
                            onPointerDown={handlePointerDown}
                            onClose={handleClose}
                            onMinimize={handleMinimize}
                            onZoom={handleZoom}
                            onFocus={handleFocus}
                        >
                            {renderWindowContent(win)}
                        </MacWindow>
                    ))}
                </AnimatePresence>
            </div>

            <div className="pointer-events-none fixed inset-x-0 top-[92px] z-[44] hidden lg:flex justify-center">
                <div className="rounded-full border border-white/40 bg-white/60 px-5 py-2 text-xs font-medium text-slate-600 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200">
                    {focusedWindow ? `Window Manager · ${focusedWindow.title}` : 'Window Manager · Idle'}
                </div>
            </div>

            <div className="pointer-events-auto fixed left-6 top-[132px] z-[46] hidden xl:flex w-56 flex-col gap-3 rounded-3xl border border-white/40 bg-white/35 p-3 shadow-lg backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40">
                <div className="flex items-center justify-between px-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">Stage Manager</p>
                    <span className="text-[0.6rem] uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">⌘↑</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setMissionControlOpen(true)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/40 bg-white/55 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-brand-200/60 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/15 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-brand-300/60 dark:hover:text-brand-200"
                    >
                        <HiOutlineSquares2X2 className="h-4 w-4" />
                        Mission Control
                    </button>
                </div>
                <button
                    type="button"
                    onClick={toggleFocusMode}
                    className={`inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 ${
                        focusMode
                            ? 'border-brand-300 bg-brand-100 text-brand-600 dark:border-brand-400/60 dark:bg-brand-500/20 dark:text-brand-200'
                            : 'border-white/40 bg-white/55 text-slate-600 hover:border-brand-200/60 hover:text-brand-600 dark:border-white/15 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-brand-300/60'
                    }`}
                >
                    {focusMode ? 'Exit Focus Mode' : 'Focus Main Window'}
                </button>
                <div className="flex flex-col gap-2">
                    {stageEntries.map((entry) => (
                        <button
                            key={entry.type}
                            type="button"
                            onClick={() => {
                                const existing = windowsRef.current.find((win) => win.type === entry.type);
                                if (existing) {
                                    if (existing.minimized) {
                                        restoreWindow(entry.type);
                                    } else {
                                        bringToFront(existing.id);
                                    }
                                } else {
                                    reopenWindow(entry.type);
                                }
                            }}
                            className={`group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-left text-sm transition hover:border-brand-200/60 hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:hover:border-brand-400/40 dark:hover:bg-slate-900/60 ${
                                entry.status === 'open' ? 'bg-white/60 shadow-sm dark:bg-slate-900/60' : ''
                            }`}
                        >
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/30 text-brand-600 shadow-inner dark:text-brand-300">
                                {windowIconForType(entry.type)}
                            </span>
                            <span className="flex-1">
                                <span className="block text-slate-600 dark:text-slate-200">{entry.title}</span>
                                <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                                    {entry.status}
                                </span>
                            </span>
                        </button>
                    ))}
                </div>
                {minimisedWindows.length > 0 ? (
                    <div className="mt-2 rounded-2xl border border-dashed border-slate-300/70 bg-white/40 p-3 text-xs text-slate-500 dark:border-slate-600/60 dark:bg-slate-900/40 dark:text-slate-300">
                        Minimized: {minimisedWindows.map((win) => typeToTitle(win.type)).join(', ')}
                    </div>
                ) : null}
            </div>

            <div className="pointer-events-auto fixed bottom-8 right-8 z-[46] hidden lg:flex flex-col items-end gap-3">
                {minimisedWindows.map((win) => (
                    <button
                        key={win.id}
                        type="button"
                        onClick={() => restoreWindow(win.type)}
                        className="flex items-center gap-3 rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm font-medium text-slate-600 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-brand-300/60 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-brand-400/40"
                    >
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-brand-500/20 text-brand-600 dark:text-brand-300">
                            {windowIconForType(win.type)}
                        </span>
                        Restore {win.title}
                    </button>
                ))}
            </div>
        </>
    );
}

MacWindowManager.propTypes = {
    windowTitle: PropTypes.string.isRequired,
    renderMainContent: PropTypes.func.isRequired,
};

function typeToTitle(type) {
    switch (type) {
        case WINDOW_TYPES.SCRATCHPAD:
            return 'Scratchpad';
        case WINDOW_TYPES.NOW_PLAYING:
            return 'Now Playing';
        case WINDOW_TYPES.STATUS:
            return 'System Status';
        case WINDOW_TYPES.QUEUE:
            return 'Action Queue';
        default:
            return 'Window';
    }
}

function formatDuration(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function missionControlPreview(win) {
    if (win.isMain) {
        return (
            <span>
                Primary workspace window hosting the current page. Use Focus Mode to isolate this surface.
            </span>
        );
    }
    switch (win.type) {
        case WINDOW_TYPES.SCRATCHPAD:
            return <span>Quick notes and ideas, saved locally for later.</span>;
        case WINDOW_TYPES.NOW_PLAYING:
            return <span>Ambient beats controller to keep you in the zone.</span>;
        case WINDOW_TYPES.STATUS:
            return <span>Live pulse of your platform health at a glance.</span>;
        case WINDOW_TYPES.QUEUE:
            return <span>Actionable reminders and tasks queued for today.</span>;
        default:
            return <span>Utility window.</span>;
    }
}

function windowIconForType(type) {
    switch (type) {
        case WINDOW_TYPES.MAIN:
            return <HiOutlineShieldCheck className="h-4 w-4" />;
        case WINDOW_TYPES.SCRATCHPAD:
            return <HiOutlinePencilSquare className="h-4 w-4" />;
        case WINDOW_TYPES.NOW_PLAYING:
            return <HiOutlineMusicalNote className="h-4 w-4" />;
        case WINDOW_TYPES.STATUS:
            return <HiOutlineCpuChip className="h-4 w-4" />;
        case WINDOW_TYPES.QUEUE:
            return <HiOutlineListBullet className="h-4 w-4" />;
        default:
            return null;
    }
}

function sanitizeWindowEntry(entry, viewportWidth, viewportHeight) {
    if (!entry || typeof entry !== 'object') return null;
    const width = clampNumber(entry.width ?? 420, 320, Math.max(viewportWidth - 48, 360));
    const height = clampNumber(entry.height ?? 320, 260, Math.max(viewportHeight - 120, 260));
    const coords = clampWindowCoords(
        entry.x ?? 48,
        entry.y ?? MAC_STAGE_MARGIN,
        width,
        height,
        viewportWidth,
        viewportHeight
    );

    const snapshot =
        entry.snapshot && typeof entry.snapshot === 'object'
            ? {
                  x: clampNumber(entry.snapshot.x ?? coords.x, 0, viewportWidth - width),
                  y: clampNumber(entry.snapshot.y ?? coords.y, MAC_STAGE_MARGIN, viewportHeight - height),
                  width: clampNumber(entry.snapshot.width ?? width, 320, viewportWidth),
                  height: clampNumber(entry.snapshot.height ?? height, 260, viewportHeight),
              }
            : null;

    return {
        id: typeof entry.id === 'string' ? entry.id : `${entry.type}-${Math.random().toString(36).slice(2, 8)}`,
        type: entry.type ?? WINDOW_TYPES.SCRATCHPAD,
        title: typeof entry.title === 'string' ? entry.title : typeToTitle(entry.type),
        width,
        height,
        x: coords.x,
        y: coords.y,
        z: typeof entry.z === 'number' ? entry.z : 21,
        minimized: Boolean(entry.minimized),
        isZoomed: Boolean(entry.isZoomed),
        snapshot,
        allowClose: entry.allowClose !== false,
        allowMinimize: entry.allowMinimize !== false,
        allowZoom: entry.allowZoom !== false,
        isMain: Boolean(entry.isMain),
    };
}

function ensureMainWindow(windows, windowTitle, viewportWidth, viewportHeight) {
    const existingMain = windows.find((win) => win.type === WINDOW_TYPES.MAIN);
    if (existingMain) {
        return windows.map((win) =>
            win.type === WINDOW_TYPES.MAIN
                ? {
                      ...clampWindowToViewport(
                          {
                              ...win,
                              title: windowTitle,
                              allowClose: false,
                              allowMinimize: true,
                              allowZoom: true,
                              isMain: true,
                          },
                          viewportWidth,
                          viewportHeight
                      ),
                  }
                : clampWindowToViewport(win, viewportWidth, viewportHeight)
        );
    }
    return [
        createMainWindow(windowTitle, viewportWidth, viewportHeight),
        ...windows.map((win) => clampWindowToViewport(win, viewportWidth, viewportHeight)),
    ];
}

function createDefaultWindows(windowTitle, viewportWidth, viewportHeight) {
    const nextZ = (() => {
        let current = 20;
        return () => {
            current += 1;
            return current;
        };
    })();

    const main = createMainWindow(windowTitle, viewportWidth, viewportHeight, nextZ());
    const scratchpad = clampWindowToViewport(
        {
            id: WINDOW_TYPES.SCRATCHPAD,
            type: WINDOW_TYPES.SCRATCHPAD,
            title: 'Scratchpad',
            width: Math.min(380, viewportWidth - 120),
            height: Math.min(320, viewportHeight - 180),
            x: Math.max(main.x - 420, 36),
            y: Math.min(main.y + 60, viewportHeight - 360),
            z: nextZ(),
            minimized: false,
            isZoomed: false,
            snapshot: null,
            allowClose: true,
            allowMinimize: true,
            allowZoom: true,
            isMain: false,
        },
        viewportWidth,
        viewportHeight
    );
    const status = clampWindowToViewport(
        {
            id: WINDOW_TYPES.STATUS,
            type: WINDOW_TYPES.STATUS,
            title: 'System Status',
            width: Math.min(420, viewportWidth - 140),
            height: Math.min(360, viewportHeight - 200),
            x: Math.min(main.x + 40, viewportWidth - 460),
            y: Math.max(main.y - 340, MAC_STAGE_MARGIN),
            z: nextZ(),
            minimized: false,
            isZoomed: false,
            snapshot: null,
            allowClose: true,
            allowMinimize: true,
            allowZoom: true,
            isMain: false,
        },
        viewportWidth,
        viewportHeight
    );
    const nowPlaying = clampWindowToViewport(
        {
            id: WINDOW_TYPES.NOW_PLAYING,
            type: WINDOW_TYPES.NOW_PLAYING,
            title: 'Now Playing',
            width: Math.min(320, viewportWidth - 120),
            height: Math.min(280, viewportHeight - 200),
            x: Math.min(main.x + main.width + 32, viewportWidth - 360),
            y: Math.max(main.y + 12, MAC_HEADER_HEIGHT + 24),
            z: nextZ(),
            minimized: false,
            isZoomed: false,
            snapshot: null,
            allowClose: true,
            allowMinimize: true,
            allowZoom: false,
            isMain: false,
        },
        viewportWidth,
        viewportHeight
    );
    const queue = clampWindowToViewport(
        {
            id: WINDOW_TYPES.QUEUE,
            type: WINDOW_TYPES.QUEUE,
            title: 'Action Queue',
            width: Math.min(320, viewportWidth - 120),
            height: Math.min(300, viewportHeight - 180),
            x: Math.min(nowPlaying.x, viewportWidth - 340),
            y: Math.min(nowPlaying.y + nowPlaying.height + 24, viewportHeight - 340),
            z: nextZ(),
            minimized: false,
            isZoomed: false,
            snapshot: null,
            allowClose: true,
            allowMinimize: true,
            allowZoom: false,
            isMain: false,
        },
        viewportWidth,
        viewportHeight
    );

    return [main, scratchpad, status, nowPlaying, queue];
}

function createMainWindow(windowTitle, viewportWidth, viewportHeight, z = 21) {
    const width = clampNumber(940, 360, viewportWidth - 96);
    const height = clampNumber(640, 320, viewportHeight - 180);
    const x = Math.max((viewportWidth - width) / 2, 24);
    const y = Math.max((viewportHeight - height) / 2 + 12, MAC_HEADER_HEIGHT);
    return {
        id: MAIN_WINDOW_ID,
        type: WINDOW_TYPES.MAIN,
        title: windowTitle,
        width,
        height,
        x,
        y,
        z,
        minimized: false,
        isZoomed: false,
        snapshot: null,
        allowClose: false,
        allowMinimize: true,
        allowZoom: true,
        isMain: true,
    };
}

function clampWindowToViewport(win, viewportWidth, viewportHeight) {
    const width = clampNumber(win.width ?? 420, 320, Math.max(viewportWidth - 48, 360));
    const height = clampNumber(win.height ?? 320, 260, Math.max(viewportHeight - 120, 260));
    const coords = clampWindowCoords(
        win.x ?? 48,
        win.y ?? MAC_STAGE_MARGIN,
        width,
        height,
        viewportWidth,
        viewportHeight
    );
    return {
        ...win,
        width,
        height,
        x: coords.x,
        y: coords.y,
    };
}

function serializeWindowEntry(win) {
    return {
        id: win.id,
        type: win.type,
        title: win.title,
        width: win.width,
        height: win.height,
        x: win.x,
        y: win.y,
        z: win.z,
        minimized: win.minimized,
        isZoomed: win.isZoomed,
        snapshot: win.snapshot,
        allowClose: win.allowClose,
        allowMinimize: win.allowMinimize,
        allowZoom: win.allowZoom,
        isMain: win.isMain,
    };
}

function clampNumber(value, min, max) {
    if (Number.isNaN(value)) return min;
    const safeMax = Math.max(min, max);
    return Math.min(Math.max(value, min), safeMax);
}

function clampWindowCoords(x, y, width, height, viewportWidth, viewportHeight) {
    const maxX = Math.max(viewportWidth - width - 24, 12);
    const maxY = Math.max(viewportHeight - height - 24, MAC_STAGE_MARGIN);
    const clampedX = clampNumber(x, 12, maxX);
    const clampedY = clampNumber(y, MAC_STAGE_MARGIN, maxY);
    return { x: clampedX, y: clampedY };
}

function StatusCard({ label, value, trend, emphasize }) {
    return (
        <div className={`rounded-2xl border border-slate-200/60 bg-white/70 p-4 shadow-sm transition hover:border-brand-300/60 hover:bg-white/80 dark:border-slate-700/60 dark:bg-slate-900/70 ${emphasize ? 'shadow-[0_22px_55px_-30px_rgba(10,132,255,0.55)] ring-1 ring-brand-300/50 dark:ring-brand-400/40' : ''}`}>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
            <p className="text-xs font-medium text-brand-500 dark:text-brand-300">{trend}</p>
        </div>
    );
}

StatusCard.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    trend: PropTypes.string.isRequired,
    emphasize: PropTypes.bool,
};

StatusCard.defaultProps = {
    emphasize: false,
};
