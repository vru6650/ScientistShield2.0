import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Badge,
    Button,
    Card,
    Select,
    Tabs,
    TextInput,
    Tooltip,
} from 'flowbite-react';
import {
    FaPause,
    FaPlay,
    FaRandom,
    FaRedoAlt,
    FaStepBackward,
    FaStepForward,
    FaFastBackward,
    FaFastForward,
    FaInfinity,
    FaTachometerAlt,
    FaListOl,
    FaInfoCircle,
    FaBalanceScale,
    FaExchangeAlt,
    FaRedo,
    FaChartLine,
    FaClock,
    FaLightbulb,
} from 'react-icons/fa';
import { algorithmCatalog } from '../data/algorithmVisualizerData';
import { normalizeDataset } from '../utils/algorithmVisualizer';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const highlightLegend = [
    { key: 'compare', label: 'Active comparison', colorClass: 'bg-amber-500', description: 'Indices currently being compared.' },
    { key: 'swap', label: 'Swap candidates', colorClass: 'bg-rose-500', description: 'Values that are about to exchange positions.' },
    { key: 'sorted', label: 'Sorted / locked', colorClass: 'bg-emerald-500', description: 'Positions confirmed in final order.' },
    { key: 'key', label: 'Key element', colorClass: 'bg-indigo-500', description: 'Current key being inserted or tracked.' },
    { key: 'pivot', label: 'Pivot / focus', colorClass: 'bg-sky-500', description: 'Central pivot for divide-and-conquer steps.' },
    { key: 'window', label: 'Search window', colorClass: 'bg-cyan-500', description: 'Active search or slicing window.' },
    { key: 'muted', label: 'Inactive', colorClass: 'bg-slate-600', description: 'Values outside the current operation.' },
];

const phaseAccent = {
    overview: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200',
    pass: 'border-blue-500/50 bg-blue-500/10 text-blue-200',
    'pass-complete': 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
    compare: 'border-amber-500/50 bg-amber-500/10 text-amber-200',
    swap: 'border-rose-500/50 bg-rose-500/10 text-rose-200',
    'key-selected': 'border-indigo-500/50 bg-indigo-500/10 text-indigo-200',
    shift: 'border-purple-500/50 bg-purple-500/10 text-purple-200',
    inserted: 'border-lime-500/50 bg-lime-500/10 text-lime-200',
    mid: 'border-sky-500/50 bg-sky-500/10 text-sky-200',
    found: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
    'shift-right': 'border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-200',
    'shift-left': 'border-pink-500/50 bg-pink-500/10 text-pink-200',
    failed: 'border-red-500/50 bg-red-500/10 text-red-200',
    complete: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
    default: 'border-slate-600 bg-slate-700/40 text-slate-100',
};

const barVariants = {
    default: { scaleY: 1, opacity: 1, boxShadow: '0 0 0 rgba(0,0,0,0)' },
    compare: { scaleY: 1.04, opacity: 1, boxShadow: '0 16px 32px -18px rgba(245, 158, 11, 0.35)' },
    swap: { scaleY: 1.1, opacity: 1, boxShadow: '0 20px 44px -22px rgba(244, 63, 94, 0.45)' },
    key: { scaleY: 1.07, opacity: 1, boxShadow: '0 18px 40px -22px rgba(99, 102, 241, 0.45)' },
    pivot: { scaleY: 1.05, opacity: 1, boxShadow: '0 16px 36px -20px rgba(56, 189, 248, 0.45)' },
    target: { scaleY: 1.05, opacity: 1, boxShadow: '0 16px 36px -20px rgba(16, 185, 129, 0.45)' },
    sorted: { scaleY: 1.02, opacity: 1, boxShadow: '0 12px 28px -20px rgba(16, 185, 129, 0.35)' },
    window: { scaleY: 1.03, opacity: 1, boxShadow: '0 14px 30px -20px rgba(34, 211, 238, 0.35)' },
    muted: { scaleY: 1, opacity: 0.5, boxShadow: '0 0 0 rgba(0,0,0,0)' },
};

