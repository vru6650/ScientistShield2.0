import PropTypes from 'prop-types';
import {
    HiMiniStar,
    HiOutlinePencilSquare,
    HiOutlineShieldCheck,
    HiOutlineSparkles,
    HiOutlineSquare2Stack,
    HiOutlineSquares2X2,
    HiOutlineXMark,
} from 'react-icons/hi2';

export default function StageSceneCard({
    entry,
    isEditing,
    editingLabel,
    onLabelChange,
    onCommitRename,
    onCancelRename,
    onStartRename,
    onActivate,
    onPin,
    onDuplicate,
    onDelete,
    stagePreviewAccent,
}) {
    if (!entry) {
        return null;
    }

    return (
        <div
            className={`rounded-3xl border p-4 transition shadow-sm ${
                entry.isActive
                    ? 'border-brand-200/60 bg-white/80 shadow-[0_26px_80px_-50px_rgba(14,116,244,0.45)] dark:border-brand-400/40 dark:bg-slate-900/65'
                    : 'border-white/35 bg-white/55 hover:border-brand-200/60 hover:bg-white/70 dark:border-white/10 dark:bg-slate-900/55 dark:hover:border-brand-300/40 dark:hover:bg-slate-900/65'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    {isEditing ? (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                onCommitRename();
                            }}
                        >
                            <label className="block text-[0.58rem] uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                                Scene name
                                <input
                                    value={editingLabel}
                                    onChange={onLabelChange}
                                    autoFocus
                                    className="mt-2 w-full rounded-xl border border-brand-200/60 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-inner focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300/50 dark:border-brand-400/40 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:border-brand-400 dark:focus:ring-brand-400/40"
                                    placeholder="Rename scene"
                                />
                            </label>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-brand-100 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-brand-700 transition hover:border-brand-400 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-brand-400/50 dark:bg-brand-500/20 dark:text-brand-200"
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    onClick={onCancelRename}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/70 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-slate-500 transition hover:border-slate-300/70 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{entry.label}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {entry.titles.length > 0 ? (
                                    entry.titles.map((title) => (
                                        <span
                                            key={`${entry.id}-${title}`}
                                            className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.32em] text-slate-500 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300"
                                        >
                                            <HiOutlineSquares2X2 className="h-3.5 w-3.5 text-brand-500/80 dark:text-brand-300/80" />
                                            {title}
                                        </span>
                                    ))
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.32em] text-slate-500 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300">
                                        <HiOutlineSquares2X2 className="h-3.5 w-3.5 text-brand-500/80 dark:text-brand-300/80" />
                                        Primary workspace
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2">
                    {entry.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-brand-200/60 bg-brand-100 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-brand-600 dark:border-brand-400/60 dark:bg-brand-500/20 dark:text-brand-200">
                            <HiOutlineSparkles className="h-3.5 w-3.5" />
                            Active
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onActivate(entry.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/70 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-slate-500 transition hover:border-brand-300/60 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300"
                        >
                            Activate
                        </button>
                    )}
                    {entry.isPinned ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/70 bg-amber-100 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-amber-700 dark:border-amber-400/60 dark:bg-amber-500/20 dark:text-amber-200">
                            <HiMiniStar className="h-3 w-3" />
                            Pinned
                        </span>
                    ) : null}
                </div>
            </div>
            <button
                type="button"
                onClick={() => onActivate(entry.id)}
                className="mt-3 w-full rounded-2xl border border-white/40 bg-white/65 p-2 shadow-inner transition hover:border-brand-300/60 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-brand-400/60 dark:hover:bg-slate-900/70"
                aria-label={`Activate ${entry.label}`}
            >
                <div className="relative h-20 w-full overflow-hidden rounded-[18px] bg-white/70 dark:bg-slate-900/60">
                    {entry.previewLayout.map((preview) => (
                        <span
                            key={`${entry.id}-${preview.type}-${preview.x}`}
                            className="absolute rounded-xl border border-white/40 shadow-lg backdrop-blur-sm dark:border-white/10"
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
            </button>
            <div className="mt-2 flex items-center justify-between text-[0.62rem] uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                <span>Visible {entry.visibleCount}</span>
                <span>Total {entry.windowCount}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => onPin(entry.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.28em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 ${
                        entry.isPinned
                            ? 'border-amber-300/70 bg-amber-100 text-amber-700 dark:border-amber-400/60 dark:bg-amber-500/20 dark:text-amber-200'
                            : 'border-white/40 bg-white/70 text-slate-500 hover:border-brand-300/60 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300'
                    }`}
                >
                    <HiMiniStar className="h-3.5 w-3.5" />
                    {entry.isPinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                    type="button"
                    onClick={() => onDuplicate(entry.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-slate-500 transition hover:border-brand-300/60 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300"
                >
                    <HiOutlineSquare2Stack className="h-4 w-4" />
                    Duplicate
                </button>
                {!entry.locked && !isEditing ? (
                    <button
                        type="button"
                        onClick={() => onStartRename(entry)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-slate-500 transition hover:border-brand-300/60 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300"
                    >
                        <HiOutlinePencilSquare className="h-4 w-4" />
                        Rename
                    </button>
                ) : null}
                {!entry.locked ? (
                    <button
                        type="button"
                        onClick={() => onDelete(entry.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-red-500 transition hover:border-red-300/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200/60 dark:border-white/10 dark:bg-slate-900/55 dark:text-red-300"
                        aria-label={`Remove ${entry.label}`}
                    >
                        <HiOutlineXMark className="h-4 w-4" />
                        Remove
                    </button>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.28em] text-slate-400 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-500">
                        <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                        Locked
                    </span>
                )}
            </div>
        </div>
    );
}

StageSceneCard.propTypes = {
    entry: PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        isActive: PropTypes.bool.isRequired,
        isPinned: PropTypes.bool.isRequired,
        locked: PropTypes.bool.isRequired,
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
        titles: PropTypes.arrayOf(PropTypes.string).isRequired,
    }),
    isEditing: PropTypes.bool.isRequired,
    editingLabel: PropTypes.string.isRequired,
    onLabelChange: PropTypes.func.isRequired,
    onCommitRename: PropTypes.func.isRequired,
    onCancelRename: PropTypes.func.isRequired,
    onStartRename: PropTypes.func.isRequired,
    onActivate: PropTypes.func.isRequired,
    onPin: PropTypes.func.isRequired,
    onDuplicate: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    stagePreviewAccent: PropTypes.func.isRequired,
};

StageSceneCard.defaultProps = {
    entry: null,
};
