import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Alert,
    Badge,
    Button,
    TextInput,
    Textarea,
} from 'flowbite-react';
import {
    FaArrowRight,
    FaCheckCircle,
    FaCopy,
    FaExternalLinkAlt,
    FaSyncAlt,
    FaSearch,
    FaHistory,
    FaLightbulb,
} from 'react-icons/fa';
import PropTypes from 'prop-types';
import { workspaceTools, resourceTools, toolCategories } from '../data/toolsData';

const defaultJsonSample = `{
  "name": "ScientistShield",
  "stack": ["React", "Node", "Tailwind"],
  "features": {
    "tools": true,
    "tutorials": true
  }
}`;

function JsonFormatterTool() {
    const [input, setInput] = useState(defaultJsonSample);
    const [output, setOutput] = useState('');
    const [status, setStatus] = useState(null);

    const handleFormat = () => {
        try {
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, 2);
            setOutput(formatted);
            setStatus({ type: 'success', message: 'Valid JSON • formatted with indentation' });
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
            setOutput('');
        }
    };

    const handleMinify = () => {
        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            setOutput(minified);
            setStatus({ type: 'success', message: 'Valid JSON • minified output ready' });
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
            setOutput('');
        }
    };

    const handleCopy = async () => {
        if (!output) return;
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(output);
                setStatus({ type: 'success', message: 'Output copied to clipboard!' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Unable to access clipboard' });
        }
    };

    return (
        <div className="space-y-space-md">
            <Textarea
                rows={7}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Paste JSON you want to validate or format"
            />
            <div className="flex flex-wrap gap-space-sm">
                <Button onClick={handleFormat} gradientDuoTone="purpleToBlue">
                    Beautify JSON
                </Button>
                <Button onClick={handleMinify} color="dark" outline>
                    Minify
                </Button>
                <Button onClick={handleCopy} color="gray" outline disabled={!output}>
                    <FaCopy className="mr-2" /> Copy Output
                </Button>
            </div>
            {status && (
                <Alert color={status.type === 'success' ? 'success' : 'failure'}>
                    {status.type === 'success' ? <FaCheckCircle className="mr-2 inline" /> : null}
                    <span className="font-medium">{status.message}</span>
                </Alert>
            )}
            <Textarea
                rows={7}
                value={output}
                readOnly
                placeholder="Formatted JSON will appear here"
            />
        </div>
    );
}

function Base64Tool() {
    const [mode, setMode] = useState('encode');
    const [input, setInput] = useState('Hello ScientistShield!');
    const [output, setOutput] = useState('');
    const [error, setError] = useState(null);

    const toBase64 = (value) => window.btoa(unescape(encodeURIComponent(value)));
    const fromBase64 = (value) => decodeURIComponent(escape(window.atob(value)));

    const handleConvert = () => {
        try {
            if (mode === 'encode') {
                setOutput(toBase64(input));
            } else {
                setOutput(fromBase64(input));
            }
            setError(null);
        } catch (err) {
            setError('Conversion failed. Check the input string.');
            setOutput('');
        }
    };

    const swapMode = () => {
        setMode((prev) => (prev === 'encode' ? 'decode' : 'encode'));
        setOutput('');
        setError(null);
    };

    return (
        <div className="space-y-space-md">
            <div className="flex flex-wrap gap-space-sm items-center">
                <Button onClick={handleConvert} gradientDuoTone="greenToBlue">
                    {mode === 'encode' ? 'Encode' : 'Decode'}
                </Button>
                <Button onClick={swapMode} color="dark" outline>
                    <FaSyncAlt className="mr-2" /> Switch to {mode === 'encode' ? 'Decode' : 'Encode'}
                </Button>
            </div>
            <Textarea
                rows={5}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={mode === 'encode' ? 'Enter text to encode…' : 'Paste Base64 to decode…'}
            />
            {error && (
                <Alert color="failure">
                    {error}
                </Alert>
            )}
            <Textarea
                rows={5}
                value={output}
                readOnly
                placeholder="Your converted result will appear here"
            />
        </div>
    );
}

