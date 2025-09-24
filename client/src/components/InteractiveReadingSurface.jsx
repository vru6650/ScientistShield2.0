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
    const [highlights, setHighlights] = useState([]);
    const [selectionMenu, setSelectionMenu] = useState(null);
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
    }, [chapterId, content]);

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

        const text = selection.toString().trim();
        if (!text) {
            closeSelectionMenu();
            return;
        }

        const { start, end } = getSelectionOffsets(container, range);
        if (start === end) {
            closeSelectionMenu();
            return;
        }

        const rect = range.getBoundingClientRect();
        const existing = highlights.find((item) => start >= item.start && end <= item.end);

        setSelectionMenu({
            text,
            start,
            end,
            highlightId: existing?.id || null,
            color: existing?.color || null,
            position: {
                x: rect.left + window.scrollX + rect.width / 2,
                y: rect.top + window.scrollY - 12,
            },
        });
    }, [closeSelectionMenu, highlights]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseUp = () => setTimeout(captureSelection, 0);
        const handleTouchEnd = () => setTimeout(captureSelection, 0);
        const handleKeyUp = () => setTimeout(captureSelection, 0);
        const handleScroll = () => closeSelectionMenu();
        const handleDocumentClick = (event) => {
            if (!selectionMenu) return;
            if (!container.contains(event.target)) {
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
        setSelectionMenu(null);

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            selection.removeAllRanges();
        }
    };

    const handleRemoveHighlight = (id) => {
        setHighlights((prev) => prev.filter((item) => item.id !== id));
        setSelectionMenu(null);
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
                className={`${className} ${surfaceClass}`.trim()}
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
                            <div className="reader-selection-card">
                                <p className="reader-selection-text">{selectionMenu.text.slice(0, 80)}{selectionMenu.text.length > 80 ? '…' : ''}</p>
                                <div className="reader-selection-actions">
                                    {highlightPalette.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`reader-highlight-option ${selectionMenu.color === item.id ? 'active' : ''}`}
                                            onClick={() => handleAddHighlight(item.id)}
                                            style={{ '--highlight-swatch': item.swatch }}
                                        >
                                            <FaHighlighter aria-hidden />
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        className="reader-selection-button"
                                        onClick={() => handleLookupWord(selectionMenu.text)}
                                        aria-label="Look up in dictionary"
                                    >
                                        <HiOutlineBookOpen />
                                    </button>
                                    {selectionMenu.highlightId && (
                                        <button
                                            type="button"
                                            className="reader-selection-button"
                                            onClick={() => handleRemoveHighlight(selectionMenu.highlightId)}
                                            aria-label="Remove highlight"
                                        >
                                            <HiOutlineTrash />
                                        </button>
                                    )}
                                </div>
                            </div>
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
