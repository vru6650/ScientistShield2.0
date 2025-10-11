import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { Button, ToggleSwitch, Spinner, Alert, Tooltip } from 'flowbite-react';
import { useSelector } from 'react-redux';
import {
    FaPlay, FaRedo, FaTerminal, FaCopy, FaExpand, FaPlus, FaMinus, FaCheck, FaCompress, FaGlobe, FaExternalLinkAlt,
    FaColumns, FaDownload, FaUpload, FaSearch, FaCodeBranch, FaSave, FaBug, FaPause, FaStepForward, FaStepBackward,
    FaSignInAlt, FaSignOutAlt, FaLevelDownAlt, FaStop, FaKeyboard
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import LanguageSelector from './LanguageSelector';
import useCodeSnippet from '../hooks/useCodeSnippet';

const supportedLanguages = ['javascript', 'cpp', 'python', 'java', 'csharp'];
const storageLanguages = [...supportedLanguages, 'html', 'css'];

const languageAliases = {
    js: 'javascript',
    javascript: 'javascript',
    py: 'python',
    python: 'python',
    'c++': 'cpp',
    cpp: 'cpp',
    java: 'java',
    csharp: 'csharp',
    'c#': 'csharp',
    cs: 'csharp',
    html: 'javascript',
    css: 'javascript',
};

const storageLanguageAliases = {
    js: 'javascript',
    javascript: 'javascript',
    py: 'python',
    python: 'python',
    'c++': 'cpp',
    cpp: 'cpp',
    java: 'java',
    csharp: 'csharp',
    'c#': 'csharp',
    cs: 'csharp',
    html: 'html',
    css: 'css',
};

const normalizeLanguage = (language) => {
    if (!language) {
        return 'javascript';
    }

    const normalizedInput = typeof language === 'string'
        ? language.toLowerCase()
        : String(language).toLowerCase();

    const normalized = languageAliases[normalizedInput] || normalizedInput;

    return supportedLanguages.includes(normalized) ? normalized : 'javascript';
};

const normalizeStorageLanguage = (language) => {
    if (!language) {
        return null;
    }

    const normalizedInput = typeof language === 'string'
        ? language.toLowerCase()
        : String(language).toLowerCase();

    const normalized = storageLanguageAliases[normalizedInput] || normalizedInput;

    return storageLanguages.includes(normalized) ? normalized : null;
};

const normalizeInitialCode = (initialCode, fallbackLanguage) => {
    if (!initialCode) {
        return {};
    }

    if (typeof initialCode === 'string') {
        const normalizedLanguage = normalizeLanguage(fallbackLanguage);
        return { [normalizedLanguage]: initialCode };
    }

    if (typeof initialCode === 'object') {
        return Object.entries(initialCode).reduce((acc, [key, value]) => {
            const normalizedKey = normalizeStorageLanguage(key);
            if (typeof value === 'string' && normalizedKey) {
                acc[normalizedKey] = value;
            }
            return acc;
        }, {});
    }

    return {};
};

const defaultCodes = {
    html: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: sans-serif;
        color: #333;
        padding: 1.5rem;
      }
      h1 {
        color: #7c3aed;
        margin-bottom: 0.75rem;
      }
      p {
        margin: 0;
        color: #475569;
      }
    </style>
  </head>
  <body>
    <h1>Live Preview</h1>
    <p>This preview updates automatically when you run JavaScript.</p>
  </body>
</html>`,
    css: `body {
  background-color: #f8fafc;
  min-height: 100vh;
}
`,
    javascript: `// Use console.log() to see output in the terminal
function greet(name) {
  return 'Hello, ' + name + '!';
}
console.log(greet('Developer'));`,
    cpp: `#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> msg {"Hello", "C++", "World", "from", "ScientistShield!"};
    for (const std::string& word : msg) {
        std::cout << word << " ";
    }
    std::cout << std::endl;
    return 0;
}`,
    java: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello from Java!");
  }
}
`,
    python: `def hello_world():
  message = "Hello, Python World!"
  print(message)

hello_world()`,
    csharp: `using System;

namespace ScientistShield
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Console.WriteLine("Hello from C#!");
        }
    }
}`,
};