function TextTransformerTool() {
    const [input, setInput] = useState('Tutorialspoint inspired developer tools hub');
    const [output, setOutput] = useState('');

    const applyTransform = (type) => {
        const text = input;
        let transformed = text;
        switch (type) {
            case 'upper':
                transformed = text.toUpperCase();
                break;
            case 'lower':
                transformed = text.toLowerCase();
                break;
            case 'title':
                transformed = text.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase());
                break;
            case 'sentence':
                transformed = text
                    .toLowerCase()
                    .replace(/(^\s*\w|[.!?]\s*\w)/g, (char) => char.toUpperCase());
                break;
            case 'snake':
                transformed = text
                    .replace(/[^a-zA-Z0-9]+/g, ' ')
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, '_');
                break;
            default:
                break;
        }
        setOutput(transformed);
    };

    const copyResult = async () => {
        if (!output) return;
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(output);
            }
        } catch (error) {
            // Ignore clipboard errors silently
        }
    };

    const stats = useMemo(() => {
        const trimmed = input.trim();
        return {
            words: trimmed ? trimmed.split(/\s+/).length : 0,
            characters: input.length,
        };
    }, [input]);

    return (
        <div className="space-y-space-md">
            <Textarea
                rows={5}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Paste or type text to transform"
            />
            <div className="flex flex-wrap gap-space-sm">
                <Button onClick={() => applyTransform('upper')} color="dark" outline>
                    Uppercase
                </Button>
                <Button onClick={() => applyTransform('lower')} color="dark" outline>
                    Lowercase
                </Button>
                <Button onClick={() => applyTransform('title')} color="dark" outline>
                    Title Case
                </Button>
                <Button onClick={() => applyTransform('sentence')} color="dark" outline>
                    Sentence Case
                </Button>
                <Button onClick={() => applyTransform('snake')} color="dark" outline>
                    Snake Case
                </Button>
                <Button onClick={copyResult} color="gray" outline disabled={!output}>
                    <FaCopy className="mr-2" /> Copy Result
                </Button>
            </div>
            <div className="flex flex-wrap gap-space-sm text-sm text-gray-600 dark:text-gray-400">
                <Badge color="gray" size="sm">{stats.words} words</Badge>
                <Badge color="gray" size="sm">{stats.characters} characters</Badge>
            </div>
            <Textarea
                rows={5}
                value={output}
                readOnly
                placeholder="Transformed text will appear here"
            />
        </div>
    );
}

const workspaceComponents = {
    'json-formatter': JsonFormatterTool,
    'base64-converter': Base64Tool,
    'text-transformer': TextTransformerTool,
};

const RECENT_WORKSPACE_KEY = 'scientistshield.recentWorkspaceTools';
const workspaceToolIdSet = new Set(workspaceTools.map((tool) => tool.id));

const cardVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
};

function ResourceCard({ tool }) {
    const Icon = tool.icon;
    const card = (
        <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, boxShadow: '0 20px 35px -20px rgba(15, 23, 42, 0.6)' }}
            className="relative h-full rounded-radius-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 p-space-xl backdrop-blur"
        >
            <div className="flex items-center gap-space-md mb-space-sm">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-radius-full bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                    <Icon className="text-xl" />
                </span>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tool.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tool.category}</p>
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-space-md">{tool.description}</p>
            <div className="flex flex-wrap gap-space-xs text-xs text-gray-500 dark:text-gray-400 mb-space-md">
                {tool.tags?.map((tag) => (
                    <span key={tag} className="rounded-radius-full border border-gray-200 dark:border-gray-700 px-space-sm py-[2px]">
                        #{tag}
                    </span>
                ))}
            </div>
            {tool.highlight && (
                <Badge color="info" className="mb-space-md w-fit">
                    {tool.highlight}
                </Badge>
            )}
            {tool.isFeatured && (
                <span className="absolute right-space-md top-space-md rounded-radius-full bg-emerald-500/10 px-space-sm py-[2px] text-xs font-semibold text-emerald-600">
                    Featured
                </span>
            )}
            <div className="mt-auto flex items-center gap-space-xs text-sm font-medium text-cyan-600 dark:text-cyan-400">
                <span>Open tool</span>
                <FaArrowRight />
            </div>
        </motion.div>
    );

    if (tool.external) {
        return (
            <a href={tool.href} target="_blank" rel="noopener noreferrer" className="block h-full">
                {card}
            </a>
        );
    }

    return (
        <Link to={tool.href} className="block h-full">
            {card}
        </Link>
    );
}

