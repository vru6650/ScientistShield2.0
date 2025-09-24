import { useState, useEffect, useMemo, useLayoutEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import parse from 'html-react-parser';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner, Tooltip } from 'flowbite-react';
import {
    HiOutlineBookOpen,
    HiOutlineSearch,
    HiOutlineX,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineTrash,
    HiOutlineClipboardCopy,
    HiOutlineShare,
    HiOutlineVolumeUp,
    HiOutlineColorSwatch,
} from 'react-icons/hi';
import { FaHighlighter } from 'react-icons/fa';

const HIGHLIGHT_STORAGE_PREFIX = 'reader-highlights:';

const highlightPalette = [
    { id: 'gold', label: 'Sunbeam', className: 'reader-highlight-gold', swatch: '#facc15' },
    { id: 'mint', label: 'Mint', className: 'reader-highlight-mint', swatch: '#34d399' },
    { id: 'rose', label: 'Blush', className: 'reader-highlight-rose', swatch: '#fb7185' },
    { id: 'violet', label: 'Iris', className: 'reader-highlight-violet', swatch: '#a855f7' },
];

const createStorageKey = (chapterId) => `${HIGHLIGHT_STORAGE_PREFIX}${chapterId}`;

const unwrapMarks = (container, attribute) => {
    if (!container) return;
    const marks = container.querySelectorAll(`mark[${attribute}]`);
    marks.forEach((mark) => {
        const parent = mark.parentNode;
        if (!parent) return;
        while (mark.firstChild) {
            parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
    });
};

const getTextNodes = (container) => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }
    return nodes;
};

const isWhitespace = (char) => /\s/.test(char || '');

const normalizeOffsets = (text, start, end) => {
    let normalizedStart = Math.max(0, start);
    let normalizedEnd = Math.max(normalizedStart, end);

    while (normalizedStart < normalizedEnd && isWhitespace(text[normalizedStart])) {
        normalizedStart += 1;
    }

    while (normalizedEnd > normalizedStart && isWhitespace(text[normalizedEnd - 1])) {
        normalizedEnd -= 1;
    }

    return { start: normalizedStart, end: normalizedEnd };
};

const createRangeFromOffsets = (container, start, end) => {
    if (!container || start >= end) return null;

    const nodes = getTextNodes(container);
    if (!nodes.length) return null;

    const range = document.createRange();
    let charIndex = 0;
    let startNode = null;
    let startOffset = 0;
    let endNode = null;
    let endOffset = 0;

    for (const node of nodes) {
        const content = node.textContent || '';
        const nodeLength = content.length;
        const nodeStart = charIndex;
        const nodeEnd = nodeStart + nodeLength;

        if (!startNode && start >= nodeStart && start <= nodeEnd) {
            startNode = node;
            startOffset = Math.min(Math.max(start - nodeStart, 0), nodeLength);
        }

        if (!endNode && end >= nodeStart && end <= nodeEnd) {
            endNode = node;
            endOffset = Math.min(Math.max(end - nodeStart, 0), nodeLength);
        }

        if (startNode && endNode) {
            break;
        }

        charIndex = nodeEnd;
    }

    if (!startNode || !endNode) {
        return null;
    }

    try {
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        return range;
    } catch (error) {
        console.error('Failed to create range from offsets', error);
        return null;
    }
};

const getRangePosition = (range) => {
    if (typeof window === 'undefined') {
        return { x: 0, y: 0 };
    }

    const primaryRect = range.getBoundingClientRect();
    const rect = primaryRect.width === 0 && primaryRect.height === 0 ? range.getClientRects()[0] || primaryRect : primaryRect;

    return {
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 12,
    };
};

