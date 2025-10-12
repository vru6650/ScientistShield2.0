import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Card, Tooltip } from 'flowbite-react';
import { FaPause, FaPlay, FaRedoAlt, FaStepBackward, FaStepForward, FaInfoCircle } from 'react-icons/fa';
import hljs from 'highlight.js/lib/common';
import { codeVisualizerCatalog } from '../data/codeVisualizerData';
import CodeStudioScene from '../components/visualizer/CodeStudioScene';

const pointerMeta = {
    left: { label: 'L', color: 'bg-sky-500/20 text-sky-200' },
    right: { label: 'R', color: 'bg-violet-500/20 text-violet-200' },
    mid: { label: 'M', color: 'bg-emerald-500/20 text-emerald-200' },
    target: { label: 'T', color: 'bg-rose-500/20 text-rose-200' },
};

const pillAccents = {
    queue: 'border-amber-400/50 bg-amber-500/10 text-amber-100',
    visited: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100',
    order: 'border-sky-400/50 bg-sky-500/10 text-sky-100',
};

const floatingOrbs = [
    {
        size: '26rem',
        position: { top: '-18%', left: '12%' },
        colors: 'from-sky-500/40 via-transparent to-transparent',
        animation: { x: [0, 24, -16, 0], y: [0, -14, 10, 0], rotate: [0, 8, -6, 0] },
        duration: 24,
    },
    {
        size: '30rem',
        position: { top: '88%', left: '88%' },
        colors: 'from-purple-500/40 via-transparent to-transparent',
        animation: { x: [0, -30, 18, 0], y: [0, 18, -12, 0], rotate: [0, -10, 6, 0] },
        duration: 28,
    },
    {
        size: '18rem',
        position: { top: '26%', left: '74%' },
        colors: 'from-emerald-500/35 via-transparent to-transparent',
        animation: { x: [0, 12, -12, 0], y: [0, -10, 14, 0], rotate: [0, 12, -8, 0] },
        duration: 18,
    },
];

const FloatingBackdrop = () => (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.25),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.22),transparent_55%),radial-gradient(circle_at_50%_80%,rgba(14,165,233,0.18),transparent_65%)]" />
        {floatingOrbs.map((orb, index) => (
            <motion.span
                key={index}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br ${orb.colors} blur-3xl`}
                style={{
                    width: orb.size,
                    height: orb.size,
                    ...orb.position,
                }}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.8, delay: index * 0.25, ease: 'easeOut' }}
            >
                <motion.span
                    className="absolute inset-0 block"
                    animate={orb.animation}
                    transition={{ duration: orb.duration, repeat: Infinity, ease: 'easeInOut' }}
                />
            </motion.span>
        ))}
        <motion.div
            className="absolute left-1/2 top-[35%] h-24 w-[130%] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-500/25 via-transparent to-purple-500/25 blur-3xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
        />
    </div>
);

const FlowProgress = ({ progress }) => (
    <div className="relative h-2 overflow-hidden rounded-full bg-slate-900/60">
        <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-500 shadow-[0_0_24px_rgba(56,189,248,0.55)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 140, damping: 24 }}
        />
    </div>
);

const highlightCode = (code, highlight) => {
    if (!code) return [];
    const normalized = code.replace(/\r\n?/g, '\n');

    try {
        const { value } = hljs.highlight(normalized, { language: highlight });
        return value.split('\n').map((line, index) => ({
            lineNumber: index + 1,
            html: line.length ? line : '&nbsp;',
        }));
    } catch (error) {
        return normalized.split('\n').map((line, index) => ({
            lineNumber: index + 1,
            html: line.replace(/ /g, '&nbsp;') || '&nbsp;',
        }));
    }
};

const MetricBadges = ({ metrics }) => {
    if (!metrics?.length) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {metrics.map((metric) => (
                <Badge
                    key={`${metric.label}-${metric.value}`}
                    color="gray"
                    className="border border-slate-700/70 bg-slate-900/60 text-xs font-semibold uppercase tracking-wide text-slate-200 shadow-[0_0_18px_rgba(15,23,42,0.35)]"
                >
                    <span className="text-slate-400">{metric.label}:</span> <span className="ml-1 text-slate-100">{metric.value}</span>
                </Badge>
            ))}
        </div>
    );
};

const Timeline = ({ events }) => {
    if (!events?.length) return null;
    return (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 shadow-[0_0_32px_rgba(15,23,42,0.35)]">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Timeline</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {events.map((event, index) => (
                    <li key={`${event.label}-${index}`} className="flex gap-3">
                        <span className="font-mono text-xs text-slate-500">{event.label}</span>
                        <span className="flex-1 leading-relaxed text-slate-200/90">{event.description}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ConsolePanel = ({ lines }) => {
    if (!lines?.length) return null;
    return (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 font-mono text-sm text-emerald-200 shadow-[inset_0_0_32px_rgba(16,185,129,0.12)]">
            {lines.map((line, index) => (
                <div key={`${line}-${index}`}>{line}</div>
            ))}
        </div>
    );
};

const CodeLine = ({ line, active }) => (
    <motion.div
        layout="position"
        key={line.lineNumber}
        className="flex items-start gap-4 rounded-xl px-3 py-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{
            opacity: 1,
            y: 0,
            backgroundColor: active ? 'rgba(56,189,248,0.18)' : 'rgba(15,23,42,0)',
            scale: active ? 1.01 : 1,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        whileHover={{ backgroundColor: 'rgba(30,41,59,0.45)' }}
    >
        <span className="w-10 select-none text-right font-mono text-xs text-slate-500">{line.lineNumber}</span>
        <motion.code
            className={`flex-1 font-mono ${active ? 'text-slate-50' : 'text-slate-300'}`}
            dangerouslySetInnerHTML={{ __html: line.html }}
            initial={false}
            animate={{ color: active ? '#f8fafc' : '#94a3b8' }}
            transition={{ duration: 0.3 }}
        />
    </motion.div>
);

const PillCollection = ({ title, values, type }) => {
    if (!values?.length) return null;
    const accent = pillAccents[type] ?? 'border-slate-800/60 bg-slate-900/60 text-slate-300';
    return (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 shadow-[0_0_32px_rgba(15,23,42,0.35)]">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{title}</p>
            <div className="mt-3 flex flex-wrap gap-2">
                {values.map((value, index) => (
                    <span key={`${title}-${value}-${index}`} className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${accent}`}>
                        {value}
                    </span>
                ))}
            </div>
        </div>
    );
};