ResourceCard.propTypes = {
    tool: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        icon: PropTypes.elementType.isRequired,
        category: PropTypes.string.isRequired,
        tags: PropTypes.arrayOf(PropTypes.string),
        highlight: PropTypes.string,
        isFeatured: PropTypes.bool,
        external: PropTypes.bool,
        href: PropTypes.string.isRequired,
    }).isRequired,
};

export default function Tools() {
    const [activeWorkspaceTool, setActiveWorkspaceTool] = useState(workspaceTools[0]?.id ?? null);
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('all');
    const [recentWorkspaceTools, setRecentWorkspaceTools] = useState([]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const stored = window.localStorage.getItem(RECENT_WORKSPACE_KEY);
            if (!stored) return;
            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) return;
            const valid = parsed.filter((id) => workspaceToolIdSet.has(id));
            if (valid.length) {
                setRecentWorkspaceTools(valid);
            }
        } catch (error) {
            // Ignore storage access issues silently
        }
    }, []);

    useEffect(() => {
        if (!activeWorkspaceTool || !workspaceToolIdSet.has(activeWorkspaceTool)) return;
        setRecentWorkspaceTools((prev) => {
            const next = [activeWorkspaceTool, ...prev.filter((id) => id !== activeWorkspaceTool)].slice(0, 4);
            if (next.length === prev.length && next.every((value, index) => value === prev[index])) {
                return prev;
            }
            if (typeof window !== 'undefined') {
                try {
                    window.localStorage.setItem(RECENT_WORKSPACE_KEY, JSON.stringify(next));
                } catch (error) {
                    // Ignore storage access issues silently
                }
            }
            return next;
        });
    }, [activeWorkspaceTool]);

    const ActiveComponent = activeWorkspaceTool ? workspaceComponents[activeWorkspaceTool] : null;
    const selectedTool = workspaceTools.find((tool) => tool.id === activeWorkspaceTool);
    const SelectedIcon = selectedTool?.icon;

    const filteredTools = useMemo(() => {
        return resourceTools.filter((tool) => {
            const matchesCategory = category === 'all' || tool.category === category;
            const query = searchTerm.trim().toLowerCase();
            if (!query) return matchesCategory;
            const haystack = `${tool.name} ${tool.description} ${tool.tags?.join(' ') ?? ''}`.toLowerCase();
            return matchesCategory && haystack.includes(query);
        });
    }, [category, searchTerm]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 pb-space-5xl">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-space-4xl px-space-md lg:px-space-2xl py-space-5xl">
                <section className="relative overflow-hidden rounded-radius-lg border border-white/20 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-space-5xl text-white shadow-2xl">
                    <div className="absolute -top-24 right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-900/40" />
                    <div className="relative z-10 flex flex-col gap-space-lg">
                        <div className="flex w-fit flex-wrap items-center gap-space-sm">
                            <div className="inline-flex items-center gap-space-xs rounded-radius-full bg-white/10 px-space-md py-[6px] text-xs font-semibold uppercase tracking-wide">
                                Inspired by tutorialsPoint toolkits
                            </div>
                            <div className="inline-flex items-center gap-space-xs rounded-radius-full bg-white/15 px-space-md py-[6px] text-xs font-semibold uppercase tracking-wide">
                                Upgraded UI &amp; UX workspace
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                            Developer tools and utilities in one hub
                        </h1>
                        <p className="max-w-2xl text-base sm:text-lg text-white/80">
                            Explore quick utilities, interactive coding sandboxes, and productivity boosters that mirror the rich toolset found on tutorialsPoint—now deeply integrated into ScientistShield.
                        </p>
                        <div className="flex flex-wrap gap-space-sm">
                            <Button as={Link} to="/tryit" color="light" className="text-gray-900">
                                Launch Playground
                            </Button>
                            <Button as={Link} to="/visualizer" color="light" outline className="text-white border-white">
                                Inspect Algorithms
                            </Button>
                        </div>
                        <div className="grid gap-space-md sm:grid-cols-3 text-sm">
                            <div className="rounded-radius-md bg-white/10 p-space-md">
                                <p className="text-xs uppercase tracking-wide text-white/70">Interactive utilities</p>
                                <p className="mt-1 text-xl font-semibold">{workspaceTools.length} built-in</p>
                            </div>
                            <div className="rounded-radius-md bg-white/10 p-space-md">
                                <p className="text-xs uppercase tracking-wide text-white/70">Resource directory</p>
                                <p className="mt-1 text-xl font-semibold">{resourceTools.length} curated</p>
                            </div>
                            <div className="rounded-radius-md bg-white/10 p-space-md">
                                <p className="text-xs uppercase tracking-wide text-white/70">Focus workflows</p>
                                <p className="mt-1 text-xl font-semibold">Practice • Learn • Build</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-space-2xl lg:grid-cols-[320px,1fr]">
                    <aside className="space-y-space-lg">
                        <div className="space-y-space-sm">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Interactive workbench</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Choose a utility to instantly run it in the browser—no setup required.
                            </p>
                        </div>
                        <div className="grid gap-space-sm">
                            {workspaceTools.map((tool) => {
                                const Icon = tool.icon;
                                const active = tool.id === activeWorkspaceTool;
                                return (
                                    <button
                                        key={tool.id}
                                        type="button"
                                        onClick={() => setActiveWorkspaceTool(tool.id)}
                                        className={`group flex w-full items-center gap-space-md rounded-radius-lg border px-space-md py-space-md text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${
                                            active
                                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 shadow-sm dark:border-cyan-400/70 dark:text-cyan-200'
                                                : 'border-gray-200 text-gray-700 hover:border-cyan-400/60 hover:bg-cyan-400/5 dark:border-gray-700 dark:text-gray-300 dark:hover:border-cyan-400/60'
                                        }`}
                                        aria-pressed={active}
                                    >
                                        <span className={`flex h-10 w-10 items-center justify-center rounded-radius-full bg-gradient-to-br ${tool.accent} text-white shadow-inner`}>
                                            <Icon aria-hidden="true" />
                                        </span>
                                        <div className="space-y-space-xs">
                                            <p className="font-semibold">{tool.name}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">{tool.description}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {recentWorkspaceTools.length > 0 && (
                            <div className="space-y-space-xs rounded-radius-lg border border-dashed border-gray-200 bg-white/70 p-space-md shadow-sm dark:border-gray-700 dark:bg-slate-900/60">
                                <div className="flex items-center gap-space-xs text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    <FaHistory aria-hidden="true" /> Recent tools
                                </div>
                                <div className="flex flex-wrap gap-space-xs">
                                    {recentWorkspaceTools.map((id) => {
                                        const recentTool = workspaceTools.find((tool) => tool.id === id);
                                        if (!recentTool) return null;
                                        const isActive = id === activeWorkspaceTool;
                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => setActiveWorkspaceTool(id)}
                                                className={`rounded-radius-full px-space-sm py-[6px] text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${
                                                    isActive
                                                        ? 'bg-cyan-600 text-white shadow'
                                                        : 'bg-white text-cyan-700 shadow-sm hover:bg-cyan-50 dark:bg-slate-950 dark:text-cyan-200 dark:hover:bg-cyan-900/40'
                                                }`}
                                                aria-pressed={isActive}
                                            >
                                                {recentTool.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </aside>
                    <div className="rounded-radius-lg border border-gray-200 bg-white/80 p-space-xl shadow-lg backdrop-blur dark:border-gray-800 dark:bg-slate-900/80">
                        {ActiveComponent ? (
                            <div className="space-y-space-lg">
                                {selectedTool ? (
                                    <div className="space-y-space-md rounded-radius-lg border border-dashed border-cyan-400/40 bg-cyan-500/5 p-space-lg dark:border-cyan-400/30 dark:bg-cyan-500/10">
                                        <div className="flex flex-col gap-space-sm sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex items-start gap-space-md">
                                                {SelectedIcon ? (
                                                    <span className={`hidden sm:inline-flex h-12 w-12 items-center justify-center rounded-radius-lg bg-gradient-to-br ${selectedTool.accent} text-white shadow-lg`}>
                                                        <SelectedIcon aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                                <div className="space-y-space-xs">
                                                    <div className="inline-flex items-center gap-space-xs text-xs font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-300">
                                                        {selectedTool.category}
                                                    </div>
                                                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{selectedTool.name}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                        {selectedTool.longDescription ?? selectedTool.description}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedTool.tags?.length ? (
                                                <div className="flex flex-wrap gap-space-xs">
                                                    {selectedTool.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="rounded-radius-full bg-white/70 px-space-sm py-[2px] text-xs font-medium text-cyan-700 shadow-sm dark:bg-slate-950/60 dark:text-cyan-200"
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                        {selectedTool.tips?.length ? (
                                            <ul className="grid gap-space-sm text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                                                {selectedTool.tips.map((tip) => (
                                                    <li key={tip} className="flex items-start gap-space-sm">
                                                        <FaLightbulb className="mt-[2px] text-cyan-500 dark:text-cyan-300" aria-hidden="true" />
                                                        <span>{tip}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </div>
                                ) : null}
                                <div className="rounded-radius-lg border border-gray-100 bg-white/90 p-space-lg shadow-sm dark:border-gray-800 dark:bg-slate-950/90">
                                    <ActiveComponent />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-space-sm text-center text-sm text-gray-600 dark:text-gray-400">
                                <p>Select a workspace tool from the left to get started.</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="space-y-space-xl">
                    <div className="flex flex-col gap-space-md lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Explore more tools</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Filter by category or search to jump into a specific workflow.
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-space-sm sm:flex-row sm:items-center sm:justify-end">
                            <TextInput
                                icon={FaSearch}
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search tools"
                                aria-label="Search tools"
                                type="search"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-space-sm">
                        {toolCategories.map((cat) => {
                            const isActive = category === cat;
                            return (
                                <button
                                    type="button"
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`rounded-radius-full border px-space-md py-[6px] text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${
                                        isActive
                                            ? 'border-transparent bg-cyan-600 text-white shadow'
                                            : 'border-gray-200 text-gray-600 hover:border-cyan-400/60 hover:text-cyan-700 dark:border-gray-700 dark:text-gray-300 dark:hover:text-cyan-200'
                                    }`}
                                    aria-pressed={isActive}
                                >
                                    {cat === 'all' ? 'All tools' : cat}
                                </button>
                            );
                        })}
                    </div>
                    <motion.div
                        className="grid grid-cols-1 gap-space-lg sm:grid-cols-2 xl:grid-cols-3"
                        initial="initial"
                        animate="animate"
                        variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
                    >
                        {filteredTools.map((tool) => (
                            <ResourceCard key={tool.id} tool={tool} />
                        ))}
                    </motion.div>
                    {filteredTools.length === 0 && (
                        <div className="flex flex-col items-center gap-space-sm rounded-radius-lg border border-dashed border-gray-300 p-space-2xl text-center dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                No tools match that search yet. Try a different keyword or category.
                            </p>
                            <Button
                                color="light"
                                onClick={() => {
                                    setSearchTerm('');
                                    setCategory('all');
                                }}
                                className="w-fit"
                            >
                                Reset filters
                            </Button>
                        </div>
                    )}
                    <div className="flex flex-col gap-space-sm rounded-radius-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-space-xl shadow-inner">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Need a tool we missed?</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            We are continuously growing this hub. Share the utilities you rely on and we will bring them into the ScientistShield experience.
                        </p>
                        <Button as={Link} to="/search?searchTerm=tool%20request" color="light" className="w-fit">
                            Request a tool <FaExternalLinkAlt className="ml-2" />
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
}