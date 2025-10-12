import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Button, Card, Tooltip } from 'flowbite-react';
import { FaPause, FaPlay, FaRedoAlt, FaStepBackward, FaStepForward, FaInfoCircle } from 'react-icons/fa';
import hljs from 'highlight.js/lib/common';
import { codeVisualizerCatalog } from '../data/codeVisualizerData';

const pointerMeta = {
    left: { label: 'L', color: 'bg-sky-100 text-sky-600' },
    right: { label: 'R', color: 'bg-violet-100 text-violet-600' },
    mid: { label: 'M', color: 'bg-emerald-100 text-emerald-600' },
    target: { label: 'T', color: 'bg-rose-100 text-rose-600' },
};

const pillAccents = {
    queue: 'border-amber-200 bg-amber-50 text-amber-600',
    visited: 'border-emerald-200 bg-emerald-50 text-emerald-600',
    order: 'border-sky-200 bg-sky-50 text-sky-600',
};

const floatingOrbs = [
    {
        size: '26rem',
        position: { top: '-18%', left: '12%' },
        colors: 'from-sky-300/50 via-transparent to-transparent',
        animation: { x: [0, 24, -16, 0], y: [0, -14, 10, 0], rotate: [0, 8, -6, 0] },
        duration: 24,
    },
    {
        size: '30rem',
        position: { top: '88%', left: '88%' },
        colors: 'from-purple-400/40 via-transparent to-transparent',
        animation: { x: [0, -30, 18, 0], y: [0, 18, -12, 0], rotate: [0, -10, 6, 0] },
        duration: 28,
    },
    {
        size: '18rem',
        position: { top: '26%', left: '74%' },
        colors: 'from-emerald-300/40 via-transparent to-transparent',
        animation: { x: [0, 12, -12, 0], y: [0, -10, 14, 0], rotate: [0, 12, -8, 0] },
        duration: 18,
    },
];

const FloatingBackdrop = () => (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.08),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(14,165,233,0.05),transparent_60%)]" />
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
            className="absolute left-1/2 top-[35%] h-24 w-[120%] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200/30 via-white/0 to-purple-200/30 blur-2xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
        />
    </div>
);

const FlowProgress = ({ progress }) => (
    <div className="relative h-2 overflow-hidden rounded-full bg-slate-200/60">
        <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-500 shadow-[0_0_18px_rgba(56,189,248,0.45)]"
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
                    className="border border-slate-200 bg-white/80 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm"
                >
                    <span className="text-slate-500">{metric.label}:</span> <span className="ml-1 text-slate-800">{metric.value}</span>
                </Badge>
            ))}
        </div>
    );
};

