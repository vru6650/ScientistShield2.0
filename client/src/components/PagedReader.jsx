import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Gauge,
  Timer,
  BookMarked,
  Sparkles,
  Highlighter,
  MoveHorizontal,
  Columns3,
  Maximize2,
  Minimize2,
  BookOpen,
  ListTree,
  CircleQuestionMark,
  Plus,
  Minus,
  ScanText,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
// parse is unused now; InteractiveReadingSurface handles parsing
import useReadingSettings from '../hooks/useReadingSettings';
import ReadingControlCenter from './ReadingControlCenter';
import InteractiveReadingSurface from './InteractiveReadingSurface.jsx';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';

const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

const DENSITY_BUCKETS = [
  { max: 0.16, label: 'XS', title: 'Ultra compact' },
  { max: 0.36, label: 'S', title: 'Compact' },
  { max: 0.62, label: 'M', title: 'Comfort' },
  { max: 0.82, label: 'L', title: 'Roomy' },
  { max: 1, label: 'XL', title: 'Immersive' },
];

const LEGACY_SIZE_TO_DENSITY = {
  xs: 0.08,
  s: 0.22,
  m: 0.5,
  l: 0.75,
  xl: 0.92,
};

const STORAGE_KEYS = {
  density: 'paged-density',
  size: 'paged-size',
  zoom: 'paged-zoom',
  book: 'paged-book',
  aspect: 'paged-aspect',
  spread: 'paged-spread',
  tools: 'paged-tools',
  highlights: 'paged-hl',
};

const storage = {
  get(key) {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  set(key, value) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // Ignore storage write failures (e.g., privacy mode)
    }
  },
};

const debugLog = (message, error) => {
  const isProduction = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'production';
  if (!isProduction) {
    // eslint-disable-next-line no-console
    console.debug(`[PagedReader] ${message}`, error);
  }
};

// Lightweight paged reader with improved UX: keyboard/touch nav, progress, and time-left.

