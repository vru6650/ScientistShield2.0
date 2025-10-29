import { AnimatePresence, motion } from 'framer-motion';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Routes, useNavigate } from 'react-router-dom';
import {
    HiOutlineAdjustmentsHorizontal,
    HiOutlineArrowsPointingOut,
    HiOutlinePlay,
    HiOutlineRectangleStack,
    HiOutlineShieldCheck,
    HiOutlineSparkles,
    HiOutlineSquares2X2,
    HiOutlineViewColumns,
    HiOutlineXMark,
} from 'react-icons/hi2';

import { STAGE_MANAGER_STATE_EVENT, STAGE_MANAGER_STORAGE_KEY, STAGE_MANAGER_TOGGLE_EVENT } from '../../constants/desktop';
import { buildRouteElements, mainLayoutRoutes } from '../../routes/mainLayoutRoutes.jsx';
import MacWindow from './MacWindow';
import StageManagerPanel from './StageManagerPanel.jsx';
import StageShelf from './StageShelf.jsx';
import WindowControlHints from './WindowControlHints.jsx';
import { renderWindowIcon } from './windowIcons';
import MacDock from './MacDock.jsx';

const WINDOW_STORAGE_VERSION = 2;
const WINDOW_STORAGE_KEY = 'scientistshield.desktop.windowState.v2';
const WINDOW_HINTS_STORAGE_KEY = 'scientistshield.desktop.controlHints.v1';
const MAIN_WINDOW_ID = 'main-window';
const MAC_STAGE_MARGIN = 72;
const MAC_HEADER_HEIGHT = 82;
const HOT_CORNER_STORAGE_KEY = 'scientistshield.desktop.hotCorners.v1';
const HOT_CORNER_THRESHOLD_PX = 44;
const HOT_CORNER_DELAY_MS = 320;
const HOT_CORNER_DEFAULTS = Object.freeze({
    topLeft: 'mission-control',
    topRight: 'quick-look',
    bottomLeft: 'stage-manager',
    bottomRight: 'focus-mode',
});
const HOT_CORNER_ACTION_LABELS = Object.freeze({
    'mission-control': 'Mission Control',
    'quick-look': 'Quick Look',
    'stage-manager': 'Stage Manager',
    'focus-mode': 'Focus Mode',
});
const HOT_CORNER_KEYS = Object.freeze(['topLeft', 'topRight', 'bottomLeft', 'bottomRight']);
const HOT_CORNER_SYMBOLS = Object.freeze({
    topLeft: '↖︎',
    topRight: '↗︎',
    bottomLeft: '↙︎',
    bottomRight: '↘︎',
});
const HOT_CORNER_ICONS = Object.freeze({
    'mission-control': HiOutlineArrowsPointingOut,
    'quick-look': HiOutlineSparkles,
    'stage-manager': HiOutlineSquares2X2,
    'focus-mode': HiOutlineShieldCheck,
});

const DRAG_VELOCITY_SMOOTHING = 0.55;
const DRAG_MOMENTUM_SAMPLE_MS = 320;
const DRAG_MOMENTUM_MAX_TRAVEL = 280;
const DRAG_MOMENTUM_THRESHOLD = 0.16;
const DRAG_MOMENTUM_MIN_DISTANCE = 2;
const DRAG_MOMENTUM_DECAY = 0.86;
const DRAG_MOMENTUM_MIN_SPEED = 0.018;
const DRAG_MOMENTUM_MAX_DURATION = 520;
const DRAG_MOMENTUM_FRAME_CLAMP = 32;
const DRAG_POINTER_OFFSET_X = 28;
const DRAG_POINTER_OFFSET_Y = -56;

const WindowRouteFallback = () => (
    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading workspace...
    </div>
);

function WindowRouteRenderer({ location }) {
    const routeElements = useMemo(() => buildRouteElements(mainLayoutRoutes), []);
    if (!location) {
        return <WindowRouteFallback />;
    }
    return (
        <Suspense fallback={<WindowRouteFallback />}>
            <Routes location={location}>
                {routeElements}
            </Routes>
        </Suspense>
    );
}

WindowRouteRenderer.propTypes = {
    location: PropTypes.shape({
        pathname: PropTypes.string,
        search: PropTypes.string,
        hash: PropTypes.string,
        state: PropTypes.any,
        key: PropTypes.string,
    }),
};

WindowRouteRenderer.defaultProps = {
    location: null,
};

const createDefaultHotCornerState = () => ({
    enabled: true,
    corners: { ...HOT_CORNER_DEFAULTS },
});

const WINDOW_TYPES = {
    MAIN: 'main',
    SCRATCHPAD: 'scratchpad',
    NOW_PLAYING: 'now-playing',
    STATUS: 'status',
    QUEUE: 'queue',
};

const APP_ICON_MAP = Object.freeze({
    home: HiOutlineSquares2X2,
    tutorials: HiOutlineSparkles,
    quizzes: HiOutlineRectangleStack,
    tools: HiOutlineAdjustmentsHorizontal,
    problems: HiOutlineShieldCheck,
    dashboard: HiOutlineViewColumns,
    projects: HiOutlineRectangleStack,
    search: HiOutlineSparkles,
    about: HiOutlineSparkles,
    admin: HiOutlineAdjustmentsHorizontal,
    'file-manager': HiOutlineSquares2X2,
    content: HiOutlineSparkles,
    default: HiOutlineSquares2X2,
});

const APP_ACCENTS = Object.freeze({
    home: 'linear-gradient(135deg, rgba(14,116,244,0.85), rgba(56,189,248,0.65))',
    tutorials: 'linear-gradient(135deg, rgba(236,72,153,0.85), rgba(168,85,247,0.6))',
    quizzes: 'linear-gradient(135deg, rgba(251,191,36,0.85), rgba(249,115,22,0.7))',
    tools: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(14,165,233,0.65))',
    problems: 'linear-gradient(135deg, rgba(45,212,191,0.85), rgba(45,197,253,0.6))',
    dashboard: 'linear-gradient(135deg, rgba(147,197,253,0.85), rgba(59,130,246,0.6))',
    projects: 'linear-gradient(135deg, rgba(251,113,133,0.85), rgba(248,113,113,0.6))',
    search: 'linear-gradient(135deg, rgba(190,242,100,0.85), rgba(59,130,246,0.55))',
    about: 'linear-gradient(135deg, rgba(251,191,36,0.8), rgba(249,115,22,0.6))',
    admin: 'linear-gradient(135deg, rgba(214,158,46,0.85), rgba(249,115,22,0.6))',
    'file-manager': 'linear-gradient(135deg, rgba(96,165,250,0.85), rgba(56,189,248,0.6))',
    content: 'linear-gradient(135deg, rgba(165,180,252,0.85), rgba(99,102,241,0.6))',
    default: 'linear-gradient(135deg, rgba(148,163,184,0.75), rgba(203,213,225,0.55))',
});

const APP_ROUTE_CONFIG = Object.freeze([
    { key: 'home', label: 'Home', match: (path) => path === '/' || path === '' },
    { key: 'tutorials', label: 'Tutorials', match: (path) => path.startsWith('/tutorials') },
    { key: 'quizzes', label: 'Quizzes', match: (path) => path.startsWith('/quizzes') },
    { key: 'tools', label: 'Tools', match: (path) => path.startsWith('/tools') || path.startsWith('/algorithm-') || path.startsWith('/code-') },
    { key: 'problems', label: 'Problems', match: (path) => path.startsWith('/problems') },
    { key: 'projects', label: 'Projects', match: (path) => path.startsWith('/projects') },
    { key: 'search', label: 'Search', match: (path) => path.startsWith('/search') },
    { key: 'content', label: 'Content', match: (path) => path.startsWith('/content') },
    { key: 'dashboard', label: 'Dashboard', match: (path) => path.startsWith('/dashboard') },
    { key: 'admin', label: 'Admin', match: (path) => path.startsWith('/admin') || path.startsWith('/create-') || path.startsWith('/update-') },
    { key: 'file-manager', label: 'File Manager', match: (path) => path.startsWith('/file-manager') },
    { key: 'about', label: 'About', match: (path) => path.startsWith('/about') },
    { key: 'default', label: 'Workspace', match: () => true },
]);

const APP_WINDOW_ID_PREFIX = 'app';

function iconForAppKey(key) {
    return APP_ICON_MAP[key] || APP_ICON_MAP.default;
}

function appAccentForKey(key) {
    return APP_ACCENTS[key] || APP_ACCENTS.default;
}

function snapshotLocation(location) {
    if (!location) return null;
    const { pathname, search, hash, state, key } = location;
    return {
        pathname: pathname || '/',
        search: search || '',
        hash: hash || '',
        state: state ?? null,
        key: key || `${pathname || '/'}${search || ''}${hash || ''}`,
    };
}

