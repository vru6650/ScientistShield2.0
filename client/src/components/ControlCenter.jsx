import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tooltip, ToggleSwitch } from 'flowbite-react';
import {
    HiOutlineSquares2X2,
    HiWifi,
    HiSignal,
    HiOutlineSparkles,
    HiOutlineMoon,
    HiSpeakerWave,
    HiOutlineSun,
    HiOutlineComputerDesktop,
    HiOutlinePaperAirplane,
    HiOutlineDevicePhoneMobile,
    HiOutlineArrowPath,
    HiOutlineGlobeAlt,
    HiOutlineBellAlert,
    HiOutlineBolt,
    HiOutlineAdjustmentsHorizontal,
    HiOutlineCloud,
    HiOutlineClock,
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
        <div className="flex items-center gap-2 rounded-full border border-gray-200/70 bg-white/80 px-3 py-1.5 text-xs text-gray-600 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/60 dark:text-gray-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100/90 text-gray-600 dark:bg-gray-800/70 dark:text-gray-200">
                <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium">{label}</span>
            {description ? <span className="text-gray-400 dark:text-gray-500">• {description}</span> : null}
        </div>
    );
}

function QuickActionButton({ icon: Icon, label, description, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex flex-col gap-1.5 rounded-2xl border border-gray-200/70 bg-white/80 p-3 text-left text-sm transition-colors hover:border-cyan-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 dark:border-gray-700/70 dark:bg-gray-900/60 dark:hover:border-cyan-500/40"
        >
            <span className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100/90 text-gray-600 transition-colors group-hover:bg-cyan-500 group-hover:text-white dark:bg-gray-800/70 dark:text-gray-300 dark:group-hover:bg-cyan-500">
                    <Icon className="h-4 w-4" />
                </span>
                {label}
            </span>
            {description ? <span className="text-xs text-gray-500 dark:text-gray-400">{description}</span> : null}
        </button>
    );
}

function ControlTile({ icon: Icon, label, description, active, onClick, accent = 'from-cyan-500 to-blue-500' }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900 ${
                active
                    ? `bg-gradient-to-br ${accent} text-white shadow-lg shadow-cyan-500/30 border-transparent`
                    : 'bg-white/80 text-gray-700 dark:bg-gray-900/50 dark:text-gray-200 border-gray-200/70 dark:border-gray-700/70 hover:bg-white dark:hover:bg-gray-900'
            }`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                    <span
                        className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-colors ${
                            active
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-100/80 text-gray-600 dark:bg-gray-800/70 dark:text-gray-300'
                        }`}
                    >
                        <Icon className="h-5 w-5" />
                    </span>
                    {label}
                </span>
                <span
                    className={`text-xs font-medium uppercase tracking-wide ${
                        active ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'
                    }`}
                >
                    {active ? 'On' : 'Off'}
                </span>
            </div>
            <p
                className={`text-xs leading-relaxed ${
                    active ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'
                }`}
            >
                {description}
            </p>
        </button>
    );
}