const applyHighlightRange = (container, highlight) => {
    if (!container || !highlight || highlight.start >= highlight.end) return;
    const nodes = getTextNodes(container);
    let charIndex = 0;
    const { start, end } = highlight;

    for (const node of nodes) {
        if (!node.textContent) {
            continue;
        }

        const length = node.textContent.length;
        const nodeStart = charIndex;
        const nodeEnd = charIndex + length;

        if (end <= nodeStart) {
            break;
        }

        if (start >= nodeEnd) {
            charIndex = nodeEnd;
            continue;
        }

        const localStart = Math.max(0, start - nodeStart);
        const localEnd = Math.min(length, end - nodeStart);

        if (localStart === localEnd) {
            charIndex = nodeEnd;
            continue;
        }

        const range = document.createRange();
        range.setStart(node, localStart);
        range.setEnd(node, localEnd);
        const mark = document.createElement('mark');
        mark.dataset.readerHighlight = 'true';
        mark.dataset.highlightId = highlight.id;
        mark.dataset.highlightColor = highlight.color;
        mark.className = `reader-highlight ${highlightPalette.find((c) => c.id === highlight.color)?.className || ''}`;
        mark.appendChild(range.extractContents());
        range.insertNode(mark);
        range.detach();

        if (end <= nodeEnd) {
            break;
        }

        charIndex = nodeEnd;
    }
};

const applySearchHighlights = (container, term, activeIndex) => {
    if (!container || !term) return [];
    const searchTerm = term.trim();
    if (!searchTerm) return [];

    const lowerTerm = searchTerm.toLowerCase();
    const results = [];
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);

    let matchIndex = 0;

    while (walker.nextNode()) {
        let node = walker.currentNode;
        if (!node || !node.textContent) continue;
        if (node.parentElement?.closest('mark[data-reader-highlight], mark[data-search-hit]')) {
            continue;
        }

        let text = node.textContent;
        let searchStart = 0;

        while (text) {
            const foundIndex = text.toLowerCase().indexOf(lowerTerm, searchStart);
            if (foundIndex === -1) break;

            const range = document.createRange();
            range.setStart(node, foundIndex);
            range.setEnd(node, foundIndex + searchTerm.length);

            const mark = document.createElement('mark');
            mark.dataset.searchHit = 'true';
            mark.dataset.searchIndex = `${matchIndex}`;
            mark.className = 'reader-search-highlight';
            mark.appendChild(range.extractContents());
            range.insertNode(mark);
            range.detach();

            if (matchIndex === activeIndex) {
                mark.classList.add('reader-search-highlight-active');
                mark.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            }

            results.push({ index: matchIndex, text: mark.textContent });
            matchIndex += 1;

            const nextNode = mark.nextSibling;
            if (nextNode && nextNode.nodeType === Node.TEXT_NODE) {
                node = nextNode;
                text = node.textContent;
                searchStart = 0;
            } else {
                break;
            }
        }
    }

    return results;
};

const getSelectionOffsets = (container, range) => {
    const preRange = range.cloneRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);
    const start = preRange.toString().length;
    const end = start + range.toString().length;
    preRange.detach();
    return { start, end };
};

