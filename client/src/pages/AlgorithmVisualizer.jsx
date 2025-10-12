import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaFastBackward, FaFastForward, FaPause, FaPlay, FaStepBackward, FaStepForward } from 'react-icons/fa';
import SortingCanvas from '../components/visualizer/SortingCanvas';
import StructureCanvas from '../components/visualizer/StructureCanvas';
import { algorithmGroups, findAlgorithmById } from '../data/visualizerCatalog';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const LANGUAGE_OPTIONS = [
    {
        id: 'javascript',
        label: 'JavaScript',
        runtime: 'Sandboxed VM',
        description: 'Execute custom logic inside an isolated Node.js VM with emit hooks.',
    },
    {
        id: 'python',
        label: 'Python',
        runtime: 'Isolated interpreter',
        description: 'Run Python snippets in a temporary process that streams emitted steps.',
    },
    {
        id: 'cpp',
        label: 'C++',
        runtime: 'Visualizer engine',
        description: 'Use the built-in engine to animate C++-style implementations.',
    },
    {
        id: 'java',
        label: 'Java',
        runtime: 'Visualizer engine',
        description: 'Replay optimized Java walkthroughs while sandbox support is in progress.',
    },
    {
        id: 'csharp',
        label: 'C#',
        runtime: 'Visualizer engine',
        description: 'Harness the visualizer’s runtime while managed language support matures.',
    },
];

const fallbackTemplateFor = (languageId, algorithmName) => {
    const label = LANGUAGE_OPTIONS.find((option) => option.id === languageId)?.label ?? languageId;
    const header = `// ${algorithmName} · ${label} walkthrough`;
    const body = [
        `// ${label} execution support is coming soon.`,
        '// The visualizer will fall back to an optimized multi-language engine',
        '// so you can still explore the algorithm step-by-step.',
        '',
        '// Tip: switch to JavaScript or Python to run custom code directly.',
    ];
    return [header, ...body].join('\n');
};

const getSocketUrl = () => {
    const normalizeBase = (value) => (value ? value.replace(/\/$/, '') : null);
    const envBase = normalizeBase(import.meta.env.VITE_API_URL);

    const fallbackBase = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const base = envBase || fallbackBase;

    try {
        const url = new URL('/ws/visualizer', base);

        if (!envBase && typeof window !== 'undefined') {
            const currentPort = window.location.port;
            if (import.meta.env.DEV && (!currentPort || currentPort === '5173')) {
                url.port = '3000';
            }
        }

        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        return url.toString();
    } catch (error) {
        return 'ws://localhost:3000/ws/visualizer';
    }
};