function parseStoredLocation(storedLocation, fallbackPath) {
    if (storedLocation && typeof storedLocation === 'object') {
        return {
            pathname: typeof storedLocation.pathname === 'string' ? storedLocation.pathname : '/',
            search: typeof storedLocation.search === 'string' ? storedLocation.search : '',
            hash: typeof storedLocation.hash === 'string' ? storedLocation.hash : '',
            state:
                storedLocation.state !== undefined
                    ? storedLocation.state
                    : null,
            key: typeof storedLocation.key === 'string' ? storedLocation.key : null,
        };
    }
    if (typeof fallbackPath === 'string' && fallbackPath.length > 0) {
        try {
            const url = new URL(fallbackPath, 'http://localhost');
            return {
                pathname: url.pathname,
                search: url.search,
                hash: url.hash,
                state: null,
                key: null,
            };
        } catch {
            const normalisedPath = fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`;
            return {
                pathname: normalisedPath.replace(/\/{2,}/g, '/'),
                search: '',
                hash: '',
                state: null,
                key: null,
            };
        }
    }
    return null;
}

function serializeRouteLocation(location, fallbackPath) {
    if (location && typeof location === 'object') {
        let serializedState = null;
        if (location.state !== undefined) {
            try {
                serializedState = JSON.parse(JSON.stringify(location.state));
            } catch {
                serializedState = null;
            }
        }
        return {
            pathname: location.pathname || '/',
            search: location.search || '',
            hash: location.hash || '',
            state: serializedState,
            key: location.key || null,
        };
    }
    return parseStoredLocation(null, fallbackPath);
}

function slugifyAppPath(path) {
    if (!path) return 'home';
    return path
        .replace(/^[#/]+/, '')
        .replace(/[^\w]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'home';
}

function normaliseAppTitle(windowTitle, fallbackLabel) {
    if (!windowTitle) return fallbackLabel;
    const cleaned = windowTitle.replace(/^Scientist Shield\s*·\s*/i, '').trim();
    return cleaned.length > 0 ? cleaned : fallbackLabel;
}

function resolveAppRouteMeta(activeLocation, windowTitle) {
    const pathname = activeLocation?.pathname ?? '/';
    const search = activeLocation?.search ?? '';
    const hash = activeLocation?.hash ?? '';
    const fullPath = `${pathname}${search}${hash}`;
    const config =
        APP_ROUTE_CONFIG.find((entry) => entry.match(pathname)) ||
        APP_ROUTE_CONFIG[APP_ROUTE_CONFIG.length - 1];
    const slug = slugifyAppPath(fullPath);
    const id = `${APP_WINDOW_ID_PREFIX}-${slug}`;
    const routesTitle = normaliseAppTitle(windowTitle, config.label);
    return {
        id,
        type: id,
        routeKey: config.key,
        label: config.label,
        title: routesTitle,
        fullPath,
        iconKey: config.key in APP_ICON_MAP ? config.key : 'default',
        accent: appAccentForKey(config.key),
    };
}

const DEFAULT_STAGE_LAYOUT_MODE = 'balanced';

const STAGE_LAYOUT_PRESETS = Object.freeze({
    balanced: {
        id: 'balanced',
        label: 'Balanced duo',
        description: 'Tall scratchpad paired with split monitors.',
        icon: HiOutlineViewColumns,
        previewSlots: [
            { type: WINDOW_TYPES.SCRATCHPAD, x: 6, y: 10, width: 32, height: 74 },
            { type: WINDOW_TYPES.STATUS, x: 44, y: 12, width: 44, height: 32 },
            { type: WINDOW_TYPES.QUEUE, x: 44, y: 50, width: 44, height: 30 },
            { type: WINDOW_TYPES.NOW_PLAYING, x: 10, y: 74, width: 26, height: 18 },
        ],
        layoutSlots: [
            { type: WINDOW_TYPES.SCRATCHPAD, x: 0.05, y: 0.1, width: 0.32, height: 0.78 },
            { type: WINDOW_TYPES.STATUS, x: 0.42, y: 0.1, width: 0.54, height: 0.38 },
            { type: WINDOW_TYPES.QUEUE, x: 0.42, y: 0.54, width: 0.54, height: 0.32 },
            { type: WINDOW_TYPES.NOW_PLAYING, x: 0.08, y: 0.78, width: 0.24, height: 0.18 },
        ],
    },
    'focus-stack': {
        id: 'focus-stack',
        label: 'Focus stack',
        description: 'Notes beside workspace, utilities stacked on the right.',
        icon: HiOutlineRectangleStack,
        previewSlots: [
            { type: WINDOW_TYPES.SCRATCHPAD, x: 10, y: 14, width: 42, height: 70 },
            { type: WINDOW_TYPES.QUEUE, x: 58, y: 14, width: 30, height: 28 },
            { type: WINDOW_TYPES.STATUS, x: 58, y: 48, width: 30, height: 24 },
            { type: WINDOW_TYPES.NOW_PLAYING, x: 58, y: 74, width: 30, height: 18 },
        ],
        layoutSlots: [
            { type: WINDOW_TYPES.SCRATCHPAD, x: 0.1, y: 0.14, width: 0.42, height: 0.7 },
            { type: WINDOW_TYPES.QUEUE, x: 0.58, y: 0.14, width: 0.32, height: 0.3 },
            { type: WINDOW_TYPES.STATUS, x: 0.58, y: 0.48, width: 0.32, height: 0.26 },
            { type: WINDOW_TYPES.NOW_PLAYING, x: 0.58, y: 0.78, width: 0.3, height: 0.18 },
        ],
    },
    'command-center': {
        id: 'command-center',
        label: 'Command center',
        description: 'Status and queue wall with compact creative tools.',
        icon: HiOutlineAdjustmentsHorizontal,
        previewSlots: [
            { type: WINDOW_TYPES.STATUS, x: 8, y: 12, width: 34, height: 32 },
            { type: WINDOW_TYPES.QUEUE, x: 8, y: 50, width: 34, height: 32 },
            { type: WINDOW_TYPES.SCRATCHPAD, x: 48, y: 18, width: 40, height: 34 },
            { type: WINDOW_TYPES.NOW_PLAYING, x: 48, y: 58, width: 40, height: 26 },
        ],
        layoutSlots: [
            { type: WINDOW_TYPES.STATUS, x: 0.08, y: 0.12, width: 0.38, height: 0.36 },
            { type: WINDOW_TYPES.QUEUE, x: 0.08, y: 0.52, width: 0.38, height: 0.34 },
            { type: WINDOW_TYPES.SCRATCHPAD, x: 0.5, y: 0.18, width: 0.4, height: 0.4 },
            { type: WINDOW_TYPES.NOW_PLAYING, x: 0.5, y: 0.6, width: 0.38, height: 0.26 },
        ],
    },
});

const STAGE_LAYOUT_IDS = Object.freeze(Object.keys(STAGE_LAYOUT_PRESETS));

const STAGE_MANAGER_STORAGE_VERSION = 2;

const DEFAULT_STAGE_GROUPS = [
    {
        id: 'stage-workspace',
        label: 'Workspace',
        windowTypes: [WINDOW_TYPES.MAIN, WINDOW_TYPES.STATUS],
        locked: true,
        layoutMode: 'balanced',
        layoutMemory: {},
    },
    {
        id: 'stage-creator-kit',
        label: 'Creator Kit',
        windowTypes: [WINDOW_TYPES.MAIN, WINDOW_TYPES.SCRATCHPAD, WINDOW_TYPES.NOW_PLAYING],
        locked: true,
        layoutMode: 'focus-stack',
        layoutMemory: {},
    },
    {
        id: 'stage-planning',
        label: 'Planning Loop',
        windowTypes: [WINDOW_TYPES.MAIN, WINDOW_TYPES.QUEUE],
        locked: true,
        layoutMode: 'command-center',
        layoutMemory: {},
    },
];

const DEFAULT_TODOS = [
    { id: 'todo-1', label: 'Review latest tutorial drafts', done: false },
    { id: 'todo-2', label: 'Ship UI polish branch', done: true },
    { id: 'todo-3', label: 'Prep upcoming webinar outline', done: false },
];

export default function MacWindowManager({ windowTitle, renderMainContent, activeLocation }) {
    const navigate = useNavigate();
    const stageManagerBootstrap = useMemo(() => {
        if (typeof window === 'undefined') return null;
        try {
            const parsed = JSON.parse(localStorage.getItem(STAGE_MANAGER_STORAGE_KEY) || 'null');
            if (!parsed || typeof parsed !== 'object') return null;
            const version =
                typeof parsed.version === 'number' ? parsed.version : STAGE_MANAGER_STORAGE_VERSION;
            if (version > STAGE_MANAGER_STORAGE_VERSION || version < 1) {
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    }, []);

    const initialStageGroups = useMemo(
        () => sanitizeStageGroups(stageManagerBootstrap?.groups),
        [stageManagerBootstrap]
    );

    const [activeAppId, setActiveAppId] = useState(null);
    const activeAppIdRef = useRef(null);

    const [stageGroups, setStageGroups] = useState(initialStageGroups);
    const [stageManagerEnabled, setStageManagerEnabled] = useState(() =>
        stageManagerBootstrap ? Boolean(stageManagerBootstrap.enabled) : true
    );
    const [activeStageGroupId, setActiveStageGroupId] = useState(() => {
        const bootstrapId = stageManagerBootstrap?.activeGroupId;
        if (bootstrapId && initialStageGroups.some((group) => group.id === bootstrapId)) {
            return bootstrapId;
        }
        return initialStageGroups[0] ? initialStageGroups[0].id : null;
    });
    const [pinnedStageGroupId, setPinnedStageGroupId] = useState(() => {
        const incomingPinned = stageManagerBootstrap?.pinnedGroupId;
        return incomingPinned && initialStageGroups.some((group) => group.id === incomingPinned)
            ? incomingPinned
            : null;
    });

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
    const [quickLookWindowId, setQuickLookWindowId] = useState(null);
    const [snapPreview, setSnapPreview] = useState(null);
    const [controlHintsPref, setControlHintsPref] = useState(() => {
        if (typeof window === 'undefined') return { dismissed: false };
        try {
            const raw = window.localStorage.getItem(WINDOW_HINTS_STORAGE_KEY);
            if (!raw) return { dismissed: false };
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                return { ...parsed, dismissed: Boolean(parsed.dismissed) };
            }
        } catch {
            // ignore parse errors
        }
        return { dismissed: false };
    });
    const [showControlHints, setShowControlHints] = useState(false);
    const [liveAnnouncement, setLiveAnnouncement] = useState('');
    const [hotCorners, setHotCorners] = useState(() => {
        if (typeof window === 'undefined') return createDefaultHotCornerState();
        try {
            const raw = window.localStorage.getItem(HOT_CORNER_STORAGE_KEY);
            if (!raw) return createDefaultHotCornerState();
            const parsed = JSON.parse(raw);
            return sanitizeHotCornerState(parsed);
        } catch {
            return createDefaultHotCornerState();
        }
    });
    const [activeHotCorner, setActiveHotCorner] = useState(null);
    const [editingStageGroupId, setEditingStageGroupId] = useState(null);
    const [editingStageGroupLabel, setEditingStageGroupLabel] = useState('');
    const [draggingWindow, setDraggingWindow] = useState(null);
    const [stageDropTarget, setStageDropTarget] = useState(null);
    const [dragPointer, setDragPointer] = useState(null);

    const zRef = useRef(20);
    const dragRef = useRef(null);
    const resizeRef = useRef(null);
    const windowsRef = useRef([]);
    const focusedWindowRef = useRef(null);
    const hydrationRef = useRef(false);
    const persistedClosedTypesRef = useRef(null);
    const stageManagerMemoryRef = useRef(null);
    const snapPreviewRef = useRef(null);
    const dragPendingRef = useRef(null);
    const dragFrameRef = useRef(null);
    const resizePendingRef = useRef(null);
    const resizeFrameRef = useRef(null);
    const hotCornerTimersRef = useRef({});
    const lastHotCornerRef = useRef(null);
    const draggingWindowRef = useRef(null);
    const stageDropTargetRef = useRef(null);
    const stageGroupsRef = useRef(stageGroups);
    const stageShelfActiveRef = useRef(false);
    const activateStageGroupRef = useRef(null);
    const applyStageLayoutRef = useRef(null);
    const dragVelocityRef = useRef({});
    const dragPointerPendingRef = useRef(null);
    const dragPointerFrameRef = useRef(null);
    const momentumAnimationsRef = useRef({});

    const upsertAppWindow = useCallback((meta, location) => {
        if (!meta || typeof window === 'undefined') {
            return;
        }
        setWindows((wins) => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const iconComponent = iconForAppKey(meta.iconKey);
            const routeLocation =
                snapshotLocation(location) || parseStoredLocation(null, meta.fullPath);

            let updated = wins.map((win) => {
                if (win.isAppWindow && win.id !== meta.id) {
                    return { ...win, isMain: false };
                }
                return win;
            });

            const existingIndex = updated.findIndex((win) => win.id === meta.id);
            if (existingIndex >= 0) {
                const existing = updated[existingIndex];
                updated[existingIndex] = {
                    ...existing,
                    title: meta.title,
                    isMain: true,
                    minimized: false,
                    minimizedByUser: false,
                    isAppWindow: true,
                    appRoutePath: meta.fullPath,
                    appRouteKey: meta.routeKey,
                    appIconKey: meta.iconKey,
                    appAccent: meta.accent,
                    routeLocation:
                        routeLocation || existing.routeLocation || parseStoredLocation(null, meta.fullPath),
                    iconComponent,
                };
            } else {
                const nextZ = zRef.current + 1;
                zRef.current = nextZ;
                const created = clampWindowToViewport(
                    {
                        id: meta.id,
                        type: meta.type,
                        title: meta.title,
                        width: Math.min(980, viewportWidth - 80),
                        height: Math.min(700, viewportHeight - 150),
                        x: Math.max((viewportWidth - 900) / 2, 36),
                        y: Math.max((viewportHeight - 640) / 2 + 20, MAC_HEADER_HEIGHT + 12),
                        z: nextZ,
                        minimized: false,
                        minimizedByUser: false,
                        isZoomed: false,
                        snapshot: null,
                        allowClose: true,
                        allowMinimize: true,
                        allowZoom: true,
                        isMain: true,
                        isAppWindow: true,
                        appRoutePath: meta.fullPath,
                        appRouteKey: meta.routeKey,
                        appIconKey: meta.iconKey,
                        appAccent: meta.accent,
                        routeLocation,
                        iconComponent,
                    },
                    viewportWidth,
                    viewportHeight
                );
                updated = [...updated, created];
            }

            updated = updated.map((win) => {
                if (win.id === MAIN_WINDOW_ID) {
                    return {
                        ...win,
                        isMain: false,
                        minimized: true,
                        minimizedByUser: false,
                        title: 'Desktop Overview',
                    };
                }
                return win;
            });

            return updated;
        });
    }, []);

    useEffect(() => {
        windowsRef.current = windows;
    }, [windows]);

    useEffect(() => {
        if (!activeLocation || typeof window === 'undefined') return;
        const meta = resolveAppRouteMeta(activeLocation, windowTitle);
        setActiveAppId(meta.id);
        activeAppIdRef.current = meta.id;
        upsertAppWindow(meta, activeLocation);
    }, [activeLocation, windowTitle, upsertAppWindow]);

    const appWindowSummaries = useMemo(
        () =>
            windows
                .filter((win) => win.isAppWindow)
                .map((win) => ({
                    id: win.id,
                    title: win.title,
                    routePath: win.appRoutePath,
                    iconKey: win.appIconKey,
                    accent: win.appAccent,
                    minimized: Boolean(win.minimized),
                    isActive: activeAppId === win.id,
                })),
        [windows, activeAppId]
    );

    const appDockEntries = useMemo(
        () =>
            appWindowSummaries.map((summary) => ({
                id: summary.id,
                type: summary.id,
                title: summary.title,
                status: summary.isActive ? 'open' : summary.minimized ? 'minimized' : 'staged',
                iconComponent: iconForAppKey(summary.iconKey),
                routePath: summary.routePath,
            })),
        [appWindowSummaries]
    );

    useEffect(() => {
        draggingWindowRef.current = draggingWindow;
    }, [draggingWindow]);

    useEffect(() => {
        stageDropTargetRef.current = stageDropTarget;
    }, [stageDropTarget]);

    useEffect(() => {
        stageGroupsRef.current = stageGroups;
    }, [stageGroups]);

    useEffect(() => {
        snapPreviewRef.current = snapPreview;
    }, [snapPreview]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(WINDOW_HINTS_STORAGE_KEY, JSON.stringify(controlHintsPref));
        } catch {
            // ignore persistence errors
        }
    }, [controlHintsPref]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const payload = {
                enabled: Boolean(hotCorners.enabled),
                corners: sanitizeHotCornerMapping(hotCorners.corners),
            };
            window.localStorage.setItem(HOT_CORNER_STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // ignore persistence errors
        }
    }, [hotCorners]);

    useEffect(() => {
        if (missionControlOpen) {
            setShowControlHints(false);
        }
    }, [missionControlOpen]);

    useEffect(() => {
        if (!activeHotCorner) return undefined;
        if (typeof window === 'undefined') return undefined;
        const timer = window.setTimeout(() => setActiveHotCorner(null), 1400);
        return () => window.clearTimeout(timer);
    }, [activeHotCorner]);

    useEffect(() => () => {
        if (dragFrameRef.current) {
            cancelAnimationFrame(dragFrameRef.current);
            dragFrameRef.current = null;
        }
        if (resizeFrameRef.current) {
            cancelAnimationFrame(resizeFrameRef.current);
            resizeFrameRef.current = null;
        }
        if (dragPointerFrameRef.current) {
            cancelAnimationFrame(dragPointerFrameRef.current);
            dragPointerFrameRef.current = null;
        }
        dragPointerPendingRef.current = null;
        Object.values(momentumAnimationsRef.current).forEach((animation) => {
            if (animation?.frame) {
                cancelAnimationFrame(animation.frame);
            }
        });
        momentumAnimationsRef.current = {};
    }, []);

    const assignStageDropTarget = useCallback((candidate) => {
        const prev = stageDropTargetRef.current;
        const same =
            (!prev && !candidate) ||
            (prev &&
                candidate &&
                prev.kind === candidate.kind &&
                prev.stageId === candidate.stageId &&
                prev.reason === candidate.reason);
        if (same) {
            return;
        }
        stageDropTargetRef.current = candidate || null;
        setStageDropTarget(candidate || null);
    }, []);

    const evaluateStageDropCandidate = useCallback((clientX, clientY) => {
        if (!stageShelfActiveRef.current || typeof document === 'undefined') {
            return null;
        }
        const dragMeta = draggingWindowRef.current;
        if (!dragMeta || dragMeta.isMain) {
            return null;
        }
        const el = document.elementFromPoint(clientX, clientY);
        if (!el || typeof el.closest !== 'function') {
            return null;
        }
        const newZone = el.closest('[data-stage-drop-new="true"]');
        if (newZone) {
            return { kind: 'new', reason: 'ready' };
        }
        const entryEl = el.closest('[data-stage-entry-id]');
        if (!entryEl) {
            return null;
        }
        const stageId = entryEl.getAttribute('data-stage-entry-id');
        if (!stageId) {
            return null;
        }
        const targetGroup = stageGroupsRef.current.find((group) => group.id === stageId);
        if (!targetGroup) {
            return null;
        }
        if (targetGroup.locked) {
            return { kind: 'stage', stageId, label: targetGroup.label, reason: 'locked' };
        }
        if (targetGroup.windowTypes.includes(dragMeta.type)) {
            return { kind: 'stage', stageId, label: targetGroup.label, reason: 'duplicate' };
        }
        return { kind: 'stage', stageId, label: targetGroup.label, reason: 'ready' };
    }, []);

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
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const compact = viewportWidth < 1024;
            setIsCompact(compact);
            setWindows((wins) =>
                wins.map((win) => {
                    if (win.isZoomed) {
                        return expandWindowToViewport(win, viewportWidth, viewportHeight);
                    }
                    if (compact) {
                        return win;
                    }
                    const maxWidth = Math.max(viewportWidth - 64, 360);
                    const maxHeight = Math.max(viewportHeight - 140, 260);
                    const width = clampNumber(win.width ?? 420, 320, maxWidth);
                    const height = clampNumber(win.height ?? 320, 260, maxHeight);
                    const { x, y } = clampPosition(win.x, win.y, width, height);
                    return { ...win, width, height, x, y };
                })
            );
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
                minimizedByUser:
                    win.isMain || !focusMode ? Boolean(win.minimizedByUser) : false,
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
        if (typeof window === 'undefined') return;
        const payload = {
            version: STAGE_MANAGER_STORAGE_VERSION,
            enabled: stageManagerEnabled,
            activeGroupId: activeStageGroupId,
            pinnedGroupId: pinnedStageGroupId,
            groups: stageGroups.map(serializeStageGroup),
        };
        try {
            localStorage.setItem(STAGE_MANAGER_STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // ignore persistence errors
        }
    }, [stageManagerEnabled, activeStageGroupId, stageGroups, pinnedStageGroupId]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        window.dispatchEvent(
            new CustomEvent(STAGE_MANAGER_STATE_EVENT, {
                detail: { enabled: stageManagerEnabled },
            })
        );
        return undefined;
    }, [stageManagerEnabled]);

    useEffect(() => {
        if (!stageManagerEnabled || !activeStageGroupId || focusMode) return;
        const group = stageGroups.find((item) => item.id === activeStageGroupId);
        if (!group) return;
        setWindows((wins) => {
            const allowedTypes = new Set(group.windowTypes);
            let changed = false;
            const next = wins.map((win) => {
                const shouldShow = win.isMain || allowedTypes.has(win.type);
                if (win.minimizedByUser) {
                    return win;
                }
                const desiredMinimized = !shouldShow;
                if (win.minimized === desiredMinimized && win.minimizedByUser === false) {
                    return win;
                }
                changed = true;
                return {
                    ...win,
                    minimized: desiredMinimized,
                    minimizedByUser: false,
                };
            });
            return changed ? next : wins;
        });
    }, [windows, stageManagerEnabled, activeStageGroupId, stageGroups, focusMode]);

    useEffect(() => {
        if (!quickLookWindowId) return;
        if (!windows.some((win) => win.id === quickLookWindowId)) {
            setQuickLookWindowId(null);
        }
    }, [windows, quickLookWindowId]);

    const focusMemoryRef = useRef(null);

    const commitDragMutation = useCallback(
        (payload) => {
            setWindows((wins) => {
                let changed = false;
                const next = wins.map((win) => {
                    if (win.id !== payload.id) return win;
                    const xChanged = win.x !== payload.x;
                    const yChanged = win.y !== payload.y;
                    const zoomChanged = win.isZoomed;
                    if (!xChanged && !yChanged && !zoomChanged) {
                        return win;
                    }
                    changed = true;
                    return {
                        ...win,
                        x: payload.x,
                        y: payload.y,
                        isZoomed: false,
                    };
                });
                return changed ? next : wins;
            });
            setSnapPreview((prev) =>
                reconcileSnapPreview(prev, payload.snapCandidate ?? null, payload.id)
            );
        },
        [setSnapPreview, setWindows]
    );

    const applyDragMutation = useCallback(() => {
        dragFrameRef.current = null;
        const payload = dragPendingRef.current;
        if (!payload) return;
        dragPendingRef.current = null;
        commitDragMutation(payload);
    }, [commitDragMutation]);

    const queueDragMutation = useCallback(
        (payload) => {
            dragPendingRef.current = payload;
            if (!dragFrameRef.current) {
                dragFrameRef.current = requestAnimationFrame(applyDragMutation);
            }
        },
        [applyDragMutation]
    );

    const flushDragMutation = useCallback(() => {
        if (!dragPendingRef.current) return;
        const payload = dragPendingRef.current;
        dragPendingRef.current = null;
        if (dragFrameRef.current) {
            cancelAnimationFrame(dragFrameRef.current);
            dragFrameRef.current = null;
        }
        commitDragMutation(payload);
    }, [commitDragMutation]);

    const commitDragPointerPosition = useCallback(() => {
        dragPointerFrameRef.current = null;
        if (!dragPointerPendingRef.current) return;
        setDragPointer(dragPointerPendingRef.current);
        dragPointerPendingRef.current = null;
    }, []);

    const queueDragPointerPosition = useCallback(
        (payload) => {
            dragPointerPendingRef.current = payload;
            if (!dragPointerFrameRef.current) {
                dragPointerFrameRef.current = requestAnimationFrame(commitDragPointerPosition);
            }
        },
        [commitDragPointerPosition]
    );

    const clearDragPointerOverlay = useCallback(() => {
        if (dragPointerFrameRef.current) {
            cancelAnimationFrame(dragPointerFrameRef.current);
            dragPointerFrameRef.current = null;
        }
        dragPointerPendingRef.current = null;
        setDragPointer(null);
    }, []);

    const commitResizeMutation = useCallback(
        (payload) => {
            setWindows((wins) => {
                let changed = false;
                const next = wins.map((win) => {
                    if (win.id !== payload.id) return win;
                    const { x, y, width, height } = payload.metrics;
                    if (
                        win.x === x &&
                        win.y === y &&
                        win.width === width &&
                        win.height === height &&
                        !win.isZoomed
                    ) {
                        return win;
                    }
                    changed = true;
                    return {
                        ...win,
                        x,
                        y,
                        width,
                        height,
                        isZoomed: false,
                        snapshot: null,
                    };
                });
                return changed ? next : wins;
            });
        },
        [setWindows]
    );

    const applyResizeMutation = useCallback(() => {
        resizeFrameRef.current = null;
        const payload = resizePendingRef.current;
        if (!payload) return;
        resizePendingRef.current = null;
        commitResizeMutation(payload);
    }, [commitResizeMutation]);

    const queueResizeMutation = useCallback(
        (payload) => {
            resizePendingRef.current = payload;
            if (!resizeFrameRef.current) {
                resizeFrameRef.current = requestAnimationFrame(applyResizeMutation);
            }
        },
        [applyResizeMutation]
    );

    const flushResizeMutation = useCallback(() => {
        if (!resizePendingRef.current) return;
        const payload = resizePendingRef.current;
        resizePendingRef.current = null;
        if (resizeFrameRef.current) {
            cancelAnimationFrame(resizeFrameRef.current);
            resizeFrameRef.current = null;
        }
        commitResizeMutation(payload);
    }, [commitResizeMutation]);

    const captureLayoutMemoryForWindow = useCallback(
        (windowId) => {
            if (!stageManagerEnabled || focusMode || !activeStageGroupId) {
                return;
            }
            const snapshot = windowsRef.current.find((win) => win.id === windowId);
            if (
                !snapshot ||
                snapshot.isMain ||
                !snapshot.type ||
                snapshot.minimized
            ) {
                return;
            }
            const metrics = {
                x: snapshot.x,
                y: snapshot.y,
                width: snapshot.width,
                height: snapshot.height,
            };
            setStageGroups((groups) =>
                groups.map((group) => {
                    if (group.id !== activeStageGroupId) {
                        return group;
                    }
                    const prevMemory = group.layoutMemory || {};
                    const prevSnapshot = prevMemory[snapshot.type];
                    if (prevSnapshot && rectsEqual(prevSnapshot, metrics, 0.5)) {
                        return group;
                    }
                    return {
                        ...group,
                        layoutMemory: {
                            ...prevMemory,
                            [snapshot.type]: metrics,
                        },
                    };
                })
            );
        },
        [activeStageGroupId, focusMode, setStageGroups, stageManagerEnabled]
    );

    const scheduleLayoutMemoryCapture = useCallback(
        (windowId) => {
            if (!windowId || !stageManagerEnabled || !activeStageGroupId) {
                return;
            }
            requestAnimationFrame(() => captureLayoutMemoryForWindow(windowId));
        },
        [activeStageGroupId, captureLayoutMemoryForWindow, stageManagerEnabled]
    );

    const stopMomentumAnimation = useCallback((id) => {
        const animation = momentumAnimationsRef.current[id];
        if (!animation) {
            return;
        }
        if (animation.frame) {
            cancelAnimationFrame(animation.frame);
        }
        delete momentumAnimationsRef.current[id];
    }, []);

    const applyDragMomentum = useCallback(
        (id, velocitySample) => {
            stopMomentumAnimation(id);
            if (
                !velocitySample ||
                typeof velocitySample.vx !== 'number' ||
                typeof velocitySample.vy !== 'number'
            ) {
                return false;
            }
            if (typeof window === 'undefined') {
                return false;
            }
            const speed = Math.hypot(velocitySample.vx, velocitySample.vy);
            if (speed < DRAG_MOMENTUM_THRESHOLD) {
                return false;
            }
            const animation = {
                id,
                vx: clampNumber(velocitySample.vx, -2.4, 2.4),
                vy: clampNumber(velocitySample.vy, -2.4, 2.4),
                travelX: 0,
                travelY: 0,
                elapsed: 0,
                lastTime: typeof performance !== 'undefined' ? performance.now() : Date.now(),
                frame: null,
            };

            const step = (now) => {
                const win = windowsRef.current.find((entry) => entry.id === id);
                if (!win) {
                    stopMomentumAnimation(id);
                    return;
                }
                const delta = Math.min(now - animation.lastTime, DRAG_MOMENTUM_FRAME_CLAMP);
                animation.lastTime = now;
                animation.elapsed += delta;

                const applyDelta = (key, velocity) => {
                    if (velocity === 0) return 0;
                    const raw = velocity * delta;
                    if (raw === 0) return 0;
                    const remaining = Math.max(DRAG_MOMENTUM_MAX_TRAVEL - animation[key], 0);
                    if (remaining <= 0.25) {
                        return 0;
                    }
                    const applied = Math.sign(raw) * Math.min(Math.abs(raw), remaining);
                    animation[key] += Math.abs(applied);
                    return applied;
                };

                const deltaX = applyDelta('travelX', animation.vx);
                const deltaY = applyDelta('travelY', animation.vy);

                if (deltaX === 0 && deltaY === 0) {
                    stopMomentumAnimation(id);
                    return;
                }

                const coords = clampWindowCoords(
                    win.x + deltaX,
                    win.y + deltaY,
                    win.width,
                    win.height,
                    window.innerWidth,
                    window.innerHeight
                );

                setWindows((wins) =>
                    wins.map((entry) =>
                        entry.id === id
                            ? {
                                  ...entry,
                                  x: coords.x,
                                  y: coords.y,
                                  isZoomed: false,
                                  snapshot: null,
                              }
                            : entry
                    )
                );

                const damping = Math.pow(DRAG_MOMENTUM_DECAY, delta / 16);
                animation.vx *= damping;
                animation.vy *= damping;

                const nextSpeed = Math.hypot(animation.vx, animation.vy);
                const fullyTravelled =
                    animation.travelX >= DRAG_MOMENTUM_MAX_TRAVEL &&
                    animation.travelY >= DRAG_MOMENTUM_MAX_TRAVEL;

                if (
                    nextSpeed < DRAG_MOMENTUM_MIN_SPEED ||
                    animation.elapsed >= DRAG_MOMENTUM_MAX_DURATION ||
                    fullyTravelled
                ) {
                    stopMomentumAnimation(id);
                    return;
                }

                animation.frame = requestAnimationFrame(step);
                momentumAnimationsRef.current[id] = animation;
            };

            animation.frame = requestAnimationFrame(step);
            momentumAnimationsRef.current[id] = animation;
            return true;
        },
        [setWindows, stopMomentumAnimation]
    );

    const announce = useCallback((message) => {
        if (!message) {
            return;
        }
        setLiveAnnouncement((prev) => (prev === message ? `${message} ` : message));
    }, []);

    const handleDismissControlHints = useCallback(() => {
        setShowControlHints(false);
        announce('Window control tips hidden');
    }, [announce]);

    const handleDisableControlHints = useCallback(() => {
        setControlHintsPref((prev) => ({ ...prev, dismissed: true }));
        setShowControlHints(false);
        announce('Window control tips disabled');
    }, [announce]);

    const handleShowControlHints = useCallback(() => {
        setControlHintsPref((prev) => ({ ...prev, dismissed: false }));
        setShowControlHints(true);
        announce('Window control tips enabled');
    }, [announce]);

    const openMissionControlFromHints = useCallback(() => {
        setShowControlHints(false);
        setMissionControlOpen(true);
        announce('Mission Control opened');
    }, [announce]);

    const bringToFront = useCallback((id) => {
        let focusedTitle = null;
        setWindows((prev) => {
            const target = prev.find((win) => win.id === id);
            if (!target) return prev;
            const newZ = zRef.current + 1;
            zRef.current = newZ;
            focusedTitle = target.title || typeToTitle(target.type);
            return prev.map((win) =>
                win.id === id
                    ? { ...win, z: newZ, minimized: false, minimizedByUser: false }
                    : win
            );
        });
        if (focusedTitle) {
            announce(`${focusedTitle} focused`);
        }
    }, [announce]);

    const handleStageDropCommit = useCallback(
        (windowId, dropTarget) => {
            if (!dropTarget || !stageManagerEnabled) {
                return false;
            }
            const dragWindow = windowsRef.current.find((win) => win.id === windowId);
            if (!dragWindow || dragWindow.isMain) {
                return false;
            }

            if (dropTarget.kind === 'stage') {
                const targetGroup = stageGroupsRef.current.find(
                    (group) => group.id === dropTarget.stageId
                );
                if (
                    !targetGroup ||
                    targetGroup.locked ||
                    targetGroup.windowTypes.includes(dragWindow.type)
                ) {
                    return false;
                }
                setStageGroups((groups) =>
                    groups.map((group) =>
                        group.id === targetGroup.id
                            ? {
                                  ...group,
                                  windowTypes: ensureStageGroupTypes([
                                      ...group.windowTypes,
                                      dragWindow.type,
                                  ]),
                              }
                            : group
                    )
                );
                setActiveStageGroupId(targetGroup.id);
                const activate = activateStageGroupRef.current;
                if (activate) {
                    requestAnimationFrame(() =>
                        activate(targetGroup.id, { force: true, skipFocus: true })
                    );
                }
                requestAnimationFrame(() => bringToFront(dragWindow.id));
                setWindows((wins) =>
                    wins.map((win) =>
                        win.id === dragWindow.id
                            ? { ...win, minimized: true, minimizedByUser: false }
                            : win
                    )
                );
                announce(
                    `${dragWindow.title || typeToTitle(dragWindow.type)} added to ${
                        targetGroup.label
                    }`
                );
                return true;
            }

            if (dropTarget.kind === 'new') {
                const newId = `stage-${Math.random().toString(36).slice(2, 8)}`;
                const label = generateStageGroupLabel(stageGroupsRef.current);
                setStageGroups((groups) => [
                    ...groups,
                    {
                        id: newId,
                        label,
                        windowTypes: ensureStageGroupTypes([dragWindow.type]),
                        locked: false,
                        layoutMode: DEFAULT_STAGE_LAYOUT_MODE,
                        layoutMemory: {},
                    },
                ]);
                setActiveStageGroupId(newId);
                const activate = activateStageGroupRef.current;
                if (activate) {
                    requestAnimationFrame(() =>
                        activate(newId, { force: true, skipFocus: true })
                    );
                }
                requestAnimationFrame(() => bringToFront(dragWindow.id));
                setWindows((wins) =>
                    wins.map((win) =>
                        win.id === dragWindow.id
                            ? { ...win, minimized: true, minimizedByUser: false }
                            : win
                    )
                );
                announce(
                    `${dragWindow.title || typeToTitle(dragWindow.type)} saved to ${label}`
                );
                return true;
            }

            return false;
        },
        [announce, bringToFront, stageManagerEnabled]
    );

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        if (controlHintsPref.dismissed) {
            setShowControlHints(false);
            return undefined;
        }
        const timer = window.setTimeout(() => {
            setShowControlHints(true);
            announce('Window control tips ready');
        }, 1200);
        return () => window.clearTimeout(timer);
    }, [announce, controlHintsPref.dismissed]);

    const focusNextWindow = useCallback(
        (direction = 1) => {
            const activeWindows = windowsRef.current
                .filter((win) => !win.minimized)
                .sort((a, b) => a.z - b.z);

            if (activeWindows.length <= 1) {
                return;
            }

            const current = focusedWindowRef.current;
            const currentIndex = current
                ? activeWindows.findIndex((win) => win.id === current.id)
                : activeWindows.length - 1;

            const nextIndex =
                (currentIndex + direction + activeWindows.length) % activeWindows.length;
            const nextWindow = activeWindows[nextIndex];
            if (nextWindow) {
                bringToFront(nextWindow.id);
            }
        },
        [bringToFront]
    );

    const handlePointerDown = useCallback(
        (event, id) => {
            if (
                event.target?.closest &&
                event.target.closest('[data-window-control]')
            ) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();

            bringToFront(id);

            const windowData = windowsRef.current.find((win) => win.id === id);
            if (!windowData) return;

            stopMomentumAnimation(id);

            setDraggingWindow({
                id,
                type: windowData.type,
                title: windowData.title,
                isMain: Boolean(windowData.isMain),
            });
            assignStageDropTarget(null);
            setDragPointer({
                x: event.clientX,
                y: event.clientY,
            });

            const offsetX = event.clientX - windowData.x;
            const offsetY = event.clientY - windowData.y;

            dragRef.current = {
                id,
                pointerId: event.pointerId,
                target: event.currentTarget,
                offsetX,
                offsetY,
            };
            const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
            dragVelocityRef.current[id] = {
                x: windowData.x,
                y: windowData.y,
                vx: 0,
                vy: 0,
                time: startTime,
            };
            setSnapPreview(null);

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
                let snapCandidate = null;
                if (typeof window !== 'undefined') {
                    snapCandidate = computeSnapCandidate({
                        pointerX: moveEvent.clientX,
                        pointerY: moveEvent.clientY,
                        viewportWidth: window.innerWidth,
                        viewportHeight: window.innerHeight,
                        disable: moveEvent.altKey || moveEvent.metaKey,
                    });
                }
                const stageCandidate = evaluateStageDropCandidate(
                    moveEvent.clientX,
                    moveEvent.clientY
                );
                assignStageDropTarget(stageCandidate);
                queueDragPointerPosition({
                    x: moveEvent.clientX,
                    y: moveEvent.clientY,
                });
                queueDragMutation({
                    id,
                    x: clampedX,
                    y: clampedY,
                    snapCandidate,
                });
                const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
                const previous = dragVelocityRef.current[id];
                if (previous) {
                    const deltaTime = Math.max(now - previous.time, 1);
                    const instantVx = (clampedX - previous.x) / deltaTime;
                    const instantVy = (clampedY - previous.y) / deltaTime;
                    dragVelocityRef.current[id] = {
                        x: clampedX,
                        y: clampedY,
                        time: now,
                        vx:
                            previous.vx * (1 - DRAG_VELOCITY_SMOOTHING) +
                            instantVx * DRAG_VELOCITY_SMOOTHING,
                        vy:
                            previous.vy * (1 - DRAG_VELOCITY_SMOOTHING) +
                            instantVy * DRAG_VELOCITY_SMOOTHING,
                    };
                } else {
                    dragVelocityRef.current[id] = {
                        x: clampedX,
                        y: clampedY,
                        vx: 0,
                        vy: 0,
                        time: now,
                    };
                }
            };

            const stopDrag = () => {
                if (!dragRef.current) return;
                flushDragMutation();
                const velocitySample = dragVelocityRef.current[id];
                delete dragVelocityRef.current[id];
                const dropTarget = stageDropTargetRef.current;
                const dropHandled = dropTarget ? handleStageDropCommit(id, dropTarget) : false;
                assignStageDropTarget(null);
                setDraggingWindow(null);
                const target = dragRef.current.target;
                const activePreview = snapPreviewRef.current;
                let snapApplied = false;
                if (!dropHandled) {
                    if (
                        activePreview &&
                        activePreview.id === id &&
                        typeof window !== 'undefined'
                    ) {
                        const { target: snapTarget } = activePreview;
                        setWindows((wins) =>
                            wins.map((win) =>
                                win.id === id
                                    ? applySnapLayout(
                                          win,
                                          snapTarget,
                                          window.innerWidth,
                                          window.innerHeight
                                      )
                                    : win
                            )
                        );
                        snapApplied = true;
                    }
                }
                if (!dropHandled && !snapApplied) {
                    applyDragMomentum(id, velocitySample);
                }
                setSnapPreview((prev) => (prev && prev.id === id ? null : prev));
                clearDragPointerOverlay();
                try {
                    target.releasePointerCapture(dragRef.current.pointerId);
                } catch {
                    // ignore
                }
                target.removeEventListener('pointermove', handleMove);
                target.removeEventListener('pointerup', stopDrag);
                target.removeEventListener('pointercancel', stopDrag);
                scheduleLayoutMemoryCapture(id);
                dragRef.current = null;
            };

            event.currentTarget.addEventListener('pointermove', handleMove);
            event.currentTarget.addEventListener('pointerup', stopDrag);
            event.currentTarget.addEventListener('pointercancel', stopDrag);
        },
        [
            assignStageDropTarget,
            bringToFront,
            clampPosition,
            evaluateStageDropCandidate,
            flushDragMutation,
            handleStageDropCommit,
            queueDragMutation,
            applyDragMomentum,
            queueDragPointerPosition,
            clearDragPointerOverlay,
            stopMomentumAnimation,
            scheduleLayoutMemoryCapture,
        ]
    );

    const handleResizeStart = useCallback(
        (event, id, edge) => {
            if (typeof window === 'undefined') return;
            event.preventDefault();
            event.stopPropagation();

            bringToFront(id);

            const windowData = windowsRef.current.find((win) => win.id === id);
            if (!windowData) return;

            const pointerId = event.pointerId;
            const target = event.currentTarget;

            resizeRef.current = {
                id,
                edge,
                pointerId,
                target,
                startX: event.clientX,
                startY: event.clientY,
                initial: {
                    x: windowData.x,
                    y: windowData.y,
                    width: windowData.width,
                    height: windowData.height,
                },
            };

            if (typeof target.setPointerCapture === 'function') {
                try {
                    target.setPointerCapture(pointerId);
                } catch {
                    // ignore pointer capture issues
                }
            }

            const handleMove = (moveEvent) => {
                if (!resizeRef.current || resizeRef.current.id !== id) return;
                const deltaX = moveEvent.clientX - resizeRef.current.startX;
                const deltaY = moveEvent.clientY - resizeRef.current.startY;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const next = resizeWindowByEdge(
                    resizeRef.current.initial,
                    resizeRef.current.edge,
                    deltaX,
                    deltaY,
                    viewportWidth,
                    viewportHeight
                );
                queueResizeMutation({
                    id,
                    metrics: next,
                });
            };

            const stopResize = () => {
                if (!resizeRef.current) return;
                flushResizeMutation();
                if (typeof target.releasePointerCapture === 'function') {
                    try {
                        target.releasePointerCapture(pointerId);
                    } catch {
                        // ignore release issues
                    }
                }
                target.removeEventListener('pointermove', handleMove);
                target.removeEventListener('pointerup', stopResize);
                target.removeEventListener('pointercancel', stopResize);
                scheduleLayoutMemoryCapture(id);
                resizeRef.current = null;
            };

            target.addEventListener('pointermove', handleMove);
            target.addEventListener('pointerup', stopResize);
            target.addEventListener('pointercancel', stopResize);
        },
        [bringToFront, flushResizeMutation, queueResizeMutation, scheduleLayoutMemoryCapture]
    );

    const navigateToWindowRoute = useCallback(
        (win) => {
            if (!win) return;
            if (win.routeLocation) {
                navigate(
                    {
                        pathname: win.routeLocation.pathname || '/',
                        search: win.routeLocation.search || '',
                        hash: win.routeLocation.hash || '',
                    },
                    { state: win.routeLocation.state ?? null }
                );
                return;
            }
            if (win.appRoutePath) {
                navigate(win.appRoutePath);
                return;
            }
            navigate('/');
        },
        [navigate]
    );

    const handleFocus = useCallback(
        (id) => {
            const snapshot = windowsRef.current;
            const target = snapshot.find((win) => win.id === id);
            if (target?.isAppWindow && activeAppIdRef.current !== target.id) {
                navigateToWindowRoute(target);
            }
            bringToFront(id);
        },
        [bringToFront, navigateToWindowRoute]
    );

    const handleClose = useCallback((id, options = {}) => {
        const snapshot = windowsRef.current;
        const primary = snapshot.find((win) => win.id === id);
        if (!primary || (primary.isMain && !primary.isAppWindow)) return;

        const windowsToClose = options.altKey
            ? snapshot.filter((win) => !win.isMain || win.isAppWindow)
            : [primary];

        if (windowsToClose.length === 0) {
            return;
        }

        const idsToClose = new Set(windowsToClose.map((win) => win.id));
        const announcement =
            windowsToClose.length > 1
                ? 'Utility windows closed'
                : `${primary.title || typeToTitle(primary.type)} closed`;

        setClosedTypes((prev) => {
            const unique = new Set(prev);
            windowsToClose.forEach((win) => {
                if (!win.isMain && !win.isAppWindow) {
                    unique.add(win.type);
                }
            });
            return Array.from(unique);
        });

        const closingAppIds = windowsToClose.filter((win) => win.isAppWindow).map((win) => win.id);
        const closingActiveApp = closingAppIds.includes(activeAppIdRef.current);

        setWindows((wins) => wins.filter((win) => !idsToClose.has(win.id)));

        if (closingAppIds.length > 0) {
            setTimeout(() => {
                if (!closingActiveApp) return;
                const remainingApps = windowsRef.current.filter(
                    (win) => win.isAppWindow && !closingAppIds.includes(win.id)
                );
                if (remainingApps.length > 0) {
                    const fallback = remainingApps[0];
                    if (fallback) {
                        navigateToWindowRoute(fallback);
                    }
                } else {
                    setActiveAppId(null);
                    activeAppIdRef.current = null;
                    navigate('/');
                }
            }, 0);
        }

        announce(announcement);
    }, [announce, navigate, navigateToWindowRoute]);

    const handleMinimize = useCallback((id, options = {}) => {
        const snapshot = windowsRef.current;
        const target = snapshot.find((win) => win.id === id);
        if (!target || target.allowMinimize === false) {
            return;
        }

        let announcement = null;

        if (options.altKey) {
            setFocusMode(false);
            setWindows((wins) =>
                wins.map((win) => {
                    if (win.isMain) {
                        return { ...win, minimized: false, minimizedByUser: false };
                    }
                    if (win.id === id) {
                        return { ...win, minimized: true, minimizedByUser: true };
                    }
                    if (win.allowMinimize === false) {
                        return win;
                    }
                    return { ...win, minimized: true, minimizedByUser: true };
                })
            );
            announcement = 'All secondary windows minimized';
        } else {
            setWindows((wins) =>
                wins.map((win) =>
                    win.id === id
                        ? { ...win, minimized: true, minimizedByUser: true }
                        : win
                )
            );
            announcement = `${target.title || typeToTitle(target.type)} minimized`;
        }

        announce(announcement);
    }, [announce]);


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
                    minimizedByUser: false,
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
        (identifier) => {
            setFocusMode(false);
            setWindows((wins) =>
                wins.map((win) =>
                    win.id === identifier || win.type === identifier
                        ? { ...win, minimized: false, minimizedByUser: false }
                        : win
                )
            );
            const match = windowsRef.current.find(
                (win) => win.id === identifier || win.type === identifier
            );
            if (match) {
                if (match.isAppWindow && activeAppIdRef.current !== match.id) {
                    navigateToWindowRoute(match);
                }
                bringToFront(match.id);
            }
        },
        [bringToFront, navigateToWindowRoute]
    );

    const handleDockActivate = useCallback(
        (entry) => {
            if (!entry) return;
            const targetId = entry.id ?? entry.type;
            if (!targetId) return;
            restoreWindow(targetId);
        },
        [restoreWindow]
    );

    const handleMissionControlSelect = useCallback(
        (win) => {
            if (win.minimized) {
                restoreWindow(win.id);
            } else {
                if (win.isAppWindow && activeAppIdRef.current !== win.id) {
                    navigateToWindowRoute(win);
                }
                bringToFront(win.id);
            }
            setMissionControlOpen(false);
        },
        [bringToFront, navigateToWindowRoute, restoreWindow]
    );

    const toggleFocusMode = useCallback(() => {
        const enteringFocus = !focusMode;
        setWindows((wins) => {
            if (!focusMode) {
                focusMemoryRef.current = wins
                    .filter((win) => !win.isMain)
                    .map((win) => ({
                        id: win.id,
                        minimized: win.minimized,
                        minimizedByUser: win.minimizedByUser,
                    }));
                return wins.map((win) =>
                    win.isMain
                        ? { ...win, minimized: false, minimizedByUser: false }
                        : { ...win, minimized: true, minimizedByUser: false }
                );
            }
            const memory = focusMemoryRef.current ?? [];
            focusMemoryRef.current = null;
            return wins.map((win) => {
                if (win.isMain) {
                    return { ...win, minimized: false, minimizedByUser: false };
                }
                const record = memory.find((entry) => entry.id === win.id);
                return {
                    ...win,
                    minimized: record ? record.minimized : false,
                    minimizedByUser: record ? Boolean(record.minimizedByUser) : false,
                };
            });
        });
        setFocusMode((value) => !value);
        announce(
            enteringFocus
                ? 'Focus mode on. Only the main window remains.'
                : 'Focus mode off. Restoring window layout.'
        );
    }, [announce, focusMode]);

    const openMissionControl = useCallback(() => {
        setMissionControlOpen(true);
    }, [setMissionControlOpen]);

    const handleZoom = useCallback(
        (id, options = {}) => {
            if (options.altKey) {
                toggleFocusMode();
                return;
            }

            if (typeof window === 'undefined') return;

            const currentWindow = windowsRef.current.find((win) => win.id === id);
            if (!currentWindow) return;

            const enteringFullScreen = !currentWindow.isZoomed;

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            setWindows((wins) =>
                wins.map((win) => {
                    if (win.id !== id) {
                        return win;
                    }

                    if (!win.isZoomed) {
                        const snapshot = {
                            x: win.x,
                            y: win.y,
                            width: win.width,
                            height: win.height,
                        };
                        return expandWindowToViewport(
                            {
                                ...win,
                                snapshot,
                            },
                            viewportWidth,
                            viewportHeight
                        );
                    }

                    if (win.snapshot) {
                        return clampWindowToViewport(
                            {
                                ...win,
                                ...win.snapshot,
                                isZoomed: false,
                                snapshot: null,
                            },
                            viewportWidth,
                            viewportHeight
                        );
                    }

                    return clampWindowToViewport(
                        {
                            ...win,
                            isZoomed: false,
                            snapshot: null,
                        },
                        viewportWidth,
                        viewportHeight
                    );
                })
            );

            const windowTitle = currentWindow.title || typeToTitle(currentWindow.type);
            announce(
                enteringFullScreen
                    ? `${windowTitle} expanded to full view`
                    : `${windowTitle} restored`
            );

            if (enteringFullScreen) {
                bringToFront(id);
                setFocusMode(false);
            }
        },
        [announce, bringToFront, toggleFocusMode]
    );

    const computeStageLayoutBlueprint = useCallback((group, viewportWidth, viewportHeight, options = {}) => {
        if (!group) return null;
        const preferMemory = options.preferMemory !== false;
        const allowed = new Set(
            ensureStageGroupTypes(Array.isArray(group.windowTypes) ? group.windowTypes : []).filter(
                (type) => type !== WINDOW_TYPES.MAIN
            )
        );
        if (allowed.size === 0) {
            return null;
        }

        const memoryEntries =
            preferMemory && group.layoutMemory
                ? Object.entries(group.layoutMemory).filter(([type]) => allowed.has(type))
                : [];
        if (memoryEntries.length > 0) {
            const blueprint = {};
            memoryEntries.forEach(([type, snapshot]) => {
                blueprint[type] = {
                    x: snapshot.x,
                    y: snapshot.y,
                    width: snapshot.width,
                    height: snapshot.height,
                };
            });
            return { blueprint, source: 'memory' };
        }

        const preset =
            STAGE_LAYOUT_PRESETS[group.layoutMode] ||
            STAGE_LAYOUT_PRESETS[DEFAULT_STAGE_LAYOUT_MODE];
        if (!preset || !Array.isArray(preset.layoutSlots)) {
            return null;
        }
        const stageArea = computeStageArea(viewportWidth, viewportHeight);
        const blueprint = {};
        preset.layoutSlots.forEach((slot) => {
            if (!allowed.has(slot.type)) {
                return;
            }
            blueprint[slot.type] = {
                x: stageArea.x + slot.x * stageArea.width,
                y: stageArea.y + slot.y * stageArea.height,
                width: slot.width * stageArea.width,
                height: slot.height * stageArea.height,
            };
        });
        if (Object.keys(blueprint).length === 0) {
            return null;
        }
        return { blueprint, source: 'preset' };
    }, []);

    const applyStageLayoutToGroup = useCallback(
        (targetGroup, options = {}) => {
            const group =
                typeof targetGroup === 'string'
                    ? stageGroupsRef.current.find((entry) => entry.id === targetGroup)
                    : targetGroup;
            if (!group) {
                return;
            }
            if (!stageManagerEnabled && !options.force) {
                return;
            }
            if (focusMode && !options.allowFocus) {
                return;
            }
            if (typeof window === 'undefined') {
                return;
            }
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const layoutResult = computeStageLayoutBlueprint(
                group,
                viewportWidth,
                viewportHeight,
                options
            );
            if (!layoutResult) {
                return;
            }

            const { blueprint, source } = layoutResult;
            setWindows((wins) => {
                let changed = false;
                const next = wins.map((win) => {
                    const rect = blueprint[win.type];
                    if (!rect) {
                        return win;
                    }
                    const clamped = clampWindowToViewport(
                        {
                            ...win,
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height,
                            isZoomed: false,
                            snapshot: null,
                        },
                        viewportWidth,
                        viewportHeight
                    );
                    if (
                        win.x === clamped.x &&
                        win.y === clamped.y &&
                        win.width === clamped.width &&
                        win.height === clamped.height &&
                        !win.isZoomed
                    ) {
                        return win;
                    }
                    changed = true;
                    return clamped;
                });
                return changed ? next : wins;
            });

            if (options.persistMemory === false || source === 'memory') {
                return;
            }

            setStageGroups((groups) =>
                groups.map((entry) => {
                    if (entry.id !== group.id) {
                        return entry;
                    }
                    const nextMemory = { ...(entry.layoutMemory || {}) };
                    Object.entries(blueprint).forEach(([type, rect]) => {
                        nextMemory[type] = {
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height,
                        };
                    });
                    return {
                        ...entry,
                        layoutMemory: nextMemory,
                    };
                })
            );
        },
        [computeStageLayoutBlueprint, focusMode, setStageGroups, setWindows, stageManagerEnabled]
    );

    useEffect(() => {
        applyStageLayoutRef.current = applyStageLayoutToGroup;
    }, [applyStageLayoutToGroup]);

    const activateStageGroup = useCallback(
        (groupId, options = {}) => {
            const group = stageGroups.find((item) => item.id === groupId);
            if (!group) return;

            const { force = false, skipFocus = false } = options;
            setActiveStageGroupId(groupId);

            const shouldApply = stageManagerEnabled || force;
            if (!shouldApply) return;

            const allowedTypes = new Set(group.windowTypes);
            const missingTypes = group.windowTypes.filter(
                (type) =>
                    type !== WINDOW_TYPES.MAIN &&
                    !windowsRef.current.some((win) => win.type === type)
            );

            if (!focusMode) {
                setWindows((wins) => {
                    let changed = false;
                    const next = wins.map((win) => {
                        const shouldShow = win.isMain || allowedTypes.has(win.type);
                        if (win.minimizedByUser) {
                            return win;
                        }
                        const desiredMinimized = !shouldShow;
                        if (win.minimized === desiredMinimized && win.minimizedByUser === false) {
                            return win;
                        }
                        changed = true;
                        return {
                            ...win,
                            minimized: desiredMinimized,
                            minimizedByUser: false,
                        };
                    });
                    return changed ? next : wins;
                });
            }

            if (missingTypes.length > 0) {
                missingTypes.forEach((type) => {
                    requestAnimationFrame(() => reopenWindow(type));
                });
            }

            const scheduleLayout = () => {
                const applyLayout = applyStageLayoutRef.current;
                if (applyLayout) {
                    applyLayout(group, { force });
                }
            };

            if (shouldApply) {
                if (missingTypes.length > 0 && typeof window !== 'undefined') {
                    window.setTimeout(scheduleLayout, 120);
                } else {
                    requestAnimationFrame(scheduleLayout);
                }
            }

            if (!skipFocus) {
                const candidate =
                    windowsRef.current.find(
                        (win) => allowedTypes.has(win.type) && !win.minimized
                    ) || windowsRef.current.find((win) => win.isMain);
                if (candidate) {
                    requestAnimationFrame(() => bringToFront(candidate.id));
                }
            }
        },
        [bringToFront, focusMode, reopenWindow, stageGroups, stageManagerEnabled]
    );

    useEffect(() => {
        activateStageGroupRef.current = activateStageGroup;
    }, [activateStageGroup]);

    const cycleStageGroup = useCallback(
        (direction) => {
            if (!stageManagerEnabled || stageGroups.length === 0) {
                return;
            }
            const currentIndex = stageGroups.findIndex((group) => group.id === activeStageGroupId);
            const baseIndex = currentIndex === -1 ? 0 : currentIndex;
            const delta = direction === 'forward' ? 1 : -1;
            const nextIndex = (baseIndex + delta + stageGroups.length) % stageGroups.length;
            const nextGroup = stageGroups[nextIndex];
            if (!nextGroup) {
                return;
            }
            activateStageGroup(nextGroup.id);
        },
        [activateStageGroup, activeStageGroupId, stageGroups, stageManagerEnabled]
    );

    const handleStageManagerToggle = useCallback(() => {
        let announcementMessage = stageManagerEnabled
            ? 'Stage Manager disabled. All windows available.'
            : 'Stage Manager enabled. Grouping utility windows.';
        if (stageManagerEnabled) {
            setStageManagerEnabled(false);
            const memory = stageManagerMemoryRef.current;
            stageManagerMemoryRef.current = null;
            if (memory) {
                setWindows((wins) => {
                    let changed = false;
                    const next = wins.map((win) => {
                        const record = memory.windows.find((entry) => entry.id === win.id);
                        if (!record) return win;
                        if (
                            win.minimized === record.minimized &&
                            Boolean(win.minimizedByUser) === Boolean(record.minimizedByUser)
                        ) {
                            return win;
                        }
                        changed = true;
                        return {
                            ...win,
                            minimized: record.minimized,
                            minimizedByUser: Boolean(record.minimizedByUser),
                        };
                    });
                    return changed ? next : wins;
                });
                if (memory.focusedId) {
                    requestAnimationFrame(() => bringToFront(memory.focusedId));
                }
            }
        } else {
            if (focusMode) {
                toggleFocusMode();
            }

            stageManagerMemoryRef.current = {
                focusedId:
                    windowsRef.current.reduce(
                        (top, win) => (!top || win.z > top.z ? win : top),
                        null
                    )?.id ?? null,
                windows: windowsRef.current.map((win) => ({
                    id: win.id,
                    minimized: win.minimized,
                    minimizedByUser: win.minimizedByUser,
                })),
            };

            setStageManagerEnabled(true);
            const targetGroup =
                activeStageGroupId && stageGroups.some((group) => group.id === activeStageGroupId)
                    ? activeStageGroupId
                    : stageGroups[0]
                    ? stageGroups[0].id
                    : null;

            if (targetGroup) {
                requestAnimationFrame(() => activateStageGroup(targetGroup, { force: true }));
            }
        }
        announce(announcementMessage);
    }, [
        activateStageGroup,
        activeStageGroupId,
        focusMode,
        stageGroups,
        stageManagerEnabled,
        toggleFocusMode,
        bringToFront,
        announce,
    ]);

    const triggerHotCorner = useCallback(
        (cornerKey) => {
            if (!hotCorners.enabled) {
                return;
            }
            const action = hotCorners.corners?.[cornerKey];
            if (!isValidCornerAction(action)) {
                return;
            }

            let performed = false;
            let announcement = null;

            switch (action) {
                case 'mission-control':
                    setMissionControlOpen(true);
                    announcement = HOT_CORNER_ACTION_LABELS[action];
                    performed = true;
                    break;
                case 'quick-look': {
                    const ranked = windowsRef.current
                        .filter((win) => !win.minimized)
                        .sort((a, b) => b.z - a.z);
                    const fallback = windowsRef.current
                        .slice()
                        .sort((a, b) => b.z - a.z)[0] ?? null;
                    const target = ranked[0] ?? fallback;
                    if (!target) {
                        break;
                    }
                    setQuickLookWindowId((prev) => (prev === target.id ? null : target.id));
                    announcement = HOT_CORNER_ACTION_LABELS[action];
                    performed = true;
                    break;
                }
                case 'stage-manager':
                    handleStageManagerToggle();
                    performed = true;
                    break;
                case 'focus-mode':
                    toggleFocusMode();
                    performed = true;
                    break;
                default:
                    break;
            }

            if (performed) {
                lastHotCornerRef.current = cornerKey;
                setActiveHotCorner({ action, corner: cornerKey });
                if (announcement) {
                    announce(`${announcement} via hot corner`);
                }
            }
        },
        [announce, handleStageManagerToggle, hotCorners, toggleFocusMode]
    );

    const handleHotCornerToggle = useCallback(() => {
        setHotCorners((prev) => {
            const nextEnabled = !prev.enabled;
            const sanitizedCorners = sanitizeHotCornerMapping(prev.corners);
            announce(nextEnabled ? 'Hot corners enabled' : 'Hot corners disabled');
            return {
                enabled: nextEnabled,
                corners: sanitizedCorners,
            };
        });
    }, [announce]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const timers = hotCornerTimersRef.current;
        const clearTimers = () => {
            Object.keys(timers).forEach((key) => {
                if (timers[key]) {
                    window.clearTimeout(timers[key]);
                    timers[key] = null;
                }
            });
        };

        if (!hotCorners.enabled || isCompact) {
            clearTimers();
            lastHotCornerRef.current = null;
            return undefined;
        }

        const handleMouseMove = (event) => {
            const { clientX, clientY } = event;
            const { innerWidth, innerHeight } = window;
            let corner = null;

            if (clientX <= HOT_CORNER_THRESHOLD_PX && clientY <= HOT_CORNER_THRESHOLD_PX) {
                corner = 'topLeft';
            } else if (
                clientX >= innerWidth - HOT_CORNER_THRESHOLD_PX &&
                clientY <= HOT_CORNER_THRESHOLD_PX
            ) {
                corner = 'topRight';
            } else if (
                clientX <= HOT_CORNER_THRESHOLD_PX &&
                clientY >= innerHeight - HOT_CORNER_THRESHOLD_PX
            ) {
                corner = 'bottomLeft';
            } else if (
                clientX >= innerWidth - HOT_CORNER_THRESHOLD_PX &&
                clientY >= innerHeight - HOT_CORNER_THRESHOLD_PX
            ) {
                corner = 'bottomRight';
            }

            if (!corner) {
                clearTimers();
                lastHotCornerRef.current = null;
                return;
            }

            if (lastHotCornerRef.current === corner || timers[corner]) {
                return;
            }

            timers[corner] = window.setTimeout(() => {
                timers[corner] = null;
                triggerHotCorner(corner);
            }, HOT_CORNER_DELAY_MS);
        };

        const handleMouseLeave = () => {
            clearTimers();
            lastHotCornerRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            clearTimers();
        };
    }, [hotCorners.enabled, isCompact, triggerHotCorner]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const metaOrCtrl = event.metaKey || event.ctrlKey;
            const activeElement = document.activeElement;
            const isEditable =
                activeElement &&
                (activeElement.isContentEditable ||
                    ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName));

            const resolveTopWindow = () =>
                windowsRef.current
                    .filter((win) => !win.minimized)
                    .reduce((top, win) => (!top || win.z > top.z ? win : top), null);

            if (metaOrCtrl && event.key === 'ArrowUp') {
                event.preventDefault();
                setMissionControlOpen(true);
                return;
            }

            if (metaOrCtrl && event.key === 'ArrowDown') {
                event.preventDefault();
                setMissionControlOpen(false);
                return;
            }

            if (metaOrCtrl && event.altKey && event.key === 'ArrowRight') {
                event.preventDefault();
                cycleStageGroup('forward');
                return;
            }

            if (metaOrCtrl && event.altKey && event.key === 'ArrowLeft') {
                event.preventDefault();
                cycleStageGroup('backward');
                return;
            }

            if (metaOrCtrl && event.altKey && event.key.toLowerCase() === 's') {
                event.preventDefault();
                handleStageManagerToggle();
                return;
            }

            if (metaOrCtrl && (event.key === '`' || event.key === '~')) {
                event.preventDefault();
                focusNextWindow(event.shiftKey ? -1 : 1);
                return;
            }

            if (metaOrCtrl && event.ctrlKey && event.key.toLowerCase() === 'f') {
                event.preventDefault();
                const target = resolveTopWindow();
                if (target) {
                    handleZoom(target.id);
                }
                return;
            }

            if (metaOrCtrl && event.altKey && event.key.toLowerCase() === 'f') {
                event.preventDefault();
                const target = resolveTopWindow();
                if (target) {
                    handleZoom(target.id, { altKey: true });
                } else {
                    toggleFocusMode();
                }
                return;
            }

            if (metaOrCtrl && event.altKey && event.key.toLowerCase() === 'm') {
                event.preventDefault();
                const target = resolveTopWindow();
                if (target && target.allowMinimize) {
                    handleMinimize(target.id, { altKey: true });
                }
                return;
            }

            if (metaOrCtrl && event.key.toLowerCase() === 'm') {
                event.preventDefault();
                const target = resolveTopWindow();
                if (target && target.allowMinimize) {
                    handleMinimize(target.id);
                }
                return;
            }

            if (metaOrCtrl && event.altKey && event.key.toLowerCase() === 'w') {
                event.preventDefault();
                const target = resolveTopWindow();
                if (target && target.allowClose) {
                    handleClose(target.id, { altKey: true });
                }
                return;
            }

            if (metaOrCtrl && event.key.toLowerCase() === 'w') {
                event.preventDefault();
                const target = resolveTopWindow();
                if (target && target.allowClose && !target.isMain) {
                    handleClose(target.id);
                }
                return;
            }

            if (!metaOrCtrl && event.key === ' ' && !event.repeat && !isEditable) {
                event.preventDefault();
                setQuickLookWindowId((current) => {
                    if (current) return null;
                    const topWindow = resolveTopWindow() ??
                        windowsRef.current.reduce(
                            (top, win) => (!top || win.z > top.z ? win : top),
                            null
                        );
                    return topWindow ? topWindow.id : current;
                });
                return;
            }

            if (event.key === 'Escape') {
                setMissionControlOpen(false);
                setQuickLookWindowId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        cycleStageGroup,
        focusNextWindow,
        handleClose,
        handleMinimize,
        handleStageManagerToggle,
        handleZoom,
        toggleFocusMode,
    ]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const handleExternalToggle = () => {
            handleStageManagerToggle();
        };
        window.addEventListener(STAGE_MANAGER_TOGGLE_EVENT, handleExternalToggle);
        return () => {
            window.removeEventListener(STAGE_MANAGER_TOGGLE_EVENT, handleExternalToggle);
        };
    }, [handleStageManagerToggle]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleStorage = (event) => {
            if (event.storageArea !== window.localStorage) return;

            if (event.key === 'scientistshield.desktop.scratchpad') {
                setScratchpadText((prev) => {
                    const nextValue = event.newValue ?? '';
                    return prev === nextValue ? prev : nextValue;
                });
                return;
            }

            if (event.key === WINDOW_STORAGE_KEY) {
                if (!event.newValue) return;
                let payload;
                try {
                    payload = JSON.parse(event.newValue);
                } catch {
                    return;
                }
                if (!payload || payload.version !== WINDOW_STORAGE_VERSION) {
                    return;
                }

                const focusFromPayload = Boolean(payload.focusMode);
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                const sanitizedEntries = Array.isArray(payload.windows)
                    ? payload.windows
                          .map((entry) => sanitizeWindowEntry(entry, viewportWidth, viewportHeight))
                          .filter(Boolean)
                    : [];

                if (sanitizedEntries.length === 0) {
                    return;
                }

                const normalized = ensureMainWindow(
                    sanitizedEntries,
                    windowTitle,
                    viewportWidth,
                    viewportHeight
                ).map((win) => {
                    if (win.isZoomed) {
                        return expandWindowToViewport(win, viewportWidth, viewportHeight);
                    }
                    if (focusFromPayload && !win.isMain) {
                        return { ...win, minimized: true, minimizedByUser: false };
                    }
                    return clampWindowToViewport(win, viewportWidth, viewportHeight);
                });

                const currentSignature = JSON.stringify(
                    windowsRef.current.map(serializeWindowEntry)
                );
                const nextSignature = JSON.stringify(normalized.map(serializeWindowEntry));
                if (currentSignature === nextSignature) {
                    return;
                }

                const maxZ = normalized.reduce((acc, win) => Math.max(acc, win.z || 0), 20);
                zRef.current = Math.max(maxZ, 20);

                const sanitizedClosedTypes = Array.isArray(payload.closedTypes)
                    ? payload.closedTypes.filter((type) => typeof type === 'string')
                    : [];

                setFocusMode((prev) => (prev === focusFromPayload ? prev : focusFromPayload));
                setClosedTypes((prev) => {
                    const prevSignature = JSON.stringify(prev);
                    const nextSignature = JSON.stringify(sanitizedClosedTypes);
                    return prevSignature === nextSignature ? prev : sanitizedClosedTypes;
                });
                setWindows(normalized);
                return;
            }

            if (event.key === STAGE_MANAGER_STORAGE_KEY) {
                if (!event.newValue) return;
                let payload;
                try {
                    payload = JSON.parse(event.newValue);
                } catch {
                    return;
                }
                if (!payload) {
                    return;
                }
                const version =
                    typeof payload.version === 'number'
                        ? payload.version
                        : STAGE_MANAGER_STORAGE_VERSION;
                if (version > STAGE_MANAGER_STORAGE_VERSION || version < 1) {
                    return;
                }

                const sanitizedGroups = sanitizeStageGroups(payload.groups);
                const nextActiveId = sanitizedGroups.some(
                    (group) => group.id === payload.activeGroupId
                )
                    ? payload.activeGroupId
                    : sanitizedGroups[0]
                    ? sanitizedGroups[0].id
                    : null;
                const nextPinnedId = sanitizedGroups.some(
                    (group) => group.id === payload.pinnedGroupId
                )
                    ? payload.pinnedGroupId
                    : null;

                setStageGroups((prev) => {
                    const prevSignature = JSON.stringify(prev.map(serializeStageGroup));
                    const nextSignature = JSON.stringify(sanitizedGroups.map(serializeStageGroup));
                    return prevSignature === nextSignature ? prev : sanitizedGroups;
                });
                setStageManagerEnabled((prev) =>
                    prev === Boolean(payload.enabled) ? prev : Boolean(payload.enabled)
                );
                setActiveStageGroupId((prev) => (prev === nextActiveId ? prev : nextActiveId));
                setPinnedStageGroupId((prev) => (prev === nextPinnedId ? prev : nextPinnedId));
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [windowTitle]);

    const activeStageGroup = useMemo(
        () => stageGroups.find((group) => group.id === activeStageGroupId) || null,
        [stageGroups, activeStageGroupId]
    );
    const activeStageLayoutMode = activeStageGroup?.layoutMode ?? DEFAULT_STAGE_LAYOUT_MODE;
    const activeStageHasCustomLayout =
        activeStageGroup && activeStageGroup.layoutMemory
            ? Object.keys(activeStageGroup.layoutMemory).length > 0
            : false;

    const handleSaveStageGroup = useCallback(() => {
        const visibleTypes = Array.from(
            new Set(
                windowsRef.current
                    .filter((win) => !win.minimized || win.isMain)
                    .map((win) => win.type)
            )
        );
        if (visibleTypes.length === 0) return;

        const sanitizedTypes = ensureStageGroupTypes(visibleTypes);
        const newId = `stage-${Math.random().toString(36).slice(2, 8)}`;

        const layoutSeed = {};
        windowsRef.current.forEach((win) => {
            if (win.isMain || !sanitizedTypes.includes(win.type)) {
                return;
            }
            layoutSeed[win.type] = {
                x: win.x,
                y: win.y,
                width: win.width,
                height: win.height,
            };
        });
        const referenceLayoutMode =
            activeStageGroup?.layoutMode ?? DEFAULT_STAGE_LAYOUT_MODE;

        setStageGroups((groups) => {
            const label = generateStageGroupLabel(groups);
            return [
                ...groups,
                {
                    id: newId,
                    label,
                    windowTypes: sanitizedTypes,
                    locked: false,
                    layoutMode: referenceLayoutMode,
                    layoutMemory: layoutSeed,
                },
            ];
        });

        setActiveStageGroupId(newId);
        if (!pinnedStageGroupId) {
            setPinnedStageGroupId(newId);
        }
        if (stageManagerEnabled) {
            requestAnimationFrame(() => activateStageGroup(newId, { force: true }));
        }
    }, [activateStageGroup, activeStageGroup, pinnedStageGroupId, stageManagerEnabled]);

    const handleDeleteStageGroup = useCallback(
        (groupId) => {
            let removedActive = false;
            let fallbackId = null;
            let removedPinned = false;
            setStageGroups((groups) => {
                const target = groups.find((group) => group.id === groupId);
                if (!target || target.locked) {
                    return groups;
                }
                const filtered = groups.filter((group) => group.id !== groupId);
                removedActive = activeStageGroupId === groupId;
                 removedPinned = pinnedStageGroupId === groupId;
                fallbackId = filtered[0] ? filtered[0].id : null;
                return filtered;
            });

            if (removedActive) {
                setActiveStageGroupId(fallbackId);
                if (stageManagerEnabled && fallbackId) {
                    requestAnimationFrame(() =>
                        activateStageGroup(fallbackId, { force: true, skipFocus: true })
                    );
                }
            }
            if (removedPinned) {
                setPinnedStageGroupId(fallbackId);
            }
        },
        [activateStageGroup, activeStageGroupId, pinnedStageGroupId, stageManagerEnabled]
    );

    const handleStartRenameStageGroup = useCallback((group) => {
        if (!group || group.locked) {
            return;
        }
        setEditingStageGroupId(group.id);
        setEditingStageGroupLabel(group.label);
    }, []);

    const handleCancelRenameStageGroup = useCallback(() => {
        setEditingStageGroupId(null);
        setEditingStageGroupLabel('');
    }, []);

    const handleStageGroupLabelInputChange = useCallback((event) => {
        setEditingStageGroupLabel(event.target.value);
    }, []);

    const handleCommitStageGroupRename = useCallback(() => {
        if (!editingStageGroupId) {
            return;
        }
        const trimmed = editingStageGroupLabel.trim();
        if (!trimmed) {
            handleCancelRenameStageGroup();
            return;
        }
        setStageGroups((groups) =>
            groups.map((group) =>
                group.id === editingStageGroupId
                    ? {
                          ...group,
                          label: trimmed,
                      }
                    : group
            )
        );
        setEditingStageGroupId(null);
        setEditingStageGroupLabel('');
    }, [editingStageGroupId, editingStageGroupLabel, handleCancelRenameStageGroup]);

    const handleDuplicateStageGroup = useCallback((groupId) => {
        setStageGroups((groups) => {
            const target = groups.find((group) => group.id === groupId);
            if (!target) {
                return groups;
            }
            const newId = `stage-${Math.random().toString(36).slice(2, 8)}`;
            const duplicateLabel = generateDuplicatedStageGroupLabel(target.label, groups);
            return [
                ...groups,
                {
                    ...target,
                    id: newId,
                    label: duplicateLabel,
                    locked: false,
                    layoutMemory: { ...(target.layoutMemory || {}) },
                },
            ];
        });
    }, []);

    const handlePinStageGroup = useCallback((groupId) => {
        setPinnedStageGroupId((prev) => (prev === groupId ? null : groupId));
    }, []);

    const handleStageLayoutModeChange = useCallback(
        (modeId) => {
            if (!activeStageGroupId || !STAGE_LAYOUT_IDS.includes(modeId)) {
                return;
            }
            setStageGroups((groups) =>
                groups.map((group) =>
                    group.id === activeStageGroupId
                        ? { ...group, layoutMode: modeId, layoutMemory: {} }
                        : group
                )
            );
            requestAnimationFrame(() =>
                applyStageLayoutToGroup(activeStageGroupId, {
                    force: true,
                    preferMemory: false,
                })
            );
        },
        [activeStageGroupId, applyStageLayoutToGroup]
    );

    const handleResetActiveStageLayout = useCallback(() => {
        if (!activeStageGroupId) {
            return;
        }
        setStageGroups((groups) =>
            groups.map((group) =>
                group.id === activeStageGroupId ? { ...group, layoutMemory: {} } : group
            )
        );
        requestAnimationFrame(() =>
            applyStageLayoutToGroup(activeStageGroupId, {
                force: true,
                preferMemory: false,
            })
        );
    }, [activeStageGroupId, applyStageLayoutToGroup]);

    const handleApplyActiveStageLayout = useCallback(() => {
        if (!activeStageGroupId) {
            return;
        }
        requestAnimationFrame(() =>
            applyStageLayoutToGroup(activeStageGroupId, {
                force: true,
            })
        );
    }, [activeStageGroupId, applyStageLayoutToGroup]);

    const renderMainContentMemo = useCallback(() => renderMainContent(), [renderMainContent]);

    const renderWindowContent = useCallback(
        (win) => {
            if (win.isAppWindow) {
                if (win.id === activeAppId && win.appRoutePath) {
                    return renderMainContentMemo();
                }
                const Icon = iconForAppKey(win.appIconKey);
                const routeLabel = win.appRouteKey
                    ? win.appRouteKey.replace(/[-_]/g, ' ')
                    : 'Workspace';
                const statusLabel = win.minimized ? 'Minimized' : 'Background';
                if (win.routeLocation) {
                    const locationKey =
                        (win.routeLocation.key &&
                            `${win.id}-${win.routeLocation.key}`) ||
                        `${win.id}-${win.routeLocation.pathname || ''}${win.routeLocation.search || ''}${win.routeLocation.hash || ''}`;
                    return (
                        <div className="flex h-full flex-col overflow-hidden rounded-[26px] border border-white/40 bg-white/80 shadow-inner dark:border-white/10 dark:bg-slate-900/60">
                            <div className="flex-1 overflow-auto">
                                <WindowRouteRenderer
                                    key={locationKey}
                                    location={win.routeLocation}
                                />
                            </div>
                            <div className="flex items-center justify-between gap-3 border-t border-white/40 bg-white/70 px-4 py-2 text-[0.58rem] uppercase tracking-[0.32em] text-slate-500 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400">
                                <span className="inline-flex items-center gap-2">
                                    <span
                                        className="flex h-6 w-6 items-center justify-center rounded-lg text-white shadow-inner shadow-brand-500/25"
                                        style={{ backgroundImage: win.appAccent || APP_ACCENTS.default }}
                                    >
                                        {Icon ? (
                                            <Icon className="h-4 w-4" />
                                        ) : (
                                            <HiOutlineSparkles className="h-4 w-4" />
                                        )}
                                    </span>
                                    <span className="font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-300">
                                        {routeLabel}
                                    </span>
                                </span>
                                <span className="truncate text-[0.55rem] uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                                    {statusLabel}
                                </span>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="flex h-full flex-col justify-between rounded-[26px] bg-gradient-to-br from-white/85 via-white/75 to-white/60 p-6 dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-900/45">
                        <div>
                            <div className="flex items-start gap-4">
                                <div
                                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-xl shadow-brand-500/30"
                                    style={{ backgroundImage: win.appAccent || APP_ACCENTS.default }}
                                >
                                    {Icon ? (
                                        <Icon className="h-7 w-7" />
                                    ) : (
                                        <HiOutlineSparkles className="h-7 w-7" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                                        {routeLabel}
                                    </p>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                        {win.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {win.minimized
                                            ? 'Currently minimized. Open it to pick up where you left off.'
                                            : 'Another workspace is active. Activate this window to continue here.'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 rounded-2xl border border-white/50 bg-white/60 p-4 text-sm text-slate-500 shadow-inner dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
                                Manage open apps from the Dock or Stage Manager. Click below to focus this workspace instantly.
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => restoreWindow(win.id)}
                                className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-500/20 dark:border-brand-400/40 dark:text-brand-200 dark:hover:border-brand-300/60"
                            >
                                Go to Workspace
                            </button>
                        </div>
                    </div>
                );
            }

            if (win.id === MAIN_WINDOW_ID && appWindowSummaries.length > 0) {
                return (
                    <div className="flex h-full flex-col justify-between rounded-[26px] bg-gradient-to-br from-white/85 via-white/75 to-white/60 p-6 dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-900/45">
                        <div>
                            <div className="flex items-baseline justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                                        Mission Control
                                    </p>
                                    <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                        Desktop Overview
                                    </h2>
                                </div>
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300">
                                    {appWindowSummaries.length} apps
                                </span>
                            </div>
                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                {appWindowSummaries.map((app) => {
                                    const Icon = iconForAppKey(app.iconKey);
                                    return (
                                        <button
                                            type="button"
                                            key={app.id}
                                            onClick={() => restoreWindow(app.id)}
                                            className="group flex flex-col items-start rounded-2xl border border-white/40 bg-white/70 p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-brand-300/60 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60"
                                        >
                                            <span
                                                className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg shadow-brand-500/20"
                                                style={{ backgroundImage: app.accent || APP_ACCENTS.default }}
                                            >
                                                {Icon ? (
                                                    <Icon className="h-6 w-6" />
                                                ) : (
                                                    <HiOutlineSparkles className="h-6 w-6" />
                                                )}
                                            </span>
                                            <span className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-100">
                                                {app.title}
                                            </span>
                                            <span className="text-[0.58rem] uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                                                {app.isActive ? 'Active' : app.minimized ? 'Minimized' : 'On Deck'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                            <span>Dock · Launch / switch apps</span>
                            <span>Stage Manager · Organize scenes</span>
                        </div>
                    </div>
                );
            }

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
        [activeAppId, appWindowSummaries, currentTrackTime, renderMainContentMemo, restoreWindow, scratchpadText, todos]
    );


    const activeUtilityCount = useMemo(
        () =>
            activeStageGroup
                ? activeStageGroup.windowTypes.filter((type) => type !== WINDOW_TYPES.MAIN).length
                : 0,
        [activeStageGroup]
    );

    const stageManagerInsights = useMemo(() => {
        const uniqueUtilities = new Set();
        stageGroups.forEach((group) => {
            group.windowTypes.forEach((type) => {
                if (type !== WINDOW_TYPES.MAIN) {
                    uniqueUtilities.add(type);
                }
            });
        });
        return {
            totalScenes: stageGroups.length,
            customScenes: stageGroups.filter((group) => !group.locked).length,
            uniqueUtilities: uniqueUtilities.size,
        };
    }, [stageGroups]);

    const minimisedWindows = useMemo(() => {
        if (!stageManagerEnabled || !activeStageGroup) {
            return windows.filter((win) => win.minimized);
        }
        const allowedTypes = new Set(activeStageGroup.windowTypes);
        return windows.filter(
            (win) => win.minimized && (win.isMain || allowedTypes.has(win.type))
        );
    }, [windows, stageManagerEnabled, activeStageGroup]);

    const minimisedWindowSummary = useMemo(() => {
        if (minimisedWindows.length === 0) {
            return '';
        }
        return minimisedWindows.map((win) => typeToTitle(win.type)).join(', ');
    }, [minimisedWindows]);

    const fullscreenWindowActive = useMemo(
        () => windows.some((win) => win.isZoomed && !win.minimized),
        [windows]
    );

    const focusedWindow = useMemo(() => {
        if (windows.length === 0) return null;
        return windows.reduce((top, current) =>
            !top || current.z > top.z ? current : top
        , null);
    }, [windows]);

    const openWindowCount = useMemo(
        () => windows.filter((win) => !win.minimized).length,
        [windows]
    );

    useEffect(() => {
        focusedWindowRef.current = focusedWindow;
    }, [focusedWindow]);

    const activeHotCornerDetails = useMemo(() => {
        if (!activeHotCorner || !isValidCornerAction(activeHotCorner.action)) {
            return null;
        }
        const { action, corner } = activeHotCorner;
        return {
            action,
            corner,
            label: HOT_CORNER_ACTION_LABELS[action],
            symbol: HOT_CORNER_SYMBOLS[corner] || '',
            Icon: HOT_CORNER_ICONS[action] || null,
        };
    }, [activeHotCorner]);
    const HotCornerIcon = activeHotCornerDetails?.Icon || null;

    const dragFlyoutPosition = useMemo(() => {
        if (!dragPointer) {
            return null;
        }
        const baseX = dragPointer.x + DRAG_POINTER_OFFSET_X;
        const baseY = dragPointer.y + DRAG_POINTER_OFFSET_Y;
        if (typeof window === 'undefined') {
            return { left: baseX, top: baseY };
        }
        const maxLeft = window.innerWidth - 220;
        const maxTop = window.innerHeight - 120;
        const minTop = MAC_STAGE_MARGIN * 0.25;
        return {
            left: clampNumber(baseX, 12, maxLeft),
            top: clampNumber(baseY, minTop, maxTop),
        };
    }, [dragPointer]);

    const stageDropIndicator = useMemo(() => {
        if (!stageDropTarget || !draggingWindow || draggingWindow.isMain) {
            return null;
        }
        const windowLabel = draggingWindow.title || typeToTitle(draggingWindow.type);
        if (stageDropTarget.kind === 'stage') {
            const label =
                stageDropTarget.label ||
                stageGroups.find((group) => group.id === stageDropTarget.stageId)?.label ||
                'Scene';
            if (stageDropTarget.reason === 'ready') {
                return {
                    tone: 'ready',
                    message: `Add ${windowLabel} to ${label}`,
                };
            }
            if (stageDropTarget.reason === 'locked') {
                return {
                    tone: 'blocked',
                    message: `${label} is locked`,
                };
            }
            if (stageDropTarget.reason === 'duplicate') {
                return {
                    tone: 'blocked',
                    message: `${label} already includes ${windowLabel}`,
                };
            }
        }
        if (stageDropTarget.kind === 'new' && stageDropTarget.reason === 'ready') {
            return {
                tone: 'ready',
                message: `Drop to create a new scene with ${windowLabel}`,
            };
        }
        return null;
    }, [draggingWindow, stageDropTarget, stageGroups]);

    const stageEntries = useMemo(() => {
        const allowedTypes = activeStageGroup ? new Set(activeStageGroup.windowTypes) : null;
        const activeEntries = windows
            .filter((win) => !win.isMain)
            .map((win) => ({
                type: win.type,
                title: win.title,
                status: win.minimized
                    ? stageManagerEnabled && allowedTypes && !allowedTypes.has(win.type)
                        ? 'staged'
                        : 'minimized'
                    : 'open',
            }));

        const missingEntries = closedTypes
            .filter((type) => !activeEntries.some((entry) => entry.type === type))
            .map((type) => ({
                type,
                title: typeToTitle(type),
                status: 'closed',
            }));

        return [...activeEntries, ...missingEntries];
    }, [activeStageGroup, closedTypes, windows, stageManagerEnabled]);

    const stageShelfEntries = useMemo(() => {
        if (stageGroups.length === 0) {
            return [];
        }
        return stageGroups.map((group) => {
            const allowedTypes = new Set(group.windowTypes);
            const previewLayout = buildStagePreviewLayout(group);
            const relatedWindows = windows.filter(
                (win) => win.isMain || allowedTypes.has(win.type)
            );
            const visibleCount = relatedWindows.filter((win) => !win.minimized).length;
            const preset =
                STAGE_LAYOUT_PRESETS[group.layoutMode] ||
                STAGE_LAYOUT_PRESETS[DEFAULT_STAGE_LAYOUT_MODE];
            return {
                id: group.id,
                label: group.label,
                isActive: group.id === activeStageGroupId,
                isPinned: group.id === pinnedStageGroupId,
                locked: group.locked,
                previewLayout,
                windowCount: relatedWindows.length,
                visibleCount,
                titles: group.windowTypes
                    .filter((type) => type !== WINDOW_TYPES.MAIN)
                    .map((type) => typeToTitle(type)),
                layoutLabel: preset.label,
                hasCustomLayout:
                    group.layoutMemory && Object.keys(group.layoutMemory).length > 0,
            };
        });
    }, [activeStageGroupId, pinnedStageGroupId, stageGroups, windows]);

    const stageLayoutOptions = useMemo(
        () =>
            STAGE_LAYOUT_IDS.map((id) => {
                const preset = STAGE_LAYOUT_PRESETS[id];
                return {
                    id,
                    label: preset.label,
                    description: preset.description,
                    icon: preset.icon,
                };
            }),
        []
    );

    const stageShelfActive =
        stageManagerEnabled &&
        !focusMode &&
        !isCompact &&
        stageShelfEntries.length > 0 &&
        !fullscreenWindowActive; // Avoid blocking window controls when a window is zoomed.

    useEffect(() => {
        stageShelfActiveRef.current = stageShelfActive;
    }, [stageShelfActive]);

    useEffect(() => {
        if (!stageShelfActive) {
            assignStageDropTarget(null);
        }
    }, [assignStageDropTarget, stageShelfActive]);

    const pinnedStageGroupSummary = useMemo(
        () => stageShelfEntries.find((entry) => entry.isPinned) || null,
        [stageShelfEntries]
    );

    const handleStageEntrySelect = useCallback(
        (entry) => {
            const existing = windowsRef.current.find((win) => win.type === entry.type);

            const maybeAddToStageGroup = () => {
                if (
                    !stageManagerEnabled ||
                    !activeStageGroup ||
                    activeStageGroup.locked ||
                    activeStageGroup.windowTypes.includes(entry.type)
                ) {
                    return;
                }
                setStageGroups((groups) =>
                    groups.map((group) =>
                        group.id === activeStageGroup.id
                            ? {
                                  ...group,
                                  windowTypes: ensureStageGroupTypes([
                                      ...group.windowTypes,
                                      entry.type,
                                  ]),
                              }
                            : group
                    )
                );
                requestAnimationFrame(() =>
                    activateStageGroup(activeStageGroup.id, { force: true })
                );
            };

            if (existing) {
                if (existing.minimized) {
                    restoreWindow(entry.type);
                } else {
                    bringToFront(existing.id);
                }
                if (entry.status === 'staged') {
                    maybeAddToStageGroup();
                }
                return;
            }

            reopenWindow(entry.type);
            maybeAddToStageGroup();
        },
        [
            activateStageGroup,
            activeStageGroup,
            bringToFront,
            reopenWindow,
            restoreWindow,
            stageManagerEnabled,
        ]
    );

    const quickLookTarget = useMemo(
        () =>
            quickLookWindowId
                ? windows.find((win) => win.id === quickLookWindowId) || null
                : null,
        [quickLookWindowId, windows]
    );

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
            <div aria-live="polite" className="sr-only">
                {liveAnnouncement}
            </div>
            {!isCompact ? (
                <WindowControlHints
                    visible={showControlHints}
                    onDismiss={handleDismissControlHints}
                    onNeverShow={handleDisableControlHints}
                    onShowMissionControl={openMissionControlFromHints}
                />
            ) : null}
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
                                                    {win.iconComponent ? (
                                                        <win.iconComponent className="h-5 w-5" />
                                                    ) : (
                                                        renderWindowIcon(win.type, 'h-5 w-5') || (
                                                            <HiOutlineSparkles className="h-5 w-5" />
                                                        )
                                                    )}
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
                                                            restoreWindow(win.id);
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
                                                {renderWindowIcon(type)}
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

            <AnimatePresence>
                {quickLookTarget ? (
                    <motion.div
                        key="quick-look"
                        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl dark:bg-slate-950/55"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={() => setQuickLookWindowId(null)}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Quick Look"
                    >
                        <motion.div
                            className="relative w-[min(90vw,900px)] max-h-[80vh] rounded-3xl border border-white/25 bg-white/90 p-6 text-slate-700 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-900/85 dark:text-slate-100"
                            initial={{ scale: 0.96, y: 12 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 12 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 text-brand-600 shadow-inner dark:bg-slate-800/70 dark:text-brand-300">
                                        {quickLookTarget.iconComponent ? (
                                            <quickLookTarget.iconComponent className="h-5 w-5" />
                                        ) : (
                                            renderWindowIcon(quickLookTarget.type, 'h-5 w-5') || (
                                                <HiOutlineSparkles className="h-5 w-5" />
                                            )
                                        )}
                                    </span>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">Quick Look</p>
                                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100">
                                            {quickLookTarget.title}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setQuickLookWindowId(null)}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-brand-200/60 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/15 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-brand-300/60"
                                >
                                    <HiOutlineXMark className="h-4 w-4" />
                                    Close
                                </button>
                            </div>
                            <div className="max-h-[60vh] overflow-auto rounded-2xl border border-white/30 bg-white/80 p-4 shadow-inner dark:border-white/10 dark:bg-slate-900/70">
                                {renderWindowContent(quickLookTarget)}
                            </div>
                            <p className="mt-4 text-[0.65rem] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                                Press Space to toggle · {Math.round(quickLookTarget.width)} × {Math.round(quickLookTarget.height)}
                            </p>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {activeHotCornerDetails ? (
                    <motion.div
                        key="hot-corner-toast"
                        className="pointer-events-none fixed bottom-8 left-1/2 z-[70] -translate-x-1/2"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        aria-hidden="true"
                    >
                        <div className="flex items-center gap-3 rounded-full border border-white/45 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-lg backdrop-blur dark:border-white/15 dark:bg-slate-900/75 dark:text-slate-200">
                            {HotCornerIcon ? (
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-200">
                                    <HotCornerIcon className="h-4 w-4" />
                                </span>
                            ) : null}
                            <span className="text-[0.65rem] uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                                Hot Corner
                            </span>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                                {activeHotCornerDetails.symbol}{' '}{activeHotCornerDetails.label}
                            </span>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {snapPreview ? (
                    <motion.div
                        key="snap-preview"
                        className="pointer-events-none fixed inset-0 z-[44] hidden lg:block"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        aria-hidden="true"
                    >
                        <div
                            className="absolute overflow-hidden"
                            style={{
                                left: snapPreview.rect.x,
                                top: snapPreview.rect.y,
                                width: snapPreview.rect.width,
                                height: snapPreview.rect.height,
                                borderRadius: 'var(--macos-window-radius)',
                            }}
                        >
                            <div className="absolute inset-0 rounded-[inherit] border border-brand-300/60 bg-gradient-to-br from-brand-400/18 via-brand-500/14 to-brand-600/20 shadow-[0_48px_120px_-50px_rgba(14,116,244,0.6)] backdrop-blur-2xl dark:border-brand-400/50 dark:from-brand-400/16 dark:via-brand-500/12 dark:to-brand-500/18" />
                            <div className="absolute inset-0 rounded-[inherit] bg-brand-400/10 dark:bg-brand-300/10 mix-blend-screen" />
                        </div>
                        <div
                            className="absolute left-1/2 -translate-x-1/2 rounded-full border border-white/45 bg-white/85 px-4 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-brand-600 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/80 dark:text-brand-200"
                            style={{
                                top: Math.max(snapPreview.rect.y - 48, MAC_STAGE_MARGIN + 12),
                            }}
                        >
                            Snap: {labelForSnapTarget(snapPreview.target)}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {stageDropIndicator ? (
                    <motion.div
                        key="stage-drop-indicator"
                        className="pointer-events-none fixed left-10 top-1/2 z-[60] hidden -translate-y-1/2 lg:block"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        aria-hidden="true"
                    >
                        <div
                            className={`rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] backdrop-blur ${
                                stageDropIndicator.tone === 'ready'
                                    ? 'border-brand-300/70 bg-white/80 text-brand-600 dark:border-brand-400/60 dark:bg-slate-900/75 dark:text-brand-200'
                                    : 'border-rose-300/70 bg-white/80 text-rose-600 dark:border-rose-400/60 dark:bg-slate-900/75 dark:text-rose-200'
                            }`}
                        >
                            {stageDropIndicator.message}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {draggingWindow && dragFlyoutPosition ? (
                    <motion.div
                        key="window-drag-flyout"
                        className="pointer-events-none fixed z-[62] hidden lg:block"
                        initial={{ opacity: 0, scale: 0.92, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 4 }}
                        transition={{ duration: 0.12, ease: 'easeOut' }}
                        style={dragFlyoutPosition}
                        aria-hidden="true"
                    >
                        <div className="rounded-2xl border border-white/60 bg-white/90 px-3 py-2 text-[0.65rem] text-slate-700 shadow-2xl backdrop-blur dark:border-white/15 dark:bg-slate-900/85 dark:text-slate-100">
                            <p className="text-[0.72rem] font-semibold leading-tight">
                                {draggingWindow.title || typeToTitle(draggingWindow.type)}
                            </p>
                            <p className="text-[0.55rem] uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                                Drag to snap · Stage · Dock
                            </p>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <div
                className={`pointer-events-none fixed inset-0 hidden lg:block ${fullscreenWindowActive ? 'z-[56]' : 'z-[45]'}`}
            >
                <AnimatePresence>
                    {windows.filter((win) => !win.minimized).map((win) => (
                        <MacWindow
                            key={win.id}
                            windowData={win}
                            isFocused={focusedWindow ? focusedWindow.id === win.id : false}
                            isDragging={draggingWindow ? draggingWindow.id === win.id : false}
                            renderContent={renderWindowContent}
                            onPointerDown={handlePointerDown}
                            onClose={handleClose}
                            onMinimize={handleMinimize}
                            onZoom={handleZoom}
                            onResizeStart={handleResizeStart}
                            onFocus={handleFocus}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {stageShelfActive ? (
                <StageShelf
                    entries={stageShelfEntries}
                    onActivate={activateStageGroup}
                    onTogglePin={handlePinStageGroup}
                    stagePreviewAccent={stagePreviewAccent}
                    draggingWindow={draggingWindow}
                    draggingWindowLabel={
                        draggingWindow ? draggingWindow.title || typeToTitle(draggingWindow.type) : ''
                    }
                    stageDropTarget={stageDropTarget}
                    forceExpand={Boolean(draggingWindow)}
                />
            ) : null}

            {appDockEntries.length > 0 ? (
                <MacDock
                    entries={appDockEntries}
                    focusedId={activeAppId}
                    onActivate={handleDockActivate}
                />
            ) : null}

            <StageManagerPanel
                stageManagerEnabled={stageManagerEnabled}
                pinnedStageGroupSummary={pinnedStageGroupSummary}
                stageManagerInsights={stageManagerInsights}
                onShowControlHints={handleShowControlHints}
                onToggleStageManager={handleStageManagerToggle}
                onOpenMissionControl={openMissionControl}
                focusMode={focusMode}
                onToggleFocusMode={toggleFocusMode}
                activeStageGroup={activeStageGroup}
                activeUtilityCount={activeUtilityCount}
                pinnedStageGroupId={pinnedStageGroupId}
                onPinStageGroup={handlePinStageGroup}
                stageShelfEntries={stageShelfEntries}
                editingStageGroupId={editingStageGroupId}
                editingStageGroupLabel={editingStageGroupLabel}
                onStageGroupLabelChange={handleStageGroupLabelInputChange}
                onCommitRename={handleCommitStageGroupRename}
                onCancelRename={handleCancelRenameStageGroup}
                onStartRename={handleStartRenameStageGroup}
                onActivateStageGroup={activateStageGroup}
                stagePreviewAccent={stagePreviewAccent}
                onDuplicateStageGroup={handleDuplicateStageGroup}
                onDeleteStageGroup={handleDeleteStageGroup}
                onSaveStageGroup={handleSaveStageGroup}
                stageEntries={stageEntries}
                onStageEntrySelect={handleStageEntrySelect}
                stageEntryStatusLabel={stageEntryStatusLabel}
                renderWindowIcon={renderWindowIcon}
                hotCorners={hotCorners}
                onHotCornerToggle={handleHotCornerToggle}
                hotCornerKeys={HOT_CORNER_KEYS}
                hotCornerSymbols={HOT_CORNER_SYMBOLS}
                hotCornerActionLabel={hotCornerActionLabel}
                formatHotCornerName={formatHotCornerName}
                hasMinimisedWindows={minimisedWindows.length > 0}
                minimisedWindowSummary={minimisedWindowSummary}
                layoutOptions={stageLayoutOptions}
                activeLayoutMode={activeStageLayoutMode}
                hasCustomLayout={activeStageHasCustomLayout}
                onChangeLayoutMode={handleStageLayoutModeChange}
                onApplyLayout={handleApplyActiveStageLayout}
                onResetLayout={handleResetActiveStageLayout}
            />

            <div className="pointer-events-auto fixed bottom-8 right-8 z-[62] hidden lg:flex flex-col items-end gap-3">
                {minimisedWindows.map((win) => (
                    <button
                        key={win.id}
                        type="button"
                        onClick={() => restoreWindow(win.id)}
                        className="flex items-center gap-3 rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm font-medium text-slate-600 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-brand-300/60 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-brand-400/40"
                    >
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-brand-500/20 text-brand-600 dark:text-brand-300">
                            {win.iconComponent ? (
                                <win.iconComponent className="h-4 w-4" />
                            ) : (
                                renderWindowIcon(win.type, 'h-4 w-4') || <HiOutlineSparkles className="h-4 w-4" />
                            )}
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
    activeLocation: PropTypes.shape({
        pathname: PropTypes.string.isRequired,
        key: PropTypes.string,
        search: PropTypes.string,
        hash: PropTypes.string,
    }).isRequired,
};

function buildStagePreviewLayout(groupOrTypes) {
    const windowTypes = Array.isArray(groupOrTypes)
        ? groupOrTypes
        : groupOrTypes?.windowTypes;
    const normalized = ensureStageGroupTypes(Array.isArray(windowTypes) ? windowTypes : []);
    const primaryType =
        normalized.find((type) => type === WINDOW_TYPES.MAIN) ??
        normalized[0] ??
        WINDOW_TYPES.MAIN;

    const presetKey =
        !Array.isArray(groupOrTypes) && groupOrTypes?.layoutMode
            ? groupOrTypes.layoutMode
            : DEFAULT_STAGE_LAYOUT_MODE;
    const preset =
        STAGE_LAYOUT_PRESETS[presetKey] || STAGE_LAYOUT_PRESETS[DEFAULT_STAGE_LAYOUT_MODE];

    const layout = [
        {
            type: primaryType,
            x: 6,
            y: 8,
            width: 60,
            height: 68,
            isPrimary: true,
        },
    ];

    const fallbackSlots = [
        { x: 70, y: 8, width: 24, height: 32 },
        { x: 70, y: 46, width: 24, height: 32 },
        { x: 8, y: 74, width: 34, height: 20 },
        { x: 50, y: 74, width: 32, height: 20 },
    ];

    let slotIndex = 0;
    normalized.forEach((type) => {
        if (type === primaryType) {
            return;
        }
        const slotFromPreset = preset.previewSlots?.find((slot) => slot.type === type);
        const slot =
            slotFromPreset || fallbackSlots[Math.min(slotIndex, fallbackSlots.length - 1)];
        if (!slot) {
            return;
        }
        layout.push({
            type,
            x: slot.x,
            y: slot.y,
            width: slot.width,
            height: slot.height,
            isPrimary: false,
        });
        slotIndex += 1;
    });

    return layout;
}

function stagePreviewAccent(type, isPrimary) {
    const palette = {
        [WINDOW_TYPES.MAIN]: 'linear-gradient(135deg, rgba(14,116,244,0.75), rgba(59,130,246,0.65))',
        [WINDOW_TYPES.SCRATCHPAD]: 'linear-gradient(135deg, rgba(249,115,22,0.7), rgba(251,191,36,0.6))',
        [WINDOW_TYPES.NOW_PLAYING]: 'linear-gradient(135deg, rgba(236,72,153,0.7), rgba(165,180,252,0.6))',
        [WINDOW_TYPES.STATUS]: 'linear-gradient(135deg, rgba(34,211,238,0.75), rgba(14,165,233,0.6))',
        [WINDOW_TYPES.QUEUE]: 'linear-gradient(135deg, rgba(74,222,128,0.7), rgba(125,211,252,0.55))',
    };
    if (palette[type]) {
        return palette[type];
    }
    return isPrimary
        ? 'linear-gradient(135deg, rgba(148,163,184,0.7), rgba(148,163,184,0.55))'
        : 'linear-gradient(135deg, rgba(148,163,184,0.55), rgba(203,213,225,0.45))';
}

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

function sanitizeHotCornerMapping(value) {
    const base = { ...HOT_CORNER_DEFAULTS };
    if (!value || typeof value !== 'object') {
        return base;
    }
    HOT_CORNER_KEYS.forEach((key) => {
        if (isValidCornerAction(value[key])) {
            base[key] = value[key];
        }
    });
    return base;
}

function sanitizeHotCornerState(raw) {
    if (!raw || typeof raw !== 'object') {
        return createDefaultHotCornerState();
    }
    const enabled = typeof raw.enabled === 'boolean' ? raw.enabled : true;
    const corners = sanitizeHotCornerMapping(raw.corners);
    return {
        enabled,
        corners,
    };
}

function isValidCornerAction(action) {
    return (
        typeof action === 'string' &&
        Object.prototype.hasOwnProperty.call(HOT_CORNER_ACTION_LABELS, action)
    );
}

function hotCornerActionLabel(action) {
    return isValidCornerAction(action) ? HOT_CORNER_ACTION_LABELS[action] : 'None';
}

function formatHotCornerName(key) {
    switch (key) {
        case 'topLeft':
            return 'Top Left';
        case 'topRight':
            return 'Top Right';
        case 'bottomLeft':
            return 'Bottom Left';
        case 'bottomRight':
            return 'Bottom Right';
        default:
            return 'Corner';
    }
}

function sanitizeStageGroups(rawGroups) {
    if (!Array.isArray(rawGroups) || rawGroups.length === 0) {
        return DEFAULT_STAGE_GROUPS;
    }
    const seenIds = new Set();
    const sanitized = rawGroups
        .map((group, index) => {
            if (!group || typeof group !== 'object') return null;
            const id =
                typeof group.id === 'string' && group.id.trim().length > 0
                    ? group.id.trim()
                    : `stage-${Math.random().toString(36).slice(2, 8)}`;
            if (seenIds.has(id)) return null;
            seenIds.add(id);
            const label =
                typeof group.label === 'string' && group.label.trim().length > 0
                    ? group.label.trim()
                    : `Set ${index + 1}`;
            const windowTypes = ensureStageGroupTypes(
                Array.isArray(group.windowTypes) ? group.windowTypes : []
            );
            return {
                id,
                label,
                windowTypes,
                locked: Boolean(group.locked),
                layoutMode: sanitizeLayoutMode(group.layoutMode),
                layoutMemory: sanitizeLayoutMemory(group.layoutMemory),
            };
        })
        .filter(Boolean);

    DEFAULT_STAGE_GROUPS.forEach((defaultGroup) => {
        if (!sanitized.some((group) => group.id === defaultGroup.id)) {
            sanitized.push({
                ...defaultGroup,
                layoutMemory: { ...(defaultGroup.layoutMemory || {}) },
            });
        }
    });

    if (sanitized.length === 0) {
        return DEFAULT_STAGE_GROUPS;
    }
    return sanitized;
}

function serializeStageGroup(group) {
    return {
        id: group.id,
        label: group.label,
        windowTypes: ensureStageGroupTypes(group.windowTypes || []),
        locked: Boolean(group.locked),
        layoutMode: sanitizeLayoutMode(group.layoutMode),
        layoutMemory: sanitizeLayoutMemory(group.layoutMemory),
    };
}

function ensureStageGroupTypes(types) {
    const allowed = new Set(Object.values(WINDOW_TYPES));
    const next = [];
    types.forEach((type) => {
        if (!allowed.has(type)) return;
        if (!next.includes(type)) {
            next.push(type);
        }
    });
    if (!next.includes(WINDOW_TYPES.MAIN)) {
        next.unshift(WINDOW_TYPES.MAIN);
    }
    return next;
}

function sanitizeLayoutMode(mode) {
    return STAGE_LAYOUT_IDS.includes(mode) ? mode : DEFAULT_STAGE_LAYOUT_MODE;
}

function sanitizeLayoutMemory(rawMemory) {
    if (!rawMemory || typeof rawMemory !== 'object') {
        return {};
    }
    const allowed = new Set(Object.values(WINDOW_TYPES));
    const sanitized = {};
    Object.entries(rawMemory).forEach(([type, snapshot]) => {
        if (!allowed.has(type)) {
            return;
        }
        const metrics = sanitizeLayoutSnapshot(snapshot);
        if (metrics) {
            sanitized[type] = metrics;
        }
    });
    return sanitized;
}

function sanitizeLayoutSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
        return null;
    }
    const x = parseFiniteNumber(snapshot.x);
    const y = parseFiniteNumber(snapshot.y);
    const width = parseFiniteNumber(snapshot.width);
    const height = parseFiniteNumber(snapshot.height);
    if ([x, y, width, height].some((value) => typeof value !== 'number')) {
        return null;
    }
    return { x, y, width, height };
}

function generateStageGroupLabel(groups) {
    const existing = new Set(groups.map((group) => group.label));
    const base = 'Set';
    let index = groups.length + 1;
    let label = `${base} ${index}`;
    while (existing.has(label)) {
        index += 1;
        label = `${base} ${index}`;
    }
    return label;
}

function generateDuplicatedStageGroupLabel(baseLabel, groups) {
    const existingLabels = new Set(groups.map((group) => group.label));
    const normalized = baseLabel && baseLabel.trim().length > 0 ? baseLabel.trim() : 'Set';
    if (!existingLabels.has(normalized)) {
        return normalized;
    }
    let index = 2;
    let candidate = `${normalized} (${index})`;
    while (existingLabels.has(candidate)) {
        index += 1;
        candidate = `${normalized} (${index})`;
    }
    return candidate;
}

function stageEntryStatusLabel(status) {
    switch (status) {
        case 'open':
            return 'open';
        case 'minimized':
            return 'minimized';
        case 'staged':
            return 'staged · off-screen';
        case 'closed':
            return 'closed';
        default:
            return status;
    }
}

function resizeWindowByEdge(initial, edge, deltaX, deltaY, viewportWidth, viewportHeight) {
    const minWidth = 320;
    const minHeight = 260;
    const maxWidth = Math.max(viewportWidth - 48, 360);
    const maxHeight = Math.max(viewportHeight - 120, 260);

    let left = initial.x;
    let right = initial.x + initial.width;
    let top = initial.y;
    let bottom = initial.y + initial.height;

    if (edge.includes('e')) {
        const desiredRight = right + deltaX;
        const maxRight = viewportWidth - 12;
        right = clampNumber(desiredRight, left + minWidth, maxRight);
    }
    if (edge.includes('s')) {
        const desiredBottom = bottom + deltaY;
        const maxBottom = viewportHeight - 12;
        bottom = clampNumber(desiredBottom, top + minHeight, maxBottom);
    }
    if (edge.includes('w')) {
        const desiredLeft = left + deltaX;
        const minLeft = 12;
        left = clampNumber(desiredLeft, minLeft, right - minWidth);
    }
    if (edge.includes('n')) {
        const desiredTop = top + deltaY;
        const minTop = MAC_STAGE_MARGIN;
        top = clampNumber(desiredTop, minTop, bottom - minHeight);
    }

    let width = clampNumber(right - left, minWidth, maxWidth);
    let height = clampNumber(bottom - top, minHeight, maxHeight);

    if (width !== right - left) {
        if (edge.includes('w')) {
            left = right - width;
        } else {
            right = left + width;
        }
    }

    if (height !== bottom - top) {
        if (edge.includes('n')) {
            top = bottom - height;
        } else {
            bottom = top + height;
        }
    }

    const coords = clampWindowCoords(left, top, width, height, viewportWidth, viewportHeight);

    return {
        x: coords.x,
        y: coords.y,
        width,
        height,
    };
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

    const sanitized = {
        id: typeof entry.id === 'string' ? entry.id : `${entry.type}-${Math.random().toString(36).slice(2, 8)}`,
        type: entry.type ?? WINDOW_TYPES.SCRATCHPAD,
        title: typeof entry.title === 'string' ? entry.title : typeToTitle(entry.type),
        width,
        height,
        x: coords.x,
        y: coords.y,
        z: typeof entry.z === 'number' ? entry.z : 21,
        minimized: Boolean(entry.minimized),
        minimizedByUser: Boolean(entry.minimizedByUser),
        isZoomed: Boolean(entry.isZoomed),
        snapshot,
        allowClose: entry.allowClose !== false,
        allowMinimize: entry.allowMinimize !== false,
        allowZoom: entry.allowZoom !== false,
        isMain: Boolean(entry.isMain),
        isAppWindow: Boolean(entry.isAppWindow),
        appRoutePath: typeof entry.appRoutePath === 'string' ? entry.appRoutePath : null,
        appRouteKey: typeof entry.appRouteKey === 'string' ? entry.appRouteKey : null,
        appIconKey: typeof entry.appIconKey === 'string' ? entry.appIconKey : null,
        appAccent: typeof entry.appAccent === 'string' ? entry.appAccent : null,
        routeLocation: parseStoredLocation(entry.routeLocation, entry.appRoutePath),
    };

    if (sanitized.isAppWindow && sanitized.appIconKey) {
        sanitized.iconComponent = iconForAppKey(sanitized.appIconKey);
    }

    if (sanitized.isZoomed) {
        return expandWindowToViewport(sanitized, viewportWidth, viewportHeight);
    }

    return sanitized;
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
                      minimizedByUser: Boolean(win.minimizedByUser),
                  }
                : {
                      ...clampWindowToViewport(win, viewportWidth, viewportHeight),
                      minimizedByUser: Boolean(win.minimizedByUser),
                  }
        );
    }
    return [
        createMainWindow(windowTitle, viewportWidth, viewportHeight),
        ...windows.map((win) => ({
            ...clampWindowToViewport(win, viewportWidth, viewportHeight),
            minimizedByUser: Boolean(win.minimizedByUser),
        })),
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
            minimizedByUser: false,
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
            minimizedByUser: false,
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
            minimizedByUser: false,
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
            minimizedByUser: false,
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

const SNAP_THRESHOLD = 84;
const SNAP_CENTER_THRESHOLD = 140;
const SNAP_GAP = 24;

const SNAP_LABELS = {
    full: 'Fill Stage',
    left: 'Left Split',
    right: 'Right Split',
    top: 'Top Half',
    bottom: 'Bottom Half',
    tl: 'Top Left',
    tr: 'Top Right',
    bl: 'Bottom Left',
    br: 'Bottom Right',
    center: 'Centered',
};

function labelForSnapTarget(target) {
    return SNAP_LABELS[target] ?? 'Snap Layout';
}

function computeStageArea(viewportWidth, viewportHeight) {
    const horizontalMargin = 24;
    const topMargin = MAC_STAGE_MARGIN;
    const bottomMargin = 24;
    const width = Math.max(360, viewportWidth - horizontalMargin * 2);
    const height = Math.max(320, viewportHeight - topMargin - bottomMargin);
    return {
        x: horizontalMargin,
        y: topMargin,
        width,
        height,
    };
}

function getSnapRect(target, viewportWidth, viewportHeight) {
    const stage = computeStageArea(viewportWidth, viewportHeight);
    const halfWidth = Math.max(stage.width / 2 - SNAP_GAP / 2, 320);
    const halfHeight = Math.max(stage.height / 2 - SNAP_GAP / 2, 260);

    switch (target) {
        case 'full':
            return {
                x: 0,
                y: 0,
                width: viewportWidth,
                height: viewportHeight,
            };
        case 'left':
            return {
                x: stage.x,
                y: stage.y,
                width: halfWidth,
                height: stage.height,
            };
        case 'right':
            return {
                x: stage.x + stage.width - halfWidth,
                y: stage.y,
                width: halfWidth,
                height: stage.height,
            };
        case 'top':
            return {
                x: stage.x,
                y: stage.y,
                width: stage.width,
                height: halfHeight,
            };
        case 'bottom':
            return {
                x: stage.x,
                y: stage.y + stage.height - halfHeight,
                width: stage.width,
                height: halfHeight,
            };
        case 'tl':
            return {
                x: stage.x,
                y: stage.y,
                width: halfWidth,
                height: halfHeight,
            };
        case 'tr':
            return {
                x: stage.x + stage.width - halfWidth,
                y: stage.y,
                width: halfWidth,
                height: halfHeight,
            };
        case 'bl':
            return {
                x: stage.x,
                y: stage.y + stage.height - halfHeight,
                width: halfWidth,
                height: halfHeight,
            };
        case 'br':
            return {
                x: stage.x + stage.width - halfWidth,
                y: stage.y + stage.height - halfHeight,
                width: halfWidth,
                height: halfHeight,
            };
        case 'center': {
            const width = Math.max(Math.min(stage.width * 0.7, 980), 420);
            const height = Math.max(Math.min(stage.height * 0.72, 680), 320);
            return {
                x: stage.x + (stage.width - width) / 2,
                y: stage.y + (stage.height - height) / 2,
                width,
                height,
            };
        }
        default:
            return null;
    }
}

function computeSnapCandidate({ pointerX, pointerY, viewportWidth, viewportHeight, disable }) {
    if (disable) return null;
    const stage = computeStageArea(viewportWidth, viewportHeight);
    if (
        pointerX < stage.x - SNAP_THRESHOLD ||
        pointerX > stage.x + stage.width + SNAP_THRESHOLD ||
        pointerY < stage.y - SNAP_THRESHOLD ||
        pointerY > stage.y + stage.height + SNAP_THRESHOLD
    ) {
        return null;
    }

    const distLeft = pointerX - stage.x;
    const distRight = stage.x + stage.width - pointerX;
    const distTop = pointerY - stage.y;
    const distBottom = stage.y + stage.height - pointerY;

    let target = null;

    if (distLeft < SNAP_THRESHOLD && distTop < SNAP_THRESHOLD) {
        target = 'tl';
    } else if (distRight < SNAP_THRESHOLD && distTop < SNAP_THRESHOLD) {
        target = 'tr';
    } else if (distLeft < SNAP_THRESHOLD && distBottom < SNAP_THRESHOLD) {
        target = 'bl';
    } else if (distRight < SNAP_THRESHOLD && distBottom < SNAP_THRESHOLD) {
        target = 'br';
    } else if (distLeft < SNAP_THRESHOLD) {
        target = 'left';
    } else if (distRight < SNAP_THRESHOLD) {
        target = 'right';
    } else if (distTop < SNAP_THRESHOLD) {
        const centerX = stage.x + stage.width / 2;
        const centerRange = Math.max(stage.width * 0.24, 220);
        target = Math.abs(pointerX - centerX) < centerRange ? 'full' : 'top';
    } else if (distBottom < SNAP_THRESHOLD) {
        target = 'bottom';
    } else {
        const centerX = stage.x + stage.width / 2;
        const centerY = stage.y + stage.height / 2;
        const withinCenterX = Math.abs(pointerX - centerX) < SNAP_CENTER_THRESHOLD;
        const withinCenterY = Math.abs(pointerY - centerY) < SNAP_CENTER_THRESHOLD;
        if (withinCenterX && withinCenterY) {
            target = 'center';
        }
    }

    if (!target) return null;
    const rect = getSnapRect(target, viewportWidth, viewportHeight);
    if (!rect) return null;
    return { target, rect };
}

function rectsEqual(a, b, tolerance = 0.5) {
    return (
        Math.abs(a.x - b.x) <= tolerance &&
        Math.abs(a.y - b.y) <= tolerance &&
        Math.abs(a.width - b.width) <= tolerance &&
        Math.abs(a.height - b.height) <= tolerance
    );
}

function reconcileSnapPreview(previous, candidate, id) {
    if (!candidate) {
        if (previous && previous.id === id) {
            return null;
        }
        return previous;
    }
    const next = { ...candidate, id };
    if (previous && previous.id === id && previous.target === next.target && rectsEqual(previous.rect, next.rect)) {
        return previous;
    }
    return next;
}

function applySnapLayout(win, target, viewportWidth, viewportHeight) {
    const rect = getSnapRect(target, viewportWidth, viewportHeight);
    if (!rect) return win;
    if (target === 'full') {
        const snapshot = {
            x: win.x,
            y: win.y,
            width: win.width,
            height: win.height,
        };
        return expandWindowToViewport(
            {
                ...win,
                snapshot,
            },
            viewportWidth,
            viewportHeight
        );
    }

    const width = clampNumber(rect.width, 320, Math.max(viewportWidth - 48, 360));
    const height = clampNumber(rect.height, 260, Math.max(viewportHeight - 120, 260));
    const coords = clampWindowCoords(rect.x, rect.y, width, height, viewportWidth, viewportHeight);

    return {
        ...win,
        x: coords.x,
        y: coords.y,
        width,
        height,
        isZoomed: false,
        snapshot: null,
    };
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
        minimizedByUser: false,
        isZoomed: false,
        snapshot: null,
        allowClose: false,
        allowMinimize: true,
        allowZoom: true,
        isMain: true,
    };
}

function expandWindowToViewport(win, viewportWidth, viewportHeight) {
    return {
        ...win,
        x: 0,
        y: 0,
        width: viewportWidth,
        height: viewportHeight,
        isZoomed: true,
    };
}

function clampWindowToViewport(win, viewportWidth, viewportHeight) {
    if (win.isZoomed) {
        return expandWindowToViewport(win, viewportWidth, viewportHeight);
    }
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
        minimizedByUser: Boolean(win.minimizedByUser),
        isZoomed: win.isZoomed,
        snapshot: win.snapshot,
        allowClose: win.allowClose,
        allowMinimize: win.allowMinimize,
        allowZoom: win.allowZoom,
        isMain: win.isMain,
        isAppWindow: Boolean(win.isAppWindow),
        appRoutePath: win.appRoutePath || null,
        appRouteKey: win.appRouteKey || null,
        appIconKey: win.appIconKey || null,
        appAccent: win.appAccent || null,
        routeLocation: serializeRouteLocation(win.routeLocation, win.appRoutePath),
    };
}

function parseFiniteNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
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