export default function PagedReader({
  content,
  parserOptions,
  className = '',
  pageHeight = 0.75, // fraction of viewport height
  chapterId, // optional: persist progress key
  readingMinutes, // optional: minutes estimate for time-left
  showReadingControls = true,
  // Optional external reading settings to keep in sync with page-level controls
  settings: extSettings,
  onChange: extOnChange,
  onReset: extOnReset,
  contentStyles: extContentStyles,
  contentMaxWidth: extContentMaxWidth,
  surfaceClass: extSurfaceClass,
}) {
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const controlCenterRef = useRef(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [isTurning, setIsTurning] = useState(null); // 'next' | 'prev' | null
  const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 0);
  const [autoHeight, setAutoHeight] = useState(null);
  const [zoom, setZoom] = useState(() => {
    const stored = parseFloat(storage.get(STORAGE_KEYS.zoom));
    if (Number.isFinite(stored)) {
      return clampValue(stored, 0.6, 1.2);
    }
    return 1;
  });
  const [density, setDensity] = useState(() => {
    const stored = parseFloat(storage.get(STORAGE_KEYS.density));
    if (Number.isFinite(stored)) {
      return clampValue(stored, 0, 1);
    }
    const legacy = storage.get(STORAGE_KEYS.size);
    if (legacy && LEGACY_SIZE_TO_DENSITY[legacy] != null) {
      return LEGACY_SIZE_TO_DENSITY[legacy];
    }
    return 0.5;
  });
  const densityRef = useRef(density);
  useEffect(() => {
    densityRef.current = density;
  }, [density]);
  const [showToc, setShowToc] = useState(false);
  const [headings, setHeadings] = useState([]);
  const [bookMode, setBookMode] = useState(() => storage.get(STORAGE_KEYS.book) === '1');
  const [aspect, setAspect] = useState(() => storage.get(STORAGE_KEYS.aspect) || 'classic');
  const aspectRatio = aspect === 'a' ? 0.707 : aspect === 'golden' ? 0.618 : 0.66; // width/height
  const [showSurfaceTools, setShowSurfaceTools] = useState(() => storage.get(STORAGE_KEYS.tools) === '1');
  const [showSurfaceHighlights, setShowSurfaceHighlights] = useState(() => storage.get(STORAGE_KEYS.highlights) === '1');
  const [activeSection, setActiveSection] = useState('');
  const [spread, setSpread] = useState(() => storage.get(STORAGE_KEYS.spread) === '1');
  const [idle, setIdle] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [dragFrac, setDragFrac] = useState(null);
  const [pageInput, setPageInput] = useState('1');
  const [isEditingPageInput, setIsEditingPageInput] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  // Parsed content handled by InteractiveReadingSurface
  const hasExternal = Boolean(extSettings);
  const hook = useReadingSettings();
  const settings = hasExternal ? extSettings : hook.settings;
  const updateSetting = hasExternal ? extOnChange : hook.updateSetting;
  const resetSettings = hasExternal ? extOnReset : hook.resetSettings;
  const contentStyles = hasExternal ? (extContentStyles || {}) : hook.contentStyles;
  const contentMaxWidth = hasExternal ? (extContentMaxWidth ?? undefined) : hook.contentMaxWidth;
  const surfaceClass = hasExternal ? (extSurfaceClass || '') : hook.surfaceClass;
  const baseHeight = pageHeight || 0.75;

  const getDensityMeta = useCallback((value) => {
    const level = clampValue(typeof value === 'number' ? value : 0.5, 0, 1);
    const heightMultiplier = 0.7 + level * 0.5;
    const heightFraction = clampValue(baseHeight * heightMultiplier, 0.5, 0.95);
    const maxColumn = Math.round(480 + level * 420);
    const bucket = DENSITY_BUCKETS.find((item) => level <= item.max) || DENSITY_BUCKETS[DENSITY_BUCKETS.length - 1];
    return {
      level,
      heightFraction,
      maxColumn,
      label: bucket.label,
      title: bucket.title,
      percent: Math.round(level * 100),
    };
  }, [baseHeight]);

  const densityMeta = useMemo(() => getDensityMeta(density), [density, getDensityMeta]);

  const computeAutoHeight = useCallback((heightFraction = densityMeta.heightFraction, zoomValue = zoom) => {
    if (typeof window === 'undefined') return null;
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const available = Math.max(320, Math.floor(window.innerHeight - rect.top - 24));
    const fraction = Math.floor(window.innerHeight * heightFraction * (typeof zoomValue === 'number' ? zoomValue : 1));
    const nextHeight = Math.min(available, fraction);
    setAutoHeight(nextHeight);
    return nextHeight;
  }, [densityMeta.heightFraction, zoom]);

  const updatePages = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    // Auto-fit column width to visible page width
  try {
      const cs = getComputedStyle(el);
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;
      const inner = Math.max(0, el.clientWidth - padL - padR);
      const meta = getDensityMeta(densityRef.current);
      const fracValue = meta.heightFraction;
      const pageH = (autoHeight ?? Math.round((vh || 0) * fracValue * (typeof zoom === 'number' ? zoom : 1)));
      let colW = Math.max(280, Math.round(inner));
      if (bookMode && pageH) {
        const desired = Math.round(pageH * aspectRatio);
        colW = Math.min(colW, desired);
      }
      const maxColumn = meta.maxColumn;
      if (maxColumn) {
        colW = Math.min(colW, Math.max(280, maxColumn));
      }
      // Spread mode: aim for two columns per viewport
      if (spread) {
        const gapPx = parseFloat(cs.columnGap) || 40; // approx 2.5rem default
        const twoCol = Math.max(240, Math.floor((inner - gapPx) / 2));
        colW = Math.min(colW, twoCol);
      }
      el.style.setProperty('--paged-column-width', `${colW}px`);
    } catch (error) {
      debugLog('Failed to measure column width', error);
    }

    const total = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPages(total);
    const current = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    setPage(Math.min(total - 1, Math.max(0, current)));
  }, [autoHeight, vh, zoom, aspectRatio, bookMode, spread, getDensityMeta]);

  useEffect(() => {
    updatePages();
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const current = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
      setPage(Math.min(pages - 1, Math.max(0, current)));
      // Determine active section by the last heading crossing the left edge of the reader
      try {
        const rectC = el.getBoundingClientRect();
        const nodes = el.querySelectorAll('h2, h3');
        let cur = '';
        for (const n of nodes) {
          const r = n.getBoundingClientRect();
          if (r.left < rectC.left + 24) cur = n.textContent || cur; else break;
        }
        if (cur && cur !== activeSection) setActiveSection(cur);
      } catch (error) {
        debugLog('Failed to derive active section', error);
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    const onResize = () => {
      setVh(window.innerHeight);
      // Compute available height so a full column fits without vertical scroll
      const meta = getDensityMeta(densityRef.current);
      computeAutoHeight(meta.heightFraction, zoom);
      updatePages();
    };
    window.addEventListener('resize', onResize);
    const id = requestAnimationFrame(updatePages);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(id);
    };
  }, [updatePages, pages, zoom, activeSection, getDensityMeta, bookMode, aspectRatio, spread, computeAutoHeight]);

  // Idle auto-hide controls
  useEffect(() => {
    let timer = 0;
    const wake = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), 2200);
    };
    wake();
    window.addEventListener('mousemove', wake, { passive: true });
    window.addEventListener('keydown', wake);
    window.addEventListener('touchstart', wake, { passive: true });
    return () => {
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('keydown', wake);
      window.removeEventListener('touchstart', wake);
      window.clearTimeout(timer);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    const root = containerRef.current?.parentElement; // the paged-reader wrapper
    if (!root) return;
    const isFs = document.fullscreenElement != null;
    if (isFs) {
      try {
        document.exitFullscreen?.();
        setIsFullscreen(false);
      } catch (error) {
        debugLog('Failed to exit fullscreen', error);
      }
    } else {
      root.requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch((error) => {
          debugLog('Failed to enter fullscreen', error);
        });
    }
  }, []);

  const go = useCallback((dir) => {
    const el = containerRef.current;
    if (!el) return;
    const next = Math.min(pages - 1, Math.max(0, page + (dir === 'next' ? 1 : -1)));
    if (next === page) return;
    if (!prefersReducedMotion) setIsTurning(dir);
    // Trigger animation overlay then scroll
    window.setTimeout(() => {
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
      // Clear animation state after duration
      window.setTimeout(() => setIsTurning(null), 560);
    }, 16);
  }, [page, pages, prefersReducedMotion]);

  const handleDensityChange = useCallback((level, zoomOverride = zoom) => {
    const next = clampValue(level, 0, 1);
    densityRef.current = next;
    const meta = getDensityMeta(next);
    setDensity(next);
    computeAutoHeight(meta.heightFraction, zoomOverride);
    storage.set(STORAGE_KEYS.density, String(next));
    requestAnimationFrame(updatePages);
  }, [getDensityMeta, updatePages, zoom, computeAutoHeight]);

  const onDensityInput = useCallback((value) => {
    handleDensityChange(value);
  }, [handleDensityChange]);

  const changeZoom = useCallback((op) => {
    const step = 0.05;
    const next = op === 'inc' ? Math.min(1.2, +(zoom + step).toFixed(2)) : Math.max(0.6, +(zoom - step).toFixed(2));
    setZoom(next);
    storage.set(STORAGE_KEYS.zoom, String(next));
    requestAnimationFrame(() => {
      computeAutoHeight(densityMeta.heightFraction, next);
      updatePages();
    });
  }, [zoom, densityMeta.heightFraction, computeAutoHeight, updatePages]);

  const toggleControlCenter = useCallback(() => {
    const api = controlCenterRef.current;
    if (!api) return;
    if (typeof api.toggle === 'function') {
      api.toggle();
    } else if (isControlCenterOpen && typeof api.close === 'function') {
      api.close();
    } else if (!isControlCenterOpen && typeof api.open === 'function') {
      api.open();
    }
  }, [isControlCenterOpen]);

  const style = { '--page-height': `${autoHeight ?? Math.round((vh || 0) * densityMeta.heightFraction * zoom)}px` };

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault(); go('next');
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault(); go('prev');
      } else if (e.key === 'Home') {
        const el = containerRef.current; if (el) el.scrollTo({ left: 0, behavior: 'smooth' });
      } else if (e.key === 'End') {
        const el = containerRef.current; if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault(); changeZoom('inc');
      } else if (e.key === '-') {
        e.preventDefault(); changeZoom('dec');
      } else if (e.key?.toLowerCase?.() === 'h') {
        setShowHelp((s) => !s);
      } else if (e.key?.toLowerCase?.() === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, changeZoom, toggleFullscreen]);

  // Touch swipe navigation
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    let startX = 0; let startY = 0; let active = false;
    const onStart = (e) => { const t = e.touches?.[0]; if (!t) return; startX = t.clientX; startY = t.clientY; active = true; };
    const onEnd = (e) => {
      if (!active) return; active = false;
      const t = e.changedTouches?.[0]; if (!t) return;
      const dx = t.clientX - startX; const dy = t.clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0) go('next'); else go('prev');
      }
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [go]);

  // Persist reading progress as fraction of pages
  useEffect(() => {
    if (!chapterId || pages <= 0) return;
    const frac = Math.min(1, Math.max(0, page / (pages - 1 || 1)));
    storage.set(`reading-progress:${chapterId}`, frac.toFixed(4));
  }, [chapterId, page, pages]);

  const minutesLeft = useMemo(() => {
    if (!readingMinutes || !Number.isFinite(readingMinutes) || pages <= 0) return null;
    const fracDone = pages > 1 ? page / (pages - 1) : 1;
    const rem = Math.max(0, Math.ceil(readingMinutes * (1 - fracDone)));
    return rem;
  }, [readingMinutes, page, pages]);

  // Accessible valuetext for slider
  const progressValueNow = pages > 1 ? Math.round((page / (pages - 1)) * 100) : 0;
  const progressValueText = `${page + 1} of ${pages}${minutesLeft !== null ? `, ${minutesLeft} minutes left` : ''}`;

  const percentComplete = pages > 1 ? progressValueNow : (page >= pages - 1 ? 100 : 0);
  const truncatedSection = activeSection && activeSection.length > 56 ? `${activeSection.slice(0, 53)}…` : activeSection;
  const aspectLabel = aspect === 'classic' ? 'Classic' : aspect === 'a' ? 'DIN A' : 'Golden';
  const fullscreenLabel = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen';
  const marginSetting = settings?.pageMargin ?? 'medium';
  const marginTitle = `Cycle page margin (currently ${marginSetting})`;

  // UI helpers
  const canPrev = page > 0;
  const canNext = page < pages - 1;
  const goto = useCallback((idx) => {
    const el = containerRef.current;
    if (!el) return;
    const target = Math.min(pages - 1, Math.max(0, idx));
    el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' });
  }, [pages]);
  const toggleSurfaceTools = useCallback(() => {
    setShowSurfaceTools((value) => {
      const nextValue = !value;
      storage.set(STORAGE_KEYS.tools, nextValue ? '1' : '0');
      return nextValue;
    });
  }, []);

  const toggleSurfaceHighlights = useCallback(() => {
    setShowSurfaceHighlights((value) => {
      const nextValue = !value;
      storage.set(STORAGE_KEYS.highlights, nextValue ? '1' : '0');
      return nextValue;
    });
  }, []);

  const cycleMargin = useCallback(() => {
    const order = ['narrow', 'medium', 'wide'];
    const cur = settings?.pageMargin || 'medium';
    const next = order[(order.indexOf(cur) + 1) % order.length];
    updateSetting?.('pageMargin', next);
  }, [settings?.pageMargin, updateSetting]);

  // Recompute layout when key reading settings or density change
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      computeAutoHeight();
      updatePages();
    });
    return () => cancelAnimationFrame(id);
  }, [computeAutoHeight, content, settings?.fontSize, settings?.lineHeight, contentMaxWidth, updatePages]);

  const toggleBookMode = useCallback(() => {
    setBookMode((value) => {
      const nextValue = !value;
      storage.set(STORAGE_KEYS.book, nextValue ? '1' : '0');
      requestAnimationFrame(updatePages);
      return nextValue;
    });
  }, [updatePages]);

  const cycleAspect = useCallback(() => {
    const order = ['classic', 'a', 'golden'];
    const idx = order.indexOf(aspect);
    const next = order[(idx + 1) % order.length];
    setAspect(next);
    storage.set(STORAGE_KEYS.aspect, next);
    requestAnimationFrame(updatePages);
  }, [aspect, updatePages]);

  const toggleSpreadMode = useCallback(() => {
    setSpread((value) => {
      const nextValue = !value;
      storage.set(STORAGE_KEYS.spread, nextValue ? '1' : '0');
      requestAnimationFrame(updatePages);
      return nextValue;
    });
  }, [updatePages]);

  const resetReader = useCallback(() => {
    const el = containerRef.current;
    setPage(0);
    setPageInput('1');
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      });
    }
    setZoom(1);
    handleDensityChange(0.5, 1);
    setBookMode(false);
    setAspect('classic');
    setSpread(false);
    setShowToc(false);
    setShowSurfaceTools(false);
    setShowSurfaceHighlights(false);
    setShowHelp(false);
    setActiveSection('');
    setIsDraggingProgress(false);
    setDragFrac(null);
    if (document.fullscreenElement) {
      try {
        document.exitFullscreen?.();
      } catch (error) {
        debugLog('Failed to exit fullscreen during reset', error);
      }
    }
    setIsFullscreen(false);
    storage.set(STORAGE_KEYS.zoom, '1');
    storage.set(STORAGE_KEYS.book, '0');
    storage.set(STORAGE_KEYS.aspect, 'classic');
    storage.set(STORAGE_KEYS.spread, '0');
    storage.set(STORAGE_KEYS.tools, '0');
    storage.set(STORAGE_KEYS.highlights, '0');
    updateSetting?.('pageMargin', 'medium');
    resetSettings?.();
    requestAnimationFrame(updatePages);
  }, [updatePages, updateSetting, resetSettings, handleDensityChange]);

  // Build headings list from content (h2/h3) for quick navigation in paged mode
  useEffect(() => {
    if (!content) { setHeadings([]); return; }
    try {
      const temp = document.createElement('div');
      temp.innerHTML = content;
      const nodes = temp.querySelectorAll('h2, h3');
      const list = Array.from(nodes).map((n) => ({ id: n.getAttribute('id') || '', text: n.textContent || '', level: n.tagName.toLowerCase() }));
      setHeadings(list.filter((h) => Boolean(h.id) && Boolean(h.text)));
    } catch (error) {
      debugLog('Failed to parse headings from content', error);
      setHeadings([]);
    }
  }, [content]);

  const jumpToHeading = useCallback((id) => {
    const c = containerRef.current;
    if (!c) return;
    const el = c.querySelector(`#${CSS.escape(id)}`);
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    } catch (error) {
      el.scrollIntoView(true);
    }
    setShowToc(false);
  }, []);

  // Make progress bar clickable to jump to page
  const onProgressClick = useCallback((e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frac = Math.min(1, Math.max(0, x / rect.width));
    const target = Math.round(frac * Math.max(0, pages - 1));
    goto(target);
  }, [pages, goto]);

  // Progress drag with pointer events
  useEffect(() => {
    if (!isDraggingProgress) return;
    const move = (e) => {
      const el = progressRef.current; if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX ?? (e.touches?.[0]?.clientX || 0)) - rect.left;
      const frac = Math.min(1, Math.max(0, x / rect.width));
      setDragFrac(frac);
    };
    const up = () => {
      setIsDraggingProgress(false);
      const frac = dragFrac ?? 0;
      const target = Math.round(frac * Math.max(0, pages - 1));
      goto(target);
      setDragFrac(null);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', up, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [isDraggingProgress, dragFrac, pages, goto]);

  const startProgressDrag = useCallback((e) => {
    setIsDraggingProgress(true);
    const el = progressRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX ?? (e.touches?.[0]?.clientX || 0)) - rect.left;
    const frac = Math.min(1, Math.max(0, x / rect.width));
    setDragFrac(frac);
  }, []);

  // Desktop drag to flip (mouse)
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    let startX = 0; let dragging = false;
    const down = (e) => { if (e.button !== 0) return; startX = e.clientX; dragging = true; };
    const up = (e) => { if (!dragging) return; dragging = false; const dx = e.clientX - startX; if (Math.abs(dx) > 60) { if (dx < 0) go('next'); else go('prev'); } };
    el.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    return () => { el.removeEventListener('mousedown', down); window.removeEventListener('mouseup', up); };
  }, [go]);

  // Wheel navigation for trackpads (horizontal or shift+wheel)
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    let accum = 0; let raf = 0;
    const handler = (e) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      if (!delta) return;
      e.preventDefault();
      accum += delta;
      if (!raf) raf = requestAnimationFrame(() => {
        const th = 80; // threshold
        if (accum > th) go('next'); else if (accum < -th) go('prev');
        accum = 0; raf = 0;
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [go]);

  // Restore persisted reading progress (if available)
  useEffect(() => {
    if (!chapterId) return;
    const fracStr = storage.get(`reading-progress:${chapterId}`);
    if (!fracStr) return;
    const frac = parseFloat(fracStr);
    if (!Number.isFinite(frac)) return;
    const el = containerRef.current; if (!el) return;
    const target = Math.round(frac * Math.max(0, pages - 1));
    if (target > 0) {
      requestAnimationFrame(() => {
        el.scrollTo({ left: target * el.clientWidth });
      });
    }
  }, [chapterId, pages]);

  // Keep numeric page input in sync
  useEffect(() => {
    if (!isEditingPageInput) setPageInput(String(page + 1));
  }, [page, isEditingPageInput]);

  // Track fullscreen change (Esc, system exit)
  useEffect(() => {
    const onFs = () => setIsFullscreen(document.fullscreenElement != null);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  return (
    <div className={`paged-reader ${bookMode ? 'book-mode' : ''} ${spread ? 'spread' : ''} ${idle ? 'reader-idle' : ''} ${!prefersReducedMotion && isTurning ? `tilt-${isTurning}` : ''} ${className}`} style={style}>
      {showReadingControls && (
        <>
      <ReadingControlCenter
        ref={controlCenterRef}
        settings={settings}
        onChange={updateSetting}
        onReset={resetSettings}
        showFloatingTrigger={false}
        placement="bottom-center"
        onVisibilityChange={setIsControlCenterOpen}
      />
          <div className="paged-topbar" role="group" aria-label="Reader navigation">
            <div className="paged-topbar-side">
              <button type="button" className="paged-btn paged-btn-icon" onClick={() => goto(0)} aria-label="First page" title="First page" disabled={!canPrev}>
                <ChevronsLeft size={16} strokeWidth={1.75} />
              </button>
              <button type="button" className="paged-btn paged-btn-icon" onClick={() => go('prev')} aria-label="Previous page" title="Previous page" disabled={!canPrev}>
                <ChevronLeft size={16} strokeWidth={1.75} />
              </button>
            </div>
            <div className="paged-topbar-center" aria-live="polite">
              <div className="paged-topbar-pages">
                <span className="paged-topbar-pages-current">Page {page + 1}</span>
                <span className="paged-topbar-pages-total">/ {pages}</span>
              </div>
              <div className="paged-topbar-pills">
                <span className="paged-topbar-pill" title={`${percentComplete}% complete`}>
                  <Gauge size={15} strokeWidth={1.8} />
                  <span>{percentComplete}% complete</span>
                </span>
                {truncatedSection && (
                  <span className="paged-topbar-pill paged-topbar-pill-section" title={activeSection}>
                    <BookMarked size={15} strokeWidth={1.8} />
                    <span>{truncatedSection}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="paged-topbar-side">
              <button type="button" className="paged-btn paged-btn-icon" onClick={() => go('next')} aria-label="Next page" title="Next page" disabled={!canNext}>
                <ChevronRight size={16} strokeWidth={1.75} />
              </button>
              <button type="button" className="paged-btn paged-btn-icon" onClick={() => goto(pages - 1)} aria-label="Last page" title="Last page" disabled={!canNext}>
                <ChevronsRight size={16} strokeWidth={1.75} />
              </button>
            </div>
          </div>
          <div className="paged-topbar-meta">
            <label className="paged-jump-control">
              <span className="paged-jump-label">Jump to</span>
              <input
                className="paged-page-input"
                inputMode="numeric"
                aria-label="Jump to page"
                value={pageInput}
                onFocus={() => setIsEditingPageInput(true)}
                onBlur={() => {
                  setIsEditingPageInput(false);
                  const n = Math.max(1, Math.min(pages, parseInt(pageInput || '1', 10) || 1));
                  goto(n - 1);
                }}
                onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
              />
              <span className="paged-jump-total" aria-hidden="true">/ {pages}</span>
            </label>
            <div className="paged-topbar-metric" title={`${densityMeta.title} layout`}>
              <Columns3 size={15} strokeWidth={1.8} />
              <span>{densityMeta.label}</span>
              <span className="paged-topbar-metric-sub">{densityMeta.percent}%</span>
            </div>
            <div className="paged-topbar-metric">
              {minutesLeft !== null ? (
                <Timer size={15} strokeWidth={1.8} />
              ) : (
                <Sparkles size={15} strokeWidth={1.8} />
              )}
              <span>{minutesLeft !== null ? `${minutesLeft}m left` : 'All caught up'}</span>
            </div>
          </div>
          <div className="paged-quick-actions" role="group" aria-label="Reader quick actions">
            {headings.length > 0 && (
              <button
                type="button"
                className={`paged-chip-btn ${showToc ? 'active' : ''}`}
                onClick={() => setShowToc((s) => !s)}
                aria-pressed={showToc}
                aria-label="Table of contents"
                title="Table of contents"
              >
                <ListTree size={16} strokeWidth={1.75} />
                <span className="paged-btn-label">TOC</span>
              </button>
            )}
            <button
              type="button"
              className={`paged-chip-btn ${isControlCenterOpen ? 'active' : ''}`}
              onClick={toggleControlCenter}
              aria-pressed={isControlCenterOpen}
              aria-label="Toggle reading control center"
              title="Reading control center"
            >
              <SlidersHorizontal size={16} strokeWidth={1.75} />
              <span className="paged-btn-label">Controls</span>
            </button>
            <button
              type="button"
              className={`paged-chip-btn ${showSurfaceTools ? 'active' : ''}`}
              onClick={toggleSurfaceTools}
              aria-pressed={showSurfaceTools}
              aria-label="Toggle reading tools"
              title="Toggle reading tools"
            >
              <Sparkles size={16} strokeWidth={1.75} />
              <span className="paged-btn-label">Tools</span>
            </button>
            <button
              type="button"
              className={`paged-chip-btn ${showSurfaceHighlights ? 'active' : ''}`}
              onClick={toggleSurfaceHighlights}
              aria-pressed={showSurfaceHighlights}
              aria-label="Toggle highlights panel"
              title="Toggle highlights panel"
            >
              <Highlighter size={16} strokeWidth={1.75} />
              <span className="paged-btn-label">Highlights</span>
            </button>
            <button
              type="button"
              className={`paged-chip-btn ${isFullscreen ? 'active' : ''}`}
              onClick={toggleFullscreen}
              aria-pressed={isFullscreen}
              aria-label={fullscreenLabel}
              title={fullscreenLabel}
            >
              {isFullscreen ? <Minimize2 size={16} strokeWidth={1.75} /> : <Maximize2 size={16} strokeWidth={1.75} />}
              <span className="paged-btn-label">{isFullscreen ? 'Exit full' : 'Fullscreen'}</span>
            </button>
            <button
              type="button"
              className={`paged-chip-btn ${showHelp ? 'active' : ''}`}
              onClick={() => setShowHelp((s) => !s)}
              aria-pressed={showHelp}
              aria-label="Keyboard and gesture shortcuts"
              title="Keyboard and gesture shortcuts"
            >
              <CircleQuestionMark size={16} strokeWidth={1.75} />
              <span className="paged-btn-label">Help</span>
            </button>
            <button
              type="button"
              className="paged-chip-btn"
              onClick={resetReader}
              aria-label="Reset reader to defaults"
              title="Reset reader to defaults"
            >
              <RotateCcw size={16} strokeWidth={1.75} />
              <span className="paged-btn-label">Reset</span>
            </button>
          </div>
        </>
      )}
      {showReadingControls && (
        <div className="paged-progress-card">
          <div className="paged-progress-meta">
            <span className="paged-progress-chip">Page {page + 1} / {pages}</span>
            <span className="paged-progress-chip">{percentComplete}% complete</span>
            <span className="paged-progress-chip" title={`${densityMeta.title} layout`}>
              <Columns3 size={14} strokeWidth={1.8} />
              {densityMeta.label} · {densityMeta.percent}%
            </span>
            {minutesLeft !== null && (
              <span className="paged-progress-chip">
                <Timer size={14} strokeWidth={1.8} />
                {minutesLeft}m left
              </span>
            )}
          </div>
          <div
            ref={progressRef}
            className="paged-progress"
            role="slider"
            aria-label="Reading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressValueNow}
            aria-valuetext={progressValueText}
            onClick={onProgressClick}
            onPointerDown={startProgressDrag}
            onTouchStart={startProgressDrag}
          >
            <div className="paged-progress-bar" style={{ width: `${percentComplete}%` }} />
            {(isDraggingProgress && dragFrac != null) && (
              <div className="paged-progress-thumb" style={{ left: `${dragFrac * 100}%` }} />
            )}
            {(isDraggingProgress && dragFrac != null) && (
              <div className="paged-progress-tooltip" style={{ left: `${dragFrac * 100}%` }}>
                {`${Math.round(dragFrac * Math.max(1, pages))} / ${pages}`}
              </div>
            )}
          </div>
          {pages > 1 && (
            <div className="paged-dots" aria-label="Page dots">
              {Array.from({ length: Math.min(pages, 24) }, (_, i) => {
                const step = pages > 24 ? Math.round((i / Math.max(1, 23)) * (pages - 1)) : i;
                const active = Math.abs(page - step) < (pages > 24 ? Math.ceil(pages / 24) : 1);
                return (
                  <button key={i} type="button" className={`paged-dot ${active ? 'active' : ''}`} onClick={() => goto(step)} aria-label={`Go to page ${step + 1}`} />
                );
              })}
            </div>
          )}
        </div>
      )}
      {showReadingControls && (
        <div className="paged-control-dock">
          <div className="paged-control-row">
            <div className="paged-density-group" role="group" aria-label="Page density">
              <span className="paged-chip-label">Density</span>
              <div className="paged-density-slider" title={densityMeta.title}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={densityMeta.percent}
                  onChange={(e) => onDensityInput(Number(e.target.value) / 100)}
                  onInput={(e) => onDensityInput(Number(e.target.value) / 100)}
                  aria-label="Adjust page density"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={densityMeta.percent}
                />
                <span className="paged-density-value">{densityMeta.label} · {densityMeta.percent}%</span>
              </div>
            </div>
            <div className="paged-zoom-group" role="group" aria-label="Zoom">
              <button type="button" className="paged-btn paged-btn-icon" onClick={() => changeZoom('dec')} aria-label="Zoom out" title="Zoom out">
                <Minus size={16} strokeWidth={1.75} />
              </button>
              <span className="paged-zoom-label">{Math.round(zoom * 100)}%</span>
              <button type="button" className="paged-btn paged-btn-icon" onClick={() => changeZoom('inc')} aria-label="Zoom in" title="Zoom in">
                <Plus size={16} strokeWidth={1.75} />
              </button>
            </div>
          </div>
          <div className="paged-control-row paged-layout-group" role="group" aria-label="Layout options">
            <button
              type="button"
              className="paged-chip-btn"
              onClick={cycleMargin}
              aria-label="Cycle page margin"
              title={marginTitle}
            >
              <MoveHorizontal size={16} strokeWidth={1.75} />
              <span className="paged-btn-label">Margin</span>
            </button>
            <button
              type="button"
              className={`paged-chip-btn ${spread ? 'active' : ''}`}
              onClick={toggleSpreadMode}
              aria-pressed={spread}
              aria-label="Toggle two-page spread"
              title="Toggle two-page spread"
            >
              <Columns3 size={16} strokeWidth={1.75} />
              <span className="paged-btn-label">Spread</span>
            </button>
            <button
              type="button"
              className={`paged-chip-btn ${bookMode ? 'active' : ''}`}
              onClick={toggleBookMode}
              aria-pressed={bookMode}
              aria-label="Toggle book styling"
              title="Toggle book styling"
            >
              <BookOpen size={16} strokeWidth={1.75} />
              <span className="paged-btn-label">Book</span>
            </button>
            <button
              type="button"
              className="paged-chip-btn"
              onClick={cycleAspect}
              disabled={!bookMode}
              aria-label="Cycle page aspect ratio"
              title={bookMode ? 'Cycle page aspect ratio' : 'Enable book mode to adjust aspect'}
            >
              <ScanText size={16} strokeWidth={1.75} />
              <span className="paged-btn-label">{aspectLabel}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tap zones for easy navigation */}
      <div className="paged-tapzone paged-tapzone-left" onClick={() => go('prev')} aria-hidden="true" />
      <div className="paged-tapzone paged-tapzone-right" onClick={() => go('next')} aria-hidden="true" />
      <div className={`paged-arrow paged-arrow-left ${canPrev ? 'show' : ''}`} aria-hidden="true">‹</div>
      <div className={`paged-arrow paged-arrow-right ${canNext ? 'show' : ''}`} aria-hidden="true">›</div>

      <div ref={containerRef} className="paged-pages post-content tiptap reading-surface" aria-roledescription="paged reader" tabIndex={0}>
        <InteractiveReadingSurface
          content={content}
          parserOptions={parserOptions}
          contentStyles={contentStyles}
          contentMaxWidth={contentMaxWidth}
          surfaceClass={surfaceClass}
          className='post-content tiptap reading-surface'
          chapterId={chapterId}
          hideUtilityBar={!showSurfaceTools}
          hideHighlightsPanel={!showSurfaceHighlights}
        />
      </div>

      {/* Decorative edge gradients */}
      <div className="paged-edge paged-edge-left" aria-hidden="true" />
      <div className="paged-edge paged-edge-right" aria-hidden="true" />

      {/* Enhanced page-turn animation */}
      {!prefersReducedMotion && isTurning && (
        <div key={`turn-${page}-${isTurning}`} className={`page-turn ${isTurning === 'next' ? 'next' : 'prev'}`} aria-hidden="true">
          <div className="page-turn-sheet" />
          <div className="page-turn-highlight" />
          <div className="page-turn-shadow" />
        </div>
      )}

      {/* TOC overlay */}
      {showToc && headings.length > 0 && (
        <div className="paged-toc">
          <div className="paged-toc-header">
            <span>On this page</span>
            <button type="button" className="paged-toc-close" onClick={() => setShowToc(false)} aria-label="Close TOC">×</button>
          </div>
          <ul className="paged-toc-list">
            {headings.map((h) => (
              <li key={h.id} className={h.level === 'h3' ? 'indent' : ''}>
                <button type="button" onClick={() => jumpToHeading(h.id)} className="paged-toc-item">{h.text}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Shortcuts Help overlay */}
      {showHelp && (
        <div className="paged-toc" style={{ right: 'unset', left: 8 }}>
          <div className="paged-toc-header">
            <span>Shortcuts</span>
            <button type="button" className="paged-toc-close" onClick={() => setShowHelp(false)} aria-label="Close help">×</button>
          </div>
          <ul className="paged-toc-list">
            <li><span className="paged-toc-item">←/→ Page · Space/Shift+Space</span></li>
            <li><span className="paged-toc-item">Home/End Jump to first/last</span></li>
            <li><span className="paged-toc-item">+/− Zoom</span></li>
            <li><span className="paged-toc-item">H Help · TOC button opens contents</span></li>
            <li><span className="paged-toc-item">Tools toggle reading surface toolbar</span></li>
            <li><span className="paged-toc-item">HL toggle highlights panel</span></li>
          </ul>
        </div>
      )}
    </div>
  );
}

PagedReader.propTypes = {
  content: PropTypes.string,
  parserOptions: PropTypes.object,
  className: PropTypes.string,
  pageHeight: PropTypes.number,
  chapterId: PropTypes.string,
  readingMinutes: PropTypes.number,
  showReadingControls: PropTypes.bool,
  settings: PropTypes.object,
  onChange: PropTypes.func,
  onReset: PropTypes.func,
  contentStyles: PropTypes.object,
  contentMaxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  surfaceClass: PropTypes.string,
};