const AlgorithmVisualizer = () => {
    const defaultAlgorithm = 'bubble-sort';
    const [{ group, algorithm }, setSelection] = useState(() => findAlgorithmById(defaultAlgorithm) ?? { group: algorithmGroups[0], algorithm: algorithmGroups[0]?.algorithms?.[0] });
    const [selectedAlgorithmId, setSelectedAlgorithmId] = useState(algorithm?.id ?? defaultAlgorithm);
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState(algorithm?.templates?.javascript ?? '');
    const [arraySize, setArraySize] = useState(10);
    const [speed, setSpeed] = useState(600);
    const [status, setStatus] = useState('idle');
    const [connectionState, setConnectionState] = useState('disconnected');
    const [messages, setMessages] = useState([]);
    const messageBufferRef = useRef([]);
    const [currentStep, setCurrentStep] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [totalSteps, setTotalSteps] = useState(0);
    const [summary, setSummary] = useState(null);
    const [config, setConfig] = useState(null);
    const socketRef = useRef(null);
    const pendingRunRef = useRef(null);

    const languageMeta = useMemo(
        () => LANGUAGE_OPTIONS.find((option) => option.id === language) ?? LANGUAGE_OPTIONS[0],
        [language],
    );

    const hasSteps = totalSteps > 0;
    const zeroBasedIndex = useMemo(() => (currentIndex > 0 ? currentIndex - 1 : 0), [currentIndex]);
    const sliderMax = Math.max(totalSteps - 1, 0);
    const progressPercent = useMemo(() => {
        if (!hasSteps) return 0;
        if (totalSteps === 1) return 100;
        return Math.round((zeroBasedIndex / Math.max(totalSteps - 1, 1)) * 100);
    }, [hasSteps, totalSteps, zeroBasedIndex]);
    const normalizedStep = useMemo(() => {
        if (!hasSteps) return 0;
        if (currentIndex <= 0) return 0;
        return Math.min(currentIndex, totalSteps);
    }, [currentIndex, hasSteps, totalSteps]);

    const canStepBackward = hasSteps && zeroBasedIndex > 0;
    const canStepForward = hasSteps && zeroBasedIndex < totalSteps - 1;

    const highlightEntries = useMemo(() => {
        if (!currentStep?.highlights || typeof currentStep.highlights !== 'object') return [];
        return Object.entries(currentStep.highlights).map(([key, value]) => {
            if (Array.isArray(value)) {
                return { key, display: value.join(', ') };
            }
            if (typeof value === 'number' || typeof value === 'string') {
                return { key, display: String(value) };
            }
            if (value && typeof value === 'object') {
                try {
                    return { key, display: JSON.stringify(value) };
                } catch (error) {
                    return { key, display: '[complex]' };
                }
            }
            return { key, display: String(value) };
        });
    }, [currentStep]);

    const sortedHighlightSet = useMemo(() => {
        if (!Array.isArray(currentStep?.highlights?.sorted)) {
            return new Set();
        }
        return new Set(currentStep.highlights.sorted);
    }, [currentStep]);

    const graphStats = useMemo(() => {
        if (currentStep?.mode !== 'graph' || !currentStep.graph) return null;
        const nodes = Array.isArray(currentStep.graph.nodes) ? currentStep.graph.nodes : [];
        const edges = Array.isArray(currentStep.graph.edges) ? currentStep.graph.edges : [];
        const visited = nodes.filter((node) => node.visited).length;
        const frontier = nodes.filter((node) => node.frontier).length;
        const activeNode = nodes.find((node) => node.current);
        return {
            total: nodes.length,
            edges: edges.length,
            visited,
            frontier,
            active: activeNode?.label ?? activeNode?.id ?? null,
        };
    }, [currentStep]);

    const treeStats = useMemo(() => {
        if (currentStep?.mode !== 'tree' || !currentStep.tree) return null;

        const compute = (node) => {
            if (!node) return { count: 0, depth: 0 };
            const left = compute(node.left);
            const right = compute(node.right);
            return {
                count: 1 + left.count + right.count,
                depth: 1 + Math.max(left.depth, right.depth),
            };
        };

        const { count, depth } = compute(currentStep.tree);
        return { nodes: count, height: depth };
    }, [currentStep]);

    const debugStack = Array.isArray(currentStep?.debug?.stack) ? currentStep.debug.stack : [];
    const debugVariables = currentStep?.debug?.variables ?? null;
    const formattedVariables = useMemo(() => {
        if (debugVariables === null || debugVariables === undefined) return null;
        try {
            return JSON.stringify(debugVariables, null, 2);
        } catch (error) {
            return String(debugVariables);
        }
    }, [debugVariables]);

    const sizeRange = useMemo(() => {
        if (group?.id === 'sorting') return { min: 4, max: 24, label: 'Array size', step: 1 };
        if (group?.id === 'graph') return { min: 4, max: 14, label: 'Node count', step: 1 };
        if (group?.id === 'trees') return { min: 3, max: 16, label: 'Insertion count', step: 1 };
        return { min: 4, max: 20, label: 'Input size', step: 1 };
    }, [group?.id]);

    const updateMessages = useCallback((entry) => {
        messageBufferRef.current = [...messageBufferRef.current.slice(-40), entry];
        setMessages([...messageBufferRef.current]);
    }, []);

    const closeSocket = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
    }, []);

    useEffect(() => () => closeSocket(), [closeSocket]);

    const resetVisualizationState = useCallback(() => {
        setCurrentStep(null);
        setCurrentIndex(0);
        setTotalSteps(0);
        setSummary(null);
        setConfig(null);
        messageBufferRef.current = [];
        setMessages([]);
        setStatus('idle');
    }, []);

    useEffect(() => {
        const found = findAlgorithmById(selectedAlgorithmId);
        if (found?.algorithm) {
            setSelection(found);
            const template = found.algorithm.templates?.[language];
            if (template) {
                setCode(template);
            } else {
                setCode(fallbackTemplateFor(language, found.algorithm.name ?? 'Algorithm'));
            }
        }
        resetVisualizationState();
        setArraySize((prev) => clamp(prev, sizeRange.min, sizeRange.max));
    }, [selectedAlgorithmId, language, sizeRange.min, sizeRange.max, resetVisualizationState]);

    const ensureSocket = useCallback(() => {
        if (socketRef.current && [WebSocket.OPEN, WebSocket.CONNECTING].includes(socketRef.current.readyState)) {
            return socketRef.current;
        }

        try {
            const socket = new WebSocket(getSocketUrl());
            socketRef.current = socket;

            socket.onopen = () => {
                setConnectionState('connected');
                updateMessages('Connected to visualization service.');
                if (pendingRunRef.current) {
                    socket.send(JSON.stringify(pendingRunRef.current));
                    pendingRunRef.current = null;
                }
            };

            socket.onclose = () => {
                setConnectionState('disconnected');
                updateMessages('Connection closed.');
                setStatus('idle');
            };

            socket.onerror = () => {
                setConnectionState('error');
                updateMessages('Connection error encountered.');
            };

            socket.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    handleIncomingMessage(payload);
                } catch (error) {
                    updateMessages('Received malformed message from server.');
                }
            };

            return socket;
        } catch (error) {
            updateMessages('Unable to initialize WebSocket connection.');
            setConnectionState('error');
            return null;
        }
    }, [updateMessages]);

    const handleIncomingMessage = useCallback(
        (payload) => {
            switch (payload.type) {
                case 'connected':
                    setConnectionState('connected');
                    updateMessages('Visualizer ready.');
                    break;
                case 'meta':
                    setSummary(payload.summary ?? null);
                    setConfig(payload.config ?? null);
                    setTotalSteps(payload.totalSteps ?? 0);
                    setCurrentIndex(0);
                    setCurrentStep(null);
                    setStatus('ready');
                    updateMessages('Received algorithm configuration.');
                    if (payload.summary?.fallback) {
                        const runtimeLabel = payload.summary?.runtime ?? 'visualizer engine';
                        updateMessages(
                            `Runtime fallback active – executing ${payload.summary.algorithmId ?? 'algorithm'} via ${runtimeLabel}.`,
                        );
                    }
                    break;
                case 'step':
                    setCurrentStep(payload.step ?? null);
                    setCurrentIndex((payload.index ?? -1) + 1);
                    if (typeof payload.totalSteps === 'number') {
                        setTotalSteps(payload.totalSteps);
                    }
                    setStatus('running');
                    updateMessages(payload.step?.message ?? `Step ${payload.index + 1}`);
                    break;
                case 'complete':
                    setStatus('complete');
                    setCurrentIndex((prev) => (prev === 0 ? totalSteps : prev));
                    updateMessages('Visualization complete.');
                    break;
                case 'paused':
                    setStatus('paused');
                    updateMessages('Playback paused.');
                    break;
                case 'resumed':
                    setStatus('running');
                    updateMessages('Playback resumed.');
                    break;
                case 'reset':
                    setStatus('idle');
                    setCurrentStep(null);
                    setCurrentIndex(0);
                    setTotalSteps(payload.totalSteps ?? 0);
                    setSummary(payload.summary ?? null);
                    setConfig(payload.config ?? null);
                    updateMessages('Visualization reset.');
                    break;
                case 'speed-updated':
                    updateMessages(`Playback speed set to ${payload.speed} ms per step.`);
                    break;
                case 'error':
                    setStatus('error');
                    updateMessages(`Error: ${payload.message}`);
                    break;
                default:
                    break;
            }
        },
        [totalSteps, updateMessages],
    );

    const sendMessage = useCallback(
        (message) => {
            const socket = ensureSocket();
            if (!socket) return;

            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(message));
            } else if (socket.readyState === WebSocket.CONNECTING) {
                pendingRunRef.current = message;
            } else {
                updateMessages('Unable to send command: socket is not ready.');
            }
        },
        [ensureSocket, updateMessages],
    );

    const handleStart = useCallback(() => {
        resetVisualizationState();
        setStatus('connecting');
        const payload = {
            type: 'run',
            algorithmId: selectedAlgorithmId,
            language,
            code,
            params: { arraySize },
            speed,
        };
        sendMessage(payload);
        updateMessages('Starting visualization…');
    }, [arraySize, code, language, resetVisualizationState, selectedAlgorithmId, sendMessage, speed, updateMessages]);

    const handlePause = useCallback(() => {
        if (status !== 'running') return;
        sendMessage({ type: 'pause' });
    }, [sendMessage, status]);

    const handleResume = useCallback(() => {
        if (!['paused', 'ready'].includes(status)) return;
        sendMessage({ type: 'resume' });
    }, [sendMessage, status]);

    const handleReset = useCallback(() => {
        sendMessage({ type: 'reset' });
    }, [sendMessage]);

    const handleSpeedChange = useCallback(
        (event) => {
            const value = Number(event.target.value);
            setSpeed(value);
            sendMessage({ type: 'speed', speed: value });
        },
        [sendMessage],
    );

    const handleStepBackward = useCallback(() => {
        if (!hasSteps) return;
        sendMessage({ type: 'step', direction: 'back' });
    }, [hasSteps, sendMessage]);

    const handleStepForward = useCallback(() => {
        if (!hasSteps) return;
        sendMessage({ type: 'step', direction: 'forward' });
    }, [hasSteps, sendMessage]);

    const handleJumpToStart = useCallback(() => {
        if (!hasSteps) return;
        sendMessage({ type: 'step', index: 0 });
    }, [hasSteps, sendMessage]);

    const handleJumpToEnd = useCallback(() => {
        if (!hasSteps) return;
        sendMessage({ type: 'step', index: totalSteps - 1 });
    }, [hasSteps, sendMessage, totalSteps]);

    const handleScrub = useCallback(
        (event) => {
            if (!hasSteps) return;
            const value = Number(event.target.value);
            if (!Number.isFinite(value)) return;
            sendMessage({ type: 'step', index: value });
        },
        [hasSteps, sendMessage],
    );

    const restoreTemplate = useCallback(() => {
        if (algorithm?.templates?.[language]) {
            setCode(algorithm.templates[language]);
        } else {
            setCode(fallbackTemplateFor(language, algorithm?.name ?? 'Algorithm'));
        }
    }, [algorithm, language]);

    const renderDatasetSummary = () => {
        if (!config) return null;
        if (config.type === 'sorting') {
            return (
                <div className="text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">Array:</span> {config.array?.join(', ')}
                </div>
            );
        }
        if (config.type === 'graph') {
            return (
                <div className="text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">Nodes:</span> {config.nodes?.length ?? 0} ·{' '}
                    <span className="font-semibold text-slate-200">Edges:</span> {config.edges?.length ?? 0} ·{' '}
                    <span className="font-semibold text-slate-200">Start:</span> {config.startNode}
                </div>
            );
        }
        if (config.type === 'tree') {
            return (
                <div className="text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">Values:</span> {config.values?.join(', ')}
                </div>
            );
        }
        return null;
    };

    const renderStatusBadge = () => {
        const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
        const colors = {
            idle: 'bg-slate-700/60 text-slate-200',
            connecting: 'bg-sky-500/20 text-sky-200 border border-sky-500/40',
            ready: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40',
            running: 'bg-cyan-500/20 text-cyan-100 border border-cyan-400/40',
            paused: 'bg-amber-500/20 text-amber-200 border border-amber-500/40',
            complete: 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/40',
            error: 'bg-rose-500/20 text-rose-100 border border-rose-400/40',
        };
        const className = colors[status] ?? 'bg-slate-700/60 text-slate-200';
        return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${className}`}>{statusLabel}</span>;
    };

    return (
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
            <div className="space-y-3">
                <h1 className="text-3xl font-bold text-white">Algorithm Visualizer Studio</h1>
                <p className="max-w-3xl text-sm text-slate-300">
                    Explore classic algorithms in motion. Choose a template implementation, tweak the input, and watch the backend
                    stream step-by-step updates for real-time visual feedback using p5.js and D3.js canvases.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                    {renderStatusBadge()}
                    <span className="uppercase tracking-widest text-slate-500">Connection: {connectionState}</span>
                    <span className="uppercase tracking-widest text-slate-500">Steps: {currentIndex}/{totalSteps}</span>
                    {summary ? (
                        <span className="uppercase tracking-widest text-slate-500">
                            Engine: {summary.algorithmId ?? 'custom'}{' '}
                            {summary.mode ? `· ${summary.mode}` : ''}
                        </span>
                    ) : null}
                    <span className="uppercase tracking-widest text-slate-500">
                        Runtime: {summary?.runtime ?? languageMeta.runtime}{' '}
                        {summary?.language ? `· ${summary.language}` : `· ${languageMeta.id}`}
                    </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 shadow-[0_0_18px_rgba(56,189,248,0.45)]"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
                <div className="space-y-6 rounded-2xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-[0_0_32px_rgba(15,23,42,0.45)]">
                    <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Algorithm</label>
                        <select
                            value={selectedAlgorithmId}
                            onChange={(event) => setSelectedAlgorithmId(event.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 p-2 text-sm text-slate-100"
                        >
                            {algorithmGroups.map((item) => (
                                <optgroup key={item.id} label={item.label}>
                                    {item.algorithms.map((algo) => (
                                        <option key={algo.id} value={algo.id}>
                                            {algo.name}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        <p className="text-xs text-slate-400">{algorithm?.summary}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Language</label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {LANGUAGE_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setLanguage(option.id)}
                                    title={option.description}
                                    className={`rounded-xl border px-3 py-3 text-left transition ${
                                        language === option.id
                                            ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.25)]'
                                            : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600 hover:text-slate-100'
                                    }`}
                                >
                                    <span className="block text-sm font-semibold">{option.label}</span>
                                    <span className="mt-1 block text-[11px] uppercase tracking-widest text-slate-400">
                                        {option.runtime}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                            {sizeRange.label}: {arraySize}
                        </label>
                        <input
                            type="range"
                            min={sizeRange.min}
                            max={sizeRange.max}
                            step={sizeRange.step}
                            value={arraySize}
                            onChange={(event) => setArraySize(Number(event.target.value))}
                            className="w-full accent-cyan-400"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                            Playback speed: {Math.round(1000 / speed)} steps/sec
                        </label>
                        <input
                            type="range"
                            min={150}
                            max={1500}
                            step={50}
                            value={speed}
                            onChange={handleSpeedChange}
                            className="w-full accent-emerald-400"
                        />
                    </div>

                    <div className="grid gap-2">
                        <button
                            type="button"
                            onClick={handleStart}
                            className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
                        >
                            <FaPlay className="text-base" />
                            <span>Start visualization</span>
                        </button>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <button
                                type="button"
                                onClick={handlePause}
                                className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-slate-200 transition hover:border-slate-600"
                            >
                                <FaPause className="text-xs" />
                                <span>Pause</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleResume}
                                className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-slate-200 transition hover:border-slate-600"
                            >
                                <FaPlay className="text-xs" />
                                <span>Resume</span>
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-2 text-sm text-slate-200 hover:border-slate-600"
                        >
                            Reset
                        </button>
                        <div className="space-y-3 border-t border-slate-800/60 pt-4">
                            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                                Step-by-step debugger
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    type="button"
                                    onClick={handleJumpToStart}
                                    disabled={!hasSteps}
                                    className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/70 p-2 text-slate-200 transition hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Jump to first step"
                                >
                                    <FaFastBackward />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleStepBackward}
                                    disabled={!canStepBackward}
                                    className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/70 p-2 text-slate-200 transition hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Step backward"
                                >
                                    <FaStepBackward />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleStepForward}
                                    disabled={!canStepForward}
                                    className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/70 p-2 text-slate-200 transition hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Step forward"
                                >
                                    <FaStepForward />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleJumpToEnd}
                                    disabled={!hasSteps}
                                    className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/70 p-2 text-slate-200 transition hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Jump to last step"
                                >
                                    <FaFastForward />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="range"
                                    min={0}
                                    max={sliderMax}
                                    step={1}
                                    value={Math.min(zeroBasedIndex, sliderMax)}
                                    onChange={handleScrub}
                                    disabled={!hasSteps}
                                    className="w-full accent-sky-400 disabled:opacity-40"
                                    aria-label="Scrub through steps"
                                />
                                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                                    <span>
                                        Step {normalizedStep}/{totalSteps}
                                    </span>
                                    <span>{progressPercent}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4 shadow-[0_0_40px_rgba(15,23,42,0.55)]">
                        <div className="mb-3 flex flex-col gap-2 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-slate-100">Visualization</span>
                                    {renderDatasetSummary()}
                                </div>
                                <p className="text-xs text-slate-400">
                                    {currentStep?.message ?? 'Select an algorithm and press start to begin the visualization.'}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest text-slate-500">
                                {currentStep?.stage ? (
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-semibold text-cyan-100">
                                        {currentStep.stage}
                                    </span>
                                ) : null}
                                <span className="rounded-full border border-slate-700/60 bg-slate-800/60 px-3 py-1 font-semibold text-slate-300">
                                    Mode: {currentStep?.mode ?? '—'}
                                </span>
                                {hasSteps ? (
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-100">
                                        Step {normalizedStep} / {totalSteps}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        <div className="h-[360px] overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/50">
                            {currentStep?.mode === 'sorting' ? (
                                <SortingCanvas step={currentStep} />
                            ) : currentStep?.mode === 'graph' || currentStep?.mode === 'tree' ? (
                                <StructureCanvas step={currentStep} />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                                    Select an algorithm and press start to begin the visualization.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/70 p-4 shadow-[0_0_32px_rgba(15,23,42,0.45)]">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-200">Step inspector</h2>
                            <span className={`text-[11px] font-semibold uppercase tracking-widest ${currentStep ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {currentStep ? 'Live context' : 'Waiting'}
                            </span>
                        </div>
                        {currentStep ? (
                            <div className="mt-3 space-y-4 text-sm text-slate-200">
                                {currentStep.mode === 'sorting' && Array.isArray(currentStep.array) ? (
                                    <div className="rounded-xl border border-slate-800/60 bg-slate-900/70 p-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                                            Array snapshot
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs text-slate-200">
                                            {currentStep.array.map((value, index) => (
                                                <span
                                                    key={`array-${index}-${value}`}
                                                    className={`rounded-lg border px-2 py-1 ${
                                                        sortedHighlightSet.has(index)
                                                            ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
                                                            : 'border-slate-700 bg-slate-800/60'
                                                    }`}
                                                >
                                                    <span className="text-slate-400">[{index}]</span> {value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {graphStats ? (
                                    <div className="rounded-xl border border-slate-800/60 bg-slate-900/70 p-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                                            Graph metrics
                                        </p>
                                        <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-200">
                                            <div>
                                                <dt className="text-slate-500">Nodes</dt>
                                                <dd className="font-mono text-base text-slate-100">{graphStats.total}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-slate-500">Edges</dt>
                                                <dd className="font-mono text-base text-slate-100">{graphStats.edges}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-slate-500">Visited</dt>
                                                <dd className="font-mono text-base text-emerald-200">{graphStats.visited}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-slate-500">Frontier</dt>
                                                <dd className="font-mono text-base text-amber-200">{graphStats.frontier}</dd>
                                            </div>
                                            {graphStats.active ? (
                                                <div className="col-span-2">
                                                    <dt className="text-slate-500">Active node</dt>
                                                    <dd className="font-semibold text-sky-200">{graphStats.active}</dd>
                                                </div>
                                            ) : null}
                                        </dl>
                                    </div>
                                ) : null}

                                {treeStats ? (
                                    <div className="rounded-xl border border-slate-800/60 bg-slate-900/70 p-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                                            Tree metrics
                                        </p>
                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-200">
                                            <div>
                                                <p className="text-slate-500">Nodes</p>
                                                <p className="font-mono text-base text-slate-100">{treeStats.nodes}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Height</p>
                                                <p className="font-mono text-base text-slate-100">{treeStats.height}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {highlightEntries.length ? (
                                    <div className="rounded-xl border border-slate-800/60 bg-slate-900/70 p-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                                            Focus points
                                        </p>
                                        <dl className="mt-2 grid gap-2 text-xs text-slate-200 sm:grid-cols-2">
                                            {highlightEntries.map((entry) => (
                                                <div key={entry.key} className="rounded-lg border border-slate-800/60 bg-slate-900/80 px-3 py-2">
                                                    <dt className="text-[10px] uppercase tracking-widest text-slate-500">{entry.key}</dt>
                                                    <dd className="mt-1 font-mono text-slate-100">{entry.display}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </div>
                                ) : null}

                                <div className="rounded-xl border border-slate-800/60 bg-slate-900/70 p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                                        Call stack
                                    </p>
                                    {debugStack.length ? (
                                        <ol className="mt-2 space-y-1 text-xs text-slate-200">
                                            {debugStack.map((frame, index) => (
                                                <li key={`frame-${index}`} className="rounded-lg border border-slate-800/60 bg-slate-900/80 px-3 py-2">
                                                    <span className="mr-2 text-slate-500">{debugStack.length - index}.</span>
                                                    <span className="font-mono">{frame}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    ) : (
                                        <p className="mt-2 text-xs text-slate-500">
                                            Stack data is not available for this step.
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-xl border border-slate-800/60 bg-slate-900/70 p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                                        Variables
                                    </p>
                                    {formattedVariables ? (
                                        <pre className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-800/60 bg-slate-950/70 p-3 text-[11px] leading-5 text-slate-200">
                                            {formattedVariables}
                                        </pre>
                                    ) : (
                                        <p className="mt-2 text-xs text-slate-500">
                                            The visualization did not emit variable snapshots for this step.
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="mt-3 text-xs text-slate-500">Detailed state will appear once the visualization emits its first step.</p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/70 p-4">
                        <h2 className="text-sm font-semibold text-slate-200">Activity log</h2>
                        <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-slate-800/60 bg-slate-950/70 p-3 text-xs text-slate-300">
                            {messages.length === 0 ? (
                                <div className="text-slate-500">Execution updates will appear here.</div>
                            ) : (
                                <ul className="space-y-2">
                                    {messages.map((entry, index) => (
                                        <li key={`${entry}-${index}`} className="rounded bg-slate-800/40 px-3 py-2">
                                            {entry}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(15,23,42,0.55)]">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Algorithm code</h2>
                        <p className="text-xs text-slate-400">
                            The backend executes this snippet inside a sandboxed runtime and streams the emitted steps to the frontend.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={restoreTemplate}
                        className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300 hover:border-slate-600"
                    >
                        Restore template
                    </button>
                </div>
                <textarea
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    rows={16}
                    className="w-full rounded-xl border border-slate-800/60 bg-slate-950/70 p-4 font-mono text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                    spellCheck={false}
                />
            </div>
        </div>
    );
};

export default AlgorithmVisualizer;
