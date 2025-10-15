// client/src/components/ControlCenter.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineSwatch,
  HiOutlineCog6Tooth,
  HiOutlineClock,
} from 'react-icons/hi2';
import { AiOutlineSearch, AiOutlineRest, AiOutlineSound } from 'react-icons/ai';
import { startRest, cancelRest } from './RestOverlay';
import { setTheme } from '../redux/theme/themeSlice';

const DOCK_LS_KEY = 'dock.settings.v1';
const DEFAULT_DOCK = {
  scale: 1.0,
  influenceDistance: 120,
  magnifyBoost: 0.35,
  magnifyBoostActive: 0.45,
  stackStyle: 'grid',
  lockReorder: false,
  magnifyEnabled: true,
  animateOnOpen: true,
  showRecents: true,
  position: 'bottom',
  showLabels: false,
};

export default function ControlCenter({ onOpenCommandMenu }) {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.theme);

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null); // 'appearance' | 'icons' | 'dock' | 'recents'
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const [dock, setDock] = useState(() => {
    try { return { ...DEFAULT_DOCK, ...(JSON.parse(localStorage.getItem(DOCK_LS_KEY) || 'null') || {}) }; }
    catch { return DEFAULT_DOCK; }
  });

  // Rest settings + session state
  const readRestSettings = () => {
    try {
      const raw = JSON.parse(localStorage.getItem('rest.settings.v1') || 'null') || {};
      return {
        muted: Boolean(raw.muted),
        notify: Boolean(raw.notify),
        vibrate: Boolean(raw.vibrate),
        autoRepeat: Boolean(raw.autoRepeat),
        dim: typeof raw.dim === 'number' ? Math.max(0, Math.min(0.9, raw.dim)) : 0.7,
        presets: Array.isArray(raw.presets) && raw.presets.length ? raw.presets.slice(0,3).map((n) => Math.max(1, Math.floor(Number(n)||0))) : [5,10,20],
        defaultDuration: Math.max(1, Math.floor(Number(raw.defaultDuration || 5))),
      };
    } catch { return { muted: false, notify: false, vibrate: false, autoRepeat: false, dim: 0.7, presets: [5,10,20], defaultDuration: 5 }; }
  };
  const [restSettings, setRestSettings] = useState(readRestSettings);
  const saveRestSettings = (patch) => {
    const next = { ...readRestSettings(), ...patch };
    setRestSettings(next);
    try { localStorage.setItem('rest.settings.v1', JSON.stringify(next)); } catch {}
    try { window.dispatchEvent(new CustomEvent('rest-settings-changed', { detail: next })); } catch {}
  };
  const [restRemaining, setRestRemaining] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const formatTime = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  useEffect(() => {
    const readRest = () => {
      try {
        const data = JSON.parse(localStorage.getItem('rest.session.v1') || 'null');
        if (!data?.endAt) {
          setRestActive(false); setRestRemaining(0); return;
        }
        const now = Date.now();
        const ms = Math.max(0, data.endAt - now);
        setRestActive(ms > 0);
        setRestRemaining(Math.ceil(ms / 1000));
      } catch {
        setRestActive(false); setRestRemaining(0);
      }
    };
    readRest();
    const onChange = () => readRest();
    const timer = setInterval(readRest, 1000);
    window.addEventListener('rest-session-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => { clearInterval(timer); window.removeEventListener('rest-session-changed', onChange); window.removeEventListener('storage', onChange); };
  }, []);

  // UI effects: brightness, contrast, veil, reduceMotion; and UI sound volume
  const readEffects = () => {
    try { return JSON.parse(localStorage.getItem('ui.effects.v1') || 'null') || { brightness: 1, contrast: 1, veil: 0, reduceMotion: false }; } catch { return { brightness: 1, contrast: 1, veil: 0, reduceMotion: false }; }
  };
  const [effects, setEffects] = useState(readEffects);
  const saveEffects = (patch) => {
    const next = { ...readEffects(), ...patch };
    setEffects(next);
    try { localStorage.setItem('ui.effects.v1', JSON.stringify(next)); } catch {}
    try { window.dispatchEvent(new CustomEvent('ui-effects-changed', { detail: next })); } catch {}
  };
  const [uiSound, setUiSound] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ui.sound.v1') || 'null') || { volume: 1 }; } catch { return { volume: 1 }; }
  });
  useEffect(() => {
    try { localStorage.setItem('ui.sound.v1', JSON.stringify(uiSound)); } catch {}
    try { window.dispatchEvent(new CustomEvent('ui-sound-changed', { detail: uiSound })); } catch {}
  }, [uiSound]);

  // Appearance (accent + transparency/blur)
  const readAppearance = () => {
    try { return JSON.parse(localStorage.getItem('ui.appearance.v1') || 'null') || { accent: '#0A84FF', glassAlpha: 0.62, glassBlur: 20 }; } catch { return { accent: '#0A84FF', glassAlpha: 0.62, glassBlur: 20 }; }
  };
  const [appearance, setAppearance] = useState(readAppearance);
  const applyAppearanceToDOM = (a) => {
    const root = document.documentElement;
    try {
      root.style.setProperty('--color-accent', a.accent);
      root.style.setProperty('accent-color', a.accent);
      const alpha = Math.max(0.2, Math.min(0.95, a.glassAlpha ?? 0.62));
      root.style.setProperty('--glass-bg-alpha', String(alpha));
      // Keep border alpha proportional but softer
      root.style.setProperty('--glass-border-alpha', String(Math.max(0.12, Math.min(0.7, alpha * 0.6))));
      const blur = Math.max(0, Math.min(28, a.glassBlur ?? 20));
      root.style.setProperty('--glass-blur', `${blur}px`);
    } catch {}
  };
  useEffect(() => { applyAppearanceToDOM(appearance); }, []);
  const saveAppearance = (patch) => {
    const next = { ...readAppearance(), ...patch };
    setAppearance(next);
    try { localStorage.setItem('ui.appearance.v1', JSON.stringify(next)); } catch {}
    applyAppearanceToDOM(next);
    try { window.dispatchEvent(new CustomEvent('ui-appearance-changed', { detail: next })); } catch {}
  };

  useEffect(() => {
    // ensure settings persisted on mount
    saveRestSettings({});
  }, []);

  const isWhiteSur = useMemo(() => {
    try { return (localStorage.getItem('iconPack') || 'default') === 'whitesur'; } catch { return false; }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickAway = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
        setExpanded(null);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (expanded) setExpanded(null); else setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, expanded]);

  const saveDock = (patch) => {
    try {
      const next = { ...dock, ...patch };
      setDock(next);
      localStorage.setItem(DOCK_LS_KEY, JSON.stringify(next));
      const evt = new CustomEvent('dock-settings-changed', { detail: next });
      window.dispatchEvent(evt);
    } catch (_) { /* ignore */ }
  };

  const setIconPack = (pack) => {
    try {
      if (pack === 'whitesur') localStorage.setItem('iconPack', 'whitesur');
      else localStorage.removeItem('iconPack');
      setTimeout(() => { window.location.reload(); }, 100);
    } catch (_) { /* ignore */ }
  };

  // Focus trap within panel
  const panelKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    const root = panelRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const elements = Array.from(focusables).filter((el) => !el.hasAttribute('disabled'));
    if (elements.length === 0) return;
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  useEffect(() => {
    if (!open) return;
    const root = panelRef.current;
    if (!root) return;
    // Focus first interactive element
    const focusable = root.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus?.();
  }, [open]);

  const EXPANDED_LS = 'cc.expanded.v1';
  useEffect(() => {
    try {
      const saved = localStorage.getItem(EXPANDED_LS);
      if (saved) setExpanded(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(EXPANDED_LS, expanded || ''); } catch {}
  }, [expanded]);

  const Panel = ({ children }) => (
    <motion.div
      ref={panelRef}
      id="control-center-panel"
      role="dialog"
      aria-label="Control Center"
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -6 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="absolute right-0 mt-2 w-[22rem] origin-top-right rounded-3xl border border-white/60 bg-white/95 p-3 shadow-[0_35px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-800/60 dark:bg-slate-900/95 z-50"
      onKeyDown={panelKeyDown}
    >
      {/* pointer arrow */}
      <div
        aria-hidden
        className="absolute -top-2 right-8 h-4 w-4 rotate-45 rounded-[6px] border border-white/60 bg-white/95 dark:border-slate-800/60 dark:bg-slate-900/95"
      />
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 id="cc-title" className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Control Center</h3>
        <button
          type="button"
          aria-label="Close Control Center"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200/70 bg-white/70 text-slate-600 hover:bg-white dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-300"
          onClick={() => { setOpen(false); setExpanded(null); }}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden><path d="M4.5 4.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </button>
      </div>
      {children}
    </motion.div>
  );

  const Tile = ({ icon, label, sublabel, active, onClick, children, expanded: isExpanded }) => (
    <div className={`rounded-2xl border transition ${
      active
        ? 'border-sky-400/60 bg-sky-50/70 dark:border-sky-500/60 dark:bg-sky-500/10'
        : 'border-slate-200/70 bg-white/70 hover:border-sky-300/60 dark:border-slate-700/60 dark:bg-slate-800/50 dark:hover:border-sky-500/40'
    } ${isExpanded ? 'col-span-2' : ''}`}>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-3">
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${active ? 'bg-sky-500/20 text-sky-600 dark:text-sky-200' : 'bg-slate-300/30 text-slate-600 dark:bg-slate-700/70 dark:text-slate-200'}`}>{icon}</span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</span>
            {sublabel ? <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">{sublabel}</span> : null}
          </span>
        </span>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isExpanded ? 'Hide' : 'Show'}</span>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="px-3 pb-3">
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        title="Open Control Center"
        className="inline-flex h-11 items-center justify-center rounded-full border bg-white/70 px-3 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white/80 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="control-center-panel"
      >
        <HiOutlineAdjustmentsHorizontal className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open ? (
          <Panel>
            <div className="grid grid-cols-2 gap-3">
              {/* Quick toggles row */}
              <div className="col-span-2 grid grid-cols-3 gap-2">
                <button type="button" className={`rounded-2xl border px-3 py-2 text-sm ${effects.veil > 0 ? 'border-indigo-400/60 bg-indigo-50 text-indigo-700 dark:border-indigo-500/60 dark:bg-indigo-500/10 dark:text-indigo-200' : 'border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-800/50'}`} onClick={() => saveEffects({ veil: effects.veil > 0 ? 0 : 0.12 })}>Focus</button>
                <button type="button" className={`rounded-2xl border px-3 py-2 text-sm ${effects.reduceMotion ? 'border-amber-400/60 bg-amber-50 text-amber-700 dark:border-amber-500/60 dark:bg-amber-500/10 dark:text-amber-200' : 'border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-800/50'}`} onClick={() => saveEffects({ reduceMotion: !effects.reduceMotion })}>Reduce Motion</button>
                <button type="button" className={`rounded-2xl border px-3 py-2 text-sm ${effects.contrast > 1.05 ? 'border-emerald-400/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-800/50'}`} onClick={() => saveEffects({ contrast: effects.contrast > 1.05 ? 1 : 1.12 })}>High Contrast</button>
              </div>
              <Tile
                icon={<HiOutlineSun className="h-5 w-5" />}
                label="Display"
                sublabel={`Brightness ${(effects.brightness * 100) | 0}%`}
                active={effects.brightness !== 1 || effects.contrast !== 1}
                onClick={() => setExpanded((e) => (e === 'display' ? null : 'display'))}
                expanded={expanded === 'display'}
              >
                <label className="block text-xs text-slate-600 dark:text-slate-300">
                  <span className="mb-1 block">Brightness</span>
                  <input type="range" min="0.7" max="1.3" step="0.01" value={effects.brightness} onChange={(e) => saveEffects({ brightness: Number(e.target.value) })} className="w-full" />
                </label>
                <label className="mt-3 block text-xs text-slate-600 dark:text-slate-300">
                  <span className="mb-1 block">Contrast</span>
                  <input type="range" min="0.9" max="1.3" step="0.01" value={effects.contrast} onChange={(e) => saveEffects({ contrast: Number(e.target.value) })} className="w-full" />
                </label>
                <label className="mt-3 block text-xs text-slate-600 dark:text-slate-300">
                  <span className="mb-1 block">Dim surroundings</span>
                  <input type="range" min="0" max="0.35" step="0.01" value={effects.veil} onChange={(e) => saveEffects({ veil: Number(e.target.value) })} className="w-full" />
                </label>
              </Tile>

              <Tile
                icon={<HiOutlineSwatch className="h-5 w-5" />}
                label="Theme"
                sublabel={`Accent`}
                active={true}
                onClick={() => setExpanded((e) => (e === 'theme' ? null : 'theme'))}
                expanded={expanded === 'theme'}
              >
                <div className="grid grid-cols-8 gap-2">
                  {[
                    '#0A84FF', // Blue (default)
                    '#BF5AF2', // Purple
                    '#FF2D55', // Pink
                    '#FF3B30', // Red
                    '#FF9500', // Orange
                    '#FFCC00', // Yellow
                    '#34C759', // Green
                    '#8E8E93', // Graphite
                  ].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`Set accent ${hex}`}
                      className={`h-7 w-7 rounded-full ring-2 ring-white/60 transition hover:scale-105 dark:ring-white/10 ${appearance.accent === hex ? 'outline outline-2 outline-offset-2 outline-slate-400/60' : ''}`}
                      style={{ backgroundColor: hex }}
                      onClick={() => saveAppearance({ accent: hex })}
                    />
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="block text-xs text-slate-600 dark:text-slate-300">
                    <span className="mb-1 block">Transparency</span>
                    <input type="range" min="0.2" max="0.95" step="0.01" value={appearance.glassAlpha} onChange={(e) => saveAppearance({ glassAlpha: Number(e.target.value) })} className="w-full" />
                  </label>
                  <label className="block text-xs text-slate-600 dark:text-slate-300">
                    <span className="mb-1 block">Blur</span>
                    <input type="range" min="0" max="28" step="1" value={appearance.glassBlur} onChange={(e) => saveAppearance({ glassBlur: Number(e.target.value) })} className="w-full" />
                  </label>
                </div>
              </Tile>

              <Tile
                icon={<AiOutlineSound className="h-5 w-5" />}
                label="Sound"
                sublabel={`Volume ${Math.round((uiSound.volume ?? 1) * 100)}%`}
                active={(uiSound.volume ?? 1) > 0}
                onClick={() => setExpanded((e) => (e === 'sound' ? null : 'sound'))}
                expanded={expanded === 'sound'}
              >
                <label className="block text-xs text-slate-600 dark:text-slate-300">
                  <span className="mb-1 block">UI Volume</span>
                  <input type="range" min="0" max="1" step="0.01" value={uiSound.volume ?? 1} onChange={(e) => setUiSound({ volume: Number(e.target.value) })} className="w-full" />
                </label>
                <div className="mt-2 text-[0.7rem] text-slate-500 dark:text-slate-400">Controls sounds played by the app (e.g., rest chime).</div>
              </Tile>
              <Tile
                icon={theme === 'dark' ? <HiOutlineMoon className="h-5 w-5" /> : <HiOutlineSun className="h-5 w-5" />}
                label="Appearance"
                sublabel={theme === 'dark' ? 'Dark' : 'Light'}
                active={theme === 'dark'}
                onClick={() => setExpanded((e) => (e === 'appearance' ? null : 'appearance'))}
                expanded={expanded === 'appearance'}
              >
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                      theme === 'light' ? 'border-amber-400/60 bg-amber-50 text-amber-700 dark:border-amber-500/60 dark:bg-amber-500/10 dark:text-amber-200' : 'border-slate-200/80 hover:border-amber-300 dark:border-slate-700/70 dark:hover:border-amber-500/70'
                    }`}
                    onClick={() => dispatch(setTheme('light'))}
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-200"><HiOutlineSun className="h-5 w-5" /></span>
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                      theme === 'dark' ? 'border-sky-400/60 bg-sky-50 text-sky-700 dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200' : 'border-slate-200/80 hover:border-sky-300 dark:border-slate-700/70 dark:hover:border-sky-500/70'
                    }`}
                    onClick={() => dispatch(setTheme('dark'))}
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-200"><HiOutlineMoon className="h-5 w-5" /></span>
                    <span>Dark</span>
                  </button>
                </div>
              </Tile>

              <Tile
                icon={<HiOutlineSwatch className="h-5 w-5" />}
                label="Icons"
                sublabel={isWhiteSur ? 'WhiteSur' : 'Default'}
                active={isWhiteSur}
                onClick={() => setExpanded((e) => (e === 'icons' ? null : 'icons'))}
                expanded={expanded === 'icons'}
              >
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className={`rounded-xl border px-3 py-2 text-sm ${!isWhiteSur ? 'border-slate-300/80 bg-white text-slate-700 dark:border-slate-600/70 dark:bg-slate-800/60 dark:text-slate-200' : 'border-slate-200/80 hover:border-slate-300 dark:border-slate-700/70'}`} onClick={() => setIconPack('default')}>Default</button>
                  <button type="button" className={`rounded-xl border px-3 py-2 text-sm ${isWhiteSur ? 'border-emerald-400/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-slate-200/80 hover:border-emerald-300 dark:border-slate-700/70 dark:hover:border-emerald-500/70'}`} onClick={() => setIconPack('whitesur')}>WhiteSur</button>
                </div>
                <div className="mt-2 text-[0.7rem] text-slate-500 dark:text-slate-400">Switching icon pack reloads the page.</div>
              </Tile>

              <Tile
                icon={<HiOutlineCog6Tooth className="h-5 w-5" />}
                label="Dock"
                sublabel={`${dock.position === 'left' ? 'Left' : 'Bottom'} • ${dock.magnifyEnabled ? 'Magnify On' : 'Magnify Off'}`}
                active={dock.magnifyEnabled}
                onClick={() => setExpanded((e) => (e === 'dock' ? null : 'dock'))}
                expanded={expanded === 'dock'}
              >
                <div className="space-y-3">
                  <label className="block text-xs text-slate-600 dark:text-slate-300">
                    <span className="mb-1 block">Size</span>
                    <input type="range" min="0.8" max="1.4" step="0.05" value={dock.scale} onChange={(e) => saveDock({ scale: Number(e.target.value) })} className="w-full" />
                  </label>
                  <label className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">Magnification</span>
                    <input type="checkbox" checked={dock.magnifyEnabled} onChange={(e) => saveDock({ magnifyEnabled: e.target.checked })} />
                  </label>
                  <label className="block text-xs text-slate-600 dark:text-slate-300">
                    <span className="mb-1 block">Magnification Intensity</span>
                    <input type="range" min="0.1" max="0.7" step="0.05" value={dock.magnifyBoost} onChange={(e) => saveDock({ magnifyBoost: Number(e.target.value) })} className="w-full" />
                  </label>
                  <div className="block text-xs text-slate-600 dark:text-slate-300">
                    <span className="mb-1 block">Position</span>
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 p-1 dark:border-slate-700/60">
                      <button type="button" className={`rounded-xl px-3 py-1.5 text-sm ${dock.position === 'bottom' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-700 dark:text-slate-300'}`} onClick={() => saveDock({ position: 'bottom' })}>Bottom</button>
                      <button type="button" className={`rounded-xl px-3 py-1.5 text-sm ${dock.position === 'left' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-700 dark:text-slate-300'}`} onClick={() => saveDock({ position: 'left' })}>Left</button>
                    </div>
                  </div>
                  <label className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">Always show labels</span>
                    <input type="checkbox" checked={dock.showLabels} onChange={(e) => saveDock({ showLabels: e.target.checked })} />
                  </label>
                </div>
              </Tile>

              <Tile
                icon={<AiOutlineRest className="h-5 w-5" />}
                label="Rest"
                sublabel={restActive ? `${formatTime(restRemaining)} left` : 'Off'}
                active={restActive}
                onClick={() => setExpanded((e) => (e === 'rest' ? null : 'rest'))}
                expanded={expanded === 'rest'}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {restActive ? (
                    <>
                      <button type="button" className="rounded-xl border border-red-300/70 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-500/60 dark:bg-red-500/10 dark:text-red-200" onClick={() => cancelRest()}>End Rest</button>
                      <button type="button" className="rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-200" onClick={() => startRest(Math.ceil(restRemaining / 60) + 5)}>Add 5 min</button>
                    </>
                  ) : (
                    <>
                      {restSettings.presets.map((p, idx) => (
                        <button key={idx} type="button" className="rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-sky-300 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:border-sky-500/50" onClick={() => startRest(Number(p))}>Start {p} min</button>
                      ))}
                    </>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800/50">
                    <span className="text-slate-700 dark:text-slate-300">Mute chime</span>
                    <input type="checkbox" checked={restSettings.muted} onChange={(e) => saveRestSettings({ muted: e.target.checked })} />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800/50">
                    <span className="text-slate-700 dark:text-slate-300">Notification</span>
                    <input type="checkbox" checked={restSettings.notify} onChange={async (e) => {
                      const value = e.target.checked;
                      if (value && typeof Notification !== 'undefined' && Notification.permission === 'default') {
                        try { await Notification.requestPermission(); } catch {}
                      }
                      saveRestSettings({ notify: value });
                    }} />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800/50">
                    <span className="text-slate-700 dark:text-slate-300">Vibrate</span>
                    <input type="checkbox" checked={restSettings.vibrate} onChange={(e) => saveRestSettings({ vibrate: e.target.checked })} />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800/50">
                    <span className="text-slate-700 dark:text-slate-300">Auto repeat</span>
                    <input type="checkbox" checked={restSettings.autoRepeat} onChange={(e) => saveRestSettings({ autoRepeat: e.target.checked })} />
                  </label>
                </div>
                <label className="mt-3 block text-xs text-slate-600 dark:text-slate-300">
                  <span className="mb-1 block">Overlay dim</span>
                  <input type="range" min="0" max="0.9" step="0.01" value={restSettings.dim} onChange={(e) => saveRestSettings({ dim: Number(e.target.value) })} className="w-full" />
                </label>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {restSettings.presets.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/70 px-2 py-2 text-xs dark:border-slate-700/60 dark:bg-slate-800/50">
                      <span>Preset {idx+1}</span>
                      <input
                        type="number"
                        min="1"
                        className="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                        value={p}
                        onChange={(e) => {
                          const v = Math.max(1, Math.floor(Number(e.target.value)||0));
                          const next = [...restSettings.presets];
                          next[idx] = v;
                          saveRestSettings({ presets: next });
                        }}
                      />
                      <span>min</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-xs text-slate-600 dark:text-slate-300">Default</label>
                  <input type="number" min="1" className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" value={restSettings.defaultDuration}
                    onChange={(e) => saveRestSettings({ defaultDuration: Math.max(1, Math.floor(Number(e.target.value)||0)) })}
                  />
                  <button type="button" className="rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-sky-300 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:border-sky-500/50" onClick={() => startRest(restSettings.defaultDuration)}>
                    Start Default
                  </button>
                  <span className="ml-auto text-[0.7rem] text-slate-500 dark:text-slate-400">Shows full-screen overlay until time is up.</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-xs text-slate-600 dark:text-slate-300">Custom</label>
                  <input id="cc-rest-custom" type="number" min="1" placeholder="min" className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" />
                  <button type="button" className="rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-sky-300 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:border-sky-500/50" onClick={() => {
                    const el = document.getElementById('cc-rest-custom');
                    const v = Math.max(1, Math.floor(Number(el?.value)||0));
                    if (v) startRest(v);
                  }}>
                    Start
                  </button>
                </div>
              </Tile>

              <Tile
                icon={<HiOutlineClock className="h-5 w-5" />}
                label="Recents"
                sublabel={dock.showRecents ? 'Visible' : 'Hidden'}
                active={dock.showRecents}
                onClick={() => setExpanded((e) => (e === 'recents' ? null : 'recents'))}
                expanded={expanded === 'recents'}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">Show recent items</span>
                  <input type="checkbox" checked={dock.showRecents} onChange={(e) => saveDock({ showRecents: e.target.checked })} />
                </div>
                <div className="mt-2 text-[0.7rem] text-slate-500 dark:text-slate-400">Tracks up to the last 6 places you’ve opened.</div>
              </Tile>

              <button
                type="button"
                className="col-span-2 flex items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:border-sky-500/60"
                onClick={() => onOpenCommandMenu?.()}
              >
                <AiOutlineSearch className="h-4 w-4" /> Open Command Menu
              </button>
            </div>
          </Panel>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