export default function CodeEditor({ initialCode = {}, language = 'javascript', snippetId }) {
    const { theme } = useSelector((state) => state.theme);
    const editorRef = useRef(null);
    const outputRef = useRef(null);
    const previewRef = useRef(null);
    const [previewHtml, setPreviewHtml] = useState('');
    const containerRef = useRef(null);
    const dragStateRef = useRef(null);
    const fileInputRef = useRef(null);
    const monacoRef = useRef(null);
    const { snippet, isLoading: isSnippetLoading, error: snippetError } = useCodeSnippet(snippetId);

    const normalizedInitialLanguage = normalizeLanguage(language);
    const storageKey = useMemo(() => `code-editor:v2:${snippetId || 'default'}`, [snippetId]);
    const normalizedInitialCode = useMemo(
        () => normalizeInitialCode(initialCode, normalizedInitialLanguage),
        [initialCode, normalizedInitialLanguage]
    );


    // Consolidated state for all code snippets
    const [codes, setCodes] = useState({
        html: normalizedInitialCode.html || defaultCodes.html,
        css: normalizedInitialCode.css || defaultCodes.css,
        javascript: normalizedInitialCode.javascript || defaultCodes.javascript,
        cpp: normalizedInitialCode.cpp || defaultCodes.cpp,
        python: normalizedInitialCode.python || defaultCodes.python,
        java: normalizedInitialCode.java || defaultCodes.java,
        csharp: normalizedInitialCode.csharp || defaultCodes.csharp,
    });

    const [selectedLanguage, setSelectedLanguage] = useState(normalizedInitialLanguage);
    const [isWebMode, setIsWebMode] = useState(false);
    const [webTab, setWebTab] = useState('javascript');
    const [consoleOutput, setConsoleOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [runError, setRunError] = useState(null);
    const [showOutputPanel, setShowOutputPanel] = useState(true);
    const [editorTheme, setEditorTheme] = useState(theme === 'dark' ? 'vs-dark' : 'vs-light');
    const [fontSize, setFontSize] = useState(14);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [hasAppliedSnippet, setHasAppliedSnippet] = useState(false);
    const [autoRunPreview, setAutoRunPreview] = useState(true);
    const appliedLocalRef = useRef(false);
    const [showMinimap, setShowMinimap] = useState(true);
    const [showLineNumbers, setShowLineNumbers] = useState(true);
    const [wordWrap, setWordWrap] = useState('on'); // 'on' | 'off'
    const [splitVertical, setSplitVertical] = useState(false);
    const [panelSize, setPanelSize] = useState(280); // px
    const [showDiff, setShowDiff] = useState(false);
    const [baselines, setBaselines] = useState(null);
    const baselineInitRef = useRef(false);
    const [cursorPos, setCursorPos] = useState({ lineNumber: 1, column: 1 });
    const [isSaved, setIsSaved] = useState(true);

    // Command palette state
    const [isCmdOpen, setIsCmdOpen] = useState(false);
    const [cmdQuery, setCmdQuery] = useState('');
    const [cmdIndex, setCmdIndex] = useState(0);

    // Debugger state
    const debugSupported = new Set();
    const [debugActive, setDebugActive] = useState(false);
    const [debugTrace, setDebugTrace] = useState(null);
    const [debugIndex, setDebugIndex] = useState(0);
    const [isDebugPlaying, setIsDebugPlaying] = useState(false);
    const [debugDelay, setDebugDelay] = useState(700);
    const [debugError, setDebugError] = useState(null);
    const [breakpointsByLang, setBreakpointsByLang] = useState({}); // { lang: number[] }
    const debugDecorationsRef = useRef([]);
    const [breakOnException, setBreakOnException] = useState(true);
    const [lineOnlyStepping, setLineOnlyStepping] = useState(true);
    const [disableBreakpoints, setDisableBreakpoints] = useState(false);
    const [runToLineTarget, setRunToLineTarget] = useState(null);
    const [selectedDebugFrame, setSelectedDebugFrame] = useState(null);
    const [selectedDebugObjectId, setSelectedDebugObjectId] = useState(null);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Shortcuts
        try {
            // Ctrl/Cmd + Enter => Run
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                runCode();
            });
            // Ctrl/Cmd + S => Format
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                formatCode();
            });
            // F11 => Toggle Fullscreen
            editor.addCommand(monaco.KeyCode.F11, () => {
                toggleFullScreen();
            });
            // Ctrl/Cmd + F => Find
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
                editor.getAction('actions.find')?.run();
            });
            // Cursor status tracking
            setCursorPos(editor.getPosition() || { lineNumber: 1, column: 1 });
            editor.onDidChangeCursorPosition((e) => {
                setCursorPos(e.position);
            });

            // Gutter click: toggle breakpoint
            editor.onMouseDown((e) => {
                try {
                    const m = monaco.editor?.MouseTargetType;
                    if (!m) return;
                    if (e.target.type === m.GUTTER_GLYPH_MARGIN || e.target.type === m.GUTTER_LINE_DECORATIONS) {
                        const line = e.target.position?.lineNumber;
                        if (line) toggleBreakpoint(line);
                    }
                } catch (_) {}
            });

            // Keyboard shortcuts for debugger (Thonny-like)
            try {
                editor.addCommand(monaco.KeyCode.F5, () => setIsDebugPlaying((p) => !p)); // Continue/Pause
                editor.addCommand(monaco.KeyCode.F10, () => stepOver()); // Step Over
                editor.addCommand(monaco.KeyCode.F11, () => stepInto()); // Step Into
                editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F11, () => stepOut()); // Step Out
                editor.addCommand(monaco.KeyCode.F9, () => toggleBreakpointAtCursor()); // Toggle BP
                editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F9, () => clearBreakpoints()); // Clear BP
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.F10, () => runToCursor()); // Run to cursor
            } catch (_) {}
        } catch (e) {
            // non-fatal
        }
    };


    const handleCodeChange = (newCode) => {
        const activeLang = isWebMode ? webTab : selectedLanguage;
        setCodes(prevCodes => ({
            ...prevCodes,
            [activeLang]: newCode
        }));
        setIsSaved(false);
    };

    const buildPreviewHtml = () => {
        const html = codes.html || '';
        const css = codes.css || '';
        const js = codes.javascript || '';
        return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; min-height: 100%; }
      ${css}
    </style>
  </head>
  <body>
    ${html}
    <script>
      try { ${js} } catch (e) { console.error(e); }
    </script>
  </body>