const resolveBarAppearance = (index, highlights = {}) => {
    const { compare, swap, sorted, keyIndex, pivot, targetIndex, boundary, window, discarded } = highlights;

    if (Array.isArray(sorted) && sorted.includes(index)) {
        return { className: 'bg-emerald-500', variant: 'sorted' };
    }
    if (Array.isArray(swap) && swap.includes(index)) {
        return { className: 'bg-rose-500', variant: 'swap' };
    }
    if (Array.isArray(compare) && compare.includes(index)) {
        return { className: 'bg-amber-500', variant: 'compare' };
    }
    if (typeof keyIndex === 'number' && keyIndex === index) {
        return { className: 'bg-indigo-500', variant: 'key' };
    }
    if (typeof pivot === 'number' && pivot === index) {
        return { className: 'bg-sky-500', variant: 'pivot' };
    }
    if (typeof targetIndex === 'number' && targetIndex === index) {
        return { className: 'bg-emerald-500', variant: 'target' };
    }
    if (Array.isArray(window)) {
        const [left, right] = window;
        if (index >= left && index <= right) {
            return { className: 'bg-cyan-500', variant: 'window' };
        }
    }
    if (typeof boundary === 'number' && index > boundary) {
        return { className: 'bg-slate-600', variant: 'muted' };
    }
    if (Array.isArray(discarded)) {
        const [start, end] = discarded;
        if (index >= start && index <= end) {
            return { className: 'bg-slate-600', variant: 'muted' };
        }
    }
    return { className: 'bg-slate-600', variant: 'default' };
};

const markerPalette = {
    i: 'bg-amber-500/95 text-white border-amber-200/40',
    j: 'bg-amber-500/95 text-white border-amber-200/40',
    key: 'bg-indigo-500/95 text-white border-indigo-200/40',
    slot: 'bg-purple-500/95 text-white border-purple-200/40',
    mid: 'bg-sky-500/95 text-white border-sky-200/40',
    l: 'bg-cyan-500/95 text-white border-cyan-200/40',
    r: 'bg-rose-500/95 text-white border-rose-200/40',
    target: 'bg-emerald-500/95 text-white border-emerald-200/40',
    found: 'bg-emerald-500/95 text-white border-emerald-200/40',
    default: 'bg-slate-700/90 text-white border-slate-400/40',
};

const AnimatedBar = ({ value, index, barHeight, appearance, isNegative, markers = [] }) => {
    const variantKey = appearance.variant ?? 'default';
    const variant = barVariants[variantKey] || barVariants.default;
    const hasMarkers = markers.length > 0;

    const markerStyle = (label) => {
        if (!label) return markerPalette.default;
        const paletteKey = typeof label === 'string' ? label.toLowerCase() : label;
        return markerPalette[paletteKey] || markerPalette.default;
    };

    return (
        <Tooltip content={`Index ${index}: ${value}`} placement="top">
            <motion.div
                layout
                className={`relative flex flex-col items-center gap-2 ${hasMarkers ? 'pt-6' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            >
                <AnimatePresence>
                    {hasMarkers ? (
                        <motion.div
                            key="bar-markers"
                            className="pointer-events-none absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-full flex-col items-center gap-1"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                        >
                            {markers.map((label, markerIndex) => (
                                <motion.span
                                    key={`${index}-${label}-${markerIndex}`}
                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-lg shadow-black/20 ${markerStyle(
                                        label,
                                    )}`}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {label}
                                </motion.span>
                            ))}
                        </motion.div>
                    ) : null}
                </AnimatePresence>
                <motion.div
                    layout
                    className={`flex w-8 items-end justify-center rounded-t-md md:w-10 ${appearance.className}`}
                    style={{ height: barHeight, transformOrigin: 'bottom center' }}
                    animate={variant}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    whileHover={{ scale: 1.05 }}
                >
                    <motion.span
                        className="select-none pb-2 text-xs font-semibold text-white/80 md:text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                    >
                        {value}
                    </motion.span>
                </motion.div>
                <span className="select-none text-xs text-slate-300">[{index}]</span>
                {isNegative && (
                    <motion.span
                        className="select-none text-[10px] uppercase tracking-wide text-rose-300"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        negative
                    </motion.span>
                )}
            </motion.div>
        </Tooltip>
    );
};

