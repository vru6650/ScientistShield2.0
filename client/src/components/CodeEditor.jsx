import React, { useState, useEffect, useRef, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Button, ToggleSwitch, Spinner, Alert } from 'flowbite-react';
import { useSelector } from 'react-redux';
import {
    FaPlay, FaRedo, FaTerminal, FaEye, FaCopy, FaExpand, FaPlus, FaMinus, FaCheck, FaCompress
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import LanguageSelector from './LanguageSelector';
import useCodeSnippet from '../hooks/useCodeSnippet';

const supportedLanguages = ['html', 'css', 'javascript', 'cpp', 'python'];

const languageAliases = {
    js: 'javascript',
    javascript: 'javascript',
    py: 'python',
    python: 'python',
    'c++': 'cpp',
    cpp: 'cpp',
};

const normalizeLanguage = (language) => {
    if (!language) {
        return 'html';
    }

    const normalizedInput = typeof language === 'string'
        ? language.toLowerCase()
        : String(language).toLowerCase();

    const normalized = languageAliases[normalizedInput] || normalizedInput;

    return supportedLanguages.includes(normalized) ? normalized : 'html';
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
            const normalizedKey = normalizeLanguage(key);
            if (typeof value === 'string' && supportedLanguages.includes(normalizedKey)) {
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
      }
    </style>
  </head>
  <body>
    <h1>Welcome to the Editor!</h1>
    <p>Change this HTML and see the live preview.</p>
  </body>
</html>`,
    css: `body {
  background-color: #f0f8ff;
  padding: 1rem;
}
h1 {
  color: #1e3a8a;
  text-decoration: underline;
}`,
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
    python: `def hello_world():
  message = "Hello, Python World!"
  print(message)

hello_world()`
};

const visualizerSupportedLanguages = new Set(['python', 'cpp', 'javascript']);

export default function CodeEditor({ initialCode = {}, language = 'html', snippetId }) {
    const { theme } = useSelector((state) => state.theme);
    const navigate = useNavigate();
    const editorRef = useRef(null);
    const outputRef = useRef(null);
    const { snippet, isLoading: isSnippetLoading, error: snippetError } = useCodeSnippet(snippetId);

    const normalizedInitialLanguage = normalizeLanguage(language);
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
    });

    const [selectedLanguage, setSelectedLanguage] = useState(normalizedInitialLanguage);
    const [srcDoc, setSrcDoc] = useState('');
    const [consoleOutput, setConsoleOutput] = useState('');
    const [autoRun, setAutoRun] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [runError, setRunError] = useState(null);
    const [showOutputPanel, setShowOutputPanel] = useState(true);
    const [editorTheme, setEditorTheme] = useState(theme === 'dark' ? 'vs-dark' : 'vs-light');
    const [fontSize, setFontSize] = useState(14);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [hasAppliedSnippet, setHasAppliedSnippet] = useState(false);

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
    };


    const handleCodeChange = (newCode) => {
        setCodes(prevCodes => ({
            ...prevCodes,
            [selectedLanguage]: newCode
        }));
    };

    const runCode = async () => {
        setIsRunning(true);
        setRunError(null);
        setConsoleOutput('');

        if (selectedLanguage === 'cpp' || selectedLanguage === 'python') {
            const endpoint = selectedLanguage === 'cpp' ? '/api/code/run-cpp' : '/api/code/run-python';
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
        } else {
            const fullSrcDoc = `
                <html>
                    <head><style>${codes.css}</style></head>
                    <body>
                        ${codes.html}
                        <script>
                            const originalLog = console.log;
                            let outputBuffer = '';
                            console.log = (...args) => {
                                outputBuffer += args.map(arg => {
                                    try {
                                        return JSON.stringify(arg, null, 2);
                                    } catch {
                                        return String(arg);
                                    }
                                }).join(' ') + '\\n';
                            };
                            try {
                                ${codes.javascript}
                                window.parent.postMessage({ type: 'js-output', output: outputBuffer.trim() || 'JavaScript executed successfully.' }, '*');
                            } catch (e) {
                                window.parent.postMessage({ type: 'js-output', output: 'JavaScript Error: ' + e.message }, '*');
                            } finally {
                                console.log = originalLog;
                            }
                        </script>
                    </body>
                </html>
            `;
            setSrcDoc(fullSrcDoc);
            setIsRunning(false);
        }
    };

    const isLivePreviewLanguage = ['html', 'css', 'javascript'].includes(selectedLanguage);

    useEffect(() => {
        setEditorTheme(theme === 'dark' ? 'vs-dark' : 'vs-light');
    }, [theme]);

    useEffect(() => {
        setHasAppliedSnippet(false);
    }, [snippetId]);

    useEffect(() => {
        if (!snippetId || !snippet || hasAppliedSnippet) {
            return;
        }

        const preferredLanguage = (() => {
            if (language && language !== 'html') {
                return language;
            }
            if (snippet.html && snippet.html.trim()) {
                return 'html';
            }
            if (snippet.js && snippet.js.trim()) {
                return 'javascript';
            }
            if (snippet.css && snippet.css.trim()) {
                return 'css';
            }
            return selectedLanguage;
        })();

        setCodes((prevCodes) => ({
            ...prevCodes,
            html: snippet.html || defaultCodes.html,
            css: snippet.css || defaultCodes.css,
            javascript: snippet.js || defaultCodes.javascript,
        }));
        setSelectedLanguage(normalizeLanguage(preferredLanguage));
        setHasAppliedSnippet(true);
    }, [snippetId, snippet, hasAppliedSnippet, language, selectedLanguage]);

    useEffect(() => {
        if (!autoRun || !isLivePreviewLanguage) return;
        const timeout = setTimeout(() => runCode(), 1000);
        return () => clearTimeout(timeout);
    }, [codes.html, codes.css, codes.javascript, autoRun, selectedLanguage, isLivePreviewLanguage]);

    useEffect(() => {
        if (isLivePreviewLanguage) runCode();
    }, [isLivePreviewLanguage, selectedLanguage]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data?.type === 'js-output') setConsoleOutput(event.data.output);
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const resetCode = () => {
        setCodes({
            html: (snippet?.html ?? normalizedInitialCode.html) || defaultCodes.html,
            css: (snippet?.css ?? normalizedInitialCode.css) || defaultCodes.css,
            javascript: (snippet?.js ?? normalizedInitialCode.javascript) || defaultCodes.javascript,
            cpp: normalizedInitialCode.cpp || defaultCodes.cpp,
            python: normalizedInitialCode.python || defaultCodes.python,
        });
        setSrcDoc('');
        setConsoleOutput('');
        setRunError(null);
    };

    const formatCode = () => {
        editorRef.current?.getAction('editor.action.formatDocument')?.run();
    };

    const copyCode = () => {
        navigator.clipboard.writeText(codes[selectedLanguage]).then(() => {
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


    return (
        <FullScreenWrapper {...fullScreenProps}>
            <div className={`flex flex-col rounded-lg shadow-xl ${isFullScreen ? 'h-full' : 'h-[90vh] md:h-[800px] bg-gray-50 dark:bg-gray-900'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-center p-2 mb-2 gap-4 border-b border-gray-200 dark:border-gray-700">
                    <LanguageSelector
                        selectedLanguage={selectedLanguage}
                        setSelectedLanguage={(lang) => setSelectedLanguage(normalizeLanguage(lang))}
                    />
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                        {isLivePreviewLanguage && <ToggleSwitch checked={autoRun} onChange={() => setAutoRun(!autoRun)} label="Auto-Run" />}
                        <Button gradientDuoTone="purpleToBlue" onClick={runCode} isProcessing={isRunning} disabled={isRunning} size="sm">
                            <FaPlay className="mr-2 h-3 w-3" /> Run
                        </Button>
                        <Button outline gradientDuoTone="pinkToOrange" onClick={resetCode} size="sm">
                            <FaRedo className="mr-2 h-3 w-3" /> Reset
                        </Button>
                        {visualizerSupportedLanguages.has(selectedLanguage) && (
                            <Button outline gradientDuoTone="purpleToBlue" size="sm" onClick={() => navigate('/visualizer', { state: { code: codes[selectedLanguage], language: selectedLanguage } })}>
                                <FaEye className="mr-2 h-3 w-3" /> Visualize
                            </Button>
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
                        {snippetError && (
                            <Alert color="failure" className="!bg-transparent text-xs">
                                Failed to load saved snippet: {snippetError}
                            </Alert>
                        )}
                        <Button color="gray" size="xs" onClick={formatCode}>Format Code</Button>
                        <Button color="gray" size="xs" onClick={copyCode}>
                            {isCopied ? <FaCheck className="mr-2 text-green-500" /> : <FaCopy className="mr-2" />}
                            {isCopied ? 'Copied!' : 'Copy'}
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
                <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
                    <div className="flex-1 flex flex-col rounded-md shadow-inner bg-white dark:bg-gray-800 p-1">
                        <div className="flex-1 rounded-md overflow-hidden relative">
                            <Editor
                                height="100%"
                                language={selectedLanguage}
                                value={codes[selectedLanguage]}
                                theme={editorTheme}
                                onMount={handleEditorDidMount}
                                onChange={handleCodeChange}
                                options={{
                                    minimap: { enabled: true },
                                    fontSize: fontSize,
                                    folding: true,
                                    wordWrap: 'on',
                                    scrollBeyondLastLine: false,
                                    padding: { top: 10, bottom: 10 },
                                }}
                            />
                            {isSnippetLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70">
                                    <Spinner />
                                </div>
                            )}
                        </div>
                    </div>
                    <AnimatePresence>
                        {showOutputPanel && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: '100%' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 flex flex-col gap-4 overflow-hidden md:w-1/2"
                            >
                                <div className="flex flex-col flex-1 rounded-md shadow-inner bg-white dark:bg-gray-800 p-2">
                                    <h3 className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 p-1">
                                        <FaTerminal />
                                        {isLivePreviewLanguage ? 'Live Preview & Console' : 'Terminal Output'}
                                    </h3>
                                    {isLivePreviewLanguage ? (
                                        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                                            <iframe
                                                title="live-output"
                                                srcDoc={srcDoc}
                                                sandbox="allow-scripts"
                                                className="w-full flex-1 bg-white border border-gray-200 dark:border-gray-700 rounded-md"
                                            />
                                            <pre className="whitespace-pre-wrap p-2 text-xs text-gray-400 font-mono h-1/3 overflow-auto bg-gray-900 rounded-md">{consoleOutput || '// JavaScript console output will appear here...'}</pre>
                                        </div>
                                    ) : (
                                        <div ref={outputRef} className='whitespace-pre-wrap p-2 text-sm text-green-400 font-mono h-full overflow-auto bg-gray-900 rounded-md'>
                                            {isRunning && <div className="flex items-center text-gray-400"><Spinner size="sm" /> <span className="ml-2">Running...</span></div>}
                                            {runError && <Alert color="failure" className="!bg-transparent text-sm"><pre className="whitespace-pre-wrap text-red-400 font-mono">{runError}</pre></Alert>}
                                            {!isRunning && !runError && <pre className="whitespace-pre-wrap text-sm text-green-400 font-mono">{consoleOutput || 'Execution complete.'}</pre>}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </FullScreenWrapper>
    );
}