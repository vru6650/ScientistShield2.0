import { useEffect, useMemo, useRef, useState } from 'react';
import { HiOutlineAdjustmentsHorizontal, HiOutlineXMark } from 'react-icons/hi2';

const themeOptions = [
    { id: 'auto', label: 'Auto', swatch: 'bg-gradient-to-r from-slate-200 via-white to-slate-200', description: 'Follow site theme' },
    { id: 'day', label: 'Day', swatch: 'bg-white border border-slate-200', description: 'Bright background' },
    { id: 'sepia', label: 'Sepia', swatch: 'bg-[#f7f2e7] border border-[#e0d3b8]', description: 'Warm sepia tone' },
    { id: 'night', label: 'Night', swatch: 'bg-slate-900 border border-slate-700', description: 'Low-light mode' },
];

const fontOptions = [
    { id: 'serif', label: 'Serif' },
    { id: 'sans', label: 'Sans' },
    { id: 'mono', label: 'Mono' },
];

const widthOptions = [
    { id: 'cozy', label: 'Cozy' },
    { id: 'comfortable', label: 'Comfort' },
    { id: 'spacious', label: 'Wide' },
];

const alignmentOptions = [
    { id: 'left', label: 'Left' },
    { id: 'justify', label: 'Justify' },
];

const themePreviewClassMap = {
    auto: 'bg-white/90 text-slate-800 border-slate-200/70 dark:bg-slate-900/80 dark:text-slate-100 dark:border-slate-700/70',
    day: 'bg-white text-slate-900 border-slate-200',
    sepia: 'bg-[#f7f2e7] text-[#5b4636] border-[#d6c5aa]',
    night: 'bg-slate-900 text-slate-100 border-slate-700',
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function ReadingControlCenter({ settings, onChange, onReset }) {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef(null);
    const triggerRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickAway = (event) => {
            const panelEl = panelRef.current;
            const triggerEl = triggerRef.current;
            if (!panelEl) return;
            if (panelEl.contains(event.target)) return;
            if (triggerEl && triggerEl.contains(event.target)) return;
            setIsOpen(false);
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickAway);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickAway);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const fontPreviewText = useMemo(() => {
        switch (settings.fontFamily) {
            case 'sans':
                return 'Inter, system';
            case 'mono':
                return 'Fira Code';
            case 'serif':
            default:
                return 'Merriweather';
        }
    }, [settings.fontFamily]);

    const previewStyles = useMemo(() => ({
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        letterSpacing: `${settings.letterSpacing}em`,
        wordSpacing: `${settings.wordSpacing}em`,
        textAlign: settings.textAlign,
        '--paragraph-spacing': `${settings.paragraphSpacing}em`,
        fontFamily:
            settings.fontFamily === 'mono'
                ? "'Fira Code', monospace"
                : settings.fontFamily === 'sans'
                    ? "'Inter', sans-serif"
                    : "'Merriweather', serif",
    }), [
        settings.fontSize,
        settings.lineHeight,
        settings.letterSpacing,
        settings.wordSpacing,
        settings.textAlign,
        settings.paragraphSpacing,
        settings.fontFamily,
    ]);

    const previewThemeClass = useMemo(() => {
        if (settings.theme === 'auto') {
            return themePreviewClassMap.auto;
        }
        return themePreviewClassMap[settings.theme] || themePreviewClassMap.auto;
    }, [settings.theme]);

    const handleFontSizeChange = (direction) => {
        const next = direction === 'increase' ? settings.fontSize + 1 : settings.fontSize - 1;
        onChange('fontSize', clamp(next, 14, 26));
    };

    const handleLineHeightChange = (event) => {
        const value = Number(event.target.value);
        onChange('lineHeight', clamp(Number(value.toFixed(2)), 1.2, 2.4));
    };

    const handleLetterSpacingChange = (event) => {
        const value = Number(event.target.value);
        onChange('letterSpacing', clamp(Number(value.toFixed(2)), -0.05, 0.1));
    };

    const handleWordSpacingChange = (event) => {
        const value = Number(event.target.value);
        onChange('wordSpacing', clamp(Number(value.toFixed(2)), 0, 0.5));
    };

    const handleParagraphSpacingChange = (event) => {
        const value = Number(event.target.value);
        onChange('paragraphSpacing', clamp(Number(value.toFixed(2)), 0.5, 2));
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            <button
                type="button"
                ref={triggerRef}
                aria-expanded={isOpen}
                aria-controls="reading-control-panel"
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-2 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 shadow-lg shadow-slate-900/20 dark:shadow-slate-900/40 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
                <HiOutlineAdjustmentsHorizontal className="h-5 w-5" />
                <span className="font-semibold text-sm">Reading Controls</span>
            </button>

            {isOpen && (
                <div
                    id="reading-control-panel"
                    ref={panelRef}
                    role="dialog"
                    aria-label="Reading Control Center"
                    className="w-80 max-w-sm rounded-3xl border border-slate-200 bg-white/90 p-5 text-slate-800 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100"
                >
                    <div className="mb-4 flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Reading Control Center</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Tune typography and colors without leaving the page.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="rounded-full p-1 text-slate-500 transition hover:bg-slate-200/60 hover:text-slate-900 dark:hover:bg-slate-700/60"
                        >
                            <HiOutlineXMark className="h-5 w-5" />
                        </button>
                    </div>

                    <div
                        className={`mb-6 rounded-2xl border p-4 text-xs shadow-inner transition-colors ${previewThemeClass}`}
                        style={previewStyles}
                    >
                        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500/70 dark:text-slate-400/80">Live preview</p>
                        <p className="mt-2 text-sm leading-relaxed">
                            The quick brown fox jumps over the lazy dog. Adjust controls to see typography updates instantly.
                        </p>
                        <p className="mt-2 text-[0.8rem] text-slate-500 dark:text-slate-300">
                            {settings.lineHeight.toFixed(1)}× line height · {settings.paragraphSpacing.toFixed(2)}em spacing · {settings.fontSize}px type
                        </p>
                    </div>

                    <section className="space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Theme</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {themeOptions.map(option => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => onChange('theme', option.id)}
                                    className={`flex flex-col rounded-2xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                                        settings.theme === option.id
                                            ? 'border-sky-400/80 bg-sky-50/70 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200'
                                            : 'border-slate-200/80 hover:border-sky-300/80 dark:border-slate-700/80 dark:hover:border-sky-500/70'
                                    }`}
                                >
                                    <span className={`h-6 w-12 rounded-full ${option.swatch} mb-2`}></span>
                                    <span className="text-sm font-medium">{option.label}</span>
                                    <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">{option.description}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="mt-6 space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Font size</h4>
                        <div className="flex items-center justify-between rounded-2xl bg-slate-100/70 p-2 dark:bg-slate-800/60">
                            <button
                                type="button"
                                onClick={() => handleFontSizeChange('decrease')}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm transition hover:scale-105 disabled:opacity-50 dark:bg-slate-900"
                                disabled={settings.fontSize <= 14}
                            >
                                <span className="text-lg font-semibold">A-</span>
                            </button>
                            <div className="text-center">
                                <p className="text-xs uppercase text-slate-500">Current</p>
                                <p className="text-lg font-semibold">{settings.fontSize}px</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleFontSizeChange('increase')}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm transition hover:scale-105 disabled:opacity-50 dark:bg-slate-900"
                                disabled={settings.fontSize >= 26}
                            >
                                <span className="text-lg font-semibold">A+</span>
                            </button>
                        </div>
                    </section>

                    <section className="mt-6 space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Font family</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {fontOptions.map(option => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => onChange('fontFamily', option.id)}
                                    className={`rounded-2xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                                        settings.fontFamily === option.id
                                            ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200'
                                            : 'border-slate-200 hover:border-sky-300 dark:border-slate-700 dark:hover:border-sky-500'
                                    }`}
                                    style={{ fontFamily: option.id === 'mono' ? 'monospace' : option.id === 'sans' ? 'Inter, sans-serif' : 'Georgia, serif' }}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Previewing as <span className="font-medium text-slate-700 dark:text-slate-200">{fontPreviewText}</span></p>
                    </section>

                    <section className="mt-6 space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Line height</h4>
                        <div>
                            <input
                                type="range"
                                min="1.2"
                                max="2.4"
                                step="0.1"
                                value={settings.lineHeight}
                                onChange={handleLineHeightChange}
                                className="w-full accent-sky-500"
                            />
                            <p className="mt-1 text-right text-xs text-slate-500">{settings.lineHeight.toFixed(1)}x</p>
                        </div>
                    </section>

                    <section className="mt-6 space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Letter spacing</h4>
                        <div>
                            <input
                                type="range"
                                min="-0.05"
                                max="0.1"
                                step="0.01"
                                value={settings.letterSpacing}
                                onChange={handleLetterSpacingChange}
                                className="w-full accent-sky-500"
                            />
                            <p className="mt-1 text-right text-xs text-slate-500">{settings.letterSpacing.toFixed(2)}em</p>
                        </div>
                    </section>

                    <section className="mt-6 space-y-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Spacing</h4>
                        <div>
                            <div className="mb-1 flex items-center justify-between text-[0.7rem] uppercase tracking-wide text-slate-400">
                                <span>Paragraph</span>
                                <span>{settings.paragraphSpacing.toFixed(2)}em</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.05"
                                value={settings.paragraphSpacing}
                                onChange={handleParagraphSpacingChange}
                                className="w-full accent-sky-500"
                            />
                        </div>
                        <div>
                            <div className="mb-1 flex items-center justify-between text-[0.7rem] uppercase tracking-wide text-slate-400">
                                <span>Word</span>
                                <span>{settings.wordSpacing.toFixed(2)}em</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="0.5"
                                step="0.01"
                                value={settings.wordSpacing}
                                onChange={handleWordSpacingChange}
                                className="w-full accent-sky-500"
                            />
                        </div>
                    </section>

                    <section className="mt-6 space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Layout</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {widthOptions.map(option => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => onChange('pageWidth', option.id)}
                                    className={`rounded-2xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                                        settings.pageWidth === option.id
                                            ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200'
                                            : 'border-slate-200 hover:border-sky-300 dark:border-slate-700 dark:hover:border-sky-500'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {alignmentOptions.map(option => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => onChange('textAlign', option.id)}
                                    className={`rounded-2xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                                        settings.textAlign === option.id
                                            ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200'
                                            : 'border-slate-200 hover:border-sky-300 dark:border-slate-700 dark:hover:border-sky-500'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    <button
                        type="button"
                        onClick={onReset}
                        className="mt-6 w-full rounded-2xl border border-transparent bg-slate-900 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        Reset to defaults
                    </button>
                </div>
            )}
        </div>
    );
}