const ArrayState = ({ array, focus = {} }) => {
    if (!array?.length) return null;
    return (
        <div className="overflow-x-auto">
            <div className="inline-flex items-end gap-3">
                {array.map((value, index) => {
                    const markers = Object.entries(pointerMeta)
                        .filter(([key]) => focus[key] === index)
                        .map(([key, meta]) => meta);
                    const inWindow =
                        typeof focus.left === 'number' && typeof focus.right === 'number'
                            ? index >= focus.left && index <= focus.right
                            : false;
                    return (
                        <motion.div
                            key={`${value}-${index}`}
                            layout
                            className={`relative flex flex-col items-center ${markers.length ? 'pb-5' : 'pb-2'}`}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                        >
                            <AnimatePresence>
                                {markers.length ? (
                                    <motion.div
                                        key={`markers-${index}`}
                                        className="absolute -top-2 flex -translate-y-full gap-1"
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                    >
                                        {markers.map((meta, markerIndex) => (
                                            <span
                                                key={`${meta.label}-${markerIndex}`}
                                                className={`rounded-full border border-slate-700/60 px-2 py-1 text-[10px] font-semibold shadow-[0_0_16px_rgba(14,116,144,0.35)] ${meta.color}`}
                                            >
                                                {meta.label}
                                            </span>
                                        ))}
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                            <div
                                className={`flex h-24 w-16 items-end justify-center rounded-xl border-2 px-2 pb-3 font-mono text-lg font-semibold shadow-[0_12px_32px_rgba(15,23,42,0.35)] transition
                                    ${inWindow ? 'border-sky-400/60 bg-sky-500/10 text-sky-100' : 'border-slate-700/60 bg-slate-900/60 text-slate-100'}`}
                            >
                                {value}
                            </div>
                            <span className="mt-1 text-xs text-slate-500">[{index}]</span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

const StepStatePanel = ({ state }) => {
    if (!state) return null;
    return (
        <div className="space-y-4">
            <MetricBadges metrics={state.metrics} />
            {state.note ? <p className="text-sm leading-relaxed text-slate-300">{state.note}</p> : null}
            <ArrayState array={state.array} focus={state.focus} />
            <div className="grid gap-4 sm:grid-cols-2">
                <PillCollection title="Queue" values={state.queue} type="queue" />
                <PillCollection title="Visited" values={state.visited} type="visited" />
                <PillCollection title="Order" values={state.order} type="order" />
                {state.timeline?.length ? (
                    <div className="sm:col-span-2">
                        <Timeline events={state.timeline} />
                    </div>
                ) : null}
            </div>
            {state.console ? <ConsolePanel lines={state.console} /> : null}
        </div>
    );
};

const InsightCard = ({ insight }) => {
    const Icon = insight.icon ?? FaInfoCircle;
    return (
        <Card className="border border-slate-800/60 bg-slate-900/60 text-slate-300 shadow-[0_0_32px_rgba(15,23,42,0.35)] transition hover:border-slate-700/60 hover:shadow-[0_0_42px_rgba(59,130,246,0.3)]">
            <div className="flex items-start gap-4">
                <div className="rounded-full border border-sky-400/40 bg-sky-500/10 p-3 text-sky-300">
                    <Icon />
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-slate-100">{insight.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{insight.body}</p>
                </div>
            </div>
        </Card>
    );
};

export default function CodeVisualizer() {
    const [scenarioId, setScenarioId] = useState(codeVisualizerCatalog[0]?.id ?? '');
    const scenario = useMemo(
        () => codeVisualizerCatalog.find((entry) => entry.id === scenarioId) ?? codeVisualizerCatalog[0],
        [scenarioId],
    );
    const languageKeys = useMemo(() => Object.keys(scenario.languages), [scenario]);
    const [languageKey, setLanguageKey] = useState(languageKeys[0]);
    useEffect(() => {
        setLanguageKey(languageKeys[0]);
    }, [languageKeys]);

    const language = scenario.languages[languageKey];
    const steps = language.steps ?? [];
    const [stepIndex, setStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(2600);
    const [codeZoom, setCodeZoom] = useState(100);

    useEffect(() => {
        setStepIndex(0);
        setIsPlaying(false);
    }, [scenarioId, languageKey]);

    useEffect(() => {
        if (!isPlaying || !steps.length) return;
        if (stepIndex >= steps.length - 1) {
            setIsPlaying(false);
            return;
        }
        const timer = setTimeout(() => {
            setStepIndex((current) => Math.min(current + 1, steps.length - 1));
        }, playbackSpeed);
        return () => clearTimeout(timer);
    }, [isPlaying, stepIndex, steps.length, playbackSpeed]);

    useEffect(() => {
        if (stepIndex >= steps.length - 1) {
            setIsPlaying(false);
        }
    }, [stepIndex, steps.length]);

    const currentStep = steps[stepIndex] ?? null;
    const highlightedLines = useMemo(() => highlightCode(language.code, language.highlight), [language]);
    const progress = steps.length ? ((stepIndex + 1) / steps.length) * 100 : 0;
    const stepSliderMax = Math.max(steps.length - 1, 0);
    const playbackMultiplier = useMemo(() => (playbackSpeed ? (2600 / playbackSpeed).toFixed(1) : '1.0'), [playbackSpeed]);
    const computedFontSize = useMemo(() => 0.9 * (codeZoom / 100), [codeZoom]);

    const goToStep = (index) => {
        setStepIndex(Math.max(0, Math.min(index, steps.length - 1)));
    };

    const handleStepSliderChange = (value) => {
        const numericValue = Number(value);
        setIsPlaying(false);
        goToStep(Number.isNaN(numericValue) ? 0 : numericValue);
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
            <FloatingBackdrop />
            <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 pb-24 pt-16">
                <header className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/60 px-8 py-12 shadow-[0_40px_120px_rgba(15,23,42,0.6)]">
                    <CodeStudioScene className="absolute inset-0 hidden lg:block opacity-80 mix-blend-screen" />
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-sky-500/20 via-transparent to-transparent" />
                    <div className="relative z-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
                        <div className="space-y-8">
                            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-200">
                                Interactive flow studio
                            </span>
                            <div className="space-y-4">
                                <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Algorithm Flow Explorer</h1>
                                <p className="max-w-2xl text-lg text-slate-300">
                                    Step through complex routines with a cinematic workspace inspired by staying.fun. Explore languages, watch state evolve, and orchestrate playback to fit your learning rhythm.
                                </p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4 shadow-[0_0_32px_rgba(15,23,42,0.45)]">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Scenarios</p>
                                    <p className="mt-2 text-2xl font-semibold text-white">{codeVisualizerCatalog.length}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4 shadow-[0_0_32px_rgba(15,23,42,0.45)]">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Languages</p>
                                    <p className="mt-2 text-2xl font-semibold text-white">{languageKeys.length}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4 shadow-[0_0_32px_rgba(15,23,42,0.45)]">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Current focus</p>
                                    <p className="mt-2 text-base font-semibold text-slate-100">{scenario.title}</p>
                                    <p className="text-xs text-slate-500">{scenario.difficulty}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-5 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-6 shadow-[0_0_40px_rgba(59,130,246,0.25)]">
                            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
                                <span>Active journey</span>
                                <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-sky-200">{language.label}</span>
                            </div>
                            <FlowProgress progress={progress} />
                            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
                                <span>Step {steps.length ? stepIndex + 1 : 0} / {steps.length || '—'}</span>
                                <span>{playbackMultiplier}x speed</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Timeline</p>
                                    <p className="mt-1 font-semibold text-slate-100">{steps.length} steps</p>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Difficulty</p>
                                    <p className="mt-1 font-semibold text-slate-100">{scenario.difficulty}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
                    <section className="order-2 space-y-6 xl:order-1">
                        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Select scenario</h2>
                                <Badge color="warning" className="bg-amber-500/10 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200">
                                    {codeVisualizerCatalog.length} flows
                                </Badge>
                            </div>
                            <div className="mt-5 space-y-3">
                                {codeVisualizerCatalog.map((entry) => {
                                    const active = entry.id === scenario.id;
                                    return (
                                        <button
                                            key={entry.id}
                                            type="button"
                                            onClick={() => setScenarioId(entry.id)}
                                            className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                                                active
                                                    ? 'border-sky-500/60 bg-sky-500/10 text-slate-100 shadow-[0_0_32px_rgba(59,130,246,0.35)]'
                                                    : 'border-slate-800/60 bg-slate-950/40 text-slate-300 hover:border-slate-700/60 hover:bg-slate-900/60 hover:text-slate-100'
                                            }`}
                                        >
                                            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">{entry.title}</span>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-400">{entry.summary}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <Badge
                                                    color={active ? 'info' : 'gray'}
                                                    className={`${active ? 'bg-sky-500/30 text-sky-100' : 'bg-slate-800/80 text-slate-400'} text-[10px] uppercase tracking-[0.3em]`}
                                                >
                                                    {entry.difficulty}
                                                </Badge>
                                                {entry.tags.slice(0, 2).map((tag) => (
                                                    <Badge key={`${entry.id}-${tag}`} color="gray" className="bg-slate-800/80 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Playback control</h3>
                                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Step {steps.length ? stepIndex + 1 : 0}</span>
                            </div>
                            <div className="mt-5 space-y-5">
                                <div>
                                    <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
                                        <span>Speed</span>
                                        <span className="text-slate-300">{playbackMultiplier}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="800"
                                        max="3200"
                                        step="200"
                                        value={playbackSpeed}
                                        onChange={(event) => setPlaybackSpeed(Number(event.target.value))}
                                        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800/60 accent-sky-500"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
                                        <span>Zoom</span>
                                        <span className="text-slate-300">{codeZoom}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="80"
                                        max="130"
                                        step="5"
                                        value={codeZoom}
                                        onChange={(event) => setCodeZoom(Number(event.target.value))}
                                        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800/60 accent-sky-500"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
                                        <span>Scrub steps</span>
                                        <span className="text-slate-300">{steps.length ? `${stepIndex + 1}/${steps.length}` : '—'}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={stepSliderMax}
                                        step="1"
                                        value={stepIndex}
                                        onChange={(event) => handleStepSliderChange(event.target.value)}
                                        disabled={!steps.length}
                                        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800/60 accent-sky-500 disabled:cursor-not-allowed disabled:opacity-30"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPlaying(true)}
                                    disabled={!steps.length}
                                    className="rounded-full border border-sky-500/40 bg-sky-500/10 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-100 transition hover:bg-sky-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Start auto-play
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsPlaying(false)}
                                    className="rounded-full border border-slate-700/60 bg-slate-900/60 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300 transition hover:border-slate-600/60 hover:text-slate-100 focus:outline-none"
                                >
                                    Pause
                                </button>
                            </div>
                        </div>
                    </section>
                    <section className="order-1 space-y-6 xl:order-2">
                        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-[0_40px_120px_rgba(15,23,42,0.55)]">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-semibold text-white">{scenario.title}</h2>
                                        <p className="text-sm text-slate-300">{scenario.summary}</p>
                                    </div>
                                    <MetricBadges metrics={scenario.metrics} />
                                </div>
                                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => goToStep(stepIndex - 1)}
                                                disabled={stepIndex === 0}
                                                className="rounded-full border border-slate-700/60 bg-slate-900/60 p-2 text-slate-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                                aria-label="Previous step"
                                            >
                                                <FaStepBackward />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsPlaying((prev) => !prev)}
                                                disabled={!steps.length}
                                                className={`rounded-full border p-2 transition focus:outline-none ${
                                                    isPlaying
                                                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
                                                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                                                } disabled:cursor-not-allowed disabled:opacity-40`}
                                                aria-label={isPlaying ? 'Pause playback' : 'Play steps'}
                                            >
                                                {isPlaying ? <FaPause /> : <FaPlay />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => goToStep(stepIndex + 1)}
                                                disabled={stepIndex >= steps.length - 1}
                                                className="rounded-full border border-slate-700/60 bg-slate-900/60 p-2 text-slate-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                                aria-label="Next step"
                                            >
                                                <FaStepForward />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => goToStep(0)}
                                                disabled={!stepIndex}
                                                className="rounded-full border border-slate-700/60 bg-slate-900/60 p-2 text-slate-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                                aria-label="Restart"
                                            >
                                                <FaRedoAlt />
                                            </button>
                                        </div>
                                        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                                            Step {steps.length ? stepIndex + 1 : 0} of {steps.length}
                                        </span>
                                    </div>
                                    <div className="relative mt-4">
                                        <FlowProgress progress={progress} />
                                        <span className="absolute -top-3 right-0 rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 shadow-[0_0_22px_rgba(15,23,42,0.8)]">
                                            {steps.length ? `Progress ${(progress || 0).toFixed(0)}%` : 'Awaiting steps'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {languageKeys.map((key) => {
                                        const active = key === languageKey;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setLanguageKey(key)}
                                                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                                                    active
                                                        ? 'border-sky-500/60 bg-sky-500/20 text-sky-100 shadow-[0_0_22px_rgba(56,189,248,0.4)]'
                                                        : 'border-slate-800/60 bg-slate-900/60 text-slate-400 hover:border-slate-700/60 hover:text-slate-200'
                                                }`}
                                            >
                                                {scenario.languages[key].label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                                    <div className="overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/40 shadow-[0_20px_60px_rgba(15,23,42,0.6)]">
                                        <header className="flex items-center justify-between border-b border-slate-800/60 bg-slate-900/60 px-4 py-3">
                                            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Highlighted code</span>
                                            {currentStep?.title ? (
                                                <Tooltip content={currentStep.description} style="dark">
                                                    <span className="flex items-center gap-2 text-xs text-sky-200">
                                                        <FaInfoCircle />
                                                        {currentStep.title}
                                                    </span>
                                                </Tooltip>
                                            ) : null}
                                        </header>
                                        <div className="max-h-[480px] overflow-auto">
                                            <pre className="m-0 bg-transparent p-4 text-slate-200" style={{ fontSize: `${computedFontSize}rem` }}>
                                                <AnimatePresence mode="sync">
                                                    {highlightedLines.map((line) => (
                                                        <CodeLine
                                                            key={line.lineNumber}
                                                            line={line}
                                                            active={currentStep?.lines?.includes(line.lineNumber)}
                                                        />
                                                    ))}
                                                </AnimatePresence>
                                            </pre>
                                        </div>
                                    </div>
                                    <div className="space-y-4 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.6)]">
                                        <AnimatePresence mode="wait">
                                            {currentStep ? (
                                                <motion.div
                                                    key={currentStep.title}
                                                    className="space-y-3"
                                                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -12, scale: 0.98 }}
                                                    transition={{ duration: 0.45, ease: 'easeOut' }}
                                                >
                                                    <div>
                                                        <motion.h3
                                                            className="text-lg font-semibold text-slate-100"
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.1, duration: 0.4 }}
                                                        >
                                                            {currentStep.title}
                                                        </motion.h3>
                                                        <motion.p
                                                            className="text-sm leading-relaxed text-slate-300"
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.18, duration: 0.4 }}
                                                        >
                                                            {currentStep.description}
                                                        </motion.p>
                                                    </div>
                                                    <StepStatePanel state={currentStep.state} />
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="empty-state"
                                                    className="py-12 text-center text-slate-500"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                >
                                                    Select a scenario to begin exploring.
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <aside className="order-3 space-y-6 xl:pl-0">
                        {scenario.insights?.length ? (
                            <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
                                <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Insight deck</h3>
                                <div className="mt-4 space-y-4">
                                    {scenario.insights.map((insight) => (
                                        <InsightCard key={`side-${insight.title}`} insight={insight} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
                                <p className="leading-relaxed">
                                    Choose any flow to unlock curated insights about algorithmic trade-offs, mental models, and extension ideas tailored to the active scenario.
                                </p>
                            </div>
                        )}
                    </aside>
                </main>
            </div>
        </div>
    );
}
