import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';
import { HiMiniStar, HiOutlinePlus, HiOutlineSquares2X2 } from 'react-icons/hi2';

function StageShelfEntry({
    entry,
    expanded,
    onActivate,
    onTogglePin,
    stagePreviewAccent,
    dropState,
    draggingWindowLabel,
}) {
    const handleActivate = useCallback(() => {
        onActivate(entry.id);
    }, [entry.id, onActivate]);

    const handleTogglePin = useCallback(
        (event) => {
            event.preventDefault();
            event.stopPropagation();
            onTogglePin(entry.id);
        },
        [entry.id, onTogglePin]
    );

    const dropReady = dropState === 'ready';
    const dropBlocked = dropState && dropState !== 'ready';
    const dropLabel =
        dropState === 'ready'
            ? `Drop ${draggingWindowLabel || 'window'}`
            : dropState === 'locked'
                ? 'Locked scene'
                : dropState === 'duplicate'
                    ? 'Already staged'
                    : null;

    const dropClasses = dropReady
        ? 'ring-2 ring-brand-300/70 dark:ring-brand-400/60'
        : dropBlocked
            ? 'ring-2 ring-rose-300/60 dark:ring-rose-400/60'
            : '';

    const containerClasses = entry.isActive
        ? 'border-brand-300/70 bg-white/80 shadow-[0_24px_65px_-34px_rgba(10,132,255,0.55)] dark:border-brand-400/50 dark:bg-slate-900/70 dark:shadow-[0_22px_50px_-32px_rgba(10,132,255,0.45)]'
        : 'border-white/35 bg-white/45 hover:border-brand-200/60 hover:bg-white/60 dark:border-white/10 dark:bg-slate-900/55 dark:hover:border-brand-400/40 dark:hover:bg-slate-900/65';

    return (
        <div
            data-stage-entry-id={entry.id}
            className={`group relative flex items-center gap-2 rounded-[28px] border px-2 py-2 transition ${containerClasses} ${dropClasses}`}
        >
            <button
                type="button"
                onClick={handleActivate}
                className="flex flex-1 items-center gap-3 rounded-[24px] px-1.5 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60"
                aria-label={`${entry.label}${entry.isActive ? ' (active)' : ''}`}
            >
                <div className="relative h-14 w-14 flex-none overflow-hidden rounded-[18px] border border-white/40 bg-white/55 shadow-inner dark:border-white/10 dark:bg-slate-900/60">
                    {entry.previewLayout.map((preview) => (
                        <span
                            key={`${entry.id}-${preview.type}-${preview.x}-${preview.y}`}
                            className="absolute rounded-[14px] border border-white/40 shadow-sm dark:border-white/10"
                            style={{
                                left: `${preview.x}%`,
                                top: `${preview.y}%`,
                                width: `${preview.width}%`,
                                height: `${preview.height}%`,
                                background: stagePreviewAccent(preview.type, preview.isPrimary),
                                opacity: preview.isPrimary ? 0.95 : 0.85,
                            }}
                        />
                    ))}
                </div>
                <div
                    className={`min-w-0 flex-1 transition-[opacity,transform] duration-200 ${
                        expanded ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 pointer-events-none'
                    }`}
                    aria-hidden={!expanded}
                >
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{entry.label}</p>
                    <p className="text-[0.58rem] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                        {entry.layoutLabel}
                        {entry.hasCustomLayout ? ' · Custom' : ''}
                    </p>
                    <p className="text-[0.52rem] uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                        {entry.visibleCount} of {entry.windowCount} visible
                    </p>
                </div>
            </button>
            <button
                type="button"
                onClick={handleTogglePin}
                className={`ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full border text-slate-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 ${
                    entry.isPinned
                        ? 'border-amber-300/70 bg-amber-100 text-amber-600 dark:border-amber-400/60 dark:bg-amber-500/20 dark:text-amber-200'
                        : 'border-white/40 bg-white/60 hover:border-brand-200/60 hover:text-brand-500 dark:border-white/15 dark:bg-slate-900/60 dark:hover:border-brand-400/40 dark:hover:text-brand-300'
                } ${expanded ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-3 opacity-0'}`}
                aria-label={entry.isPinned ? 'Unpin scene' : 'Pin scene'}
            >
                <HiMiniStar className="h-4 w-4" />
            </button>
            {dropState ? (
                <span
                    className={`pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.32em] ${
                        dropReady
                            ? 'border-brand-300/70 bg-white/95 text-brand-600 shadow-lg dark:border-brand-400/60 dark:bg-slate-900/90 dark:text-brand-200'
                            : 'border-rose-300/70 bg-white/95 text-rose-600 shadow-lg dark:border-rose-400/60 dark:bg-slate-900/90 dark:text-rose-200'
                    }`}
                >
                    {dropLabel}
                </span>
            ) : null}
        </div>
    );
}

StageShelfEntry.propTypes = {
    entry: PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        isActive: PropTypes.bool.isRequired,
        isPinned: PropTypes.bool.isRequired,
        previewLayout: PropTypes.arrayOf(
            PropTypes.shape({
                type: PropTypes.string.isRequired,
                x: PropTypes.number.isRequired,
                y: PropTypes.number.isRequired,
                width: PropTypes.number.isRequired,
                height: PropTypes.number.isRequired,
                isPrimary: PropTypes.bool.isRequired,
            })
        ).isRequired,
        windowCount: PropTypes.number.isRequired,
        visibleCount: PropTypes.number.isRequired,
    }).isRequired,
    expanded: PropTypes.bool.isRequired,
    onActivate: PropTypes.func.isRequired,
    onTogglePin: PropTypes.func.isRequired,
    stagePreviewAccent: PropTypes.func.isRequired,
    dropState: PropTypes.oneOf(['ready', 'locked', 'duplicate']),
    draggingWindowLabel: PropTypes.string,
};

