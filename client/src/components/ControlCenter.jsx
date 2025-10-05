import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tooltip } from 'flowbite-react';
import { useDispatch, useSelector } from 'react-redux';
import {
    HiOutlineSquares2X2,
    HiMagnifyingGlass,
    HiWifi,
    HiSignal,
    HiSpeakerWave,
    HiOutlineSun,
    HiOutlineMoon,
    HiOutlineComputerDesktop,
    HiOutlinePaperAirplane,
    HiOutlineDevicePhoneMobile,
    HiOutlineBellAlert,
    HiOutlineBolt,
} from 'react-icons/hi2';
import { toggleTheme, setThemePreference } from '../redux/theme/themeSlice';

const focusModes = [
    { id: 'off', label: 'Off' },
    { id: 'deep', label: 'Deep Work' },
    { id: 'break', label: 'Break Timer' },
];

function QuickToggle({ icon: Icon, label, active, detail, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                active
                    ? 'border-transparent bg-gradient-to-br from-blue-500 via-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30'
                    : 'border-white/60 bg-white/80 text-gray-700 backdrop-blur-sm hover:bg-white dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200'
            }`}
        >
            <span
                className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg transition-colors ${
                    active
                        ? 'bg-white/25 text-white'
                        : 'bg-white text-blue-500 shadow-sm dark:bg-gray-800 dark:text-blue-400'
                }`}
            >
                <Icon className="h-5 w-5" />
            </span>
            <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className={`text-xs font-medium ${active ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                    {detail}
                </p>
            </div>
        </button>
    );
}

function ModuleCard({ icon: Icon, title, detail, action, children }) {
    return (
        <div className="rounded-3xl border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-900/80">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        <Icon className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</p>
                        {detail ? <p className="text-xs text-gray-500 dark:text-gray-400">{detail}</p> : null}
                    </div>
                </div>
                {action}
            </div>
            <div className="mt-4">{children}</div>
        </div>
    );
}

function SliderControl({ value, onChange, min = 0, max = 100, accent = 'accent-blue-500', ariaLabel }) {
    return (
        <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            aria-label={ariaLabel}
            className={`h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:bg-gray-700 ${accent}`}
        />
    );
}

function SectionTitle({ children }) {
    return <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-500">{children}</p>;
}

export default function ControlCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [wifiEnabled, setWifiEnabled] = useState(true);
    const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
    const [focusMode, setFocusMode] = useState('off');
    const [doNotDisturb, setDoNotDisturb] = useState(false);
    const [screenMirroring, setScreenMirroring] = useState(false);
    const [nightShift, setNightShift] = useState(false);
    const [brightness, setBrightness] = useState(80);
    const [volume, setVolume] = useState(60);
    const [airdropEnabled, setAirdropEnabled] = useState(true);
    const [hotspotEnabled, setHotspotEnabled] = useState(false);
    const [energySaverEnabled, setEnergySaverEnabled] = useState(false);
    const [currentMoment, setCurrentMoment] = useState(() => new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState([
        {
            id: 'lab-monitor',
            title: 'Lab Monitor',
            message: 'Sample batch #42 is ready for review.',
            time: '2m ago',
            read: false,
            snoozedUntil: null,
        },
        {
            id: 'safety-update',
            title: 'Safety Update',
            message: 'New PPE protocol acknowledged by your team.',
            time: '12m ago',
            read: false,
            snoozedUntil: null,
        },
        {
            id: 'shipment',
            title: 'Shipment Incoming',
            message: 'Cryogenic storage replenishment arrives tomorrow 09:00.',
            time: '1h ago',
            read: true,
            snoozedUntil: null,
        },
    ]);

    const panelRef = useRef(null);
    const triggerRef = useRef(null);
    const energySaverSnapshotRef = useRef(null);
    const searchInputRef = useRef(null);

    const dispatch = useDispatch();
    const { theme, preference } = useSelector((state) => state.theme);
    const isDarkMode = theme === 'dark';

    const cycleThemePreference = () => {
        if (preference === 'light') return dispatch(setThemePreference('dark'));
        if (preference === 'dark') return dispatch(setThemePreference('system'));
        return dispatch(setThemePreference('light'));
    };

    const focusSummary = useMemo(() => {
        switch (focusMode) {
            case 'deep':
                return doNotDisturb ? 'Deep Work • DND on' : 'Deep Work preset';
            case 'break':
                return 'Break Timer • Relaxed settings';
            default:
                return doNotDisturb ? 'Manual • DND on' : 'Manual controls';
        }
    }, [focusMode, doNotDisturb]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const handleClickOutside = (event) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    useEffect(() => {
        const interval = setInterval(() => setCurrentMoment(new Date()), 60_000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleGlobalShortcut = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setIsOpen(true);
                requestAnimationFrame(() => {
                    searchInputRef.current?.focus();
                });
            }
        };

        window.addEventListener('keydown', handleGlobalShortcut);
        return () => window.removeEventListener('keydown', handleGlobalShortcut);
    }, []);

    const handleFocusSelection = (modeId) => {
        setFocusMode(modeId);
        const presets = {
            off: { brightness: 80, volume: 60, doNotDisturb: false },
            deep: { brightness: 65, volume: 35, doNotDisturb: true },
            break: { brightness: 95, volume: 75, doNotDisturb: false },
        };
        const preset = presets[modeId];
        if (preset) {
            setBrightness(preset.brightness);
            setVolume(preset.volume);
            setDoNotDisturb(preset.doNotDisturb);
        }
    };

    const handleReset = useCallback(() => {
        setWifiEnabled(true);
        setBluetoothEnabled(false);
        setFocusMode('off');
        setDoNotDisturb(false);
        setScreenMirroring(false);
        setNightShift(false);
        setBrightness(80);
        setVolume(60);
        setAirdropEnabled(true);
        setHotspotEnabled(false);
        setEnergySaverEnabled(false);
        energySaverSnapshotRef.current = null;
    }, []);

    const handleEnergySaverToggle = useCallback(() => {
        setEnergySaverEnabled((previous) => {
            const next = !previous;
            if (next) {
                energySaverSnapshotRef.current = { brightness, nightShift };
                setNightShift(true);
                setBrightness((value) => Math.min(value, 60));
            } else if (energySaverSnapshotRef.current) {
                setBrightness(energySaverSnapshotRef.current.brightness);
                setNightShift(energySaverSnapshotRef.current.nightShift);
                energySaverSnapshotRef.current = null;
            }
            return next;
        });
    }, [brightness, nightShift]);

    const unreadNotifications = useMemo(
        () => notifications.filter((notification) => !notification.read).length,
        [notifications],
    );

    const notificationsPreview = useMemo(() => notifications.slice(0, 3), [notifications]);

    const handleNotificationAction = useCallback((notificationId, action) => {
        setNotifications((previous) =>
            previous
                .map((notification) => {
                    if (notification.id !== notificationId) {
                        return notification;
                    }

                    switch (action) {
                        case 'read':
                            return { ...notification, read: true, snoozedUntil: null };
                        case 'snooze':
                            return { ...notification, read: true, snoozedUntil: '1 hr' };
                        case 'dismiss':
                            return { ...notification, dismissed: true };
                        default:
                            return notification;
                    }
                })
                .filter((notification) => !notification.dismissed),
        );
    }, []);

    const handleClearNotifications = useCallback(() => {
        setNotifications((previous) =>
            previous.map((notification) => ({ ...notification, read: true, snoozedUntil: null })),
        );
    }, []);

    const searchItems = useMemo(
        () => [
            {
                id: 'wifi-toggle',
                label: wifiEnabled ? 'Turn Wi-Fi off' : 'Turn Wi-Fi on',
                description: wifiEnabled ? 'Disable connection to ScientistNet' : 'Enable connection to ScientistNet',
                keywords: ['wifi', 'wireless', 'network'],
                icon: HiWifi,
                action: () => setWifiEnabled((prev) => !prev),
            },
            {
                id: 'bluetooth-toggle',
                label: bluetoothEnabled ? 'Turn Bluetooth off' : 'Turn Bluetooth on',
                description: bluetoothEnabled ? 'Stop being discoverable' : 'Make device discoverable',
                keywords: ['bluetooth', 'signal'],
                icon: HiSignal,
                action: () => setBluetoothEnabled((prev) => !prev),
            },
            {
                id: 'airdrop-toggle',
                label: airdropEnabled ? 'Disable AirDrop' : 'Enable AirDrop',
                description: airdropEnabled ? 'Stop receiving nearby files' : 'Allow contacts to share files',
                keywords: ['airdrop', 'files', 'share'],
                icon: HiOutlinePaperAirplane,
                action: () => setAirdropEnabled((prev) => !prev),
            },
            {
                id: 'hotspot-toggle',
                label: hotspotEnabled ? 'Disable Hotspot' : 'Enable Hotspot',
                description: hotspotEnabled ? 'Stop sharing your connection' : 'Share your connection',
                keywords: ['hotspot', 'tethering'],
                icon: HiOutlineDevicePhoneMobile,
                action: () => setHotspotEnabled((prev) => !prev),
            },
            {
                id: 'appearance-toggle',
                label:
                    preference === 'system'
                        ? 'Appearance • Auto (System)'
                        : isDarkMode
                        ? 'Appearance • Dark'
                        : 'Appearance • Light',
                description:
                    preference === 'system'
                        ? 'Follow OS preference'
                        : isDarkMode
                        ? 'Dark theme enabled'
                        : 'Light theme enabled',
                keywords: ['appearance', 'theme', 'dark mode', 'light mode', 'system'],
                icon: preference === 'system' ? HiOutlineComputerDesktop : isDarkMode ? HiOutlineMoon : HiOutlineSun,
                action: cycleThemePreference,
            },
            {
                id: 'focus-dnd',
                label: doNotDisturb ? 'Disable Do Not Disturb' : 'Enable Do Not Disturb',
                description: 'Quickly toggle focus notifications',
                keywords: ['focus', 'dnd', 'notifications'],
                icon: HiOutlineBellAlert,
                action: () => setDoNotDisturb((prev) => !prev),
            },
            {
                id: 'focus-mode-deep',
                label: 'Focus • Deep Work',
                description: 'Preset brightness, volume, and DND for deep work',
                keywords: ['focus', 'deep work'],
                icon: HiOutlineBolt,
                action: () => handleFocusSelection('deep'),
            },
            {
                id: 'focus-mode-break',
                label: 'Focus • Break Timer',
                description: 'Preset settings for downtime breaks',
                keywords: ['focus', 'break'],
                icon: HiSpeakerWave,
                action: () => handleFocusSelection('break'),
            },
            {
                id: 'focus-mode-off',
                label: 'Focus • Manual',
                description: 'Return to manual focus controls',
                keywords: ['focus', 'manual', 'off'],
                icon: HiOutlineSquares2X2,
                action: () => handleFocusSelection('off'),
            },
            {
                id: 'night-shift',
                label: nightShift ? 'Disable Night Shift' : 'Enable Night Shift',
                description: 'Adjust display warmth for evening viewing',
                keywords: ['night shift', 'display', 'warmth'],
                icon: HiOutlineSun,
                action: () => setNightShift((prev) => !prev),
            },
            {
                id: 'energy-saver',
                label: energySaverEnabled ? 'Disable Energy Saver' : 'Enable Energy Saver',
                description: 'Optimise battery life by reducing brightness',
                keywords: ['energy saver', 'battery'],
                icon: HiOutlineBolt,
                action: handleEnergySaverToggle,
            },
            {
                id: 'mute-toggle',
                label: volume === 0 ? 'Unmute alerts' : 'Mute alerts',
                description: 'Quickly toggle alert sounds',
                keywords: ['mute', 'volume', 'sound'],
                icon: HiSpeakerWave,
                action: () => setVolume((value) => (value === 0 ? 45 : 0)),
            },
            {
                id: 'reset-panel',
                label: 'Reset Control Center',
                description: 'Restore default control settings',
                keywords: ['reset', 'defaults'],
                icon: HiOutlineSquares2X2,
                action: handleReset,
            },
            {
                id: 'notification-clear',
                label: 'Clear Notifications',
                description: 'Mark all notifications as read',
                keywords: ['notifications', 'clear'],
                icon: HiOutlineBellAlert,
                action: handleClearNotifications,
            },
        ],
        [
            wifiEnabled,
            bluetoothEnabled,
            airdropEnabled,
            hotspotEnabled,
            isDarkMode,
            doNotDisturb,
            nightShift,
            energySaverEnabled,
            volume,
            dispatch,
            handleFocusSelection,
            handleEnergySaverToggle,
            handleReset,
            handleClearNotifications,
        ],
    );

    const filteredSearchResults = useMemo(() => {
        if (!searchQuery.trim()) {
            return [];
        }

        const normalizedQuery = searchQuery.trim().toLowerCase();
        return searchItems.filter((item) => {
            if (item.label.toLowerCase().includes(normalizedQuery)) {
                return true;
            }

            return item.keywords?.some((keyword) => keyword.toLowerCase().includes(normalizedQuery));
        });
    }, [searchItems, searchQuery]);

    const handleSearchSelect = (item) => {
        item.action?.();
        setSearchQuery('');
    };

    return (
        <div className="relative">
            <Tooltip content="Control Center">
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="flex h-10 w-12 items-center justify-center rounded-full bg-white/70 text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:bg-gray-800/70 dark:text-gray-100"
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    aria-controls="control-center-panel"
                >
                    <HiOutlineSquares2X2 className="h-5 w-5" />
                </button>
            </Tooltip>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        id="control-center-panel"
                        role="dialog"
                        aria-modal="true"
                        ref={panelRef}
                        initial={{ opacity: 0, y: -12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute right-0 z-50 mt-3 w-[22rem] max-h-[34rem] overflow-y-auto rounded-[28px] border border-white/60 bg-white/80 p-5 text-sm shadow-2xl backdrop-blur-2xl dark:border-gray-700/60 dark:bg-gray-900/90"
                    >
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-semibold text-gray-700 dark:text-gray-200">Control Center</span>
                            <span>{currentMoment.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className="mt-3">
                            <label htmlFor="control-center-search" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-500">
                                Search
                            </label>
                            <div className="relative mt-2">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                                    <HiMagnifyingGlass className="h-4 w-4" />
                                </span>
                                <input
                                    id="control-center-search"
                                    ref={searchInputRef}
                                    type="search"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && filteredSearchResults.length > 0) {
                                            event.preventDefault();
                                            handleSearchSelect(filteredSearchResults[0]);
                                        }
                                    }}
                                    placeholder="Search controls"
                                    className="w-full rounded-2xl border border-white/60 bg-white/80 py-2 pl-11 pr-16 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-100 dark:placeholder:text-gray-500"
                                />
                                <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                                    <kbd className="font-sans">⌘</kbd>
                                    <span>K</span>
                                </span>
                            </div>
                            {filteredSearchResults.length > 0 && (
                                <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-white/60 bg-white/90 p-2 text-sm shadow-sm dark:border-gray-700/60 dark:bg-gray-900/90">
                                    <ul className="space-y-1">
                                        {filteredSearchResults.map((item) => {
                                            const ItemIcon = item.icon ?? HiOutlineSquares2X2;
                                            return (
                                                <li key={item.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSearchSelect(item)}
                                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-gray-700 transition hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:text-gray-200 dark:hover:bg-gray-800/80"
                                                    >
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                                            <ItemIcon className="h-4 w-4" />
                                                        </span>
                                                        <span>
                                                            <p className="text-xs font-semibold">{item.label}</p>
                                                            {item.description ? (
                                                                <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.description}</p>
                                                            ) : null}
                                                        </span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <QuickToggle
                                icon={HiWifi}
                                label="Wi-Fi"
                                active={wifiEnabled}
                                detail={wifiEnabled ? 'ScientistNet' : 'Off'}
                                onClick={() => setWifiEnabled((prev) => !prev)}
                            />
                            <QuickToggle
                                icon={HiSignal}
                                label="Bluetooth"
                                active={bluetoothEnabled}
                                detail={bluetoothEnabled ? 'Discoverable' : 'Off'}
                                onClick={() => setBluetoothEnabled((prev) => !prev)}
                            />
                            <QuickToggle
                                icon={HiOutlinePaperAirplane}
                                label="AirDrop"
                                active={airdropEnabled}
                                detail={airdropEnabled ? 'Contacts Only' : 'Receiving Off'}
                                onClick={() => setAirdropEnabled((prev) => !prev)}
                            />
                            <QuickToggle
                                icon={HiOutlineDevicePhoneMobile}
                                label="Hotspot"
                                active={hotspotEnabled}
                                detail={hotspotEnabled ? 'Sharing Connection' : 'Off'}
                                onClick={() => setHotspotEnabled((prev) => !prev)}
                            />
                            <QuickToggle
                                icon={preference === 'system' ? HiOutlineComputerDesktop : isDarkMode ? HiOutlineMoon : HiOutlineSun}
                                label="Appearance"
                                active={isDarkMode}
                                detail={preference === 'system' ? 'Auto (System)' : isDarkMode ? 'Dark' : 'Light'}
                                onClick={cycleThemePreference}
                            />
                        </div>

                        <div className="mt-5 space-y-4">
                            <div className="rounded-3xl border border-white/60 bg-white/85 p-4 backdrop-blur-xl shadow-sm dark:border-gray-700/60 dark:bg-gray-900/80">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Focus</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{focusSummary}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDoNotDisturb((prev) => !prev)}
                                        className={`flex h-9 w-16 items-center rounded-full border px-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                                            doNotDisturb
                                                ? 'border-transparent bg-gradient-to-r from-blue-500 to-cyan-400'
                                                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                        }`}
                                        aria-pressed={doNotDisturb}
                                    >
                                        <span
                                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-transform ${
                                                doNotDisturb
                                                    ? 'translate-x-7 bg-white text-blue-600'
                                                    : 'translate-x-0 bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-300'
                                            }`}
                                        >
                                            {doNotDisturb ? 'On' : 'Off'}
                                        </span>
                                    </button>
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-2">
                                    {focusModes.map((mode) => (
                                        <button
                                            key={mode.id}
                                            type="button"
                                            onClick={() => handleFocusSelection(mode.id)}
                                            className={`rounded-2xl px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                                                focusMode === mode.id
                                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-sm'
                                                    : 'bg-white/70 text-gray-600 hover:bg-white dark:bg-gray-800/70 dark:text-gray-300'
                                            }`}
                                            aria-pressed={focusMode === mode.id}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <SectionTitle>Display & Sound</SectionTitle>
                                <ModuleCard
                                    icon={HiOutlineSun}
                                    title="Display"
                                    detail={nightShift ? 'Night Shift on' : 'Night Shift off'}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2 dark:bg-gray-800/80">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-400 text-white">
                                                <HiOutlineSun className="h-5 w-5" />
                                            </span>
                                            <SliderControl value={brightness} onChange={setBrightness} ariaLabel="Brightness" />
                                            <span className="w-8 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">{brightness}%</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <button
                                                type="button"
                                                onClick={() => setNightShift((prev) => !prev)}
                                                className={`rounded-full px-3 py-1 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                                                    nightShift
                                                        ? 'bg-blue-500/10 text-blue-500'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                                }`}
                                            >
                                                Night Shift
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEnergySaverEnabled((prev) => !prev)}
                                                className={`rounded-full px-3 py-1 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                                                    energySaverEnabled
                                                        ? 'bg-emerald-500/10 text-emerald-500'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                                }`}
                                            >
                                                Energy Saver
                                            </button>
                                        </div>
                                    </div>
                                </ModuleCard>

                                <ModuleCard icon={HiSpeakerWave} title="Sound" detail={volume <= 5 ? 'Muted' : `${volume}%`}>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2 dark:bg-gray-800/80">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
                                                <HiSpeakerWave className="h-5 w-5" />
                                            </span>
                                            <SliderControl value={volume} onChange={setVolume} ariaLabel="Volume" />
                                            <span className="w-8 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">{volume}%</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setVolume((value) => (value === 0 ? 45 : 0))}
                                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-white dark:border-gray-700/60 dark:bg-gray-800/80 dark:text-gray-300"
                                        >
                                            {volume === 0 ? 'Unmute' : 'Mute'} alerts
                                        </button>
                                    </div>
                                </ModuleCard>
                                <ModuleCard
                                    icon={HiOutlineBellAlert}
                                    title="Notifications"
                                    detail={
                                        unreadNotifications
                                            ? `${unreadNotifications} pending`
                                            : 'All caught up'
                                    }
                                    action={
                                        <button
                                            type="button"
                                            onClick={handleClearNotifications}
                                            disabled={unreadNotifications === 0}
                                            className={`rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                                                unreadNotifications === 0
                                                    ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                                                    : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20'
                                            }`}
                                        >
                                            Clear
                                        </button>
                                    }
                                >
                                    {notifications.length > 0 ? (
                                        <ul className="space-y-2">
                                            {notificationsPreview.map((notification) => {
                                                const isUnread = !notification.read;
                                                return (
                                                    <li key={notification.id}>
                                                        <div
                                                            className={`rounded-2xl border px-3 py-3 transition ${
                                                                isUnread
                                                                    ? 'border-blue-200 bg-blue-50 text-blue-900 shadow-sm dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-50'
                                                                    : 'border-white/60 bg-white/70 text-gray-700 dark:border-gray-700/60 dark:bg-gray-800/70 dark:text-gray-200'
                                                            }`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="space-y-1">
                                                                    <p
                                                                        className={`text-sm font-semibold ${
                                                                            isUnread
                                                                                ? 'text-blue-900 dark:text-blue-50'
                                                                                : 'text-gray-700 dark:text-gray-100'
                                                                        }`}
                                                                    >
                                                                        {notification.title}
                                                                    </p>
                                                                    <p
                                                                        className={`text-xs ${
                                                                            isUnread
                                                                                ? 'text-blue-800/80 dark:text-blue-100/80'
                                                                                : 'text-gray-500 dark:text-gray-400'
                                                                        }`}
                                                                    >
                                                                        {notification.message}
                                                                    </p>
                                                                </div>
                                                                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                                                    {notification.time}
                                                                </span>
                                                            </div>
                                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide">
                                                                <span
                                                                    className={`rounded-full px-2 py-1 ${
                                                                        notification.snoozedUntil
                                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
                                                                            : isUnread
                                                                                ? 'bg-blue-500 text-white dark:bg-blue-500 dark:text-white'
                                                                                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                                    }`}
                                                                >
                                                                    {notification.snoozedUntil
                                                                        ? `Snoozed • ${notification.snoozedUntil}`
                                                                        : isUnread
                                                                            ? 'New alert'
                                                                            : 'Read'}
                                                                </span>
                                                                {isUnread ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleNotificationAction(notification.id, 'read')}
                                                                            className="rounded-full border border-blue-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-600 transition hover:bg-blue-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:border-blue-400/50 dark:text-blue-200 dark:hover:bg-blue-500/20"
                                                                        >
                                                                            Mark read
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleNotificationAction(notification.id, 'snooze')}
                                                                            className="rounded-full border border-amber-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600 transition hover:bg-amber-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-amber-400/50 dark:text-amber-200 dark:hover:bg-amber-500/20"
                                                                        >
                                                                            Snooze 1 hr
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400 dark:text-gray-500">Up to date</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="rounded-2xl border border-dashed border-white/60 bg-white/60 px-4 py-6 text-center text-xs text-gray-500 dark:border-gray-700/60 dark:bg-gray-800/60 dark:text-gray-400">
                                            You're all caught up. New alerts will appear here.
                                        </p>
                                    )}
                                    {notifications.length > notificationsPreview.length ? (
                                        <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                                            Showing latest {notificationsPreview.length} of {notifications.length} notifications.
                                        </p>
                                    ) : null}
                                </ModuleCard>
                            </div>

                            <div className="space-y-3">
                                <SectionTitle>Additional</SectionTitle>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setScreenMirroring((prev) => !prev)}
                                        className={`flex flex-col gap-2 rounded-3xl border px-4 py-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                                            screenMirroring
                                                ? 'border-transparent bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                                                : 'border-white/60 bg-white/80 text-gray-700 hover:bg-white dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200'
                                        }`}
                                    >
                                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-500 shadow-sm dark:bg-gray-800 dark:text-blue-400">
                                            <HiOutlineComputerDesktop className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold">Screen Mirroring</p>
                                            <p className={`text-xs font-medium ${screenMirroring ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {screenMirroring ? 'Streaming active' : 'Connect to share'}
                                            </p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleEnergySaverToggle}
                                        className={`flex flex-col gap-2 rounded-3xl border px-4 py-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                                            energySaverEnabled
                                                ? 'border-transparent bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                                                : 'border-white/60 bg-white/80 text-gray-700 hover:bg-white dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200'
                                        }`}
                                    >
                                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow-sm dark:bg-gray-800 dark:text-emerald-400">
                                            <HiOutlineBolt className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold">Energy Saver</p>
                                            <p className={`text-xs font-medium ${energySaverEnabled ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {energySaverEnabled ? 'Extending battery' : 'Performance mode'}
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-3xl border border-white/60 bg-white/80 px-4 py-3 text-xs text-gray-500 backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-400">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                    <HiOutlineBellAlert className="h-5 w-5" />
                                    {doNotDisturb
                                        ? 'Notifications silenced'
                                        : unreadNotifications > 0
                                            ? `${unreadNotifications} notification${unreadNotifications > 1 ? 's' : ''} pending`
                                            : 'Alerts enabled'}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="rounded-full bg-gray-900/80 px-3 py-1 text-xs font-semibold text-white transition hover:bg-black dark:bg-gray-100 dark:text-gray-900"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
