import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Button, Card, Tooltip } from 'flowbite-react';
import { FaPause, FaPlay, FaRedoAlt, FaStepBackward, FaStepForward, FaInfoCircle } from 'react-icons/fa';
import hljs from 'highlight.js/lib/common';
import { codeVisualizerCatalog } from '../data/codeVisualizerData';

const pointerMeta = {
    left: { label: 'L', color: 'bg-sky-500 text-white' },
    right: { label: 'R', color: 'bg-purple-500 text-white' },
    mid: { label: 'M', color: 'bg-emerald-500 text-slate-900' },
    target: { label: 'T', color: 'bg-rose-500 text-white' },
};

const pillAccents = {
    queue: 'border-amber-500/50 bg-amber-500/10 text-amber-100',
    visited: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
    order: 'border-sky-500/40 bg-sky-500/10 text-sky-100',
};

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
                    className="border border-slate-600/60 bg-slate-800/60 text-xs font-semibold uppercase tracking-wide"
                >
                    <span className="text-slate-300">{metric.label}:</span> <span className="ml-1 text-white">{metric.value}</span>
                </Badge>
            ))}
        </div>
    );
};

const Timeline = ({ events }) => {
    if (!events?.length) return null;
    return (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Timeline</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {events.map((event, index) => (
                    <li key={`${event.label}-${index}`} className="flex gap-3">
                        <span className="font-mono text-xs text-slate-500">{event.label}</span>
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
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 font-mono text-sm text-emerald-200 shadow-inner shadow-emerald-500/10">
            {lines.map((line, index) => (
                <div key={`${line}-${index}`}>{line}</div>
            ))}
        </div>
    );
};

const PillCollection = ({ title, values, type }) => {
    if (!values?.length) return null;
    const accent = pillAccents[type] ?? 'border-slate-600/60 bg-slate-800/60 text-slate-100';
    return (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4">
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
                                                className={`rounded-full border border-white/20 px-2 py-1 text-[10px] font-semibold ${meta.color}`}
                                            >
                                                {meta.label}
                                            </span>
                                        ))}
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                            <div
                                className={`flex h-24 w-16 items-end justify-center rounded-xl border-2 px-2 pb-3 font-mono text-lg font-semibold shadow-lg shadow-black/20 transition
                                    ${inWindow ? 'border-sky-500/60 bg-sky-500/10 text-sky-100' : 'border-slate-600/60 bg-slate-800/60 text-slate-100'}`}
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
            {state.note ? <p className="text-sm leading-relaxed text-slate-200">{state.note}</p> : null}
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
        <Card className="border border-slate-700/50 bg-slate-900/70 text-slate-100 transition hover:border-slate-500/60 hover:bg-slate-900">
            <div className="flex items-start gap-4">
                <div className="rounded-full border border-slate-600/60 bg-slate-800/80 p-3 text-sky-300">
                    <Icon />
                </div>
                <div>
                    <h4 className="text-lg font-semibold">{insight.title}</h4>
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

    useEffect(() => {
        setStepIndex(0);
        setIsPlaying(false);
    }, [scenarioId, languageKey]);

    useEffect(() => {
        if (!isPlaying) return;
        const timer = setInterval(() => {
            setStepIndex((current) => {
                if (current >= steps.length - 1) {
                    clearInterval(timer);
                    return current;
                }
                return current + 1;
            });
        }, 2600);
        return () => clearInterval(timer);
    }, [isPlaying, steps.length]);

    useEffect(() => {
        if (stepIndex >= steps.length - 1) {
            setIsPlaying(false);
        }
    }, [stepIndex, steps.length]);

    const currentStep = steps[stepIndex] ?? null;
    const highlightedLines = useMemo(() => highlightCode(language.code, language.highlight), [language]);
    const progress = steps.length ? ((stepIndex + 1) / steps.length) * 100 : 0;

    const goToStep = (index) => {
        setStepIndex(Math.max(0, Math.min(index, steps.length - 1)));
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_55%)] from-slate-950 via-slate-950 to-slate-950 text-slate-100">
            <div className="border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
                <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 lg:flex-row lg:items-center">
                    <div className="flex-1 space-y-4">
                        <Badge color="info" className="w-fit uppercase tracking-wide">Inspired by interactive labs</Badge>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                            Code Visualizer Studio
                        </h1>
                        <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
                            Step through algorithms and interaction patterns with a presentation style reminiscent of staying.fun. Each scenario combines highlighted code with live state snapshots so you can see how the logic evolves in real time.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-300">
                        <span className="text-xs uppercase tracking-wider text-slate-400">What is this?</span>
                        <p>
                            A guided viewer for popular code flows. Choose an example, pick a language, and scrub through each stage with animated highlights and state panels.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[280px_1fr]">
                <aside className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Scenarios</h2>
                        <Badge color="warning" className="bg-amber-500/10 text-xs font-semibold uppercase tracking-wider text-amber-300">
                            {codeVisualizerCatalog.length} flows
                        </Badge>
                    </div>
                    <div className="space-y-3">
                        {codeVisualizerCatalog.map((entry) => {
                            const active = entry.id === scenario.id;
                            return (
                                <button
                                    key={entry.id}
                                    onClick={() => setScenarioId(entry.id)}
                                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                                        active
                                            ? 'border-sky-500/60 bg-sky-500/10 text-sky-100 shadow-lg shadow-sky-900/30'
                                            : 'border-slate-800/60 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                                    }`}
                                >
                                    <span className="text-sm font-semibold uppercase tracking-wide">{entry.title}</span>
                                    <p className="mt-2 text-xs leading-relaxed opacity-80">{entry.summary}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge color={active ? 'info' : 'gray'} className="text-[10px] uppercase tracking-wider">
                                            {entry.difficulty}
                                        </Badge>
                                        {entry.tags.slice(0, 2).map((tag) => (
                                            <Badge key={`${entry.id}-${tag}`} color="gray" className="text-[10px] uppercase tracking-wider">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <section className="space-y-8">
                    <div className="space-y-4 rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-2xl shadow-black/20">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{scenario.title}</h2>
                                <p className="mt-1 text-sm text-slate-300">{scenario.summary}</p>
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
                                        color="gray"
                                        onClick={() => setLanguageKey(key)}
                                        className={`${
                                            active
                                                ? 'bg-sky-500 text-white hover:bg-sky-400 focus:ring-sky-300'
                                                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 focus:ring-slate-600'
                                        } border border-slate-700/60 font-semibold uppercase tracking-wide`}
                                    >
                                        {scenario.languages[key].label}
                                    </Button>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    pill
                                    color="gray"
                                    size="xs"
                                    onClick={() => goToStep(stepIndex - 1)}
                                    disabled={stepIndex === 0}
                                >
                                    <FaStepBackward />
                                </Button>
                                <Button
                                    pill
                                    color={isPlaying ? 'failure' : 'success'}
                                    size="xs"
                                    onClick={() => setIsPlaying((prev) => !prev)}
                                    disabled={!steps.length}
                                >
                                    {isPlaying ? <FaPause /> : <FaPlay />}
                                </Button>
                                <Button
                                    pill
                                    color="gray"
                                    size="xs"
                                    onClick={() => goToStep(stepIndex + 1)}
                                    disabled={stepIndex >= steps.length - 1}
                                >
                                    <FaStepForward />
                                </Button>
                                <Button pill color="gray" size="xs" onClick={() => goToStep(0)} disabled={!stepIndex}>
                                    <FaRedoAlt />
                                </Button>
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Step {steps.length ? stepIndex + 1 : 0} of {steps.length}
                            </span>
                        </div>

                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-cyan-400 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)]">
                            <div className="overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/80 shadow-inner shadow-black/40">
                                <header className="flex items-center justify-between border-b border-slate-800/60 bg-slate-900/70 px-4 py-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Highlighted Code</span>
                                    {currentStep?.title ? (
                                        <Tooltip content={currentStep.description} style="dark">
                                            <span className="flex items-center gap-2 text-xs text-sky-300">
                                                <FaInfoCircle />
                                                {currentStep.title}
                                            </span>
                                        </Tooltip>
                                    ) : null}
                                </header>
                                <div className="max-h-[480px] overflow-auto">
                                    <pre className="m-0 bg-transparent p-4 text-sm leading-relaxed">
                                        {highlightedLines.map((line) => {
                                            const active = currentStep?.lines?.includes(line.lineNumber);
                                            return (
                                                <div
                                                    key={line.lineNumber}
                                                    className={`flex items-start gap-4 rounded-lg px-3 py-1 transition ${
                                                        active ? 'bg-sky-500/15 ring-1 ring-sky-500/40' : 'hover:bg-slate-800/40'
                                                    }`}
                                                >
                                                    <span className="w-10 select-none text-right font-mono text-xs text-slate-500">{line.lineNumber}</span>
                                                    <code
                                                        className={`flex-1 font-mono text-xs md:text-sm ${active ? 'text-white' : 'text-slate-200'}`}
                                                        dangerouslySetInnerHTML={{ __html: line.html }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </pre>
                                </div>
                            </div>
                            <div className="space-y-4 rounded-2xl border border-slate-800/60 bg-slate-950/80 p-6 shadow-inner shadow-black/40">
                                {currentStep ? (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-white">{currentStep.title}</h3>
                                        <p className="text-sm leading-relaxed text-slate-300">{currentStep.description}</p>
                                        <StepStatePanel state={currentStep.state} />
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-slate-400">Select a scenario to begin exploring.</div>
                                )}
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
                </section>
            </div>
        </div>
    );
}
