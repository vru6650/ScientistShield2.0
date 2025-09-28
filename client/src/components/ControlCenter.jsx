import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tooltip } from 'flowbite-react';
import {
    HiOutlineSquares2X2,
    HiWifi,
    HiSignal,
    HiOutlineMoon,
    HiSpeakerWave,
    HiOutlineSun,
    HiOutlineComputerDesktop,
    HiOutlinePaperAirplane,
    HiOutlineDevicePhoneMobile,
    HiOutlineBolt,
    HiOutlineCloud,
    HiOutlineGlobeAlt,
    HiOutlineSparkles,
    HiChevronDown,
} from 'react-icons/hi2';
import { PiMonitorLight } from 'react-icons/pi';
import ThemeToggle from './ThemeToggle.jsx';

const focusModes = [
    { id: 'off', label: 'Off' },
    { id: 'deep', label: 'Deep Work' },
    { id: 'break', label: 'Break Timer' },
];

const focusPresets = {
    off: {
        brightness: 80,
        volume: 60,
        doNotDisturb: false,
    },
    deep: {
        brightness: 65,
        volume: 35,
        doNotDisturb: true,
    },
    break: {
        brightness: 95,
        volume: 75,
        doNotDisturb: false,
    },
};

const ambientScenes = [
    {
        id: 'rain',
        label: 'Calm Rain',
        description: 'Muted ambience for deep work',
        icon: HiOutlineCloud,
        volume: 45,
    },
    {
        id: 'forest',
        label: 'Forest Air',
        description: 'Balanced nature textures',
        icon: HiOutlineGlobeAlt,
        volume: 55,
    },
    {
        id: 'cafe',
        label: 'Cafe Focus',
        description: 'Gentle bustle for energy',
        icon: HiOutlineSparkles,
        volume: 65,
    },
];

function StatusPill({ icon: Icon, label, description }) {
    return (
        <div className="flex items-center gap-2 rounded-full border border-gray-200/70 bg-white/80 px-3 py-1.5 text-xs text-gray-600 shadow-inner dark:border-gray-700/70 dark:bg-gray-900/60 dark:text-gray-300">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium">{label}</span>
            {description ? <span className="text-gray-400 dark:text-gray-500">• {description}</span> : null}
        </div>
    );
}

function ControlToggle({ icon: Icon, label, detail, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col gap-2 rounded-2xl border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                active
                    ? 'border-transparent bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'border-gray-200/70 bg-white/80 text-gray-700 hover:bg-white dark:border-gray-700/70 dark:bg-gray-900/70 dark:text-gray-200'
            }`}
        >
            <span
                className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                    active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
            >
                <Icon className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
                <span className="text-sm font-semibold">{label}</span>
                <span className={`text-xs ${active ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{detail}</span>
            </div>
        </button>
    );
}

function MiniToggleButton({ icon: Icon, label, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                active
                    ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/40'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
        >
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {label}
        </button>
    );
}

