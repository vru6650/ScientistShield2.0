import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tooltip } from 'flowbite-react';
import { useDispatch, useSelector } from 'react-redux';
import {
    HiOutlineSquares2X2,
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
import { toggleTheme } from '../redux/theme/themeSlice';

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

    const panelRef = useRef(null);
    const triggerRef = useRef(null);
    const energySaverSnapshotRef = useRef(null);

    const dispatch = useDispatch();
    const { theme } = useSelector((state) => state.theme);
    const isDarkMode = theme === 'dark';

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

    const handleReset = () => {
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
                                icon={isDarkMode ? HiOutlineMoon : HiOutlineSun}
                                label="Appearance"
                                active={isDarkMode}
                                detail={isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}
                                onClick={() => dispatch(toggleTheme())}
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
                                    {doNotDisturb ? 'Notifications silenced' : 'Alerts enabled'}
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