</html>`;
    };

    const updatePreview = () => {
        // Use srcDoc to render the preview to avoid cross-origin access errors
        setPreviewHtml(buildPreviewHtml());
    };

    const runCode = async () => {
        if (isWebMode) {
            updatePreview();
            return;
        }
        setIsRunning(true);
        setRunError(null);
        setConsoleOutput('');

        const endpointMap = {
            javascript: '/api/code/run-js',
            cpp: '/api/code/run-cpp',
            python: '/api/code/run-python',
            java: '/api/code/run-java',
            csharp: '/api/code/run-csharp',
        };

        const endpoint = endpointMap[selectedLanguage];

        if (!endpoint) {
            setRunError(`Unsupported language: ${selectedLanguage}`);
            setIsRunning(false);
            return;
        }

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codes[selectedLanguage] }),
            });
            const data = await res.json();
            if (data.error) {
                setRunError(data.output);
            } else {
                setConsoleOutput(data.output);
            }
        } catch (error) {
            setRunError(`An error occurred while running the ${selectedLanguage} code.`);
            console.error(error);
        } finally {
            setIsRunning(false);
        }
    };

    useEffect(() => {
        setEditorTheme(theme === 'dark' ? 'vs-dark' : 'vs-light');
    }, [theme]);

    // Auto-run preview when code changes in web mode
    useEffect(() => {
        if (!isWebMode || !autoRunPreview) return;
        const t = setTimeout(() => updatePreview(), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [codes.html, codes.css, codes.javascript, isWebMode, autoRunPreview]);

    // When switching to web mode, ensure webTab and default preview
    useEffect(() => {
        if (isWebMode) {
            setWebTab((prev) => (['html','css','javascript'].includes(prev) ? prev : 'javascript'));
            // Initialize preview once on enter
            updatePreview();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWebMode]);

    useEffect(() => {
        setHasAppliedSnippet(false);
    }, [snippetId]);

    // Initialize diff baselines once from first resolved codes
    useEffect(() => {
        if (!baselineInitRef.current && codes && Object.keys(codes).length) {
            setBaselines((prev) => prev || { ...codes });
            baselineInitRef.current = true;
        }
    }, [codes]);

    // ============ Debugger helpers ============
    const activeLang = isWebMode ? webTab : selectedLanguage;
    const debugEvents = debugTrace?.events || [];
    const debugHasEvents = debugEvents.length > 0;
    const debugCurrent = debugHasEvents ? debugEvents[Math.min(debugIndex, debugEvents.length - 1)] : null;
    const debugNext = debugHasEvents && debugIndex < debugEvents.length - 1 ? debugEvents[debugIndex + 1] : null;
    const debugCurrentLine = debugCurrent?.line || null;
    const debugNextLine = debugNext?.line || null;
    const currentDepth = Array.isArray(debugCurrent?.stack) ? debugCurrent.stack.length : 0;
    const debugMemoryFrames = debugCurrent?.memory?.frames || [];
    const debugMemoryObjects = debugCurrent?.memory?.objects || [];

    const getBreakpoints = (lang) => new Set((breakpointsByLang[lang] || []).map(Number));
    const setBreakpoints = (lang, set) => {
        setBreakpointsByLang((prev) => ({ ...prev, [lang]: Array.from(set).sort((a, b) => a - b) }));
    };

    const toggleBreakpoint = (lineNumber) => {
        const lang = activeLang;
        const set = getBreakpoints(lang);
        if (set.has(lineNumber)) set.delete(lineNumber); else set.add(lineNumber);
        setBreakpoints(lang, set);
    };

    const renderBreakpointDecorations = () => {
        const editor = editorRef.current; const monaco = monacoRef.current;
        if (!editor || !monaco) return [];
        const set = getBreakpoints(activeLang);
        return Array.from(set).map((ln) => ({
            range: new monaco.Range(ln, 1, ln, 1),
            options: {
                isWholeLine: false,
                glyphMarginClassName: 'ss-breakpoint-glyph',
                glyphMarginHoverMessage: { value: `Breakpoint at line ${ln}` },
            },
        }));
    };

    const updateDebugDecorations = useCallback(() => {
        const editor = editorRef.current; const monaco = monacoRef.current;
        if (!editor || !monaco) return;
        const decos = [];
        if (debugCurrentLine) {
            decos.push({
                range: new monaco.Range(debugCurrentLine, 1, debugCurrentLine, 1),
                options: { isWholeLine: true, className: 'ss-debug-current', glyphMarginClassName: 'ss-debug-glyph-current' },
            });
        }
        if (debugNextLine && debugNextLine !== debugCurrentLine) {
            decos.push({
                range: new monaco.Range(debugNextLine, 1, debugNextLine, 1),
                options: { isWholeLine: true, className: 'ss-debug-next', glyphMarginClassName: 'ss-debug-glyph-next' },
            });
        }
        const bps = renderBreakpointDecorations();
        const all = decos.concat(bps);
        debugDecorationsRef.current = editor.deltaDecorations(debugDecorationsRef.current, all);
    }, [debugCurrentLine, debugNextLine, breakpointsByLang, activeLang]);

    useEffect(() => { updateDebugDecorations(); }, [updateDebugDecorations]);

    // Debugger placeholder (feature removed)
    const startDebug = async () => {
        setDebugActive(false);
        setDebugTrace(null);
        setDebugIndex(0);
        setIsDebugPlaying(false);
        setSelectedDebugFrame(null);
        setSelectedDebugObjectId(null);
        setRunToLineTarget(null);
        setDebugError('Step-by-step debugging is no longer available.');
    };

    const stopDebug = () => {
        setIsDebugPlaying(false);
        setDebugActive(false);
        setDebugTrace(null);
        setDebugIndex(0);
        setDebugError(null);
        setRunToLineTarget(null);
        // clear decorations
        try {
            const editor = editorRef.current;
            if (editor && debugDecorationsRef.current.length) {
                debugDecorationsRef.current = editor.deltaDecorations(debugDecorationsRef.current, []);
            }
        } catch (_) {}
    };

    const restartDebug = () => {
        stopDebug();
        startDebug();
    };

    const goToDebugIndex = (idx) => {
        if (!debugHasEvents) return;
        setDebugIndex(Math.max(0, Math.min(idx, debugEvents.length - 1)));
        setIsDebugPlaying(false);
    };
    const findNextIndex = (from) => {
        if (!debugHasEvents) return from;
        for (let i = Math.min(from + 1, debugEvents.length - 1); i < debugEvents.length; i += 1) {
            const ev = debugEvents[i];
            if (lineOnlyStepping && ev?.event !== 'line') continue;
            return i;
        }
        return from;
    };
    const findPrevIndex = (from) => {
        if (!debugHasEvents) return from;
        for (let i = Math.max(from - 1, 0); i >= 0; i -= 1) {
            const ev = debugEvents[i];
            if (lineOnlyStepping && ev?.event !== 'line') continue;
            return i;
        }
        return from;
    };
    const stepNext = () => { if (debugHasEvents) goToDebugIndex(findNextIndex(debugIndex)); };
    const stepPrev = () => { if (debugHasEvents) goToDebugIndex(findPrevIndex(debugIndex)); };
    const stepInto = () => { if (debugHasEvents) stepNext(); };
    const stepOver = () => {
        if (!debugHasEvents) return;
        const depth = currentDepth;
        for (let i = debugIndex + 1; i < debugEvents.length; i += 1) {
            const d = Array.isArray(debugEvents[i]?.stack) ? debugEvents[i].stack.length : 0;
            if (d <= depth) { goToDebugIndex(i); return; }
        }
        goToDebugIndex(debugEvents.length - 1);
    };
    const stepOut = () => {
        if (!debugHasEvents) return;
        const depth = currentDepth;
        for (let i = debugIndex + 1; i < debugEvents.length; i += 1) {
            const d = Array.isArray(debugEvents[i]?.stack) ? debugEvents[i].stack.length : 0;
            if (d < depth) { goToDebugIndex(i); return; }
        }
        goToDebugIndex(debugEvents.length - 1);
    };

    const toggleBreakpointAtCursor = () => {
        const pos = editorRef.current?.getPosition?.();
        if (!pos?.lineNumber) return;
        toggleBreakpoint(pos.lineNumber);
    };
    const clearBreakpoints = () => {
        setBreakpointsByLang((prev) => ({ ...prev, [activeLang]: [] }));
    };
    const runToCursor = () => {
        const pos = editorRef.current?.getPosition?.();
        if (!pos?.lineNumber) return;
        setRunToLineTarget(pos.lineNumber);
        setIsDebugPlaying(true);
    };

    // Play loop with breakpoint support
    useEffect(() => {
        if (!isDebugPlaying || !debugHasEvents) return;
        const bpSet = getBreakpoints(activeLang);
        const timer = setTimeout(() => {
            // next qualifying step
            const nextIdxRaw = findNextIndex(debugIndex);
            const nextIdx = Math.min(nextIdxRaw, debugEvents.length - 1);
            const nextEvt = debugEvents[nextIdx];
            if (breakOnException && nextEvt?.event === 'exception') {
                setIsDebugPlaying(false);
                setDebugIndex(nextIdx);
                return;
            }
            if (runToLineTarget && nextEvt?.line === runToLineTarget) {
                setRunToLineTarget(null);
                setIsDebugPlaying(false);
                setDebugIndex(nextIdx);
                return;
            }
            if (!disableBreakpoints && nextEvt && nextEvt.line && bpSet.has(Number(nextEvt.line))) {
                setIsDebugPlaying(false);
                setDebugIndex(nextIdx);
                return;
            }
            if (nextIdx === debugIndex) {
                setIsDebugPlaying(false);
                return;
            }
            setDebugIndex(nextIdx);
        }, debugDelay);
        return () => clearTimeout(timer);
    }, [isDebugPlaying, debugIndex, debugDelay, debugHasEvents, breakpointsByLang, activeLang, lineOnlyStepping, breakOnException, disableBreakpoints, runToLineTarget]);

    useEffect(() => {
        if (!snippetId || !snippet || hasAppliedSnippet) {
            return;
        }

        const preferredLanguage = (() => {
            if (language) {
                return normalizeLanguage(language);
            }
            if (snippet.js && snippet.js.trim()) {
                return 'javascript';
            }
            if (snippet.cpp && snippet.cpp.trim()) {
                return 'cpp';
            }
            if (snippet.python && snippet.python.trim()) {
                return 'python';
            }
            if (snippet.java && snippet.java.trim()) {
                return 'java';
            }
            if (snippet.csharp && snippet.csharp.trim()) {
                return 'csharp';
            }
            return selectedLanguage;
        })();

        setCodes((prevCodes) => ({
            ...prevCodes,
            html: snippet.html || defaultCodes.html,
            css: snippet.css || defaultCodes.css,
            javascript: snippet.js || defaultCodes.javascript,
            cpp: snippet.cpp || prevCodes.cpp || defaultCodes.cpp,
            python: snippet.python || prevCodes.python || defaultCodes.python,
            java: snippet.java || prevCodes.java || defaultCodes.java,
            csharp: snippet.csharp || prevCodes.csharp || defaultCodes.csharp,
        }));
        setSelectedLanguage(supportedLanguages.includes(preferredLanguage) ? preferredLanguage : 'javascript');
        setHasAppliedSnippet(true);
    }, [snippetId, snippet, hasAppliedSnippet, language, selectedLanguage]);

    // Apply locally saved state (codes + settings) after snippet load
    useEffect(() => {
        if (appliedLocalRef.current) return;
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;
        try {
            const saved = JSON.parse(raw);
            if (saved?.codes && typeof saved.codes === 'object') {
                setCodes((prev) => ({ ...prev, ...saved.codes }));
            }
            if (saved?.selectedLanguage) {
                setSelectedLanguage(normalizeLanguage(saved.selectedLanguage));
            }
            if (typeof saved?.isWebMode === 'boolean') setIsWebMode(saved.isWebMode);
            if (saved?.webTab && ['html','css','javascript'].includes(saved.webTab)) setWebTab(saved.webTab);
            if (typeof saved?.fontSize === 'number') setFontSize(Math.max(8, Math.min(32, saved.fontSize)));
            if (typeof saved?.autoRunPreview === 'boolean') setAutoRunPreview(saved.autoRunPreview);
            if (typeof saved?.showMinimap === 'boolean') setShowMinimap(saved.showMinimap);
            if (typeof saved?.showLineNumbers === 'boolean') setShowLineNumbers(saved.showLineNumbers);
            if (saved?.wordWrap) setWordWrap(saved.wordWrap === 'off' ? 'off' : 'on');
            if (typeof saved?.splitVertical === 'boolean') setSplitVertical(saved.splitVertical);
            if (typeof saved?.panelSize === 'number') setPanelSize(Math.max(160, Math.min(1000, saved.panelSize)));
            if (typeof saved?.showOutputPanel === 'boolean') setShowOutputPanel(saved.showOutputPanel);
        } catch (_) {
            // ignore bad local storage
        }
        appliedLocalRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasAppliedSnippet, storageKey]);

    // Persist state to local storage (debounced)
    useEffect(() => {
        const t = setTimeout(() => {
            try {
                const payload = {
                    codes,
                    selectedLanguage,
                    isWebMode,
                    webTab,
                    fontSize,
                    autoRunPreview,
                    showMinimap,
                    showLineNumbers,
                    wordWrap,
                    splitVertical,
                    panelSize,
                    showOutputPanel,
                };
                localStorage.setItem(storageKey, JSON.stringify(payload));
                setIsSaved(true);
            } catch (_) {}
        }, 500);
        return () => clearTimeout(t);
    }, [codes, selectedLanguage, isWebMode, webTab, fontSize, autoRunPreview, showMinimap, showLineNumbers, wordWrap, splitVertical, panelSize, showOutputPanel, storageKey]);

    const resetCode = () => {
        setCodes({
            html: (snippet?.html ?? normalizedInitialCode.html) || defaultCodes.html,
            css: (snippet?.css ?? normalizedInitialCode.css) || defaultCodes.css,
            javascript: (snippet?.js ?? normalizedInitialCode.javascript) || defaultCodes.javascript,
            cpp: (snippet?.cpp ?? normalizedInitialCode.cpp) || defaultCodes.cpp,
            python: (snippet?.python ?? normalizedInitialCode.python) || defaultCodes.python,
            java: (snippet?.java ?? normalizedInitialCode.java) || defaultCodes.java,
            csharp: (snippet?.csharp ?? normalizedInitialCode.csharp) || defaultCodes.csharp,
        });
        setConsoleOutput('');
        setRunError(null);
        if (isWebMode) updatePreview();
    };

    const formatCode = () => {
        editorRef.current?.getAction('editor.action.formatDocument')?.run();
    };

    const copyCode = () => {
        const activeLang = isWebMode ? webTab : selectedLanguage;
        navigator.clipboard.writeText(codes[activeLang]).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

    const FullScreenWrapper = isFullScreen ? motion.div : React.Fragment;
    const fullScreenProps = isFullScreen ? {
        className: "fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-900 p-4 flex flex-col",
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 }
    } : {};

    const startResize = (e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        dragStateRef.current = { rect };
        const point = (ev) => (ev.touches && ev.touches[0]) ? ev.touches[0] : ev;
        const onMove = (ev) => {
            const { rect } = dragStateRef.current || {};
            if (!rect) return;
            const p = point(ev);
            if (splitVertical) {
                const newSize = Math.max(160, Math.min(rect.width - 160, rect.right - p.clientX));
                setPanelSize(newSize);
            } else {
                const newSize = Math.max(160, Math.min(rect.height - 160, rect.bottom - p.clientY));
                setPanelSize(newSize);
            }
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onUp);
            dragStateRef.current = null;
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onUp);
    };

    // Command palette actions
    const openCmd = () => { setIsCmdOpen(true); setCmdQuery(''); setCmdIndex(0); };
    const closeCmd = () => setIsCmdOpen(false);
    const toggleCmd = () => (isCmdOpen ? closeCmd() : openCmd());


    const openFind = () => {
        editorRef.current?.focus();
        editorRef.current?.getAction('actions.find')?.run();
    };

    const downloadCode = () => {
        const activeLang = isWebMode ? webTab : selectedLanguage;
        const extMap = { javascript: 'js', cpp: 'cpp', python: 'py', java: 'java', csharp: 'cs', html: 'html', css: 'css' };
        const ext = extMap[activeLang] || 'txt';
        const blob = new Blob([codes[activeLang] || ''], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snippet.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    const uploadCode = (file) => {
        if (!file) return;
        const name = file.name.toLowerCase();
        const setForExt = (ext, lang) => {
            if (name.endsWith(`.${ext}`)) {
                const reader = new FileReader();
                reader.onload = () => {
                    setCodes((prev) => ({ ...prev, [lang]: String(reader.result || '') }));
                    if (isWebMode && ['html','css','javascript'].includes(lang)) {
                        setWebTab(lang);
                    } else if (!isWebMode && supportedLanguages.includes(lang)) {
                        setSelectedLanguage(lang);
                    }
                };
                reader.readAsText(file);
                return true;
            }
            return false;
        };
        const mapping = [
            ['js','javascript'], ['cpp','cpp'], ['py','python'], ['java','java'], ['cs','csharp'], ['html','html'], ['css','css']
        ];
        for (const [ext, lang] of mapping) {
            if (setForExt(ext, lang)) return;
        }
        // default to current language
        const reader = new FileReader();
        reader.onload = () => setCodes((prev) => ({ ...prev, [isWebMode ? webTab : selectedLanguage]: String(reader.result || '') }));
        reader.readAsText(file);
    };


    const setBaselineForActive = () => {
        setBaselines((prev) => ({ ...(prev || {}), [activeLang]: codes[activeLang] || '' }));
    };

    const commands = useMemo(() => {
        const entries = [];
        entries.push({ id: 'run', label: isWebMode ? 'Run Preview' : 'Run', action: runCode });
        entries.push({ id: 'reset', label: 'Reset Code', action: resetCode });
        entries.push({ id: 'format', label: 'Format Code', action: formatCode });
        entries.push({ id: 'find', label: 'Find', action: openFind });
        entries.push({ id: 'copy', label: 'Copy Code', action: copyCode });
        entries.push({ id: 'download', label: 'Download Code', action: downloadCode });
        entries.push({ id: 'upload', label: 'Upload From File…', action: () => fileInputRef.current?.click() });
        entries.push({ id: 'webmode', label: `${isWebMode ? 'Disable' : 'Enable'} Web Preview`, action: () => setIsWebMode(v => !v) });
        entries.push({ id: 'split', label: `Split ${splitVertical ? 'Horizontal' : 'Vertical'}`, action: () => setSplitVertical(v => !v) });
        entries.push({ id: 'minimap', label: `${showMinimap ? 'Hide' : 'Show'} Minimap`, action: () => setShowMinimap(v => !v) });
        entries.push({ id: 'linenumbers', label: `${showLineNumbers ? 'Hide' : 'Show'} Line Numbers`, action: () => setShowLineNumbers(v => !v) });
        entries.push({ id: 'wrap', label: `Word Wrap ${wordWrap === 'on' ? 'Off' : 'On'}`, action: () => setWordWrap(w => (w === 'on' ? 'off' : 'on')) });
        entries.push({ id: 'diff', label: `${showDiff ? 'Hide' : 'Show'} Diff`, action: () => setShowDiff(v => !v) });
        entries.push({ id: 'baseline', label: 'Set Baseline (current file)', action: setBaselineForActive });
        entries.push({ id: 'output', label: `${showOutputPanel ? 'Hide' : 'Show'} Output Panel`, action: () => setShowOutputPanel(v => !v) });
        entries.push({ id: 'theme', label: `Editor Theme: ${editorTheme === 'vs-dark' ? 'Light' : 'Dark'}`, action: () => setEditorTheme(t => (t === 'vs-dark' ? 'vs-light' : 'vs-dark')) });
        if (!isWebMode && debugSupported.has(selectedLanguage)) {
            entries.push({ id: 'debug', label: debugActive ? 'Stop Debugger' : 'Start Debugger', action: () => (debugActive ? stopDebug() : startDebug()) });
        }
        if (isWebMode) {
            entries.push({ id: 'open-preview', label: 'Open Preview in New Tab', action: () => {
                const blob = new Blob([buildPreviewHtml()], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank', 'noopener');
                setTimeout(() => URL.revokeObjectURL(url), 60000);
            }});
        }
        return entries;
    }, [isWebMode, runCode, resetCode, formatCode, openFind, copyCode, downloadCode, splitVertical, showMinimap, showLineNumbers, wordWrap, showDiff, setBaselineForActive, showOutputPanel, editorTheme, selectedLanguage, debugActive]);

    const filteredCommands = useMemo(() => {
        const q = cmdQuery.trim().toLowerCase();
        if (!q) return commands;
        return commands.filter(c => c.label.toLowerCase().includes(q));
    }, [cmdQuery, commands]);

    useEffect(() => {
        const onKey = (e) => {
            const mod = e.ctrlKey || e.metaKey;
            if ((mod && e.shiftKey && e.key.toLowerCase() === 'p')) {
                e.preventDefault();
                toggleCmd();
            } else if (isCmdOpen) {
                if (e.key === 'Escape') { e.preventDefault(); closeCmd(); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); setCmdIndex(i => Math.min(i + 1, filteredCommands.length - 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setCmdIndex(i => Math.max(i - 1, 0)); }
                else if (e.key === 'Enter') { e.preventDefault(); const cmd = filteredCommands[cmdIndex]; if (cmd) { closeCmd(); setTimeout(() => cmd.action(), 0); } }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isCmdOpen, filteredCommands, cmdIndex]);
    const renderEditor = () => {
        if (showDiff) {
            return (
                <DiffEditor
                    height="100%"
                    language={activeLang}
                    original={baselines?.[activeLang] || ''}
                    modified={codes[activeLang] || ''}
                    theme={editorTheme}
                    onMount={(diff, monaco) => {
                        try {
                            const modified = diff.getModifiedEditor();
                            handleEditorDidMount(modified, monaco);
                        } catch (_) {}
                    }}
                    onChange={(value) => handleCodeChange(value ?? '')}
                    options={{
                        renderSideBySide: true,
                        readOnly: false,
                        originalEditable: false,
                        automaticLayout: true,
                        minimap: { enabled: showMinimap },
                        wordWrap: wordWrap,
                        lineNumbers: showLineNumbers ? 'on' : 'off',
                        scrollBeyondLastLine: false,
                        padding: { top: 10, bottom: 10 },
                        smoothScrolling: true,
                        mouseWheelZoom: true,
                    }}
                />
            );
        }
                return (
                    <Editor
                        height="100%"
                        language={activeLang}
                        value={codes[activeLang]}
                        theme={editorTheme}
                        onMount={handleEditorDidMount}
                        onChange={(value) => handleCodeChange(value ?? '')}
                        options={{
                            minimap: { enabled: showMinimap },
                            automaticLayout: true,
                            fontSize: fontSize,
                            folding: true,
                            wordWrap: wordWrap,
                            scrollBeyondLastLine: false,
                            padding: { top: 10, bottom: 10 },
                            smoothScrolling: true,
                            formatOnPaste: true,
                            formatOnType: true,
                            lineNumbers: showLineNumbers ? 'on' : 'off',
                            renderWhitespace: 'selection',
                            bracketPairColorization: { enabled: true },
                            guides: { indentation: true, bracketPairs: true },
                            stickyScroll: { enabled: true },
                            mouseWheelZoom: true,
                            glyphMargin: debugSupported.has(activeLang),
                            fontLigatures: true,
                            renderLineHighlight: 'line',
                            cursorSmoothCaretAnimation: 'on',
                            tabSize: 2,
                            roundedSelection: true,
                            quickSuggestions: { other: true, comments: false, strings: false },
                        }}
                    />
                );
            };

    return (
        <FullScreenWrapper {...fullScreenProps}>
            <div className={`flex flex-col rounded-lg shadow-xl ${isFullScreen ? 'h-full' : 'h-[90vh] md:h-[800px] bg-gray-50 dark:bg-gray-900'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-center p-2 mb-2 gap-4 border-b border-gray-200 dark:border-gray-700">
                    {!isWebMode ? (
                        <LanguageSelector
                            selectedLanguage={selectedLanguage}
                            setSelectedLanguage={(lang) => setSelectedLanguage(normalizeLanguage(lang))}
                        />
                    ) : (
                        <div className="flex flex-wrap items-center gap-2">
                            {['html','css','javascript'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setWebTab(tab)}
                                    className={`px-3 py-1 text-sm font-semibold rounded-md ${webTab === tab ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
                                >
                                    {tab.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                        <Button gradientDuoTone="purpleToBlue" onClick={runCode} isProcessing={!isWebMode && isRunning} disabled={!isWebMode ? isRunning : false} size="sm">
                            <FaPlay className="mr-2 h-3 w-3" /> {isWebMode ? 'Run Preview' : 'Run'}
                        </Button>
                        <Button outline gradientDuoTone="pinkToOrange" onClick={resetCode} size="sm">
                            <FaRedo className="mr-2 h-3 w-3" /> Reset
                        </Button>
                        {!isWebMode && debugSupported.has(selectedLanguage) && (
                            !debugActive ? (
                                <Button color="success" size="sm" onClick={startDebug}>
                                    <FaBug className="mr-2 h-3 w-3" /> Debug
                                </Button>
                            ) : (
                                <Button color="failure" size="sm" onClick={stopDebug}>
                                    <FaStop className="mr-2 h-3 w-3" /> Stop Debug
                                </Button>
                            )
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between p-2 mb-2 gap-4 border-b border-gray-200 dark:border-gray-700">
                    <Button.Group>
                        <Button color="gray" size="xs" onClick={() => setFontSize(fz => Math.max(8, fz - 1))}><FaMinus /></Button>
                        <Button color="gray" size="xs" onClick={() => setFontSize(14)}>{fontSize}px</Button>
                        <Button color="gray" size="xs" onClick={() => setFontSize(fz => Math.min(24, fz + 1))}><FaPlus /></Button>
                    </Button.Group>
                    <div className="flex items-center gap-4">
                        <Button color="gray" size="xs" onClick={() => setShowDiff((v) => !v)}>
                            <FaCodeBranch className="mr-2" /> {showDiff ? 'Hide Diff' : 'Show Diff'}
                        </Button>
                        <Button color="gray" size="xs" onClick={setBaselineForActive}>
                            <FaSave className="mr-2" /> Set Baseline
                        </Button>
                        <ToggleSwitch
                            checked={wordWrap === 'on'}
                            onChange={(checked) => setWordWrap(checked ? 'on' : 'off')}
                            label="Word wrap"
                        />
                        <Button color="gray" size="xs" onClick={() => setShowOutputPanel(v => !v)} title={showOutputPanel ? 'Hide output panel' : 'Show output panel'}>
                            <FaColumns className="mr-2" /> {showOutputPanel ? 'Hide Output' : 'Show Output'}
                        </Button>
                        <Tooltip content="Command Palette (Ctrl/Cmd+Shift+P)">
                            <Button color="gray" size="xs" onClick={openCmd} aria-label="Open command palette">
                                <FaKeyboard className="mr-2" /> Commands
                            </Button>
                        </Tooltip>
                        {debugActive && (
                            <div className="flex items-center gap-2 ml-2 flex-wrap">
                                <Tooltip content="Previous step">
                                    <Button color="light" size="xs" onClick={stepPrev}><FaStepBackward className="mr-1" /> Prev</Button>
                                </Tooltip>
                                <Tooltip content={isDebugPlaying ? 'Pause (F5)' : 'Play/Continue (F5)'}>
                                    <Button color="light" size="xs" onClick={() => setIsDebugPlaying((p) => !p)}>
                                        {isDebugPlaying ? (<><FaPause className="mr-1" /> Pause</>) : (<><FaPlay className="mr-1" /> Play</>)}
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Step Into (F11)">
                                    <Button color="light" size="xs" onClick={stepInto}><FaSignInAlt className="mr-1" /> Into</Button>
                                </Tooltip>
                                <Tooltip content="Step Over (F10)">
                                    <Button color="light" size="xs" onClick={stepOver}><FaLevelDownAlt className="mr-1" /> Over</Button>
                                </Tooltip>
                                <Tooltip content="Step Out (Shift+F11)">
                                    <Button color="light" size="xs" onClick={stepOut}><FaSignOutAlt className="mr-1" /> Out</Button>
                                </Tooltip>
                                <Tooltip content="Next step">
                                    <Button color="light" size="xs" onClick={stepNext}><FaStepForward className="mr-1" /> Next</Button>
                                </Tooltip>
                                <Tooltip content="Run to Cursor (Ctrl/Cmd+F10)">
                                    <Button color="light" size="xs" onClick={runToCursor}>Run to cursor</Button>
                                </Tooltip>
                                <Tooltip content="Toggle Breakpoint (F9)">
                                    <Button color="light" size="xs" onClick={toggleBreakpointAtCursor}>Toggle breakpoint</Button>
                                </Tooltip>
                                <Tooltip content="Clear Breakpoints (Shift+F9)">
                                    <Button color="light" size="xs" onClick={clearBreakpoints}>Clear breakpoints</Button>
                                </Tooltip>
                                <Tooltip content="Restart Debugger">
                                    <Button color="light" size="xs" onClick={restartDebug}>Restart</Button>
                                </Tooltip>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 ml-2">
                                    <span>Delay</span>
                                    <input type="range" min={300} max={2000} step={100} value={debugDelay} onChange={(e) => setDebugDelay(Number(e.target.value))} className="w-24 accent-purple-500" />
                                </div>
                                <div className="flex items-center gap-3 text-xs ml-2">
                                    <label className="inline-flex items-center gap-1"><input type="checkbox" checked={breakOnException} onChange={(e) => setBreakOnException(e.target.checked)} /> Break on exception</label>
                                    <label className="inline-flex items-center gap-1"><input type="checkbox" checked={lineOnlyStepping} onChange={(e) => setLineOnlyStepping(e.target.checked)} /> Line-only</label>
                                    <label className="inline-flex items-center gap-1"><input type="checkbox" checked={disableBreakpoints} onChange={(e) => setDisableBreakpoints(e.target.checked)} /> Disable BPs</label>
                                </div>
                            </div>
                        )}
                        {snippetError && (
                            <Alert color="failure" className="!bg-transparent text-xs">
                                Failed to load saved snippet: {snippetError}
                            </Alert>
                        )}
                        <ToggleSwitch
                            checked={showOutputPanel}
                            onChange={(checked) => setShowOutputPanel(checked)}
                            label="Output"
                        />
                        <ToggleSwitch
                            checked={isWebMode}
                            onChange={(checked) => setIsWebMode(checked)}
                            label="Web Preview"
                        />
                        {isWebMode && (
                            <ToggleSwitch
                                checked={autoRunPreview}
                                onChange={(checked) => setAutoRunPreview(checked)}
                                label="Auto run"
                            />
                        )}
                        <Button color="gray" size="xs" onClick={formatCode}>Format Code</Button>
                        <Button color="gray" size="xs" onClick={copyCode}>
                            {isCopied ? <FaCheck className="mr-2 text-green-500" /> : <FaCopy className="mr-2" />}
                            {isCopied ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button color="gray" size="xs" onClick={openFind}>
                            <FaSearch className="mr-2" /> Find
                        </Button>
                        <Button color="gray" size="xs" onClick={downloadCode}>
                            <FaDownload className="mr-2" /> Download
                        </Button>
                        <input ref={fileInputRef} type="file" accept=".js,.cpp,.py,.java,.cs,.html,.css,.txt" className="hidden" onChange={(e) => uploadCode(e.target.files?.[0])} />
                        <Button color="gray" size="xs" onClick={() => fileInputRef.current?.click()}>
                            <FaUpload className="mr-2" /> Upload
                        </Button>
                        <ToggleSwitch
                            checked={editorTheme === 'vs-dark'}
                            onChange={(checked) => setEditorTheme(checked ? 'vs-dark' : 'vs-light')}
                            label="Dark Mode"
                        />
                        <Button color="gray" size="xs" onClick={toggleFullScreen}>
                            {isFullScreen ? <FaCompress /> : <FaExpand />}
                        </Button>
                    </div>
                </div>
                <div className={`flex-1 overflow-hidden ${splitVertical ? 'flex flex-row gap-4' : 'flex flex-col gap-4'}`} ref={containerRef}>
                    {/* Editor panel */}
                    <div className={`rounded-md shadow-inner bg-white dark:bg-gray-800 p-1 ${splitVertical ? 'flex-1' : 'flex-none'}`} style={splitVertical ? undefined : { flex: '1 1 auto' }}>
                        <div className="rounded-md overflow-hidden relative h-full flex flex-col">
                            <div className="relative flex-1">
                                <style>{`
                                    .ss-debug-current { background-color: rgba(34,197,94,0.15) !important; }
                                    .ss-debug-next { background-color: rgba(239,68,68,0.12) !important; }
                                    .ss-debug-glyph-current::before { content: ''; display: inline-block; width: 10px; height: 10px; background:#22c55e; border-radius:50%; box-shadow:0 0 0 2px rgba(34,197,94,0.4); }
                                    .ss-debug-glyph-next::before { content: ''; display: inline-block; width: 10px; height: 10px; background:#ef4444; border-radius:50%; box-shadow:0 0 0 2px rgba(239,68,68,0.4); }
                                    .ss-breakpoint-glyph::before { content: ''; display: inline-block; width: 10px; height: 10px; background:#f43f5e; border-radius:50%; box-shadow:0 0 0 2px rgba(244,63,94,0.4); }
                                `}</style>
                                {renderEditor()}
                                {isSnippetLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70">
                                        <Spinner />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                                <div className="flex items-center gap-3">
                                    <span>{(isWebMode ? webTab : selectedLanguage).toUpperCase()}</span>
                                    <span>Ln {cursorPos.lineNumber}, Col {cursorPos.column}</span>
                                    <span>Wrap: {wordWrap === 'on' ? 'On' : 'Off'}</span>
                                </div>
                                <div className="flex items-center gap-3 opacity-70">
                                    <span>{isSaved ? 'Saved' : 'Saving…'}</span>
                                    <span>UTF-8</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resizer */}
                    {showOutputPanel && (
                        <div
                            onMouseDown={startResize}
                            onTouchStart={startResize}
                            className={`${splitVertical ? 'w-2 cursor-col-resize mx-0.5' : 'h-2 cursor-row-resize my-0.5'} bg-gray-300/70 dark:bg-gray-700/70 rounded flex-none flex items-center justify-center`}
                            title="Drag to resize"
                            role="separator"
                            aria-orientation={splitVertical ? 'vertical' : 'horizontal'}
                            aria-label="Resize panel"
                        >
                            {splitVertical ? (
                                <div className="w-1 h-10 bg-gray-400/80 dark:bg-gray-500/80 rounded" />
                            ) : (
                                <div className="h-1 w-10 bg-gray-400/80 dark:bg-gray-500/80 rounded" />
                            )}
                        </div>
                    )}

                    {/* Output/Preview panel */}
                    {showOutputPanel && (
                        <div
                            className="flex flex-col rounded-md shadow-inner bg-white dark:bg-gray-800 p-2 overflow-hidden"
                            style={splitVertical ? { width: panelSize } : { height: panelSize }}
                        >
                            {!isWebMode ? (
                                <>
                                    <div className="flex items-center gap-2 p-1">
                                        <h3 className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <FaTerminal />
                                            {debugActive ? 'Debugger' : 'Terminal Output'}
                                        </h3>
                                        <div className="ml-auto flex items-center gap-3">
                                            <ToggleSwitch
                                                checked={splitVertical}
                                                onChange={(checked) => setSplitVertical(checked)}
                                                label="Vertical split"
                                            />
                                            <ToggleSwitch
                                                checked={showMinimap}
                                                onChange={(checked) => setShowMinimap(checked)}
                                                label="Minimap"
                                            />
                                            <ToggleSwitch
                                                checked={showLineNumbers}
                                                onChange={(checked) => setShowLineNumbers(checked)}
                                                label="Line #"
                                            />
                                            <ToggleSwitch
                                                checked={wordWrap === 'on'}
                                                onChange={(checked) => setWordWrap(checked ? 'on' : 'off')}
                                                label="Wrap"
                                            />
                                        </div>
                                    </div>
                                    {debugActive ? (
                                        <div className='flex-1 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 p-2'>
                                            {debugError && (
                                                <Alert color="failure" className="!bg-transparent text-sm">
                                                    <pre className="whitespace-pre-wrap text-red-400 font-mono">{debugError}</pre>
                                                </Alert>
                                            )}
                                            {!debugTrace && !debugError && (
                                                <div className="flex items-center gap-2 text-gray-500 text-sm"><Spinner size="sm" />
                                                    <span>Preparing debugger…</span>
                                                </div>
                                            )}
                                    {debugTrace && (
                                        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)]">
                                            <div className="space-y-3">
                                                <div>
                                                    <h4 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Frames</h4>
                                                    {debugMemoryFrames.length > 0 ? (
                                                        <ul className="space-y-1 text-xs text-gray-200">
                                                            {debugMemoryFrames.map((frame, i) => {
                                                                const isSel = selectedDebugFrame === i;
                                                                return (
                                                                    <li key={`mframe-${i}`} className={`rounded border px-2 py-1 flex justify-between ${isSel ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-900/60'}`}>
                                                                        <button className={`text-left flex-1 ${isSel ? 'text-purple-300' : ''}`} onClick={() => setSelectedDebugFrame(i)}>
                                                                            {frame.function || '<module>'}
                                                                        </button>
                                                                        <span>line {frame.line}</span>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">(no frames)</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Variables</h4>
                                                    {(() => {
                                                        const locals = (() => {
                                                            if (selectedDebugFrame != null && debugMemoryFrames[selectedDebugFrame]) {
                                                                return debugMemoryFrames[selectedDebugFrame].locals || {};
                                                            }
                                                            return debugCurrent?.locals || {};
                                                        })();
                                                        const entries = Object.entries(locals);
                                                        return entries.length > 0 ? (
                                                            <ul className="space-y-1 text-sm font-mono text-gray-700 dark:text-gray-200">
                                                                {entries.map(([k, info]) => (
                                                                    <li key={`loc-${k}`} className="flex justify-between gap-3 rounded bg-gray-900/40 px-2 py-1">
                                                                        <span className="text-purple-300">{k}</span>
                                                                        <span className="text-right break-all">{String(info?.preview ?? info)}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">(no variables)</p>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <h4 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Heap objects</h4>
                                                    {debugMemoryObjects.length > 0 ? (
                                                        <ul className="space-y-1 text-xs text-gray-200">
                                                            {debugMemoryObjects.map((obj) => {
                                                                const isSel = selectedDebugObjectId === obj.id;
                                                                return (
                                                                    <li key={`obj-${obj.id}`} className={`rounded border px-2 py-1 ${isSel ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-900/60'}`}>
                                                                        <button className={`font-mono ${isSel ? 'text-purple-300' : ''}`} onClick={() => setSelectedDebugObjectId(obj.id)}>
                                                                            {obj.id}
                                                                        </button>
                                                                        <div className="text-gray-400">{obj.type}{obj.kind ? ` · ${obj.kind}` : ''}</div>
                                                                        {obj.preview && (<div className="text-[0.7rem] text-gray-400">{obj.preview}</div>)}
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">(heap empty)</p>
                                                    )}
                                                </div>
                                                {debugCurrent?.event === 'return' && debugCurrent?.returnValue != null && (
                                                    <div>
                                                        <h4 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Return value</h4>
                                                        <div className="text-sm font-mono text-gray-200 bg-gray-900/60 rounded px-2 py-1">{String(debugCurrent.returnValue)}</div>
                                                    </div>
                                                )}
                                                {debugCurrent?.event === 'exception' && debugTrace?.error?.traceback && (
                                                    <div className="text-xs text-red-400">
                                                        <h4 className="uppercase tracking-wide">Traceback</h4>
                                                        <pre className="bg-red-500/10 border border-red-600 rounded px-2 py-1 whitespace-pre-wrap">{debugTrace.error.traceback}</pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                            {debugTrace && (
                                                <div className="mt-3">
                                                    <h4 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Stdout</h4>
                                                    <pre className="bg-gray-900 text-green-300 text-sm font-mono p-2 rounded-md min-h-[80px] overflow-auto">
                                                        {(debugCurrent?.stdout ?? debugTrace?.stdout ?? '') || 'No output.'}
                                                    </pre>
                                                </div>
                                            )}
                                            <div className="mt-2 text-[0.7rem] text-gray-500 dark:text-gray-400">Tip: Click the editor gutter to toggle breakpoints.</div>
                                        </div>
                                    ) : (
                                        <div ref={outputRef} className='flex-1 whitespace-pre-wrap p-2 text-sm text-green-400 font-mono overflow-auto bg-gray-900 rounded-md'>
                                            {isRunning && <div className="flex items-center text-gray-400"><Spinner size="sm" /> <span className="ml-2">Running...</span></div>}
                                            {runError && <Alert color="failure" className="!bg-transparent text-sm"><pre className="whitespace-pre-wrap text-red-400 font-mono">{runError}</pre></Alert>}
                                            {!isRunning && !runError && <pre className="whitespace-pre-wrap text-sm text-green-400 font-mono">{consoleOutput || 'Execution complete.'}</pre>}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 p-1">
                                        <h3 className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <FaGlobe />
                                            Live Preview
                                        </h3>
                                        <div className="ml-auto flex items-center gap-3">
                                            <ToggleSwitch
                                                checked={splitVertical}
                                                onChange={(checked) => setSplitVertical(checked)}
                                                label="Vertical split"
                                            />
                                            <ToggleSwitch
                                                checked={autoRunPreview}
                                                onChange={(checked) => setAutoRunPreview(checked)}
                                                label="Auto run"
                                            />
                                            <button
                                                onClick={() => {
                                                    const blob = new Blob([buildPreviewHtml()], { type: 'text/html' });
                                                    const url = URL.createObjectURL(blob);
                                                    window.open(url, '_blank', 'noopener');
                                                    setTimeout(() => URL.revokeObjectURL(url), 60000);
                                                }}
                                                className="inline-flex items-center gap-2 rounded-md bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                            >
                                                <FaExternalLinkAlt /> Open in new tab
                                            </button>
                                        </div>
                                    </div>
                                    <div className='flex-1 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700'>
                                        <iframe
                                            ref={previewRef}
                                            title="Live Preview"
                                            sandbox="allow-scripts allow-forms allow-modals"
                                            srcDoc={previewHtml}
                                            className="h-full w-full bg-white"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Command Palette */}
            <AnimatePresence>
                {isCmdOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/40" onClick={closeCmd}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: -6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: -6 }}
                            className="mx-auto mt-24 w-[min(720px,92vw)] rounded-lg bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/10 dark:ring-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="border-b border-gray-200 dark:border-gray-700 p-2">
                                <div className="flex items-center gap-2 px-2 py-1 rounded bg-gray-50 dark:bg-gray-700">
                                    <FaKeyboard className="text-gray-500" />
                                    <input
                                        autoFocus
                                        value={cmdQuery}
                                        onChange={(e) => { setCmdQuery(e.target.value); setCmdIndex(0); }}
                                        placeholder="Type a command… (e.g., Run, Wrap, Minimap)"
                                        className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400"
                                    />
                                </div>
                            </div>
                            <div className="max-h-72 overflow-auto">
                                {filteredCommands.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No matching commands</div>
                                ) : (
                                    <ul className="py-1">
                                        {filteredCommands.map((c, i) => (
                                            <li key={c.id}>
                                                <button
                                                    className={`w-full text-left px-4 py-2 text-sm ${i === cmdIndex ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100'}`}
                                                    onClick={() => { closeCmd(); setTimeout(() => c.action(), 0); }}
                                                >
                                                    {c.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </FullScreenWrapper>
    );
}