function FocusCard({
    focusMode,
    focusModes,
    focusSummary,
    doNotDisturb,
    onToggle,
    onSelect,
    isMenuOpen,
    onMenuToggle,
}) {
    return (
        <div
            className={`relative rounded-3xl border p-4 transition ${
                doNotDisturb
                    ? 'border-transparent bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'border-gray-200/70 bg-white/90 text-gray-700 dark:border-gray-700/70 dark:bg-gray-900/70 dark:text-gray-200'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <button
                    type="button"
                    onClick={onToggle}
                    className="flex flex-1 flex-col items-start gap-1 text-left focus:outline-none"
                >
                    <span
                        className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                            doNotDisturb ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                    >
                        <HiOutlineMoon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold">Focus</span>
                    <span className={`text-xs ${doNotDisturb ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                        {doNotDisturb ? focusSummary : 'Off'}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={onMenuToggle}
                    className={`rounded-full p-1 transition ${
                        doNotDisturb
                            ? 'bg-white/20 text-white hover:bg-white/30'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                    aria-label="Choose focus"
                >
                    <HiChevronDown className={`h-4 w-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className={`mt-4 overflow-hidden rounded-2xl border ${
                            doNotDisturb
                                ? 'border-white/20 bg-white/80 text-gray-700'
                                : 'border-gray-200/70 bg-white/90 text-gray-600 dark:border-gray-700/70 dark:bg-gray-900/80 dark:text-gray-200'
                        }`}
                    >
                        <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                            {focusModes.map((mode) => (
                                <li key={mode.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(mode.id)}
                                        className={`flex w-full items-center justify-between px-3 py-2 text-left transition ${
                                            focusMode === mode.id
                                                ? 'text-cyan-600 dark:text-cyan-300'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800/70'
                                        }`}
                                    >
                                        <span>{mode.label}</span>
                                        {focusMode === mode.id ? (
                                            <span className="text-xs font-medium uppercase">Active</span>
                                        ) : null}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function LargeActionTile({ icon: Icon, label, description, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex h-full flex-col justify-between rounded-3xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                active
                    ? 'border-transparent bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30'
                    : 'border-gray-200/70 bg-white/90 text-gray-700 hover:bg-white dark:border-gray-700/70 dark:bg-gray-900/70 dark:text-gray-200'
            }`}
        >
            <div className="flex items-center justify-between">
                <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                        active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                >
                    <Icon className="h-5 w-5" />
                </span>
                <span
                    className={`text-xs font-medium uppercase tracking-wide ${
                        active ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    }`}
                >
                    {active ? 'On' : 'Off'}
                </span>
            </div>
            <div className="mt-4">
                <p className="text-sm font-semibold">{label}</p>
                <p className={`mt-1 text-xs leading-relaxed ${active ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                    {description}
                </p>
            </div>
        </button>
    );
}

function SoundSceneButton({ icon: Icon, label, description, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col gap-1.5 rounded-2xl border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                active
                    ? 'border-transparent bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'border-gray-200/70 bg-white/80 text-gray-700 hover:bg-white dark:border-gray-700/70 dark:bg-gray-900/70 dark:text-gray-200'
            }`}
        >
            <span
                className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                    active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
            >
                <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">{label}</span>
            <span className={`text-xs leading-relaxed ${active ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                {description}
            </span>
        </button>
    );
}

function DisplayModule({
    brightness,
    onBrightnessChange,
    nightShift,
    onNightShiftToggle,
    energySaverEnabled,
    onEnergySaverToggle,
}) {
    return (
        <div className="rounded-3xl border border-gray-200/70 bg-white/90 p-4 shadow-inner dark:border-gray-700/70 dark:bg-gray-900/70">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                        <PiMonitorLight className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Display</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{brightness}% brightness</p>
                    </div>
                </div>
                <MiniToggleButton
                    icon={HiOutlineBolt}
                    label={energySaverEnabled ? 'Saver On' : 'Energy Saver'}
                    active={energySaverEnabled}
                    onClick={onEnergySaverToggle}
                />
            </div>
            <div className="mt-4">
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={brightness}
                    onChange={(event) => onBrightnessChange(Number(event.target.value))}
                    className="h-2 w-full appearance-none bg-transparent"
                    aria-label="Display brightness"
                />
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                        className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500"
                        style={{ width: `${brightness}%` }}
                    />
                </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                <MiniToggleButton
                    icon={HiOutlineSun}
                    label={nightShift ? 'Night Shift On' : 'Night Shift'}
                    active={nightShift}
                    onClick={onNightShiftToggle}
                />
                <div className="flex items-center gap-2 rounded-full border border-gray-200/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/70 dark:text-gray-300">
                    <ThemeToggle className="h-8 w-8 !bg-transparent !text-gray-600 dark:!bg-transparent dark:!text-gray-300" />
                    <span>Dark Mode</span>
                </div>
            </div>
        </div>
    );
}

function SoundModule({ volume, onVolumeChange, ambientScene, onAmbientSelect }) {
    const activeScene = ambientScenes.find((scene) => scene.id === ambientScene);

    return (
        <div className="rounded-3xl border border-gray-200/70 bg-white/90 p-4 shadow-inner dark:border-gray-700/70 dark:bg-gray-900/70">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                        <HiSpeakerWave className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Sound</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{volume}% volume</p>
                    </div>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {activeScene ? activeScene.label : 'Custom'}
                </span>
            </div>
            <div className="mt-4">
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(event) => onVolumeChange(Number(event.target.value))}
                    className="h-2 w-full appearance-none bg-transparent"
                    aria-label="System volume"
                />
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                        className="h-full bg-gradient-to-r from-sky-400 to-cyan-500"
                        style={{ width: `${volume}%` }}
                    />
                </div>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Ambient soundscapes
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
                {ambientScenes.map((scene) => (
                    <SoundSceneButton
                        key={scene.id}
                        icon={scene.icon}
                        label={scene.label}
                        description={scene.description}
                        active={ambientScene === scene.id}
                        onClick={() => onAmbientSelect(scene)}
                    />
                ))}
            </div>
        </div>
    );
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
    const [ambientScene, setAmbientScene] = useState('rain');
    const [currentMoment, setCurrentMoment] = useState(() => new Date());
    const [isFocusMenuOpen, setIsFocusMenuOpen] = useState(false);

    const panelRef = useRef(null);
    const triggerRef = useRef(null);
    const energySaverSnapshotRef = useRef(null);

    const wifiNetworkName = 'ScientistNet';
    const bluetoothDeviceName = 'Studio Buds';

    const focusSummary = useMemo(() => {
        if (!doNotDisturb) {
            return 'Off';
        }
        const activeFocus = focusModes.find((mode) => mode.id === focusMode);
        return activeFocus ? activeFocus.label : 'Custom';
    }, [focusMode, doNotDisturb]);

    const ambientSceneLabel = useMemo(() => {
        const activeScene = ambientScenes.find((scene) => scene.id === ambientScene);
        return activeScene ? activeScene.label : 'Custom ambience';
    }, [ambientScene]);

    const connectivitySummary = useMemo(() => {
        const activeConnections = [
            wifiEnabled ? 'Wi-Fi' : null,
            bluetoothEnabled ? 'Bluetooth' : null,
            airdropEnabled ? 'AirDrop' : null,
            hotspotEnabled ? 'Hotspot' : null,
        ].filter(Boolean);
        return activeConnections.length > 0 ? activeConnections.join(' · ') : 'All connections off';
    }, [wifiEnabled, bluetoothEnabled, airdropEnabled, hotspotEnabled]);

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
        const interval = setInterval(() => {
            setCurrentMoment(new Date());
        }, 60_000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setIsFocusMenuOpen(false);
        }
    }, [isOpen]);

    const handleFocusSelection = (modeId) => {
        setFocusMode(modeId);
        const preset = focusPresets[modeId];
        if (preset) {
            setBrightness(preset.brightness);
            setVolume(preset.volume);
            setDoNotDisturb(preset.doNotDisturb);
        } else {
            setDoNotDisturb(modeId !== 'off');
        }
        setIsFocusMenuOpen(false);
    };

    const handleFocusToggle = () => {
        if (doNotDisturb) {
            handleFocusSelection('off');
        } else {
            const nextMode = focusMode === 'off' ? 'deep' : focusMode;
            handleFocusSelection(nextMode);
        }
    };

    const handleBrightnessChange = (value) => {
        setBrightness(value);
    };

    const handleVolumeChange = (value) => {
        setVolume(value);
    };

    const handleEnergySaverToggle = () => {
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
    };

    const handleAmbientSceneSelection = (scene) => {
        setAmbientScene(scene.id);
        setVolume(scene.volume);
    };

    return (
        <div className="relative">
            <Tooltip content="Control Center">
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="flex h-10 w-12 items-center justify-center rounded-full bg-white/70 text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 dark:bg-gray-800/70 dark:text-gray-100"
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
                        className="absolute right-0 z-50 mt-3 w-[22rem] rounded-3xl border border-gray-200/70 bg-white/90 p-5 shadow-2xl backdrop-blur-xl dark:border-gray-700/70 dark:bg-gray-900/90"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                    Control Center
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-gray-100">
                                    {currentMoment.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {currentMoment.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <StatusPill
                                    icon={HiWifi}
                                    label={wifiEnabled ? 'Wi-Fi On' : 'Wi-Fi Off'}
                                    description={wifiEnabled ? wifiNetworkName : 'Disabled'}
                                />
                                <StatusPill
                                    icon={HiSignal}
                                    label={bluetoothEnabled ? 'Bluetooth On' : 'Bluetooth Off'}
                                    description={bluetoothEnabled ? bluetoothDeviceName : 'Disabled'}
                                />
                                <StatusPill icon={HiOutlineMoon} label="Focus" description={focusSummary} />
                            </div>
                        </div>

                        <div className="mt-5 space-y-4">
                            <div className="rounded-3xl border border-gray-200/70 bg-white/90 p-4 dark:border-gray-700/70 dark:bg-gray-900/70">
                                <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                    <span>Connectivity</span>
                                    <span className="text-[11px] normal-case text-gray-500 dark:text-gray-400">{connectivitySummary}</span>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <ControlToggle
                                        icon={HiWifi}
                                        label="Wi-Fi"
                                        detail={wifiEnabled ? wifiNetworkName : 'Off'}
                                        active={wifiEnabled}
                                        onClick={() => setWifiEnabled((prev) => !prev)}
                                    />
                                    <ControlToggle
                                        icon={HiSignal}
                                        label="Bluetooth"
                                        detail={bluetoothEnabled ? bluetoothDeviceName : 'Off'}
                                        active={bluetoothEnabled}
                                        onClick={() => setBluetoothEnabled((prev) => !prev)}
                                    />
                                    <ControlToggle
                                        icon={HiOutlinePaperAirplane}
                                        label="AirDrop"
                                        detail={airdropEnabled ? 'Contacts Only' : 'Receiving Off'}
                                        active={airdropEnabled}
                                        onClick={() => setAirdropEnabled((prev) => !prev)}
                                    />
                                    <ControlToggle
                                        icon={HiOutlineDevicePhoneMobile}
                                        label="Hotspot"
                                        detail={hotspotEnabled ? 'Sharing connection' : 'Off'}
                                        active={hotspotEnabled}
                                        onClick={() => setHotspotEnabled((prev) => !prev)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FocusCard
                                    focusMode={focusMode}
                                    focusModes={focusModes}
                                    focusSummary={focusSummary}
                                    doNotDisturb={doNotDisturb}
                                    onToggle={handleFocusToggle}
                                    onSelect={handleFocusSelection}
                                    isMenuOpen={isFocusMenuOpen}
                                    onMenuToggle={() => setIsFocusMenuOpen((prev) => !prev)}
                                />
                                <LargeActionTile
                                    icon={HiOutlineComputerDesktop}
                                    label="Screen Mirroring"
                                    description={
                                        screenMirroring
                                            ? 'Streaming to meeting room display'
                                            : 'Connect to share this screen'
                                    }
                                    active={screenMirroring}
                                    onClick={() => setScreenMirroring((prev) => !prev)}
                                />
                            </div>

                            <DisplayModule
                                brightness={brightness}
                                onBrightnessChange={handleBrightnessChange}
                                nightShift={nightShift}
                                onNightShiftToggle={() => setNightShift((prev) => !prev)}
                                energySaverEnabled={energySaverEnabled}
                                onEnergySaverToggle={handleEnergySaverToggle}
                            />

                            <SoundModule
                                volume={volume}
                                onVolumeChange={handleVolumeChange}
                                ambientScene={ambientScene}
                                onAmbientSelect={handleAmbientSceneSelection}
                            />

                            <div className="rounded-3xl border border-gray-200/70 bg-white/90 p-4 dark:border-gray-700/70 dark:bg-gray-900/70">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                                        <HiOutlineCloud className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Environment</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {ambientSceneLabel} ambience and wellness reminders
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">
                                        Energy saver {energySaverEnabled ? 'enabled' : 'off'}
                                    </span>
                                    <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">
                                        Focus {doNotDisturb ? 'active' : 'idle'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