const ArrayVisualizer = ({ step }) => {
    const { array = [], highlights } = step || {};
    const maxValue = array.reduce((acc, value) => Math.max(acc, Math.abs(value)), 1);
    const markersByIndex = useMemo(() => {
        const map = new Map();
        const total = array.length;
        const addMarker = (index, label) => {
            if (!Number.isFinite(index) || total === 0) return;
            const safeIndex = Math.round(index);
            if (safeIndex < 0 || safeIndex >= total) return;
            const normalized = typeof label === 'string' ? label : `${label}`;
            const existing = map.get(safeIndex) ?? [];
            if (!existing.includes(normalized)) {
                map.set(safeIndex, [...existing, normalized]);
            }
        };

        if (Array.isArray(step?.info?.pointers)) {
            step.info.pointers.forEach(({ index, label }) => addMarker(index, label));
        }

        if (typeof highlights?.targetIndex === 'number') {
            addMarker(highlights.targetIndex, 'target');
        }

        return map;
    }, [array.length, highlights, step]);

    return (
        <div className="relative w-full">
            <motion.div
                className="pointer-events-none absolute inset-0 -z-10 rounded-xl opacity-40 blur-3xl"
                style={{
                    background: 'radial-gradient(circle at 20% 20%, rgba(34,211,238,0.25), transparent 55%)',
                }}
                animate={{ rotate: [0, 18, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative overflow-hidden rounded-xl border border-slate-800/40 bg-slate-950/60">
                <motion.div
                    className="pointer-events-none absolute -inset-24 opacity-40 blur-3xl"
                    style={{
                        background: 'conic-gradient(from 90deg at 50% 50%, rgba(129,140,248,0.3), rgba(34,211,238,0.15), transparent)',
                    }}
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
                />
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.12]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />
                <div className="relative flex min-h-[220px] items-end gap-2 p-4 md:gap-3">
                    {array.map((value, index) => {
                        const normalizedHeight = maxValue === 0 ? 12 : clamp(Math.abs(value) / maxValue, 0.05, 1);
                        const barHeight = Math.round(normalizedHeight * 160) + 40;
                        const appearance = resolveBarAppearance(index, highlights);
                        const markers = markersByIndex.get(index) ?? [];

                        return (
                            <AnimatedBar
                                key={`${index}-${value}`}
                                value={value}
                                index={index}
                                barHeight={barHeight}
                                appearance={appearance}
                                isNegative={value < 0}
                                markers={markers}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const PseudocodeBlock = ({ pseudocode, activeLine }) => (
    <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Pseudocode trace</h3>
        <div className="rounded-lg border border-slate-800/60 bg-slate-900/80 p-4 text-sm leading-relaxed">
            {pseudocode.map((line) => (
                <div
                    key={line.id}
                    className={`rounded px-3 py-1 font-mono ${
                        activeLine === line.id ? 'bg-slate-800 text-cyan-300' : 'text-slate-300'
                    }`}
                >
                    {line.text}
                </div>
            ))}
        </div>
    </div>
);

const CodeBlock = ({ code, highlightedLines = [] }) => {
    const lines = code.split('\n');
    const highlightSet = useMemo(() => new Set(highlightedLines), [highlightedLines]);
    return (
        <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Reference implementation</h3>
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/80">
                <pre className="overflow-auto p-4 text-left text-sm leading-relaxed text-slate-200">
                    {lines.map((lineContent, index) => {
                        const lineNumber = index + 1;
                        const isHighlighted = highlightSet.has(lineNumber);
                        return (
                            <div
                                key={`${lineContent}-${index}`}
                                className={`grid grid-cols-[auto,1fr] gap-4 rounded ${
                                    isHighlighted ? 'bg-slate-800/80 text-cyan-200 shadow-inner shadow-cyan-500/10' : ''
                                }`}
                            >
                                <span className={`text-xs ${isHighlighted ? 'text-cyan-300' : 'text-slate-500'}`}>{lineNumber}</span>
                                <code className="whitespace-pre">{lineContent || '\u00A0'}</code>
                            </div>
                        );
                    })}
                </pre>
            </div>
        </div>
    );
};

const SpeedControl = ({ speedMs, onChange }) => (
    <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
            <FaTachometerAlt className="text-slate-400" />
            <span className="text-sm text-slate-300">Playback speed</span>
            <Badge color="info" className="bg-cyan-500/20 text-cyan-300">
                {Math.round(1000 / speedMs)} steps/sec
            </Badge>
        </div>
        <input
            type="range"
            min={200}
            max={1800}
            step={100}
            value={speedMs}
            onChange={(event) => onChange(Number(event.target.value))}
            className="accent-cyan-400"
        />
        <div className="flex justify-between text-xs uppercase tracking-widest text-slate-400">
            <span>slower</span>
            <span>faster</span>
        </div>
    </div>
);

const LegendPanel = () => (
    <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Highlight legend</h3>
        <div className="flex flex-wrap gap-3 rounded-lg border border-slate-800/60 bg-slate-900/60 p-4 text-sm">
            {highlightLegend.map((item) => (
                <div key={item.key} className="flex flex-col gap-1 text-slate-300">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex h-3 w-3 rounded-full ${item.colorClass}`} />
                        <span className="font-medium text-white">{item.label}</span>
                    </div>
                    <span className="pl-5 text-xs text-slate-400">{item.description}</span>
                </div>
            ))}
        </div>
        <p className="text-xs text-slate-400">
            Pointer badges such as <span className="font-semibold text-slate-200">i, j, key, L, R</span> float above bars to track loop indices, insertion slots,
            and binary search bounds in real time.
        </p>
    </div>
);

const StatsPanel = ({ stats, category }) => {
    if (!stats) return null;
    const iterationLabel = category === 'Search' ? 'Iterations' : 'Passes';
    const adjustmentsLabel = category === 'Search' ? 'Boundary shifts' : 'Swaps / shifts';
    const adjustmentsValue = category === 'Search' ? stats.adjustments : stats.swaps + stats.shifts;
    const iterationValue = category === 'Search' ? stats.iterations : stats.passes || stats.iterations;
    const formatValue = (value) => (Number.isFinite(value) ? value.toLocaleString('en-US') : '0');
    const items = [
        { key: 'comparisons', label: 'Comparisons', value: stats.comparisons, icon: FaBalanceScale, accent: 'from-amber-500 to-orange-500' },
        { key: 'adjustments', label: adjustmentsLabel, value: adjustmentsValue, icon: FaExchangeAlt, accent: 'from-rose-500 to-pink-500' },
        { key: 'iterations', label: iterationLabel, value: iterationValue, icon: FaRedo, accent: 'from-sky-500 to-indigo-500' },
        { key: 'steps', label: 'Step count', value: stats.totalSteps, icon: FaChartLine, accent: 'from-emerald-500 to-teal-500' },
    ];

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
                <FaClock className="text-slate-300" />
                <h3 className="text-lg font-semibold">Telemetry</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                {items.map(({ key, label, value, icon: Icon, accent }) => (
                    <div
                        key={key}
                        className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-4 shadow-lg shadow-black/10"
                    >
                        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${accent} text-white`}>
                            <Icon />
                        </div>
                        <div className="mt-3 text-xs uppercase tracking-widest text-slate-400">{label}</div>
                        <div className="text-2xl font-semibold text-white">{formatValue(value)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const InsightList = ({ insights }) => (
    <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Why it matters</h3>
        <ul className="space-y-2 text-sm text-slate-300">
            {insights.map((point) => (
                <li key={point} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <span>{point}</span>
                </li>
            ))}
        </ul>
    </div>
);

const ComplexityCallout = ({ complexity }) => {
    if (!complexity) return null;
    const items = [
        { key: 'best', label: 'Best case', value: complexity.best },
        { key: 'average', label: 'Average case', value: complexity.average },
        { key: 'worst', label: 'Worst case', value: complexity.worst },
        { key: 'space', label: 'Space', value: complexity.space },
    ];
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Complexity profile</h3>
            <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item) => (
                    <div
                        key={item.key}
                        className="rounded-lg border border-slate-800/60 bg-slate-900/70 p-4"
                    >
                        <div className="text-xs uppercase tracking-widest text-slate-400">{item.label}</div>
                        <div className="text-xl font-semibold text-white">{item.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const humanizeKey = (text) => {
    if (!text) return '';
    return text
        .replace(/[_-]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, (char) => char.toUpperCase());
};

const formatMetaValue = (value) => {
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    return value;
};

const StepDetails = ({ step }) => {
    if (!step) return null;
    const phase = step.info?.phase;
    const metaEntries = Object.entries(step.info ?? {}).filter(([key, value]) => {
        if (key === 'phase' || key === 'pointers') return false;
        return value !== undefined && value !== null && value !== '';
    });

    if (!phase && metaEntries.length === 0) {
        return null;
    }

    const phaseLabel = phase ? humanizeKey(phase) : null;
    const phaseClass = phase ? phaseAccent[phase] ?? phaseAccent.default : null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
                <FaInfoCircle className="text-slate-300" />
                <h3 className="text-lg font-semibold">Step insights</h3>
            </div>
            {phase && (
                <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${phaseClass}`}
                >
                    Phase · {phaseLabel}
                </span>
            )}
            {metaEntries.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {metaEntries.map(([key, value]) => (
                        <span
                            key={key}
                            className="rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1 text-xs text-slate-200"
                        >
                            <span className="mr-1 font-semibold uppercase tracking-wider text-slate-400">
                                {humanizeKey(key)}:
                            </span>
                            {formatMetaValue(value)}
                        </span>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-slate-400">No additional metrics recorded for this step.</p>
            )}
        </div>
    );
};

const StepTimeline = ({ steps, currentStepIndex, onSelectStep }) => {
    const stepRefs = useRef([]);

    useEffect(() => {
        stepRefs.current = stepRefs.current.slice(0, steps.length);
    }, [steps.length]);

    useEffect(() => {
        const target = stepRefs.current[currentStepIndex];
        if (target && typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [currentStepIndex]);

    if (!steps.length) {
        return null;
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                    <FaListOl className="text-slate-300" />
                    <h3 className="text-lg font-semibold">Step timeline</h3>
                </div>
                <Badge color="info" className="bg-cyan-500/20 text-cyan-300">
                    {steps.length} steps
                </Badge>
            </div>
            <div className="max-h-[360px] overflow-y-auto rounded-lg border border-slate-800/70 bg-slate-950/70 p-2 pr-1">
                <div className="space-y-2">
                    {steps.map((step, index) => {
                        const isActive = index === currentStepIndex;
                        const phase = step.info?.phase;
                        const phaseLabel = phase ? humanizeKey(phase) : null;
                        const phaseClass = phase ? phaseAccent[phase] ?? phaseAccent.default : phaseAccent.default;

                        return (
                            <motion.button
                                key={`timeline-step-${index}`}
                                type="button"
                                layout
                                ref={(element) => {
                                    stepRefs.current[index] = element;
                                }}
                                onClick={() => onSelectStep(index)}
                                className={`relative flex w-full flex-col items-start gap-1 rounded-lg border px-3 py-3 text-left transition ${
                                    isActive
                                        ? 'border-cyan-400/70 bg-slate-800/90 shadow-lg shadow-cyan-500/10'
                                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
                                }`}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="timeline-active-indicator"
                                        className="absolute inset-y-1 left-1 w-1 rounded-full bg-cyan-400"
                                    />
                                )}
                                <span className="pl-4 text-xs uppercase tracking-widest text-slate-400">
                                    Step {index + 1}
                                </span>
                                <span className={`pl-4 text-sm ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                    {step.message}
                                </span>
                                {phaseLabel && (
                                    <span
                                        className={`ml-4 mt-1 inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${phaseClass}`}
                                    >
                                        {phaseLabel}
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default function AlgorithmVisualizer() {
    const [algorithmId, setAlgorithmId] = useState(algorithmCatalog[0].id);
    const [rawDataset, setRawDataset] = useState(algorithmCatalog[0].defaultInput);
    const [targetInput, setTargetInput] = useState(algorithmCatalog[0].defaultTarget || '');
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [speed, setSpeed] = useState(900);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loopPlayback, setLoopPlayback] = useState(false);

    const selectedAlgorithm = useMemo(
        () => algorithmCatalog.find((definition) => definition.id === algorithmId),
        [algorithmId],
    );

    const fallbackValues = useMemo(
        () => normalizeDataset(selectedAlgorithm?.defaultInput || ''),
        [selectedAlgorithm?.defaultInput],
    );

    const dataset = useMemo(
        () => normalizeDataset(rawDataset || '', fallbackValues),
        [rawDataset, fallbackValues],
    );

    const parsedTarget = useMemo(() => {
        if (!selectedAlgorithm?.requiresTarget) return null;
        const numeric = Number(targetInput);
        return Number.isFinite(numeric) ? numeric : null;
    }, [selectedAlgorithm?.requiresTarget, targetInput]);

    const steps = useMemo(() => {
        if (!selectedAlgorithm) return [];
        try {
            if (selectedAlgorithm.requiresTarget) {
                if (parsedTarget === null) {
                    return [
                        {
                            array: dataset,
                            message: 'Enter a numeric target to explore binary search.',
                            line: 'start',
                            highlights: { window: [0, dataset.length - 1] },
                            info: { phase: 'overview' },
                        },
                    ];
                }
                return selectedAlgorithm.generator(dataset, parsedTarget);
            }
            return selectedAlgorithm.generator(dataset);
        } catch (error) {
            return [
                {
                    array: dataset,
                    message: `Unable to simulate this algorithm: ${error.message}`,
                    line: 'start',
                    info: { phase: 'failed' },
                },
            ];
        }
    }, [dataset, parsedTarget, selectedAlgorithm]);

    const currentStep = steps[currentStepIndex] || steps[steps.length - 1] || null;
    const nextStep = steps[currentStepIndex + 1] || null;
    const totalSteps = steps.length;
    const progressPercent = totalSteps > 1 ? Math.round((currentStepIndex / (totalSteps - 1)) * 100) : 0;
    const codeHighlightLines = useMemo(() => {
        if (!selectedAlgorithm?.codeHighlights || !currentStep?.line) return [];
        return selectedAlgorithm.codeHighlights[currentStep.line] ?? [];
    }, [selectedAlgorithm, currentStep]);
    const aggregateStats = useMemo(() => {
        const stats = {
            comparisons: 0,
            swaps: 0,
            shifts: 0,
            adjustments: 0,
            passes: 0,
            iterations: 0,
            totalSteps: steps.length,
        };
        steps.forEach((step) => {
            const phase = step.info?.phase;
            if (!phase) return;
            if (phase.includes('compare')) {
                stats.comparisons += 1;
            }
            if (phase === 'swap') {
                stats.swaps += 1;
                stats.adjustments += 1;
            }
            if (phase === 'shift') {
                stats.shifts += 1;
                stats.adjustments += 1;
            }
            if (phase === 'inserted') {
                stats.adjustments += 1;
            }
            if (phase === 'pass' || phase === 'pass-complete') {
                const passCount = step.info?.pass;
                if (Number.isFinite(passCount)) {
                    stats.passes = Math.max(stats.passes, passCount);
                }
            }
            if (phase === 'mid') {
                stats.iterations += 1;
            }
            if (phase === 'shift-right' || phase === 'shift-left') {
                stats.iterations += 1;
                stats.adjustments += 1;
            }
        });
        return stats;
    }, [steps]);
    const datasetSummary = useMemo(() => {
        if (!dataset.length) {
            return { length: 0, min: 0, max: 0, spread: 0, unique: 0 };
        }
        const min = Math.min(...dataset);
        const max = Math.max(...dataset);
        const unique = new Set(dataset).size;
        return {
            length: dataset.length,
            min,
            max,
            spread: max - min,
            unique,
        };
    }, [dataset]);

    useEffect(() => {
        setCurrentStepIndex(0);
        setIsPlaying(false);
    }, [algorithmId, parsedTarget]);

    useEffect(() => {
        if (!isPlaying) return undefined;
        if (currentStepIndex >= steps.length - 1) {
            if (loopPlayback && steps.length > 1) {
                setCurrentStepIndex(0);
                return undefined;
            }
            setIsPlaying(false);
            return undefined;
        }

        const timer = setTimeout(() => {
            setCurrentStepIndex((index) => clamp(index + 1, 0, steps.length - 1));
        }, speed);

        return () => clearTimeout(timer);
    }, [isPlaying, currentStepIndex, steps.length, speed, loopPlayback]);

    const handleAlgorithmChange = (event) => {
        const nextId = event.target.value;
        const nextDefinition = algorithmCatalog.find((item) => item.id === nextId);
        setAlgorithmId(nextId);
        setRawDataset(nextDefinition?.defaultInput || '');
        setTargetInput(nextDefinition?.defaultTarget || '');
    };

    const handleRandomDataset = () => {
        const size = clamp(dataset.length || 6, 5, 12);
        const randomValues = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 5);
        if (selectedAlgorithm?.requiresTarget) {
            const sorted = [...randomValues].sort((a, b) => a - b);
            setRawDataset(sorted.join(', '));
            const fallbackTarget = selectedAlgorithm?.defaultTarget || String(sorted[Math.floor(sorted.length / 2)]);
            setTargetInput(fallbackTarget);
        } else {
            setRawDataset(randomValues.join(', '));
        }
        setCurrentStepIndex(0);
        setIsPlaying(false);
    };

    const handlePresetSelect = (preset) => {
        if (!preset) return;
        if (preset.dataset) {
            setRawDataset(preset.dataset);
        }
        if (selectedAlgorithm?.requiresTarget) {
            setTargetInput(
                Object.prototype.hasOwnProperty.call(preset, 'target')
                    ? preset.target ?? ''
                    : selectedAlgorithm?.defaultTarget || '',
            );
        }
        setCurrentStepIndex(0);
        setIsPlaying(false);
    };

    const handleReset = () => {
        setCurrentStepIndex(0);
        setIsPlaying(false);
    };

    const goToPrevious = () => {
        setCurrentStepIndex((index) => clamp(index - 1, 0, steps.length - 1));
        setIsPlaying(false);
    };

    const goToNext = () => {
        setCurrentStepIndex((index) => clamp(index + 1, 0, steps.length - 1));
        setIsPlaying(false);
    };

    const jumpToStart = () => {
        setCurrentStepIndex(0);
        setIsPlaying(false);
    };

    const jumpToEnd = () => {
        if (steps.length === 0) return;
        setCurrentStepIndex(steps.length - 1);
        setIsPlaying(false);
    };

    const toggleLoop = () => setLoopPlayback((value) => !value);
    const handleScrub = (value) => {
        if (!Number.isFinite(value)) return;
        const safeIndex = clamp(value, 0, Math.max(steps.length - 1, 0));
        setCurrentStepIndex(safeIndex);
        setIsPlaying(false);
    };

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 text-white">
            <div className="space-y-3">
                <Badge color="info" className="w-fit bg-cyan-500/20 text-cyan-300">
                    Interactive algorithm lab
                </Badge>
                <h1 className="text-3xl font-bold md:text-4xl">Algorithm Visualizer</h1>
                {selectedAlgorithm?.tagline && (
                    <p className="text-base font-semibold text-cyan-200">{selectedAlgorithm.tagline}</p>
                )}
                <p className="max-w-2xl text-lg text-slate-300">
                    Explore classic algorithms through code, pseudocode, and live data structures. Adjust the data,
                    scrub through every operation, and keep track of active phases with interactive highlights.
                </p>
            </div>

            <Card className="border border-slate-800/60 bg-slate-950/60">
                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[320px_1fr_320px]">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-200">Choose an algorithm</label>
                            <Select value={algorithmId} onChange={handleAlgorithmChange} className="bg-slate-900 text-white">
                                {algorithmCatalog.map((algorithm) => (
                                    <option key={algorithm.id} value={algorithm.id}>
                                        {algorithm.name} · {algorithm.category}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-200">Input dataset</label>
                            <TextInput
                                value={rawDataset}
                                onChange={(event) => setRawDataset(event.target.value)}
                                placeholder="Enter comma separated numbers"
                                helperText="Use commas or spaces to separate values. Up to 16 numbers are visualized."
                            />
                        </div>

                        {selectedAlgorithm?.requiresTarget && (
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-200">Target value</label>
                                <TextInput
                                    value={targetInput}
                                    onChange={(event) => setTargetInput(event.target.value)}
                                    placeholder="Value to search for"
                                />
                            </div>
                        )}

                        {selectedAlgorithm?.presets?.length ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
                                    <FaLightbulb className="text-amber-300" />
                                    Scenario presets
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedAlgorithm.presets.map((preset) => (
                                        <Button
                                            key={preset.label}
                                            color="gray"
                                            size="xs"
                                            onClick={() => handlePresetSelect(preset)}
                                            className="border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-cyan-500 hover:text-white"
                                        >
                                            {preset.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-3">
                            <Button color="light" onClick={handleRandomDataset}>
                                <FaRandom className="mr-2" /> Shuffle dataset
                            </Button>
                            <Button color="gray" onClick={handleReset}>
                                <FaRedoAlt className="mr-2" /> Reset playback
                            </Button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border border-slate-800/60 bg-slate-900/70 p-4">
                                <span className="text-xs uppercase tracking-widest text-slate-400">Category</span>
                                <p className="text-lg font-semibold">{selectedAlgorithm?.category}</p>
                            </div>
                            <div className="rounded-lg border border-slate-800/60 bg-slate-900/70 p-4">
                                <span className="text-xs uppercase tracking-widest text-slate-400">Elements</span>
                                <p className="text-lg font-semibold">{datasetSummary.length}</p>
                            </div>
                            <div className="rounded-lg border border-slate-800/60 bg-slate-900/70 p-4">
                                <span className="text-xs uppercase tracking-widest text-slate-400">Value span</span>
                                <p className="text-lg font-semibold">
                                    {datasetSummary.length ? `${datasetSummary.min} → ${datasetSummary.max}` : '–'}
                                </p>
                            </div>
                            <div className="rounded-lg border border-slate-800/60 bg-slate-900/70 p-4">
                                <span className="text-xs uppercase tracking-widest text-slate-400">Unique values</span>
                                <p className="text-lg font-semibold">{datasetSummary.unique}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <ArrayVisualizer step={currentStep} />
                        <div className="space-y-5 rounded-lg border border-slate-800/60 bg-slate-900/80 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <span className="font-semibold text-cyan-300">Step {currentStepIndex + 1}</span>
                                    <span className="text-slate-500">/</span>
                                    <span>{totalSteps}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Tooltip content="Jump to start">
                                        <span>
                                            <Button
                                                color="gray"
                                                onClick={jumpToStart}
                                                disabled={currentStepIndex === 0}
                                            >
                                                <FaFastBackward />
                                            </Button>
                                        </span>
                                    </Tooltip>
                                    <Tooltip content="Previous step">
                                        <span>
                                            <Button color="gray" onClick={goToPrevious} disabled={currentStepIndex === 0}>
                                                <FaStepBackward />
                                            </Button>
                                        </span>
                                    </Tooltip>
                                    <Tooltip content={isPlaying ? 'Pause autoplay' : 'Play animation'}>
                                        <span>
                                            <Button color="light" onClick={() => setIsPlaying((playing) => !playing)}>
                                                {isPlaying ? <FaPause /> : <FaPlay />}
                                            </Button>
                                        </span>
                                    </Tooltip>
                                    <Tooltip content="Next step">
                                        <span>
                                            <Button
                                                color="gray"
                                                onClick={goToNext}
                                                disabled={currentStepIndex >= totalSteps - 1}
                                            >
                                                <FaStepForward />
                                            </Button>
                                        </span>
                                    </Tooltip>
                                    <Tooltip content="Jump to end">
                                        <span>
                                            <Button
                                                color="gray"
                                                onClick={jumpToEnd}
                                                disabled={currentStepIndex >= totalSteps - 1}
                                            >
                                                <FaFastForward />
                                            </Button>
                                        </span>
                                    </Tooltip>
                                    <Tooltip content={loopPlayback ? 'Looping enabled' : 'Enable looped playback'}>
                                        <span>
                                            <Button
                                                color={loopPlayback ? 'success' : 'gray'}
                                                onClick={toggleLoop}
                                                outline={!loopPlayback}
                                            >
                                                <FaInfinity className="mr-2" />
                                                Loop
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </div>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
                            <motion.div
                                className="h-full bg-cyan-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ type: 'spring', stiffness: 180, damping: 28 }}
                            />
                        </div>
                        <div>
                            <input
                                type="range"
                                min={0}
                                max={Math.max(totalSteps - 1, 0)}
                                value={currentStepIndex}
                                onChange={(event) => handleScrub(Number(event.target.value))}
                                className="w-full accent-cyan-400"
                                disabled={totalSteps <= 1}
                            />
                            <div className="mt-1 flex justify-between text-[10px] uppercase tracking-widest text-slate-500">
                                <span>Start</span>
                                <span>Scrub</span>
                                <span>End</span>
                            </div>
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={currentStepIndex}
                                className="text-sm text-slate-300"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.25 }}
                            >
                                {currentStep?.message}
                            </motion.p>
                        </AnimatePresence>
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={nextStep ? `next-${currentStepIndex + 1}` : 'next-final'}
                                className="text-xs text-slate-500"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.25 }}
                            >
                                {nextStep ? `Next: ${nextStep.message}` : 'You are viewing the final state.'}
                            </motion.p>
                        </AnimatePresence>
                        <SpeedControl speedMs={speed} onChange={setSpeed} />
                    </div>
                    <LegendPanel />
                </div>

                    <div className="space-y-6">
                        <StepTimeline
                            steps={steps}
                            currentStepIndex={currentStepIndex}
                            onSelectStep={(index) => {
                                setCurrentStepIndex(index);
                                setIsPlaying(false);
                            }}
                        />
                        <StepDetails step={currentStep} />
                        <StatsPanel stats={aggregateStats} category={selectedAlgorithm?.category} />
                    </div>
                </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[0.6fr_1fr]">
                <Card className="border border-slate-800/60 bg-slate-950/60">
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge color="info" className="bg-cyan-500/20 text-cyan-300">
                                    {selectedAlgorithm?.category}
                                </Badge>
                                {selectedAlgorithm?.tagline && (
                                    <span className="text-xs uppercase tracking-widest text-slate-400">
                                        {selectedAlgorithm.tagline}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-semibold text-white">{selectedAlgorithm?.name}</h2>
                            <p className="text-base text-slate-300">{selectedAlgorithm?.description}</p>
                        </div>
                        <ComplexityCallout complexity={selectedAlgorithm?.complexity} />
                        {selectedAlgorithm?.insights && <InsightList insights={selectedAlgorithm.insights} />}
                    </div>
                </Card>

                <Card className="border border-slate-800/60 bg-slate-950/60">
                    <Tabs aria-label="Algorithm reference views" style="pills">
                        {selectedAlgorithm?.pseudocode ? (
                            <Tabs.Item title="Pseudocode">
                                <PseudocodeBlock pseudocode={selectedAlgorithm.pseudocode} activeLine={currentStep?.line} />
                            </Tabs.Item>
                        ) : null}
                        {selectedAlgorithm?.code ? (
                            <Tabs.Item title="Implementation">
                                <CodeBlock code={selectedAlgorithm.code} highlightedLines={codeHighlightLines} />
                            </Tabs.Item>
                        ) : null}
                        {!selectedAlgorithm?.pseudocode && !selectedAlgorithm?.code ? (
                            <Tabs.Item title="Overview">
                                <p className="text-sm text-slate-300">Reference material for this algorithm will be added soon.</p>
                            </Tabs.Item>
                        ) : null}
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
