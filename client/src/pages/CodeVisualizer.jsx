import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Alert,
    Badge,
    Button,
    Card,
    Select,
    Spinner,
    Textarea,
    ToggleSwitch,
    Tooltip,
} from 'flowbite-react';
import {
    FaArrowRight,
    FaBug,
    FaBolt,
    FaChartBar,
    FaCode,
    FaExchangeAlt,
    FaInfoCircle,
    FaMinusCircle,
    FaPause,
    FaPlay,
    FaPlusCircle,
    FaRedo,
    FaStepBackward,
    FaStepForward,
    FaTerminal,
} from 'react-icons/fa';

const LANGUAGE_OPTIONS = [
    {
        id: 'python',
        label: 'Python 3',
        description: 'Executed locally with detailed stack, heap, and stdout capture.',
    },
    {
        id: 'java',
        label: 'Java',
        description: 'Powered by Python Tutor. Requires valid main entry point.',
    },
    {
        id: 'c',
        label: 'C',
        description: 'Powered by Python Tutor for C programs compiled on-demand.',
    },
    {
        id: 'cpp',
        label: 'C++',
        description: 'Powered by Python Tutor for modern C++ snippets.',
    },
    {
        id: 'javascript',
        label: 'JavaScript',
        description: 'Powered by Python Tutor. Uses the latest ECMAScript runtime.',
    },
    {
        id: 'typescript',
        label: 'TypeScript',
        description: 'Powered by Python Tutor with automatic transpilation.',
    },
];

const SUPPORTED_LANGUAGE_IDS = new Set(LANGUAGE_OPTIONS.map((option) => option.id));

const DEFAULT_SNIPPETS = {
    python: `def factorial(n: int) -> int:\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint('5! =', factorial(5))`,
    java: `import java.util.*;\n\npublic class Main {\n    public static int factorial(int n) {\n        if (n <= 1) {\n            return 1;\n        }\n        return n * factorial(n - 1);\n    }\n\n    public static void main(String[] args) {\n        System.out.println("5! = " + factorial(5));\n    }\n}`,
    c: `#include <stdio.h>\n\nint factorial(int n) {\n    if (n <= 1) {\n        return 1;\n    }\n    return n * factorial(n - 1);\n}\n\nint main(void) {\n    printf("5! = %d\\n", factorial(5));\n    return 0;\n}`,
    cpp: `#include <iostream>\n\nint factorial(int n) {\n    if (n <= 1) {\n        return 1;\n    }\n    return n * factorial(n - 1);\n}\n\nint main() {\n    std::cout << "5! = " << factorial(5) << std::endl;\n    return 0;\n}`,
    javascript: `function factorial(n) {\n    if (n <= 1) {\n        return 1;\n    }\n    return n * factorial(n - 1);\n}\n\nconsole.log('5! =', factorial(5));`,
    typescript: `function factorial(n: number): number {\n    if (n <= 1) {\n        return 1;\n    }\n    return n * factorial(n - 1);\n}\n\nconsole.log('5! =', factorial(5));`,
};

const getLanguageLabel = (id) => LANGUAGE_OPTIONS.find((option) => option.id === id)?.label || id;

const eventMetadata = {
    call: { label: 'Call', color: 'purple' },
    line: { label: 'Line', color: 'info' },
    return: { label: 'Return', color: 'success' },
    exception: { label: 'Exception', color: 'failure' },
};

const descriptiveLabels = {
    call: 'A function frame was pushed onto the stack.',
    line: 'A line of code executed inside the current frame.',
    return: 'Execution is returning from the current frame.',
    exception: 'An exception was raised at this position.',
};

const formatStepLabel = (event) => {
    const meta = eventMetadata[event.event] ?? { label: 'Event' };
    return meta.label;
};

const formatFrameLabel = (frame) => {
    if (!frame) {
        return '';
    }

    const functionName = frame.function || '<module>';
    if (frame.line) {
        return `${functionName} (line ${frame.line})`;
    }
    return functionName;
};