const InteractiveReadingSurface = ({
    content,
    parserOptions,
    contentStyles,
    contentMaxWidth,
    surfaceClass,
    className,
    chapterId,
}) => {
    const containerRef = useRef(null);
    const selectionMenuRef = useRef(null);
    const speechUtteranceRef = useRef(null);
    const [highlights, setHighlights] = useState([]);
    const [selectionMenu, setSelectionMenu] = useState(null);
    const [isHighlightPaletteOpen, setIsHighlightPaletteOpen] = useState(false);
    const [lastHighlightColor, setLastHighlightColor] = useState(() => highlightPalette[0]?.id || 'gold');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchMatches, setSearchMatches] = useState([]);
    const [activeMatchIndex, setActiveMatchIndex] = useState(0);
    const [dictionaryState, setDictionaryState] = useState({
        word: '',
        loading: false,
        entries: [],
        error: null,
        open: false,
    });
    const [selectionFeedback, setSelectionFeedback] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);

    const parsedContent = useMemo(() => parse(content || '', parserOptions), [content, parserOptions]);

    useEffect(() => {
        if (!chapterId || typeof window === 'undefined') {
            setHighlights([]);
            return;
        }

        try {
            const stored = localStorage.getItem(createStorageKey(chapterId));
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setHighlights(parsed);
                    return;
                }
            }
        } catch (error) {
            console.error('Failed to load highlights for chapter', error);
        }
        setHighlights([]);
    }, [chapterId, content]);

    useEffect(() => {
        if (!chapterId || typeof window === 'undefined') return;
        try {
            localStorage.setItem(createStorageKey(chapterId), JSON.stringify(highlights));
        } catch (error) {
            console.error('Failed to persist highlights', error);
        }
    }, [chapterId, highlights]);

    useEffect(() => {
        setSearchTerm('');
        setSearchMatches([]);
        setActiveMatchIndex(0);
        setSelectionMenu(null);
        setSelectionFeedback('');
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }, [chapterId, content]);

    useEffect(() => () => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    useEffect(() => {
        if (!selectionFeedback) return undefined;
        const timeout = setTimeout(() => setSelectionFeedback(''), 2500);
        return () => clearTimeout(timeout);
    }, [selectionFeedback]);

    useEffect(() => {
        if (!selectionMenu && isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            speechUtteranceRef.current = null;
        }
    }, [selectionMenu, isSpeaking]);

    useEffect(() => {
        if (!selectionMenu) {
            setIsHighlightPaletteOpen(false);
            return;
        }
        if (selectionMenu.color) {
            setLastHighlightColor(selectionMenu.color);
        }
    }, [selectionMenu]);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        unwrapMarks(container, 'data-reader-highlight');
        unwrapMarks(container, 'data-search-hit');

        const ordered = [...highlights].sort((a, b) => a.start - b.start);
        ordered.forEach((highlight) => applyHighlightRange(container, { ...highlight }));

        if (searchTerm) {
            const matches = applySearchHighlights(container, searchTerm, activeMatchIndex);
            setSearchMatches(matches);
        } else {
            setSearchMatches([]);
        }
    }, [content, highlights, searchTerm, activeMatchIndex]);

    useEffect(() => {
        if (searchMatches.length === 0 && activeMatchIndex !== 0) {
            setActiveMatchIndex(0);
        }
        if (searchMatches.length > 0 && activeMatchIndex >= searchMatches.length) {
            setActiveMatchIndex(searchMatches.length - 1);
        }
    }, [searchMatches, activeMatchIndex]);

    const closeSelectionMenu = useCallback(() => {
        setIsHighlightPaletteOpen(false);
        setSelectionMenu(null);
    }, []);

    const captureSelection = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            closeSelectionMenu();
            return;
        }

        const range = selection.getRangeAt(0);
        if (!container.contains(range.commonAncestorContainer)) {
            closeSelectionMenu();
            return;
        }

        const fullText = container.textContent || '';

        const rawSelection = selection.toString();
        const text = rawSelection.trim();
        if (!text) {
            closeSelectionMenu();
            return;
        }

        const offsets = getSelectionOffsets(container, range);
        const leadingWhitespace = rawSelection.length - rawSelection.trimStart().length;
        const trailingWhitespace = rawSelection.length - rawSelection.trimEnd().length;

        let start = offsets.start + leadingWhitespace;
        let end = offsets.end - trailingWhitespace;

        ({ start, end } = normalizeOffsets(fullText, start, end));

        if (start === end) {
            closeSelectionMenu();
            return;
        }

        const normalizedRange = createRangeFromOffsets(container, start, end) || range.cloneRange();

        if (selection && normalizedRange) {
            selection.removeAllRanges();
            selection.addRange(normalizedRange);
        }

        const existing = highlights.find((item) => start >= item.start && end <= item.end);

        if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            speechUtteranceRef.current = null;
        }

        setSelectionFeedback('');
        setIsHighlightPaletteOpen(false);

        setSelectionMenu({
            text: normalizedRange?.toString().trim() || text,
            start,
            end,
            highlightId: existing?.id || null,
            color: existing?.color || null,
            position: getRangePosition(normalizedRange),
        });
    }, [closeSelectionMenu, highlights, isSpeaking]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseUp = () => setTimeout(captureSelection, 0);
        const handleTouchEnd = () => setTimeout(captureSelection, 0);
        const handleKeyUp = () => setTimeout(captureSelection, 0);
        const handleScroll = () => closeSelectionMenu();
        const handleDocumentClick = (event) => {
            if (!selectionMenu) return;
            const target = event.target;
            if (!target || typeof target !== 'object' || !('nodeType' in target)) {
                return;
            }
            if (selectionMenuRef.current?.contains(target)) {
                return;
            }
            if (!container.contains(target)) {
                closeSelectionMenu();
            }
        };

        container.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('touchend', handleTouchEnd);
        container.addEventListener('keyup', handleKeyUp);
        document.addEventListener('scroll', handleScroll, true);
        document.addEventListener('mousedown', handleDocumentClick);

        return () => {
            container.removeEventListener('mouseup', handleMouseUp);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('keyup', handleKeyUp);
            document.removeEventListener('scroll', handleScroll, true);
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, [captureSelection, closeSelectionMenu, selectionMenu]);

    const handleAddHighlight = (color) => {
        if (!selectionMenu) return;
        const { start, end, text, highlightId } = selectionMenu;
        if (!text || start === end) return;

        const id = highlightId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hl-${Date.now()}`);

        setHighlights((prev) => {
            const filtered = prev.filter((item) => item.id !== highlightId);
            return [...filtered, { id, start, end, color, text }];
        });
        setLastHighlightColor(color);
        setIsHighlightPaletteOpen(false);
        setSelectionMenu(null);

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            selection.removeAllRanges();
        }
    };

    const handleRemoveHighlight = (id) => {
        setHighlights((prev) => prev.filter((item) => item.id !== id));
        setIsHighlightPaletteOpen(false);
        setSelectionMenu(null);
    };

    const handlePrimaryHighlight = () => {
        if (!selectionMenu) return;
        if (selectionMenu.highlightId) {
            handleRemoveHighlight(selectionMenu.highlightId);
        } else {
            handleAddHighlight(selectionMenu.color || lastHighlightColor);
        }
    };

    const handleLookupWord = async (text) => {
        if (!text) return;
        const word = text.split(/\s+/)[0].toLowerCase();
        setDictionaryState({ word, loading: true, entries: [], error: null, open: true });
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            if (!response.ok) {
                throw new Error('Definition not found for selected term.');
            }
            const data = await response.json();
            setDictionaryState({ word, loading: false, entries: data, error: null, open: true });
        } catch (error) {
            setDictionaryState({
                word,
                loading: false,
                entries: [],
                error: error.message || 'Unable to fetch dictionary entry.',
                open: true,
            });
        }
    };

    const handleCopySelection = async () => {
        if (!selectionMenu?.text) return;
        if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
            setSelectionFeedback('Clipboard access is not available.');
            return;
        }
        try {
            await navigator.clipboard.writeText(selectionMenu.text);
            setSelectionFeedback('Selection copied to clipboard.');
        } catch (error) {
            console.error('Unable to copy selection', error);
            setSelectionFeedback('Unable to copy selection.');
        }
    };

    const handleShareSelection = async () => {
        if (!selectionMenu?.text) return;
        if (typeof navigator === 'undefined' || !navigator.share) {
            setSelectionFeedback('Sharing is not supported in this browser.');
            return;
        }
        try {
            await navigator.share({ text: selectionMenu.text });
            setSelectionFeedback('Shared selection.');
        } catch (error) {
            if (error?.name !== 'AbortError') {
                console.error('Unable to share selection', error);
                setSelectionFeedback('Unable to share selection.');
            }
        }
    };

    const handleSpeakSelection = () => {
        if (!selectionMenu?.text) return;
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            setSelectionFeedback('Text-to-speech is not supported in this browser.');
            return;
        }

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            speechUtteranceRef.current = null;
            setSelectionFeedback('Stopped reading the selection.');
            return;
        }

        const utterance = new window.SpeechSynthesisUtterance(selectionMenu.text);
        speechUtteranceRef.current = utterance;
        utterance.onend = () => {
            setIsSpeaking(false);
            speechUtteranceRef.current = null;
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
            speechUtteranceRef.current = null;
            setSelectionFeedback('Unable to read the selection aloud.');
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
        setSelectionFeedback('Reading selection aloud…');
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setActiveMatchIndex(0);
    };

    const goToNextMatch = () => {
        if (searchMatches.length === 0) return;
        setActiveMatchIndex((prev) => (prev + 1) % searchMatches.length);
    };

    const goToPreviousMatch = () => {
        if (searchMatches.length === 0) return;
        setActiveMatchIndex((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);
    };

    const clearSearch = () => {
        setSearchTerm('');
        setActiveMatchIndex(0);
    };

    const closeDictionary = () => {
        setDictionaryState((prev) => ({ ...prev, open: false }));
    };

    return (
        <div className="space-y-6">
            <div className="reader-utility-bar">
                <div className="reader-search-field">
                    <HiOutlineSearch className="reader-search-icon" aria-hidden />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search within this chapter..."
                        className="reader-search-input"
                    />
                    {searchTerm && (
                        <button type="button" className="reader-search-clear" onClick={clearSearch} aria-label="Clear search">
                            <HiOutlineX />
                        </button>
                    )}
                </div>
                {searchMatches.length > 0 && (
                    <div className="reader-search-controls">
                        <button type="button" onClick={goToPreviousMatch} aria-label="Previous match">
                            <HiOutlineChevronLeft />
                        </button>
                        <span>
                            {activeMatchIndex + 1} / {searchMatches.length}
                        </span>
                        <button type="button" onClick={goToNextMatch} aria-label="Next match">
                            <HiOutlineChevronRight />
                        </button>
                    </div>
                )}
            </div>

            <motion.div
                ref={containerRef}
                className={[className, surfaceClass].filter(Boolean).join(' ')}
                data-reading-surface="true"
                style={{ ...contentStyles, maxWidth: contentMaxWidth }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                tabIndex={0}
            >
                {parsedContent}
            </motion.div>

            {highlights.length > 0 && (
                <div className="reader-highlights-panel">
                    <div className="reader-highlights-header">
                        <div className="flex items-center gap-2">
                            <FaHighlighter aria-hidden />
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Your Highlights</h3>
                        </div>
                        <button
                            type="button"
                            className="reader-highlight-clear"
                            onClick={() => setHighlights([])}
                        >
                            <HiOutlineTrash className="mr-1" /> Clear all
                        </button>
                    </div>
                    <ul className="space-y-3">
                        {highlights
                            .slice()
                            .sort((a, b) => a.start - b.start)
                            .map((highlight) => (
                                <li key={highlight.id} className="reader-highlight-item">
                                    <span className={`reader-highlight-chip ${highlightPalette.find((c) => c.id === highlight.color)?.className || ''}`}>
                                        {highlight.text.trim().slice(0, 120)}
                                        {highlight.text.length > 120 ? '…' : ''}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Tooltip content="Reveal highlight">
                                            <button
                                                type="button"
                                                className="reader-highlight-jump"
                                                onClick={() => {
                                                    const container = containerRef.current;
                                                    if (!container) return;
                                                    const mark = container.querySelector(`mark[data-highlight-id="${highlight.id}"]`);
                                                    if (mark) {
                                                        mark.classList.add('reader-highlight-pulse');
                                                        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        setTimeout(() => mark.classList.remove('reader-highlight-pulse'), 1200);
                                                    }
                                                }}
                                            >
                                                Jump
                                            </button>
                                        </Tooltip>
                                        <button
                                            type="button"
                                            className="reader-highlight-delete"
                                            onClick={() => handleRemoveHighlight(highlight.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </li>
                            ))}
                    </ul>
                </div>
            )}

            <AnimatePresence>
                {dictionaryState.open && (
                    <motion.div
                        key="dictionary"
                        className="reader-dictionary-panel"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        <div className="reader-dictionary-header">
                            <div className="flex items-center gap-2">
                                <HiOutlineBookOpen aria-hidden />
                                <h4 className="text-sm font-semibold">Dictionary · {dictionaryState.word}</h4>
                            </div>
                            <button type="button" onClick={closeDictionary} aria-label="Close dictionary">
                                <HiOutlineX />
                            </button>
                        </div>
                        <div className="reader-dictionary-body">
                            {dictionaryState.loading && (
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                                    <Spinner size="sm" />
                                    <span>Looking up definition…</span>
                                </div>
                            )}
                            {!dictionaryState.loading && dictionaryState.error && (
                                <p className="text-sm text-red-500">{dictionaryState.error}</p>
                            )}
                            {!dictionaryState.loading && !dictionaryState.error && dictionaryState.entries.length > 0 && (
                                <div className="space-y-3 text-sm">
                                    {dictionaryState.entries[0]?.meanings?.slice(0, 2).map((meaning, index) => (
                                        <div key={index} className="reader-dictionary-meaning">
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">
                                                {meaning.partOfSpeech}
                                            </p>
                                            <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300">
                                                {meaning.definitions.slice(0, 2).map((def, defIndex) => (
                                                    <li key={defIndex}>{def.definition}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {selectionMenu && typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        <motion.div
                            key="selection-menu"
                            className="reader-selection-menu"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{ top: selectionMenu.position.y, left: selectionMenu.position.x }}
                        >
                            <motion.div
                                ref={selectionMenuRef}
                                className="reader-selection-popover"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 6 }}
                                transition={{ duration: 0.18 }}
                            >
                                <div className="reader-selection-top">
                                    <button
                                        type="button"
                                        className={`reader-highlight-button ${selectionMenu.highlightId ? 'is-active' : ''}`}
                                        onClick={handlePrimaryHighlight}
                                        aria-pressed={Boolean(selectionMenu.highlightId)}
                                    >
                                        <FaHighlighter aria-hidden />
                                        <span>{selectionMenu.highlightId ? 'Remove' : 'Highlight'}</span>
                                    </button>
                                    <div className="reader-selection-icons">
                                        <Tooltip content="Highlight colors">
                                            <button
                                                type="button"
                                                className={`reader-selection-icon ${isHighlightPaletteOpen ? 'active' : ''}`}
                                                onClick={() => setIsHighlightPaletteOpen((prev) => !prev)}
                                                aria-label="Choose highlight color"
                                            >
                                                <HiOutlineColorSwatch />
                                            </button>
                                        </Tooltip>
                                        <Tooltip content="Dictionary">
                                            <button
                                                type="button"
                                                className="reader-selection-icon"
                                                onClick={() => handleLookupWord(selectionMenu.text)}
                                                aria-label="Look up in dictionary"
                                            >
                                                <HiOutlineBookOpen />
                                            </button>
                                        </Tooltip>
                                        <Tooltip content="Copy">
                                            <button
                                                type="button"
                                                className="reader-selection-icon"
                                                onClick={handleCopySelection}
                                                aria-label="Copy selection"
                                            >
                                                <HiOutlineClipboardCopy />
                                            </button>
                                        </Tooltip>
                                        <Tooltip content="Share">
                                            <button
                                                type="button"
                                                className="reader-selection-icon"
                                                onClick={handleShareSelection}
                                                aria-label="Share selection"
                                            >
                                                <HiOutlineShare />
                                            </button>
                                        </Tooltip>
                                        <Tooltip content={isSpeaking ? 'Stop listening' : 'Listen'}>
                                            <button
                                                type="button"
                                                className={`reader-selection-icon ${isSpeaking ? 'active' : ''}`}
                                                onClick={handleSpeakSelection}
                                                aria-label={isSpeaking ? 'Stop reading selection' : 'Read selection aloud'}
                                                aria-pressed={isSpeaking}
                                            >
                                                <HiOutlineVolumeUp />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                                {isHighlightPaletteOpen && (
                                    <div className="reader-highlight-palette" role="group" aria-label="Highlight colors">
                                        {highlightPalette.map((item) => {
                                            const isActive = (selectionMenu.color || lastHighlightColor) === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    className={`reader-highlight-swatch ${isActive ? 'active' : ''}`}
                                                    onClick={() => handleAddHighlight(item.id)}
                                                    aria-label={`Highlight with ${item.label}`}
                                                    style={{ '--highlight-swatch': item.swatch }}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                                <div className="reader-selection-snippet">
                                    {selectionMenu.text.length > 140
                                        ? `${selectionMenu.text.slice(0, 137)}…`
                                        : selectionMenu.text}
                                </div>
                                {selectionFeedback && <p className="reader-selection-feedback">{selectionFeedback}</p>}
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    );
};

InteractiveReadingSurface.propTypes = {
    content: PropTypes.string,
    parserOptions: PropTypes.object,
    contentStyles: PropTypes.object,
    contentMaxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    surfaceClass: PropTypes.string,
    className: PropTypes.string,
    chapterId: PropTypes.string,
};

export default InteractiveReadingSurface;
