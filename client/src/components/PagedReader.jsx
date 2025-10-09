import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
// parse is unused now; InteractiveReadingSurface handles parsing
import useReadingSettings from '../hooks/useReadingSettings';
import ReadingControlCenter from './ReadingControlCenter';
import InteractiveReadingSurface from './InteractiveReadingSurface.jsx';

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
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [isTurning, setIsTurning] = useState(null); // 'next' | 'prev' | null
  const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 0);
  const [size, setSize] = useState(() => {
    // Persist preferred page size per user
    try { return localStorage.getItem('paged-size') || 'm'; } catch { return 'm'; }
  });
  const [showToc, setShowToc] = useState(false);
  const [headings, setHeadings] = useState([]);
  // Parsed content handled by InteractiveReadingSurface
  const hasExternal = Boolean(extSettings);
  const hook = useReadingSettings();
  const settings = hasExternal ? extSettings : hook.settings;
  const updateSetting = hasExternal ? extOnChange : hook.updateSetting;
  const resetSettings = hasExternal ? extOnReset : hook.resetSettings;
  const contentStyles = hasExternal ? (extContentStyles || {}) : hook.contentStyles;
  const contentMaxWidth = hasExternal ? (extContentMaxWidth ?? undefined) : hook.contentMaxWidth;
  const surfaceClass = hasExternal ? (extSurfaceClass || '') : hook.surfaceClass;

  const updatePages = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const total = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPages(total);
    const current = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    setPage(Math.min(total - 1, Math.max(0, current)));
  }, []);

  useEffect(() => {
    updatePages();
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const current = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
      setPage(Math.min(pages - 1, Math.max(0, current)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    const onResize = () => {
      setVh(window.innerHeight);
      updatePages();
    };
    window.addEventListener('resize', onResize);
    const id = requestAnimationFrame(updatePages);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(id);
    };
  }, [updatePages, pages]);

  const go = useCallback((dir) => {
    const el = containerRef.current;
    if (!el) return;
    const next = Math.min(pages - 1, Math.max(0, page + (dir === 'next' ? 1 : -1)));
    if (next === page) return;
    setIsTurning(dir);
    // Trigger animation overlay then scroll
    window.setTimeout(() => {
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
      // Clear animation state after duration
      window.setTimeout(() => setIsTurning(null), 560);
    }, 16);
  }, [page, pages]);

  // Page size presets
  const sizeToFrac = size === 's' ? 0.65 : size === 'l' ? 0.85 : (pageHeight || 0.75);
  const style = { '--page-height': `${Math.round((vh || 0) * sizeToFrac)}px` };

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
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

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
    try {
      if (chapterId && pages > 0) {
        const frac = Math.min(1, Math.max(0, page / (pages - 1 || 1)));
        localStorage.setItem(`reading-progress:${chapterId}`, frac.toFixed(4));
      }
    } catch (_) {}
  }, [chapterId, page, pages]);

  const minutesLeft = useMemo(() => {
    if (!readingMinutes || !Number.isFinite(readingMinutes) || pages <= 0) return null;
    const fracDone = pages > 1 ? page / (pages - 1) : 1;
    const rem = Math.max(0, Math.ceil(readingMinutes * (1 - fracDone)));
    return rem;
  }, [readingMinutes, page, pages]);

  // UI helpers
  const canPrev = page > 0;
  const canNext = page < pages - 1;
  const goto = (idx) => {
    const el = containerRef.current; if (!el) return;
    const target = Math.min(pages - 1, Math.max(0, idx));
    el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' });
  };
  const changeSize = (s) => {
    setSize(s);
    try { localStorage.setItem('paged-size', s); } catch {}
    // trigger recalculation
    requestAnimationFrame(updatePages);
  };

  // Build headings list from content (h2/h3) for quick navigation in paged mode
  useEffect(() => {
    if (!content) { setHeadings([]); return; }
    try {
      const temp = document.createElement('div');
      temp.innerHTML = content;
      const nodes = temp.querySelectorAll('h2, h3');
      const list = Array.from(nodes).map((n) => ({ id: n.getAttribute('id') || '', text: n.textContent || '', level: n.tagName.toLowerCase() }));
      setHeadings(list.filter((h) => Boolean(h.id) && Boolean(h.text)));
    } catch (_) {
      setHeadings([]);
    }
  }, [content]);

  const jumpToHeading = (id) => {
    const c = containerRef.current; if (!c) return;
    const el = c.querySelector(`#${CSS.escape(id)}`);
    if (!el) return;
    try { el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' }); } catch (_) { el.scrollIntoView(true); }
    setShowToc(false);
  };

  // Make progress bar clickable to jump to page
  const onProgressClick = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frac = Math.min(1, Math.max(0, x / rect.width));
    const target = Math.round(frac * Math.max(0, pages - 1));
    goto(target);
  };

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

  return (
    <div className={`paged-reader ${isTurning ? `tilt-${isTurning}` : ''} ${className}`} style={style}>
      {showReadingControls && (
        <ReadingControlCenter
          settings={settings}
          onChange={updateSetting}
          onReset={resetSettings}
        />
      )}
      <div className="paged-toolbar">
        <button type="button" className="paged-btn" onClick={() => goto(0)} aria-label="First page" disabled={!canPrev}>«</button>
        <button type="button" className="paged-btn" onClick={() => go('prev')} aria-label="Previous page" disabled={!canPrev}>‹</button>
        <div className="paged-indicator" aria-live="polite">Page {page + 1} / {pages}{minutesLeft !== null ? ` · ${minutesLeft} min left` : ''}</div>
        <button type="button" className="paged-btn" onClick={() => go('next')} aria-label="Next page" disabled={!canNext}>›</button>
        <button type="button" className="paged-btn" onClick={() => goto(pages - 1)} aria-label="Last page" disabled={!canNext}>»</button>
        <div className="paged-size">
          <button type="button" className={`paged-size-btn ${size === 's' ? 'active' : ''}`} onClick={() => changeSize('s')} aria-label="Compact">S</button>
          <button type="button" className={`paged-size-btn ${size === 'm' ? 'active' : ''}`} onClick={() => changeSize('m')} aria-label="Comfort">M</button>
          <button type="button" className={`paged-size-btn ${size === 'l' ? 'active' : ''}`} onClick={() => changeSize('l')} aria-label="Spacious">L</button>
        </div>
        {headings.length > 0 && (
          <div className="paged-actions">
            <button type="button" className="paged-btn" onClick={() => setShowToc((s) => !s)} aria-label="Table of contents">TOC</button>
          </div>
        )}
      </div>
      <div className="paged-progress" role="slider" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pages > 1 ? Math.round((page / (pages - 1)) * 100) : 0} onClick={onProgressClick}>
        <div className="paged-progress-bar" style={{ width: pages > 1 ? `${(page / (pages - 1)) * 100}%` : '0%' }} />
      </div>

      {/* Page dots (clickable) */}
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

      {/* Tap zones for easy navigation */}
      <div className="paged-tapzone paged-tapzone-left" onClick={() => go('prev')} aria-hidden="true" />
      <div className="paged-tapzone paged-tapzone-right" onClick={() => go('next')} aria-hidden="true" />
      <div className={`paged-arrow paged-arrow-left ${canPrev ? 'show' : ''}`} aria-hidden="true">‹</div>
      <div className={`paged-arrow paged-arrow-right ${canNext ? 'show' : ''}`} aria-hidden="true">›</div>

      <div ref={containerRef} className="paged-pages post-content tiptap reading-surface">
        <InteractiveReadingSurface
          content={content}
          parserOptions={parserOptions}
          contentStyles={contentStyles}
          contentMaxWidth={contentMaxWidth}
          surfaceClass={surfaceClass}
          className='post-content tiptap reading-surface'
          chapterId={chapterId}
          hideUtilityBar
          hideHighlightsPanel
        />
      </div>

      {/* Decorative edge gradients */}
      <div className="paged-edge paged-edge-left" aria-hidden="true" />
      <div className="paged-edge paged-edge-right" aria-hidden="true" />

      {/* Enhanced page-turn animation */}
      {isTurning && (
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
    </div>
  );
}