StageShelfEntry.defaultProps = {
    dropState: null,
    draggingWindowLabel: '',
};

export default function StageShelf({
    entries,
    onActivate,
    onTogglePin,
    stagePreviewAccent,
    draggingWindow,
    draggingWindowLabel,
    stageDropTarget,
    forceExpand,
}) {
    const [expanded, setExpanded] = useState(false);
    const containerRef = useRef(null);
    const hasEntries = entries.length > 0;
    const isExpanded = forceExpand || expanded;
    const dropTargetStageId =
        stageDropTarget && stageDropTarget.kind === 'stage' ? stageDropTarget.stageId : null;

    const handlePointerEnter = useCallback(() => {
        if (!hasEntries) return;
        setExpanded(true);
    }, [hasEntries]);

    const handlePointerLeave = useCallback(() => {
        setExpanded(false);
    }, []);

    const handleFocusCapture = useCallback(() => {
        if (!hasEntries) return;
        setExpanded(true);
    }, [hasEntries]);

    const handleBlurCapture = useCallback((event) => {
        if (!containerRef.current) return;
        if (containerRef.current.contains(event.relatedTarget)) {
            return;
        }
        setExpanded(false);
    }, []);

    if (!hasEntries) {
        return null;
    }

    return (
        <motion.aside
            ref={containerRef}
            className="pointer-events-auto fixed inset-y-0 left-0 z-[57] hidden justify-center lg:flex"
            initial={false}
            animate={{ x: isExpanded ? 0 : -184, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            onMouseEnter={handlePointerEnter}
            onMouseLeave={handlePointerLeave}
            onFocusCapture={handleFocusCapture}
            onBlurCapture={handleBlurCapture}
            aria-label="Stage Manager shelf"
        >
            <div className="relative flex h-[26rem] w-[260px] flex-col justify-center gap-3 px-4 py-6">
                <div
                    className="absolute inset-0 rounded-r-[36px] border border-white/45 bg-white/25 shadow-[0_38px_90px_-45px_rgba(15,23,42,0.4)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/50"
                    aria-hidden="true"
                />
                <div className="relative flex flex-col gap-3">
                    <div
                        className={`flex items-center gap-2 pl-1 text-[0.58rem] uppercase tracking-[0.32em] text-slate-500 transition-opacity duration-200 ${
                            isExpanded ? 'opacity-100' : 'pointer-events-none opacity-0'
                        }`}
                    >
                        <HiOutlineSquares2X2 className="h-4 w-4 text-brand-500 dark:text-brand-300" />
                        Stage Sets
                    </div>
                    {entries.map((entry) => (
                        <StageShelfEntry
                            key={entry.id}
                            entry={entry}
                            expanded={isExpanded}
                            onActivate={onActivate}
                            onTogglePin={onTogglePin}
                            stagePreviewAccent={stagePreviewAccent}
                            dropState={
                                dropTargetStageId === entry.id
                                    ? stageDropTarget?.reason || null
                                    : null
                            }
                            draggingWindowLabel={draggingWindowLabel}
                        />
                    ))}
                    {draggingWindow && !draggingWindow.isMain ? (
                        <div
                            data-stage-drop-new="true"
                            className={`mt-1 flex items-center gap-2 rounded-[24px] border border-dashed px-3 py-2 text-[0.58rem] uppercase tracking-[0.3em] transition ${
                                stageDropTarget?.kind === 'new'
                                    ? 'border-brand-300/70 bg-white/80 text-brand-600 dark:border-brand-400/60 dark:bg-slate-900/70 dark:text-brand-200'
                                    : 'border-white/35 bg-white/45 text-slate-500 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300'
                            }`}
                        >
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-200">
                                <HiOutlinePlus className="h-4 w-4" />
                            </span>
                            Drop to create new scene
                        </div>
                    ) : null}
                </div>
            </div>
        </motion.aside>
    );
}

StageShelf.propTypes = {
    entries: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            isActive: PropTypes.bool.isRequired,
            isPinned: PropTypes.bool.isRequired,
            previewLayout: PropTypes.arrayOf(
                PropTypes.shape({
                    type: PropTypes.string.isRequired,
                    x: PropTypes.number.isRequired,
                    y: PropTypes.number.isRequired,
                    width: PropTypes.number.isRequired,
                    height: PropTypes.number.isRequired,
                    isPrimary: PropTypes.bool.isRequired,
                })
            ).isRequired,
        windowCount: PropTypes.number.isRequired,
        visibleCount: PropTypes.number.isRequired,
        layoutLabel: PropTypes.string.isRequired,
        hasCustomLayout: PropTypes.bool.isRequired,
    })
).isRequired,
    onActivate: PropTypes.func.isRequired,
    onTogglePin: PropTypes.func.isRequired,
    stagePreviewAccent: PropTypes.func.isRequired,
    draggingWindow: PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        title: PropTypes.string,
        isMain: PropTypes.bool,
    }),
    draggingWindowLabel: PropTypes.string,
    stageDropTarget: PropTypes.shape({
        kind: PropTypes.oneOf(['stage', 'new']).isRequired,
        stageId: PropTypes.string,
        reason: PropTypes.string,
    }),
    forceExpand: PropTypes.bool,
};

StageShelf.defaultProps = {
    draggingWindow: null,
    draggingWindowLabel: '',
    stageDropTarget: null,
    forceExpand: false,
};