function AmbientSceneButton({ icon: Icon, label, description, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col gap-1 rounded-2xl border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                active
                    ? 'border-transparent bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'border-gray-200/70 bg-white/80 text-gray-700 hover:bg-white dark:border-gray-700/70 dark:bg-gray-900/50 dark:text-gray-200'
            }`}
        >
            <span
                className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                    active
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100/80 text-gray-600 dark:bg-gray-800/70 dark:text-gray-300'
                }`}
            >
                <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">{label}</span>
            <span className={`text-xs ${active ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{description}</span>
        </button>
    );
}

function SliderControl({
    icon: Icon,
    label,
    value,
    onChange,
    accent = 'bg-cyan-500',
    min = 0,
    max = 100,
    step = 1,
}) {
    return (
        <div className="rounded-2xl border border-gray-200/70 bg-white/80 p-4 dark:border-gray-700/70 dark:bg-gray-900/50">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-200">
                <span className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100/90 text-gray-600 dark:bg-gray-800/70 dark:text-gray-300">
                        <Icon className="h-5 w-5" />
                    </span>
                    {label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{value}</span>
            </div>
            <div className="mt-3">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(event) => onChange(Number(event.target.value))}
                    className={`h-2 w-full appearance-none rounded-full bg-gray-200 dark:bg-gray-700 accent-cyan-500`}
                    aria-label={label}
                />
                <div className="mt-1 h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                        className={`h-full rounded-full ${accent}`}
                        style={{ width: `${((value - min) / (max - min)) * 100}%` }}
                    />
                </div>
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
    const [hasCustomAdjustments, setHasCustomAdjustments] = useState(false);
    const [energySaverEnabled, setEnergySaverEnabled] = useState(false);
    const [ambientScene, setAmbientScene] = useState('rain');
    const [currentMoment, setCurrentMoment] = useState(() => new Date());

    const panelRef = useRef(null);
    const triggerRef = useRef(null);
    const energySaverSnapshotRef = useRef(null);

    const focusSummary = useMemo(() => {
        if (hasCustomAdjustments) {
            return 'Custom tweaks active';
        }

        switch (focusMode) {
            case 'deep':
                return doNotDisturb ? 'Deep Work • DND on' : 'Deep Work preset';
            case 'break':
                return 'Break Timer • Relaxed settings';
            default:
                return doNotDisturb ? 'Manual • DND on' : 'Manual controls';
        }
    }, [focusMode, doNotDisturb, hasCustomAdjustments]);

    const ambientSceneLabel = useMemo(() => {
        const activeScene = ambientScenes.find((scene) => scene.id === ambientScene);
        return activeScene ? activeScene.label : 'Custom ambience';
    }, [ambientScene]);

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

    const handleFocusSelection = (modeId) => {
        setFocusMode(modeId);
        const preset = focusPresets[modeId];
        if (preset) {
            setBrightness(preset.brightness);
            setVolume(preset.volume);
            setDoNotDisturb(preset.doNotDisturb);
            setHasCustomAdjustments(false);
        }
    };

    const handleDoNotDisturbChange = (value) => {
        setDoNotDisturb(value);
        setHasCustomAdjustments(true);
    };

    const handleBrightnessChange = (value) => {
        setBrightness(value);
        setHasCustomAdjustments(true);
    };

    const handleVolumeChange = (value) => {
        setVolume(value);
        setHasCustomAdjustments(true);
    };

    const handleReset = () => {
        setWifiEnabled(true);
        setBluetoothEnabled(false);
        setFocusMode('off');
        setDoNotDisturb(false);
        setScreenMirroring(false);
        setNightShift(false);
        setBrightness(focusPresets.off.brightness);
        setVolume(focusPresets.off.volume);
        setAirdropEnabled(true);
        setHotspotEnabled(false);
        setHasCustomAdjustments(false);
        setEnergySaverEnabled(false);
        setAmbientScene('rain');
        energySaverSnapshotRef.current = null;
    };

    const handleEnergySaverToggle = () => {
        setEnergySaverEnabled((previous) => {
            const next = !previous;
            if (next) {
                energySaverSnapshotRef.current = { brightness, nightShift };
                setNightShift(true);
                setBrightness((value) => Math.min(value, 60));
            } else {
                if (energySaverSnapshotRef.current) {
                    setBrightness(energySaverSnapshotRef.current.brightness);
                    setNightShift(energySaverSnapshotRef.current.nightShift);
                    energySaverSnapshotRef.current = null;
                }
            }
            setHasCustomAdjustments(true);
            return next;
        });
    };

    const handleAmbientSceneSelection = (scene) => {
        setAmbientScene(scene.id);
        setVolume(scene.volume);
        setHasCustomAdjustments(true);
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
                        className="absolute right-0 z-50 mt-3 w-80 rounded-3xl border border-gray-200/70 bg-white/90 p-5 shadow-2xl backdrop-blur-xl dark:border-gray-700/70 dark:bg-gray-900/90"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Control Center</h2>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Quick actions</span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-gray-200/70 bg-gradient-to-br from-white to-gray-50 p-4 dark:border-gray-700/70 dark:from-gray-900/80 dark:to-gray-900">
                                <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <HiOutlineClock className="h-4 w-4" />
                                        Now
                                    </span>
                                    <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-200">
                                        {focusMode === 'deep' ? 'Deep session' : focusMode === 'break' ? 'Recharge' : 'Manual'}
                                    </span>
                                </div>
                                <div className="mt-3 text-2xl font-semibold text-gray-800 dark:text-gray-100">
                                    {currentMoment.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {currentMoment.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <HiOutlineGlobeAlt className="h-4 w-4 text-cyan-500" />
                                    <span>{ambientSceneLabel}</span>
                                </div>
                            </div>
                            <div className="flex flex-col justify-between rounded-2xl border border-gray-200/70 bg-white/90 p-4 text-xs text-gray-600 shadow-inner dark:border-gray-700/70 dark:bg-gray-900/70 dark:text-gray-300">
                                <div className="flex items-start gap-2">
                                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                                        <HiOutlineAdjustmentsHorizontal className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="font-semibold text-gray-700 dark:text-gray-200">Session health</p>
                                        <p>Controls tuned for {hasCustomAdjustments ? 'your custom flow' : 'a balanced workflow'}.</p>
                                    </div>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-medium">
                                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                        <HiOutlineSun className="h-4 w-4" /> {brightness}%
                                    </span>
                                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                        <HiSpeakerWave className="h-4 w-4" /> {volume}%
                                    </span>
                                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                        <HiOutlineBellAlert className="h-4 w-4" /> {doNotDisturb ? 'DND on' : 'Alerts on'}
                                    </span>
                                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                        <HiOutlineBolt className="h-4 w-4" /> {energySaverEnabled ? 'Energy saver' : 'Performance'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            <StatusPill
                                icon={HiWifi}
                                label={wifiEnabled ? 'Wi-Fi connected' : 'Wi-Fi off'}
                                description={wifiEnabled ? 'ScientistNet' : undefined}
                            />
                            <StatusPill
                                icon={HiSignal}
                                label={bluetoothEnabled ? 'Bluetooth on' : 'Bluetooth off'}
                                description={bluetoothEnabled ? 'Discoverable' : undefined}
                            />
                            <StatusPill icon={HiOutlineSparkles} label="Focus" description={focusSummary} />
                            <StatusPill icon={HiOutlineCloud} label="Ambience" description={ambientSceneLabel} />
                            <StatusPill
                                icon={HiOutlineBolt}
                                label={energySaverEnabled ? 'Energy saver on' : 'Energy saver off'}
                                description={energySaverEnabled ? 'Brightness moderated' : 'Full performance'}
                            />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <ControlTile
                                icon={HiWifi}
                                label="Wi-Fi"
                                description={wifiEnabled ? 'Connected to ScientistNet' : 'Turn on to connect networks'}
                                active={wifiEnabled}
                                onClick={() => setWifiEnabled((prev) => !prev)}
                            />
                            <ControlTile
                                icon={HiSignal}
                                label="Bluetooth"
                                description={bluetoothEnabled ? 'Discoverable nearby' : 'Devices will appear here'}
                                active={bluetoothEnabled}
                                onClick={() => setBluetoothEnabled((prev) => !prev)}
                                accent="from-indigo-500 to-purple-500"
                            />
                        </div>

                        <div className="mt-4 space-y-3 rounded-3xl border border-gray-200/70 bg-white/80 p-4 dark:border-gray-700/70 dark:bg-gray-900/60">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Focus</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Craft the perfect environment for your next session.
                                    </p>
                                </div>
                                <ToggleSwitch checked={doNotDisturb} onChange={handleDoNotDisturbChange} label={undefined} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {focusModes.map((mode) => (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() => handleFocusSelection(mode.id)}
                                        className={`rounded-full px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                                            focusMode === mode.id
                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm'
                                                : 'bg-white/70 text-gray-600 hover:bg-white dark:bg-gray-800/70 dark:text-gray-300 dark:hover:bg-gray-800'
                                        }`}
                                        aria-pressed={focusMode === mode.id}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200/80 bg-white/70 p-3 text-sm text-gray-600 dark:border-gray-700/70 dark:bg-gray-900/40 dark:text-gray-300">
                                <HiOutlineSparkles className="h-5 w-5 text-cyan-500" />
                                {doNotDisturb
                                    ? 'Do Not Disturb enabled — notifications will be muted.'
                                    : 'Enable Do Not Disturb to stay focused without interruptions.'}
                            </div>
                        </div>

                        <div className="mt-4 space-y-3">
                            <SliderControl
                                icon={HiOutlineSun}
                                label="Display Brightness"
                                value={brightness}
                                onChange={handleBrightnessChange}
                                accent="bg-gradient-to-r from-amber-400 to-orange-500"
                            />
                            <SliderControl
                                icon={HiSpeakerWave}
                                label="System Volume"
                                value={volume}
                                onChange={handleVolumeChange}
                                accent="bg-gradient-to-r from-sky-400 to-cyan-500"
                            />
                            <div className="flex items-center justify-between rounded-2xl border border-gray-200/70 bg-white/80 p-4 text-sm text-gray-700 dark:border-gray-700/70 dark:bg-gray-900/60 dark:text-gray-200">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100/90 text-gray-600 dark:bg-gray-800/70 dark:text-gray-300">
                                        <PiMonitorLight className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="font-semibold">Appearance</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Toggle between light and dark experiences.
                                        </p>
                                    </div>
                                </div>
                                <ThemeToggle className="h-10 w-12" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                    Ambient soundscapes
                                </p>
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                    {ambientScenes.map((scene) => (
                                        <AmbientSceneButton
                                            key={scene.id}
                                            icon={scene.icon}
                                            label={scene.label}
                                            description={scene.description}
                                            active={ambientScene === scene.id}
                                            onClick={() => handleAmbientSceneSelection(scene)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <ControlTile
                                icon={HiOutlineComputerDesktop}
                                label="Screen Mirroring"
                                description={screenMirroring ? 'Streaming to external display' : 'Connect to share your screen'}
                                active={screenMirroring}
                                onClick={() => setScreenMirroring((prev) => !prev)}
                                accent="from-sky-500 to-cyan-500"
                            />
                            <ControlTile
                                icon={HiOutlineMoon}
                                label="Night Shift"
                                description={nightShift ? 'Warmer tones for evening' : 'Automatically shift colors after dark'}
                                active={nightShift}
                                onClick={() => setNightShift((prev) => !prev)}
                                accent="from-amber-500 to-rose-500"
                            />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <ControlTile
                                icon={HiOutlinePaperAirplane}
                                label="AirDrop"
                                description={airdropEnabled ? 'Receiving from contacts only' : 'Tap to accept incoming files'}
                                active={airdropEnabled}
                                onClick={() => setAirdropEnabled((prev) => !prev)}
                                accent="from-emerald-500 to-teal-500"
                            />
                            <ControlTile
                                icon={HiOutlineDevicePhoneMobile}
                                label="Personal Hotspot"
                                description={hotspotEnabled ? 'Sharing connection' : 'Share your connection with others'}
                                active={hotspotEnabled}
                                onClick={() => setHotspotEnabled((prev) => !prev)}
                                accent="from-violet-500 to-indigo-500"
                            />
                            <ControlTile
                                icon={HiOutlineBolt}
                                label="Energy Saver"
                                description={energySaverEnabled ? 'Keeping things efficient' : 'Maximize performance & brightness'}
                                active={energySaverEnabled}
                                onClick={handleEnergySaverToggle}
                                accent="from-emerald-500 to-cyan-500"
                            />
                        </div>

                        <div className="mt-4 space-y-3 rounded-3xl border border-gray-200/70 bg-white/80 p-4 dark:border-gray-700/70 dark:bg-gray-900/60">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Quick automations</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Instantly tailor the space for how you work.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <QuickActionButton
                                    icon={HiOutlineSparkles}
                                    label="Deep focus"
                                    description="Dim screen, lower distractions"
                                    onClick={() => handleFocusSelection('deep')}
                                />
                                <QuickActionButton
                                    icon={HiOutlineSun}
                                    label="Break burst"
                                    description="Brighten display, pump up volume"
                                    onClick={() => handleFocusSelection('break')}
                                />
                                <QuickActionButton
                                    icon={HiOutlineSquares2X2}
                                    label="Everything off"
                                    description="Return to manual controls"
                                    onClick={() => handleFocusSelection('off')}
                                />
                                <QuickActionButton
                                    icon={HiOutlineArrowPath}
                                    label="Reset panel"
                                    description="Restore default toggles"
                                    onClick={handleReset}
                                />
                                <QuickActionButton
                                    icon={HiOutlineBolt}
                                    label={energySaverEnabled ? 'Disable saver' : 'Enable saver'}
                                    description={energySaverEnabled ? 'Return to performance' : 'Extend your session'}
                                    onClick={handleEnergySaverToggle}
                                />
                                <QuickActionButton
                                    icon={HiOutlineCloud}
                                    label="Calm ambience"
                                    description="Switch to gentle rain soundscape"
                                    onClick={() => handleAmbientSceneSelection(ambientScenes[0])}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
