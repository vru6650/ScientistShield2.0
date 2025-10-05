import { useEffect, useMemo, useRef, useState } from 'react';
import {
    HiOutlineAdjustmentsHorizontal,
    HiOutlineBolt,
    HiOutlineDevicePhoneMobile,
    HiOutlineMoon,
    HiOutlineSpeakerWave,
    HiOutlineSun,
    HiOutlineWifi,
} from 'react-icons/hi2';
import PropTypes from 'prop-types';
import ThemeToggle from './ThemeToggle';

const storageKeys = {
    brightness: 'control-center:brightness',
    volume: 'control-center:volume',
    focus: 'control-center:focus-mode',
    bluetooth: 'control-center:bluetooth',
    hotspot: 'control-center:hotspot',
    wifi: 'control-center:wifi',
};

const getStoredNumber = (key, fallback) => {
    if (typeof window === 'undefined') {
        return fallback;
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) {
        return fallback;
    }
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
};

const getStoredBoolean = (key, fallback) => {
    if (typeof window === 'undefined') {
        return fallback;
    }
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
        return fallback;
    }
    return raw === 'true';
};

const QuickToggle = ({ Icon, label, isActive, description, onToggle }) => (
    <button
        type="button"
        onClick={onToggle}
        aria-pressed={isActive}
        className={`group flex h-full flex-col justify-between rounded-3xl border px-4 py-3 text-left ${
            isActive
                ? 'border-brand-500/40 bg-gradient-to-br from-brand-500/15 via-brand-500/10 to-transparent text-brand-700 shadow-lg shadow-brand-500/20 dark:border-brand-400/40 dark:from-brand-400/20 dark:text-brand-200'
                : 'border-white/60 bg-white/80 text-ink-600 shadow-sm hover:border-brand-500/40 hover:text-brand-600 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-ink-100'
        }`}
    >
        <span className="flex items-center gap-2">
            <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl ${
                    isActive
                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/40'
                        : 'bg-white/80 text-brand-500 shadow-sm group-hover:bg-brand-500 group-hover:text-white dark:bg-gray-800/90'
                }`}
            >
                <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold tracking-wide">{label}</span>
        </span>
        <span className="mt-2 text-xs uppercase tracking-[0.24em] text-ink-400 dark:text-ink-300/70">
            {description}
        </span>
    </button>
);

QuickToggle.propTypes = {
    Icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    isActive: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
};

export default function ControlCenter() {
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);

    const [wifiEnabled, setWifiEnabled] = useState(() => getStoredBoolean(storageKeys.wifi, true));
    const [bluetoothEnabled, setBluetoothEnabled] = useState(() => getStoredBoolean(storageKeys.bluetooth, false));
    const [hotspotEnabled, setHotspotEnabled] = useState(() => getStoredBoolean(storageKeys.hotspot, false));
    const [focusModeEnabled, setFocusModeEnabled] = useState(() => getStoredBoolean(storageKeys.focus, false));
    const [brightnessLevel, setBrightnessLevel] = useState(() => getStoredNumber(storageKeys.brightness, 90));
    const [volumeLevel, setVolumeLevel] = useState(() => getStoredNumber(storageKeys.volume, 70));

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const handleClickAway = (event) => {
            if (
                panelRef.current && !panelRef.current.contains(event.target) &&
                triggerRef.current && !triggerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickAway);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickAway);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(storageKeys.wifi, String(wifiEnabled));
    }, [wifiEnabled]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(storageKeys.bluetooth, String(bluetoothEnabled));
    }, [bluetoothEnabled]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(storageKeys.hotspot, String(hotspotEnabled));
    }, [hotspotEnabled]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(storageKeys.focus, String(focusModeEnabled));
    }, [focusModeEnabled]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const normalized = Math.min(Math.max(Number(brightnessLevel) || 0, 20), 120);
        const ratio = (normalized / 100).toFixed(2);
        document.documentElement.style.setProperty('--app-brightness', ratio);
        window.localStorage.setItem(storageKeys.brightness, String(normalized));
    }, [brightnessLevel]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const normalized = Math.min(Math.max(Number(volumeLevel) || 0, 0), 100);
        const ratio = Math.min(Math.max(normalized / 100, 0), 1);
        window.localStorage.setItem(storageKeys.volume, String(normalized));
        const mediaNodes = document.querySelectorAll('audio, video');
        mediaNodes.forEach((node) => {
            try {
                node.volume = ratio;
                node.muted = ratio === 0;
            } catch (error) {
                /* ignore media elements that refuse programmatic volume */
            }
        });
    }, [volumeLevel]);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return undefined;
        }
        const { body } = document;
        if (!body) {
            return undefined;
        }
        if (focusModeEnabled) {
            body.classList.add('focus-mode-active');
        } else {
            body.classList.remove('focus-mode-active');
        }
        return () => body.classList.remove('focus-mode-active');
    }, [focusModeEnabled]);

    const statusSummary = useMemo(() => {
        const enabled = [
            wifiEnabled ? 'Wi-Fi' : null,
            bluetoothEnabled ? 'Bluetooth' : null,
            hotspotEnabled ? 'Hotspot' : null,
            focusModeEnabled ? 'Focus' : null,
        ].filter(Boolean);
        if (!enabled.length) {
            return 'All controls inactive';
        }
        if (enabled.length === 1) {
            return `${enabled[0]} on`;
        }
        if (enabled.length === 2) {
            return `${enabled[0]} & ${enabled[1]} on`;
        }
        return `${enabled.length} controls on`;
    }, [wifiEnabled, bluetoothEnabled, hotspotEnabled, focusModeEnabled]);

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen((previous) => !previous)}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-label="Open control center"
                className="inline-flex flex-col gap-1 rounded-3xl border border-white/60 bg-white/75 px-3 py-2 text-left shadow-sm hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:border-gray-700/60 dark:bg-gray-900/70"
            >
                <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">
                    Control
                    <HiOutlineAdjustmentsHorizontal className="h-3.5 w-3.5" />
                </span>
                <span className="flex items-center gap-2 text-sm font-semibold text-ink-700 dark:text-white">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-2xl ${
                        wifiEnabled ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                        <HiOutlineWifi className="h-4 w-4" />
                    </span>
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-2xl ${
                        focusModeEnabled ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                        <HiOutlineMoon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{statusSummary}</span>
                </span>
            </button>

            {isOpen ? (
                <div
                    ref={panelRef}
                    className="absolute right-0 mt-3 w-80 origin-top-right rounded-[26px] border border-white/60 bg-white/90 p-4 shadow-[0_24px_64px_-32px_rgba(39,47,138,0.55)] backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-900/90"
                    role="dialog"
                    aria-label="Control center"
                >
                        <div className="flex items-baseline justify-between">
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">
                                    Quick Controls
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400/80">Adjust workspace essentials</p>
                            </div>
                            <button
                                type="button"
                                className="rounded-full border border-transparent px-2 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gray-400 hover:border-brand-500/40 hover:text-brand-500"
                                onClick={() => setIsOpen(false)}
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <QuickToggle
                                Icon={HiOutlineWifi}
                                label="Wi-Fi"
                                description={wifiEnabled ? 'Connected' : 'Offline'}
                                isActive={wifiEnabled}
                                onToggle={() => setWifiEnabled((previous) => !previous)}
                            />
                            <QuickToggle
                                Icon={HiOutlineBolt}
                                label="Hotspot"
                                description={hotspotEnabled ? 'Sharing' : 'Off'}
                                isActive={hotspotEnabled}
                                onToggle={() => setHotspotEnabled((previous) => !previous)}
                            />
                            <QuickToggle
                                Icon={HiOutlineDevicePhoneMobile}
                                label="Bluetooth"
                                description={bluetoothEnabled ? 'Discoverable' : 'Disconnected'}
                                isActive={bluetoothEnabled}
                                onToggle={() => setBluetoothEnabled((previous) => !previous)}
                            />
                            <QuickToggle
                                Icon={HiOutlineMoon}
                                label="Focus"
                                description={focusModeEnabled ? 'Ambient dim' : 'Standard'}
                                isActive={focusModeEnabled}
                                onToggle={() => setFocusModeEnabled((previous) => !previous)}
                            />
                        </div>

                        <div className="mt-4 space-y-4">
                            <div className="rounded-3xl border border-white/60 bg-white/90 p-4 shadow-sm dark:border-gray-700/60 dark:bg-gray-900/80">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-100">
                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                                            <HiOutlineSun className="h-4 w-4" />
                                        </span>
                                        Brightness
                                    </span>
                                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">
                                        {Math.round(brightnessLevel)}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="20"
                                    max="120"
                                    value={brightnessLevel}
                                    onChange={(event) => setBrightnessLevel(Number(event.target.value))}
                                    className="mt-3 h-2 w-full cursor-pointer rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 accent-indigo-500"
                                    aria-label="Adjust brightness"
                                />
                            </div>

                            <div className="rounded-3xl border border-white/60 bg-white/90 p-4 shadow-sm dark:border-gray-700/60 dark:bg-gray-900/80">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-100">
                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                                            <HiOutlineSpeakerWave className="h-4 w-4" />
                                        </span>
                                        Volume
                                    </span>
                                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">
                                        {Math.round(volumeLevel)}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={volumeLevel}
                                    onChange={(event) => setVolumeLevel(Number(event.target.value))}
                                    className="mt-3 h-2 w-full cursor-pointer rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 accent-sky-500"
                                    aria-label="Adjust volume"
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-3xl border border-dashed border-brand-500/30 bg-brand-500/5 px-4 py-3 text-sm text-ink-600 dark:border-brand-400/30 dark:bg-brand-400/10 dark:text-ink-100">
                                <div>
                                    <p className="font-semibold tracking-tight">Theme</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400/80">Switch between light and dark</p>
                                </div>
                                <ThemeToggle className="h-10 w-10" />
                            </div>
                        </div>
                </div>
            ) : null}
        </div>
    );
}