const Timeline = ({ events }) => {
    if (!events?.length) return null;
    return (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Timeline</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {events.map((event, index) => (
                    <li key={`${event.label}-${index}`} className="flex gap-3">
                        <span className="font-mono text-xs text-slate-400">{event.label}</span>
                        <span className="flex-1 leading-relaxed">{event.description}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ConsolePanel = ({ lines }) => {
    if (!lines?.length) return null;
    return (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 font-mono text-sm text-emerald-600 shadow-inner shadow-emerald-100/60">
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
            backgroundColor: active ? 'rgba(224,242,254,0.95)' : 'rgba(255,255,255,0)',
            scale: active ? 1.01 : 1,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        whileHover={{ backgroundColor: 'rgba(226,232,240,0.45)' }}
    >
        <span className="w-10 select-none text-right font-mono text-xs text-slate-300">{line.lineNumber}</span>
        <motion.code
            className={`flex-1 font-mono ${active ? 'text-slate-900' : 'text-slate-600'}`}
            dangerouslySetInnerHTML={{ __html: line.html }}
            initial={false}
            animate={{ color: active ? '#0f172a' : '#475569' }}
            transition={{ duration: 0.3 }}
        />
    </motion.div>
);

const PillCollection = ({ title, values, type }) => {
    if (!values?.length) return null;
    const accent = pillAccents[type] ?? 'border-slate-200 bg-slate-100 text-slate-600';
    return (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{title}</p>
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
                                                className={`rounded-full border border-white/60 px-2 py-1 text-[10px] font-semibold shadow-sm ${meta.color}`}
                                            >
                                                {meta.label}
                                            </span>
                                        ))}
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                            <div
                                className={`flex h-24 w-16 items-end justify-center rounded-xl border-2 px-2 pb-3 font-mono text-lg font-semibold shadow-lg shadow-slate-200/60 transition
                                    ${inWindow ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-700'}`}
                            >
                                {value}
                            </div>
                            <span className="mt-1 text-xs text-slate-400">[{index}]</span>
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
            {state.note ? <p className="text-sm leading-relaxed text-slate-600">{state.note}</p> : null}
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
        <Card className="border border-slate-200 bg-white/80 text-slate-700 shadow-md transition hover:shadow-lg">
            <div className="flex items-start gap-4">
                <div className="rounded-full border border-sky-100 bg-sky-50 p-3 text-sky-500">
                    <Icon />
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-slate-900">{insight.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{insight.body}</p>
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
        <div className="relative min-h-screen overflow-hidden bg-[#f4f7ff] text-slate-700">
            <FloatingBackdrop />
            <div className="mx-auto max-w-6xl px-6 pb-20 pt-16">
                <header className="mb-12 overflow-hidden rounded-3xl bg-white/70 px-8 py-12 shadow-2xl shadow-sky-100/60 backdrop-blur">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-3xl space-y-4">
                            <Badge color="info" className="w-fit bg-sky-100 text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
                                Interactive learning lab
                            </Badge>
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Code Visualizer Studio</h1>
                            <p className="text-lg leading-relaxed text-slate-600">
                                Step through algorithms with a calm, presentation-ready canvas inspired by staying.fun. Compare languages, monitor state, and control pacing to make complex flows feel approachable.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600 shadow-md">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">At a glance</p>
                            <ul className="mt-3 space-y-2">
                                <li className="flex items-center justify-between gap-6">
                                    <span>Interactive flows</span>
                                    <span className="font-semibold text-slate-900">{codeVisualizerCatalog.length}</span>
                                </li>
                                <li className="flex items-center justify-between gap-6">
                                    <span>Languages available</span>
                                    <span className="font-semibold text-slate-900">{languageKeys.length}</span>
                                </li>
                                <li className="flex items-center justify-between gap-6">
                                    <span>Current focus</span>
                                    <span className="font-semibold text-slate-900">{scenario.title}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </header>
                <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-8">
                        <div className="rounded-3xl bg-white/90 p-6 shadow-2xl shadow-slate-200/70">
                            <div className="flex flex-col gap-6">
                                <motion.div
                                        className="relative"
                                        initial={{ opacity: 0, y: 18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                    >
                                        <FlowProgress progress={progress} />
                                        <motion.span
                                            className="absolute -top-3 right-0 rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 shadow"
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2, duration: 0.4 }}
                                        >
                                            {steps.length ? `Progress ${(progress || 0).toFixed(0)}%` : 'Select a scenario'}
                                        </motion.span>
                                    </motion.div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-slate-900">{scenario.title}</h2>
                                        <p className="mt-1 text-sm text-slate-600">{scenario.summary}</p>
                                    </div>
                                    <MetricBadges metrics={scenario.metrics} />
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {languageKeys.map((key) => {
                                        const active = key === languageKey;
                                        return (
                                            <Button
                                                key={key}
                                                size="xs"
                                                color="light"
                                                onClick={() => setLanguageKey(key)}
                                                className={`${
                                                    active
                                                        ? 'bg-sky-500 text-white hover:bg-sky-400 focus:ring-sky-200'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 focus:ring-slate-200'
                                                } border border-transparent px-4 py-2 font-semibold uppercase tracking-wide`}
                                            >
                                                {scenario.languages[key].label}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner shadow-slate-100">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                pill
                                                color="light"
                                                size="xs"
                                                onClick={() => goToStep(stepIndex - 1)}
                                                disabled={stepIndex === 0}
                                                className="bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                                            >
                                                <FaStepBackward />
                                            </Button>
                                            <Button
                                                pill
                                                color="light"
                                                size="xs"
                                                onClick={() => setIsPlaying((prev) => !prev)}
                                                disabled={!steps.length}
                                                className={`${
                                                    isPlaying
                                                        ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                                                        : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                                                } font-semibold`}
                                            >
                                                {isPlaying ? <FaPause /> : <FaPlay />}
                                            </Button>
                                            <Button
                                                pill
                                                color="light"
                                                size="xs"
                                                onClick={() => goToStep(stepIndex + 1)}
                                                disabled={stepIndex >= steps.length - 1}
                                                className="bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                                            >
                                                <FaStepForward />
                                            </Button>
                                            <Button
                                                pill
                                                color="light"
                                                size="xs"
                                                onClick={() => goToStep(0)}
                                                disabled={!stepIndex}
                                                className="bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                                            >
                                                <FaRedoAlt />
                                            </Button>
                                        </div>
                                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                                            Step {steps.length ? stepIndex + 1 : 0} of {steps.length}
                                        </span>
                                    </div>
                                    <FlowProgress progress={progress} />
                                </div>
                                <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-inner shadow-slate-100">
                                        <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3">
                                            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Highlighted Code</span>
                                            {currentStep?.title ? (
                                                <Tooltip content={currentStep.description} style="light">
                                                    <span className="flex items-center gap-2 text-xs text-sky-500">
                                                        <FaInfoCircle />
                                                        {currentStep.title}
                                                    </span>
                                                </Tooltip>
                                            ) : null}
                                        </header>
                                        <div className="max-h-[480px] overflow-auto">
                                            <pre className="m-0 bg-transparent p-4" style={{ fontSize: `${computedFontSize}rem` }}>
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
                                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-inner shadow-slate-100">
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
                                                            className="text-lg font-semibold text-slate-900"
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.1, duration: 0.4 }}
                                                        >
                                                            {currentStep.title}
                                                        </motion.h3>
                                                        <motion.p
                                                            className="text-sm leading-relaxed text-slate-600"
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
                                                    className="py-12 text-center text-slate-400"
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
                        {scenario.insights?.length ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {scenario.insights.map((insight) => (
                                    <InsightCard key={insight.title} insight={insight} />
                                ))}
                            </div>
                        ) : null}
                    </div>
                    <div className="space-y-6">
                        <div className="rounded-3xl bg-white/90 p-6 shadow-2xl shadow-slate-200/70">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Example flows</h3>
                                <Badge color="warning" className="bg-amber-100 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                    {codeVisualizerCatalog.length} total
                                </Badge>
                            </div>
                            <div className="mt-4 space-y-3">
                                {codeVisualizerCatalog.map((entry) => {
                                    const active = entry.id === scenario.id;
                                    return (
                                        <button
                                            key={entry.id}
                                            onClick={() => setScenarioId(entry.id)}
                                            className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                                                active
                                                    ? 'border-sky-300 bg-sky-50 shadow-lg shadow-sky-100'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                                            }`}
                                        >
                                            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{entry.title}</span>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">{entry.summary}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <Badge
                                                    color={active ? 'info' : 'gray'}
                                                    className={`${active ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'} text-[10px] uppercase tracking-[0.3em]`}
                                                >
                                                    {entry.difficulty}
                                                </Badge>
                                                {entry.tags.slice(0, 2).map((tag) => (
                                                    <Badge key={`${entry.id}-${tag}`} color="gray" className="bg-slate-100 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="rounded-3xl bg-white/90 p-6 shadow-2xl shadow-slate-200/70">
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Playback controls</h3>
                                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Step {steps.length ? stepIndex + 1 : 0}</span>
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
                                            <span>Speed</span>
                                            <span className="text-slate-600">{playbackMultiplier}x</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="800"
                                            max="3200"
                                            step="200"
                                            value={playbackSpeed}
                                            onChange={(event) => setPlaybackSpeed(Number(event.target.value))}
                                            className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-100 accent-sky-500"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
                                            <span>Zoom</span>
                                            <span className="text-slate-600">{codeZoom}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="80"
                                            max="130"
                                            step="5"
                                            value={codeZoom}
                                            onChange={(event) => setCodeZoom(Number(event.target.value))}
                                            className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-100 accent-sky-500"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
                                            <span>Scrub steps</span>
                                            <span className="text-slate-600">{steps.length ? `${stepIndex + 1}/${steps.length}` : '—'}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max={stepSliderMax}
                                            step="1"
                                            value={stepIndex}
                                            onChange={(event) => handleStepSliderChange(event.target.value)}
                                            disabled={!steps.length}
                                            className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-100 accent-sky-500 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Button
                                        color="light"
                                        className="bg-slate-100 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-600 hover:bg-slate-200"
                                        onClick={() => setIsPlaying(true)}
                                        disabled={!steps.length}
                                    >
                                        Start auto-play
                                    </Button>
                                    <Button
                                        color="light"
                                        className="bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 shadow-inner hover:bg-slate-50"
                                        onClick={() => setIsPlaying(false)}
                                    >
                                        Pause
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
