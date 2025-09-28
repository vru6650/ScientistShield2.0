import { useEffect, useRef, useState } from 'react';
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
} from 'react-icons/hi2';
import { PiMonitorLight } from 'react-icons/pi';
import ThemeToggle from './ThemeToggle.jsx';

const focusModes = [
    { id: 'off', label: 'Off' },
    { id: 'deep', label: 'Deep Work' },
    { id: 'break', label: 'Break Timer' },
];

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

    const panelRef = useRef(null);
    const triggerRef = useRef(null);

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
                                <ToggleSwitch checked={doNotDisturb} onChange={setDoNotDisturb} label={undefined} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {focusModes.map((mode) => (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() => setFocusMode(mode.id)}
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
                                onChange={setBrightness}
                                accent="bg-gradient-to-r from-amber-400 to-orange-500"
                            />
                            <SliderControl
                                icon={HiSpeakerWave}
                                label="System Volume"
                                value={volume}
                                onChange={setVolume}
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
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