export default function CodeVisualizer() {
    const location = useLocation();
    const locationStateLanguage = location.state?.language;
    const locationStateCode = location.state?.code;
    const initialLanguage = SUPPORTED_LANGUAGE_IDS.has(locationStateLanguage)
        ? locationStateLanguage
        : 'python';
    const initialCode = typeof locationStateCode === 'string' ? locationStateCode : null;

    const [language, setLanguage] = useState(initialLanguage);
    const [codeByLanguage, setCodeByLanguage] = useState(() => {
        const seeds = { ...DEFAULT_SNIPPETS };
        if (initialCode) {
            seeds[initialLanguage] = initialCode;
        }
        return seeds;
    });
    const [trace, setTrace] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playDelay, setPlayDelay] = useState(900);
    const [autoPlay, setAutoPlay] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [selectedObjectId, setSelectedObjectId] = useState(null);
    const [liveMode, setLiveMode] = useState(false);
    const [liveUpdating, setLiveUpdating] = useState(false);

    const code = codeByLanguage[language] ?? '';

    const currentLanguageOption = useMemo(
        () => LANGUAGE_OPTIONS.find((option) => option.id === language) ?? LANGUAGE_OPTIONS[0],
        [language],
    );
    const languageHelperText =
        language === 'python'
            ? 'The visualizer captures standard output, return values, exceptions, and heap snapshots.'
            : 'Visualization is powered by Python Tutor. Heap diagrams may be simplified depending on the language runtime.';
    const liveModeSupported = language === 'python';
    const howItWorksDescription =
        language === 'python'
            ? 'We execute your code in an isolated Python worker with tracing enabled, capturing every call, line, return, and exception locally.'
            : 'We send your program to the official Python Tutor service for secure, step-by-step execution and return the resulting trace to you.';

    const events = trace?.events ?? [];
    const hasEvents = events.length > 0;
    const currentEvent = hasEvents ? events[Math.min(currentIndex, events.length - 1)] : null;
    const previousEvent = hasEvents && currentIndex > 0 ? events[currentIndex - 1] : null;
    const codeLines = useMemo(() => code.replace(/\r\n/g, '\n').split('\n'), [code]);
    const currentLine = currentEvent?.line ?? null;
    const nextEvent = hasEvents && currentIndex < events.length - 1 ? events[currentIndex + 1] : null;
    const nextLine = nextEvent?.line ?? null;
    const timelineProgress = hasEvents ? Math.round((currentIndex / Math.max(events.length - 1, 1)) * 100) : 0;

    const memoryFrames = currentEvent?.memory?.frames ?? [];
    const memoryObjects = currentEvent?.memory?.objects ?? [];
    const memoryAvailable = memoryFrames.length > 0 || memoryObjects.length > 0;

    const objectLookup = useMemo(() => {
        const lookup = new Map();
        memoryObjects.forEach((object) => {
            if (object?.id) {
                lookup.set(object.id, object);
            }
        });
        return lookup;
    }, [memoryObjects]);
    const focusedObject = selectedObjectId ? objectLookup.get(selectedObjectId) : null;

    const insights = useMemo(() => {
        const counts = { call: 0, line: 0, return: 0, exception: 0 };
        const functions = new Set();
        let maxStackDepth = 0;

        events.forEach((event) => {
            if (typeof counts[event.event] === 'number') {
                counts[event.event] += 1;
            }
            if (event?.function) {
                functions.add(event.function);
            }
            const depth = Array.isArray(event?.stack) ? event.stack.length : 0;
            if (depth > maxStackDepth) {
                maxStackDepth = depth;
            }
        });

        return {
            totalEvents: events.length,
            counts,
            uniqueFunctionCount: functions.size,
            maxStackDepth,
        };
    }, [events]);

    const variableDiff = useMemo(() => {
        if (!currentEvent) {
            return { added: [], updated: [], removed: [] };
        }

        const previousLocals = previousEvent?.locals ?? {};
        const currentLocals = currentEvent.locals ?? {};

        const added = [];
        const updated = [];
        const removed = [];

        Object.entries(currentLocals).forEach(([key, value]) => {
            if (!(key in previousLocals)) {
                added.push({ key, value });
            } else if (previousLocals[key] !== value) {
                updated.push({ key, previous: previousLocals[key], current: value });
            }
        });

        Object.entries(previousLocals).forEach(([key, value]) => {
            if (!(key in currentLocals)) {
                removed.push({ key, previous: value });
            }
        });

        return { added, updated, removed };
    }, [currentEvent, previousEvent]);

    const stackDiff = useMemo(() => {
        if (!currentEvent) {
            return { persistedLength: 0, pushed: [], popped: [] };
        }

        const currentStack = Array.isArray(currentEvent.stack) ? currentEvent.stack : [];
        const previousStack = Array.isArray(previousEvent?.stack) ? previousEvent.stack : [];

        let persistedLength = 0;
        const minLength = Math.min(currentStack.length, previousStack.length);

        for (let index = 0; index < minLength; index += 1) {
            const currentFrame = currentStack[index];
            const previousFrame = previousStack[index];
            if (
                !currentFrame ||
                !previousFrame ||
                currentFrame.function !== previousFrame.function ||
                currentFrame.line !== previousFrame.line
            ) {
                break;
            }
            persistedLength += 1;
        }

        return {
            persistedLength,
            pushed: currentStack.slice(persistedLength),
            popped: previousStack.slice(persistedLength),
        };
    }, [currentEvent, previousEvent]);

    const liveUpdateTimerRef = useRef(null);
    const skipLiveRunRef = useRef(true);
    const activeRequestRef = useRef(null);

    useEffect(() => {
        setSelectedObjectId(null);
    }, [currentIndex, trace]);

    const handleSelectObject = (objectId) => {
        if (!objectId) return;
        setSelectedObjectId(objectId);
    };

    useEffect(
        () => () => {
            if (activeRequestRef.current) {
                activeRequestRef.current.abort();
            }
            if (liveUpdateTimerRef.current) {
                clearTimeout(liveUpdateTimerRef.current);
            }
        },
        [],
    );

    const visualizeCode = useCallback(
        async ({ sourceCode, triggeredByLive = false, runLanguage } = {}) => {
            if (liveUpdateTimerRef.current) {
                clearTimeout(liveUpdateTimerRef.current);
                liveUpdateTimerRef.current = null;
            }

            if (!triggeredByLive) {
                setLiveUpdating(false);
            }

            const targetLanguage = SUPPORTED_LANGUAGE_IDS.has(runLanguage) ? runLanguage : language;
            const program =
                typeof sourceCode === 'string'
                    ? sourceCode
                    : codeByLanguage[targetLanguage] ?? '';
            const languageLabel = getLanguageLabel(targetLanguage);
            if (!program.trim()) {
                setTrace(null);
                setCurrentIndex(0);
                setIsPlaying(false);
                setErrorMessage(`Enter some ${languageLabel} code to visualize.`);
                if (triggeredByLive) {
                    setLiveUpdating(false);
                } else {
                    setIsLoading(false);
                }
                return;
            }

            if (activeRequestRef.current) {
                activeRequestRef.current.abort();
            }

            const controller = new AbortController();
            activeRequestRef.current = controller;

            if (triggeredByLive) {
                setLiveUpdating(true);
            } else {
                setIsLoading(true);
            }

            setIsPlaying(false);
            setErrorMessage(null);

            try {
                const response = await fetch('/api/code/visualize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code: program, language: targetLanguage }),
                    signal: controller.signal,
                });

                const payload = await response.json();

                if (!response.ok) {
                    setTrace(null);
                    setCurrentIndex(0);
                    setErrorMessage(payload?.message || 'Unable to visualize the code.');
                    return;
                }

                setTrace(payload);
                setCurrentIndex(0);

                if (payload?.error?.message) {
                    setErrorMessage(payload.error.message);
                } else if (!payload.success) {
                    setErrorMessage('Visualization completed with errors. Inspect the trace for details.');
                } else {
                    setErrorMessage(null);
                }

                if (!triggeredByLive && Array.isArray(payload?.events) && payload.events.length > 0 && autoPlay) {
                    setIsPlaying(true);
                } else {
                    setIsPlaying(false);
                }
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }
                console.error('Failed to visualize code:', error);
                setTrace(null);
                setErrorMessage('An unexpected error occurred while visualizing your code.');
            } finally {
                if (activeRequestRef.current === controller) {
                    activeRequestRef.current = null;
                }
                if (triggeredByLive) {
                    setLiveUpdating(false);
                } else {
                    setIsLoading(false);
                }
            }
        },
        [autoPlay, codeByLanguage, language],
    );

    const renderReferenceBadge = (payload) => {
        if (!payload) return null;
        if (payload.type === 'primitive') {
            return <span className="text-xs text-gray-500 dark:text-gray-400">{payload.value}</span>;
        }

        if (payload.type === 'reference') {
            const isSelected = selectedObjectId === payload.objectId;
            return (
                <button
                    type="button"
                    onClick={() => handleSelectObject(payload.objectId)}
                    title={payload.preview || ''}
                    className={`text-xs font-semibold px-2 py-1 rounded border transition focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                        isSelected
                            ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                            : 'border-purple-400/40 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20'
                    }`}
                >
                    {payload.objectId}
                </button>
            );
        }

        return null;
    };

    const renderCollectionElements = (object) => {
        if (!Array.isArray(object?.elements) || object.elements.length === 0) {
            return <p className="text-xs text-gray-500 dark:text-gray-400">(empty)</p>;
        }

        return (
            <ul className="mt-2 space-y-1 text-xs text-gray-700 dark:text-gray-200">
                {object.elements.map((element, index) => (
                    <li key={`${object.id}-element-${index}`} className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-gray-500 dark:text-gray-400">[{index}]</span>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                            {renderReferenceBadge(element)}
                            {element?.preview && (
                                <span className="font-mono text-[0.65rem] text-gray-400 dark:text-gray-500 truncate max-w-[150px]">
                                    {element.preview}
                                </span>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    const renderMappingEntries = (object) => {
        if (!Array.isArray(object?.entries) || object.entries.length === 0) {
            return <p className="text-xs text-gray-500 dark:text-gray-400">(empty)</p>;
        }

        return (
            <ul className="mt-2 space-y-2 text-xs text-gray-700 dark:text-gray-200">
                {object.entries.map((entry, index) => (
                    <li key={`${object.id}-entry-${index}`} className="space-y-1 border border-gray-200 dark:border-gray-700 rounded p-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="uppercase tracking-wide text-[0.6rem] text-gray-500 dark:text-gray-400">Key</span>
                            {renderReferenceBadge(entry.key)}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="uppercase tracking-wide text-[0.6rem] text-gray-500 dark:text-gray-400">Value</span>
                            <div className="flex items-center gap-2">
                                {renderReferenceBadge(entry.value)}
                                {entry?.value?.preview && (
                                    <span className="font-mono text-[0.65rem] text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
                                        {entry.value.preview}
                                    </span>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    const renderAttributeRows = (object) => {
        if (!Array.isArray(object?.attributes) || object.attributes.length === 0) {
            return <p className="text-xs text-gray-500 dark:text-gray-400">(no attributes)</p>;
        }

        return (
            <ul className="mt-2 space-y-1 text-xs text-gray-700 dark:text-gray-200">
                {object.attributes.map((attribute) => (
                    <li key={`${object.id}-attr-${attribute.name}`} className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-purple-400">{attribute.name}</span>
                        <div className="flex items-center gap-2">
                            {renderReferenceBadge(attribute.value)}
                            {attribute?.value?.preview && (
                                <span className="font-mono text-[0.65rem] text-gray-400 dark:text-gray-500 truncate max-w-[130px]">
                                    {attribute.value.preview}
                                </span>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    const renderObjectDetails = (object) => {
        if (!object) {
            return null;
        }

        if (object.kind === 'primitive') {
            return (
                <p className="text-xs text-gray-600 dark:text-gray-300">
                    Value: <span className="font-mono text-purple-300">{object.value ?? object.repr}</span>
                </p>
            );
        }

        if (object.kind === 'collection') {
            return (
                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {object.collectionType || 'collection'} elements
                    </p>
                    {renderCollectionElements(object)}
                </div>
            );
        }

        if (object.kind === 'mapping') {
            return (
                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Dictionary entries</p>
                    {renderMappingEntries(object)}
                </div>
            );
        }

        if (object.kind === 'object') {
            return (
                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Attributes</p>
                    {renderAttributeRows(object)}
                </div>
            );
        }

        return (
            <p className="text-xs text-gray-600 dark:text-gray-300">
                {object.value || object.repr}
            </p>
        );
    };

    useEffect(() => {
        if (!isPlaying) return undefined;
        if (!hasEvents) return undefined;
        if (currentIndex >= events.length - 1) {
            setIsPlaying(false);
            return undefined;
        }

        const timer = setTimeout(() => {
            setCurrentIndex((previous) => Math.min(previous + 1, events.length - 1));
        }, playDelay);

        return () => clearTimeout(timer);
    }, [isPlaying, playDelay, currentIndex, events.length, hasEvents]);

    useEffect(() => {
        const nextLanguage = SUPPORTED_LANGUAGE_IDS.has(locationStateLanguage)
            ? locationStateLanguage
            : null;
        const nextCode = typeof locationStateCode === 'string' ? locationStateCode : null;

        if (nextLanguage && nextLanguage !== language) {
            setLanguage(nextLanguage);
        }
        if (nextCode) {
            setCodeByLanguage((previous) => ({
                ...previous,
                [nextLanguage || language]: nextCode,
            }));
        }
    }, [language, location.key, locationStateCode, locationStateLanguage]);

    useEffect(() => {
        setTrace(null);
        setCurrentIndex(0);
        setIsPlaying(false);
        setErrorMessage(null);
        setSelectedObjectId(null);
        skipLiveRunRef.current = true;
        if (!liveModeSupported) {
            setLiveMode(false);
        }
    }, [language, liveModeSupported]);

    useEffect(() => {
        if (!liveMode) {
            if (liveUpdateTimerRef.current) {
                clearTimeout(liveUpdateTimerRef.current);
                liveUpdateTimerRef.current = null;
            }
            setLiveUpdating(false);
            skipLiveRunRef.current = true;
            return undefined;
        }

        if (skipLiveRunRef.current) {
            skipLiveRunRef.current = false;
            visualizeCode({ sourceCode: code, triggeredByLive: true, runLanguage: language });
            return undefined;
        }

        if (liveUpdateTimerRef.current) {
            clearTimeout(liveUpdateTimerRef.current);
        }

        setLiveUpdating(true);
        liveUpdateTimerRef.current = setTimeout(() => {
            visualizeCode({ sourceCode: code, triggeredByLive: true, runLanguage: language });
        }, 800);

        return () => {
            if (liveUpdateTimerRef.current) {
                clearTimeout(liveUpdateTimerRef.current);
                liveUpdateTimerRef.current = null;
            }
        };
    }, [code, liveMode, visualizeCode]);

    const handleVisualize = () => {
        visualizeCode({ sourceCode: code, runLanguage: language });
    };

    const handleResetCode = () => {
        if (activeRequestRef.current) {
            activeRequestRef.current.abort();
            activeRequestRef.current = null;
        }
        if (liveUpdateTimerRef.current) {
            clearTimeout(liveUpdateTimerRef.current);
            liveUpdateTimerRef.current = null;
        }
        setLiveUpdating(false);
        setCodeByLanguage((previous) => ({
            ...previous,
            [language]: DEFAULT_SNIPPETS[language] ?? '',
        }));
        setTrace(null);
        setCurrentIndex(0);
        setIsPlaying(false);
        setErrorMessage(null);
    };

    const goToStep = (index) => {
        if (!hasEvents) return;
        setCurrentIndex(Math.max(0, Math.min(index, events.length - 1)));
        setIsPlaying(false);
    };

    const handleStepForward = () => {
        if (!hasEvents) return;
        goToStep(Math.min(currentIndex + 1, events.length - 1));
    };

    const handleStepBackward = () => {
        if (!hasEvents) return;
        goToStep(Math.max(currentIndex - 1, 0));
    };

    const togglePlayback = () => {
        if (!hasEvents) return;
        setIsPlaying((prev) => !prev);
    };

    const stdoutForCurrentStep = currentEvent?.stdout ?? trace?.stdout ?? '';
    const stderrOutput = trace?.stderr ?? '';
    const activeEventMeta = currentEvent ? eventMetadata[currentEvent.event] : null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 text-gray-900 dark:text-gray-100">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="space-y-3 text-center">
                    <h1 className="text-4xl lg:text-5xl font-extrabold">Interactive Code Execution Visualizer</h1>
                    <p className="text-lg max-w-3xl mx-auto text-gray-600 dark:text-gray-300">
                        Step through Python, Java, C, C++, JavaScript, or TypeScript code line by line. Inspect the call stack,
                        track variables, and capture console output without leaving ScientistShield.
                    </p>
                </div>

                <Alert color="info" icon={FaInfoCircle} className="max-w-3xl mx-auto">
                    Select your language, paste code, press <strong>Visualize</strong>, and explore each execution step using
                    the playback controls. Every step highlights the active line, exposes the current stack, and records stdout.
                    <span className="block mt-2 text-sm">
                        Follow the <span className="font-semibold text-green-500">green arrow</span> for the line currently
                        executing and the <span className="font-semibold text-red-500">red arrow</span> to preview what runs next.
                    </span>
                </Alert>

                <Card className="space-y-6 bg-white/90 dark:bg-gray-800/80 backdrop-blur">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <label className="block text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            {currentLanguageOption.label} code
                                        </label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {currentLanguageOption.description}
                                        </p>
                                    </div>
                                    <Select
                                        value={language}
                                        onChange={(event) => {
                                            const nextLanguage = event.target.value;
                                            if (SUPPORTED_LANGUAGE_IDS.has(nextLanguage)) {
                                                setLanguage(nextLanguage);
                                            }
                                        }}
                                        className="w-full sm:w-auto"
                                    >
                                        {LANGUAGE_OPTIONS.map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                <Textarea
                                    rows={16}
                                    value={code}
                                    onChange={(event) =>
                                        setCodeByLanguage((previous) => ({
                                            ...previous,
                                            [language]: event.target.value,
                                        }))
                                    }
                                    className="font-mono text-sm"
                                    helperText={languageHelperText}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Button gradientDuoTone="purpleToBlue" onClick={handleVisualize} disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Spinner size="sm" className="mr-2" />
                                            Visualizing...
                                        </>
                                    ) : (
                                        <>
                                            <FaPlay className="mr-2" /> Visualize
                                        </>
                                    )}
                                </Button>
                                <Button color="light" onClick={handleResetCode} disabled={isLoading}>
                                    <FaRedo className="mr-2" /> Reset to example
                                </Button>
                                <Tooltip
                                    content={
                                        liveModeSupported
                                            ? 'Automatically re-run the visualizer as you pause typing.'
                                            : 'Live programming mode is available for Python only.'
                                    }
                                >
                                    <ToggleSwitch
                                        checked={liveModeSupported && liveMode}
                                        label="Live programming mode"
                                        disabled={!liveModeSupported || isLoading}
                                        onChange={() => {
                                            if (!liveModeSupported) return;
                                            setLiveMode((prev) => !prev);
                                        }}
                                    />
                                </Tooltip>
                                <ToggleSwitch
                                    checked={autoPlay}
                                    label="Auto-play after run"
                                    onChange={() => setAutoPlay((prev) => !prev)}
                                />
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span>Step delay:</span>
                                    <Tooltip content={`${(playDelay / 1000).toFixed(1)}s per step`}>
                                        <input
                                            type="range"
                                            min={300}
                                            max={2000}
                                            step={100}
                                            value={playDelay}
                                            onChange={(event) => setPlayDelay(Number(event.target.value))}
                                            className="w-36 accent-purple-500"
                                        />
                                    </Tooltip>
                                </div>
                                {liveMode && (
                                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-500 dark:text-purple-300">
                                        {liveUpdating ? (
                                            <Spinner size="sm" />
                                        ) : (
                                            <FaBolt className="text-purple-400" />
                                        )}
                                        <span>{liveUpdating ? 'Updating trace…' : 'Live mode active'}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-full lg:w-80 space-y-4">
                            <Card className="bg-purple-500/10 border border-purple-200 dark:border-purple-700">
                                <div className="flex items-center gap-3">
                                    <FaCode className="text-purple-500" />
                                    <div>
                                        <h2 className="text-sm font-semibold">How it works</h2>
                                        <p className="text-xs text-gray-600 dark:text-gray-300">{howItWorksDescription}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-amber-500/10 border border-amber-200 dark:border-amber-700">
                                <div className="flex items-start gap-3">
                                    <FaBug className="text-amber-500 mt-1" />
                                    <div>
                                        <h2 className="text-sm font-semibold">Tips</h2>
                                        <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                            <li>Add print statements to compare console output with variable snapshots.</li>
                                            <li>Recursive functions shine when you track the stack growth step-by-step.</li>
                                            <li>Use the slider to slow down tricky sections of code.</li>
                                        </ul>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </Card>

                {errorMessage && (
                    <Alert color="failure" icon={FaBug} className="max-w-4xl mx-auto">
                        {errorMessage}
                    </Alert>
                )}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <Card className="space-y-5 bg-white/90 dark:bg-gray-800/80 backdrop-blur">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <FaCode /> Trace timeline
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {hasEvents
                                        ? `Step ${currentIndex + 1} of ${events.length} (${timelineProgress}% complete)`
                                        : 'Run the visualizer to generate an execution trace.'}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button color="light" onClick={handleStepBackward} disabled={!hasEvents}>
                                    <FaStepBackward className="mr-1" /> Prev
                                </Button>
                                <Button color="light" onClick={togglePlayback} disabled={!hasEvents}>
                                    {isPlaying ? (
                                        <>
                                            <FaPause className="mr-1" /> Pause
                                        </>
                                    ) : (
                                        <>
                                            <FaPlay className="mr-1" /> Play
                                        </>
                                    )}
                                </Button>
                                <Button color="light" onClick={handleStepForward} disabled={!hasEvents}>
                                    <FaStepForward className="mr-1" /> Next
                                </Button>
                                <Button color="light" onClick={() => goToStep(0)} disabled={!hasEvents}>
                                    <FaRedo className="mr-1" /> Restart
                                </Button>
                            </div>
                        </div>

                        {hasEvents && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                        <FaChartBar />
                                        <span>Execution insights</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white/70 dark:bg-gray-900/40">
                                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total steps</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{insights.totalEvents}</p>
                                        </div>
                                        <div className="rounded-lg border border-purple-200 dark:border-purple-700 p-3 bg-purple-500/10">
                                            <p className="text-xs uppercase tracking-wide text-purple-500">Call events</p>
                                            <p className="text-lg font-semibold text-purple-600 dark:text-purple-300">{insights.counts.call}</p>
                                        </div>
                                        <div className="rounded-lg border border-blue-200 dark:border-blue-700 p-3 bg-blue-500/10">
                                            <p className="text-xs uppercase tracking-wide text-blue-500">Line events</p>
                                            <p className="text-lg font-semibold text-blue-600 dark:text-blue-300">{insights.counts.line}</p>
                                        </div>
                                        <div className="rounded-lg border border-emerald-200 dark:border-emerald-700 p-3 bg-emerald-500/10">
                                            <p className="text-xs uppercase tracking-wide text-emerald-500">Returns</p>
                                            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-300">{insights.counts.return}</p>
                                        </div>
                                        <div className="rounded-lg border border-rose-200 dark:border-rose-700 p-3 bg-rose-500/10">
                                            <p className="text-xs uppercase tracking-wide text-rose-500">Exceptions</p>
                                            <p className="text-lg font-semibold text-rose-600 dark:text-rose-300">{insights.counts.exception}</p>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white/70 dark:bg-gray-900/40">
                                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Unique functions</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{insights.uniqueFunctionCount}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Scrub the timeline</label>
                                    <input
                                        type="range"
                                        min={0}
                                        max={Math.max(events.length - 1, 0)}
                                        value={currentIndex}
                                        onChange={(event) => goToStep(Number(event.target.value))}
                                        className="w-full accent-purple-500"
                                    />
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span>Start</span>
                                        <span>
                                            Step {currentIndex + 1} · {formatStepLabel(currentEvent)} · line {currentEvent?.line ?? '—'}
                                        </span>
                                        <span>End</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"
                                            style={{ width: `${timelineProgress}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                                        Max stack depth observed: <span className="font-semibold text-indigo-500 dark:text-indigo-300">{insights.maxStackDepth}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {hasEvents && (
                                <div className="flex items-center justify-end gap-4 bg-gray-100 dark:bg-gray-900 text-[0.7rem] uppercase tracking-wide text-gray-500 dark:text-gray-400 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                                    <span className="flex items-center gap-1">
                                        <FaArrowRight className="text-green-400" aria-hidden="true" />
                                        Current line
                                    </span>
                                    {nextLine && (
                                        <span className="flex items-center gap-1">
                                            <FaArrowRight className="text-red-400" aria-hidden="true" />
                                            Next line
                                        </span>
                                    )}
                                </div>
                            )}
                            <pre className="bg-gray-900 text-gray-100 text-sm font-mono p-4 overflow-auto max-h-[420px]">
                                {codeLines.map((line, index) => {
                                    const isActive = currentLine === index + 1;
                                    const isNext = !isActive && nextLine === index + 1;
                                    return (
                                        <div
                                            key={index}
                                            className={`flex items-start gap-3 py-1 px-2 rounded transition-colors ${
                                                isActive
                                                    ? 'bg-purple-500/30 text-white'
                                                    : isNext
                                                    ? 'bg-red-500/10 text-gray-200'
                                                    : 'text-gray-300'
                                            }`}
                                        >
                                            <span className="w-6 flex justify-center pt-1">
                                                {isActive ? (
                                                    <FaArrowRight className="text-green-400" aria-label="Current executing line" />
                                                ) : isNext ? (
                                                    <FaArrowRight className="text-red-400" aria-label="Next line in trace" />
                                                ) : null}
                                            </span>
                                            <span className="w-10 text-right text-xs text-gray-500 dark:text-gray-500">
                                                {index + 1}
                                            </span>
                                            <span className="flex-1 whitespace-pre">{line || ' '}</span>
                                        </div>
                                    );
                                })}
                            </pre>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Timeline
                            </h3>
                            {hasEvents ? (
                                <div className="flex overflow-x-auto gap-3 pb-1">
                                    {events.map((event, index) => {
                                        const isActive = index === currentIndex;
                                        const meta = eventMetadata[event.event] ?? { color: 'gray', label: 'Event' };
                                        return (
                                            <Tooltip
                                                key={`event-${index}`}
                                                content={`${formatStepLabel(event)} — ${descriptiveLabels[event.event] || ''}`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => goToStep(index)}
                                                    className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                                                        isActive
                                                            ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                                                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-purple-400'
                                                    }`}
                                                >
                                                    <span className="text-[0.7rem] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                                        #{index + 1}
                                                    </span>
                                                    <span>{meta.label}</span>
                                                </button>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Once a trace is generated, each event will appear here for quick navigation.
                                </p>
                            )}
                        </div>
                    </Card>

                    <Card className="space-y-5 bg-white/90 dark:bg-gray-800/80 backdrop-blur">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FaTerminal /> State inspector
                            </h2>
                            {activeEventMeta && (
                                <Badge color={activeEventMeta.color} className="uppercase">
                                    {activeEventMeta.label}
                                </Badge>
                            )}
                        </div>

                        {currentEvent ? (
                            <div className="space-y-4">
                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
                                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Event details</h3>
                                    <dl className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex justify-between">
                                            <dt>Function</dt>
                                            <dd className="font-mono">{currentEvent.function}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt>Line</dt>
                                            <dd className="font-mono">{currentEvent.line}</dd>
                                        </div>
                                        {currentEvent.event === 'return' && currentEvent.returnValue && (
                                            <div className="flex justify-between">
                                                <dt>Return value</dt>
                                                <dd className="font-mono">{currentEvent.returnValue}</dd>
                                            </div>
                                        )}
                                        {currentEvent.event === 'exception' && currentEvent.exception && (
                                            <div className="text-red-500 dark:text-red-400">
                                                <p className="font-semibold">{currentEvent.exception.type}</p>
                                                <p className="font-mono text-xs">{currentEvent.exception.message}</p>
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            {descriptiveLabels[currentEvent.event]}
                                        </div>
                                    </dl>
                                </div>

                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
                                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Variable changes</h3>
                                    {previousEvent ? (
                                        variableDiff.added.length === 0 &&
                                        variableDiff.updated.length === 0 &&
                                        variableDiff.removed.length === 0 ? (
                                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No variable changes since the previous step.</p>
                                        ) : (
                                            <div className="mt-3 space-y-3 text-sm font-mono text-gray-700 dark:text-gray-200">
                                                {variableDiff.added.length > 0 && (
                                                    <div>
                                                        <p className="flex items-center gap-2 text-green-500">
                                                            <FaPlusCircle /> Added
                                                        </p>
                                                        <ul className="mt-1 space-y-1">
                                                            {variableDiff.added.map(({ key, value }) => (
                                                                <li key={`added-${key}`} className="flex justify-between gap-3">
                                                                    <span>{key}</span>
                                                                    <span className="text-right break-all">{value}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {variableDiff.updated.length > 0 && (
                                                    <div>
                                                        <p className="flex items-center gap-2 text-amber-500">
                                                            <FaExchangeAlt /> Updated
                                                        </p>
                                                        <ul className="mt-1 space-y-1">
                                                            {variableDiff.updated.map(({ key, previous, current }) => (
                                                                <li key={`updated-${key}`} className="flex flex-col gap-1">
                                                                    <div className="flex justify-between gap-3">
                                                                        <span>{key}</span>
                                                                        <span className="text-right break-all">{current}</span>
                                                                    </div>
                                                                    <div className="flex justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                                        <span>Previous</span>
                                                                        <span className="text-right break-all">{previous}</span>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {variableDiff.removed.length > 0 && (
                                                    <div>
                                                        <p className="flex items-center gap-2 text-rose-500">
                                                            <FaMinusCircle /> Removed
                                                        </p>
                                                        <ul className="mt-1 space-y-1">
                                                            {variableDiff.removed.map(({ key, previous }) => (
                                                                <li key={`removed-${key}`} className="flex justify-between gap-3">
                                                                    <span>{key}</span>
                                                                    <span className="text-right break-all">{previous}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            Initial step — variable history will appear after the next event.
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
                                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Local variables</h3>
                                    {currentEvent.locals && Object.keys(currentEvent.locals).length > 0 ? (
                                        <ul className="mt-2 space-y-1 text-sm font-mono text-gray-700 dark:text-gray-200">
                                            {Object.entries(currentEvent.locals).map(([key, value]) => (
                                                <li key={key} className="flex justify-between gap-3">
                                                    <span className="text-purple-500">{key}</span>
                                                    <span className="text-right break-all">{value}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No locals captured for this step.</p>
                                    )}
                                </div>

                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
                                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Call stack</h3>
                                    {currentEvent.stack && currentEvent.stack.length > 0 ? (
                                        <div className="mt-3 space-y-3 text-sm text-gray-700 dark:text-gray-200">
                                            <ol className="space-y-2">
                                                {currentEvent.stack.map((frame, index) => {
                                                    const isTopFrame = index === currentEvent.stack.length - 1;
                                                    const isNewFrame = index >= stackDiff.persistedLength;
                                                    return (
                                                        <li
                                                            key={`${frame.function}-${index}`}
                                                            className={`rounded border px-3 py-2 flex items-center justify-between gap-3 transition ${
                                                                isNewFrame
                                                                    ? 'border-purple-400/60 bg-purple-500/10'
                                                                    : 'border-gray-200 dark:border-gray-700 bg-gray-900/40'
                                                            } ${
                                                                isTopFrame ? 'shadow-lg shadow-purple-500/10 ring-1 ring-purple-400/40' : ''
                                                            }`}
                                                        >
                                                            <div>
                                                                <p className="font-semibold text-gray-800 dark:text-gray-100">
                                                                    {frame.function}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">line {frame.line}</p>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1 text-xs uppercase tracking-wide">
                                                                {isNewFrame && (
                                                                    <span className="flex items-center gap-1 text-purple-400">
                                                                        <FaPlusCircle className="text-[0.6rem]" /> New frame
                                                                    </span>
                                                                )}
                                                                {isTopFrame && (
                                                                    <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                                                                        Current call
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ol>
                                            {(stackDiff.pushed.length > 0 || stackDiff.popped.length > 0) && (
                                                <div className="space-y-1 border-t border-dashed border-gray-200 dark:border-gray-700 pt-2 text-xs">
                                                    {stackDiff.pushed.length > 0 && (
                                                        <p className="flex items-center gap-2 text-purple-400">
                                                            <FaPlusCircle />
                                                            <span>
                                                                {stackDiff.pushed.length === 1
                                                                    ? 'A new frame was pushed:'
                                                                    : `${stackDiff.pushed.length} frames were pushed:`}{' '}
                                                                {stackDiff.pushed.map((frame) => formatFrameLabel(frame)).join(' → ')}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {stackDiff.popped.length > 0 && (
                                                        <p className="flex items-center gap-2 text-rose-400">
                                                            <FaMinusCircle />
                                                            <span>
                                                                {stackDiff.popped.length === 1
                                                                    ? 'A frame returned:'
                                                                    : `${stackDiff.popped.length} frames returned:`}{' '}
                                                                {stackDiff.popped.map((frame) => formatFrameLabel(frame)).join(' → ')}
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Frames are ordered from the first call at the top to the active frame at the bottom.
                                                Watch how recursive calls push new frames and returns pop them off the stack.
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Stack is empty at this step.</p>
                                    )}
                                </div>

                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Frames &amp; heap</h3>
                                        {selectedObjectId && (
                                            <span className="text-xs font-mono text-purple-400">
                                                Focused: {selectedObjectId}
                                                {focusedObject?.type ? ` · ${focusedObject.type}` : ''}
                                            </span>
                                        )}
                                    </div>
                                    {memoryAvailable ? (
                                        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)]">
                                            <div className="space-y-3">
                                                <h4 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Stack frames
                                                </h4>
                                                {memoryFrames.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {memoryFrames.map((frame, index) => {
                                                            const localsEntries = Object.entries(frame.locals || {});
                                                            return (
                                                                <div
                                                                    key={`${frame.function}-${index}`}
                                                                    className="rounded border border-gray-200 dark:border-gray-700 bg-gray-900/40 p-3 space-y-2"
                                                                >
                                                                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
                                                                        <span>{frame.function}</span>
                                                                        <span>line {frame.line}</span>
                                                                    </div>
                                                                    {localsEntries.length > 0 ? (
                                                                        <ul className="space-y-1 text-xs text-gray-200">
                                                                            {localsEntries.map(([name, info]) => {
                                                                                const isSelected = info?.objectId && selectedObjectId === info.objectId;
                                                                                return (
                                                                                    <li
                                                                                        key={`${frame.function}-${name}`}
                                                                                        className={`rounded border px-2 py-1 flex flex-col gap-1 ${
                                                                                            isSelected
                                                                                                ? 'border-purple-500 bg-purple-500/20'
                                                                                                : 'border-gray-700 bg-gray-900/60'
                                                                                        }`}
                                                                                    >
                                                                                        <div className="flex items-center justify-between">
                                                                                            <span className="font-semibold text-purple-300">{name}</span>
                                                                                            {renderReferenceBadge(
                                                                                                info?.objectId
                                                                                                    ? { type: 'reference', objectId: info.objectId, preview: info.preview }
                                                                                                    : { type: 'primitive', value: info?.preview }
                                                                                            )}
                                                                                        </div>
                                                                                        {info?.preview && (
                                                                                            <span className="font-mono text-[0.65rem] text-gray-400 truncate">
                                                                                                {info.preview}
                                                                                            </span>
                                                                                        )}
                                                                                    </li>
                                                                                );
                                                                            })}
                                                                        </ul>
                                                                    ) : (
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">(no locals)</p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">No frame data captured.</p>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Heap objects
                                                </h4>
                                                {memoryObjects.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {memoryObjects.map((object) => {
                                                            const isSelected = selectedObjectId === object.id;
                                                            return (
                                                                <div
                                                                    key={object.id}
                                                                    className={`rounded border p-3 space-y-2 transition ${
                                                                        isSelected
                                                                            ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                                                                            : 'border-gray-200 dark:border-gray-700'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between text-xs">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleSelectObject(object.id)}
                                                                            className={`font-semibold font-mono px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                                                                                isSelected
                                                                                    ? 'bg-purple-600 text-white'
                                                                                    : 'bg-gray-900 text-purple-200'
                                                                            }`}
                                                                        >
                                                                            {object.id}
                                                                        </button>
                                                                        <span className="uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                                            {object.type}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[0.7rem] text-gray-400 dark:text-gray-500">
                                                                        {object.kind}
                                                                        {object.truncated ? ' · truncated' : ''}
                                                                    </p>
                                                                    {renderObjectDetails(object)}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">No heap objects recorded.</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            Memory snapshots are unavailable for this step.
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Generate a trace to inspect execution state. Variable snapshots, return values, and exceptions
                                will appear here as you step through the timeline.
                            </div>
                        )}

                        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <FaTerminal /> Console output
                            </div>
                            <pre className="bg-gray-900 text-green-300 text-sm font-mono p-3 rounded-lg min-h-[100px] overflow-auto">
                                {stdoutForCurrentStep ? stdoutForCurrentStep : 'No output captured yet.'}
                            </pre>
                            {stderrOutput && (
                                <Alert color="warning" className="bg-amber-500/10 border border-amber-200 dark:border-amber-600">
                                    <span className="font-semibold">stderr</span>
                                    <pre className="mt-1 text-xs font-mono whitespace-pre-wrap text-amber-600 dark:text-amber-300">
                                        {stderrOutput}
                                    </pre>
                                </Alert>
                            )}
                            {trace?.error?.traceback && (
                                <Alert color="failure" className="bg-red-500/10 border border-red-300 dark:border-red-600">
                                    <span className="font-semibold">Python traceback</span>
                                    <pre className="mt-2 text-xs font-mono whitespace-pre-wrap text-red-500 dark:text-red-300">
                                        {trace.error.traceback}
                                    </pre>
                                </Alert>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
