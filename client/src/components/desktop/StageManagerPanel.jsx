import PropTypes from 'prop-types';
import {
    HiMiniStar,
    HiOutlineCheckCircle,
    HiOutlinePencilSquare,
    HiOutlinePlus,
    HiOutlineQuestionMarkCircle,
    HiOutlineShieldCheck,
    HiOutlineSparkles,
    HiOutlineSquare2Stack,
    HiOutlineSquares2X2,
    HiOutlineViewColumns,
    HiOutlineXMark,
} from 'react-icons/hi2';

function StageMetric({ label, value }) {
    return (
        <div className="rounded-2xl border border-white/45 bg-white/70 p-3 text-center shadow-sm dark:border-white/10 dark:bg-slate-900/55">
            <p className="text-[0.55rem] uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-700 dark:text-slate-100">{value}</p>
        </div>
    );
}

StageMetric.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

function StageSceneCard({
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
                                            className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.32em] text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
                                        >
                                            <HiOutlineSquares2X2 className="h-3.5 w-3.5 text-brand-500/80 dark:text-brand-300/80" />
                                            {title}
                                        </span>
                                    ))
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.32em] text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
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

export default function StageManagerPanel({
    stageManagerEnabled,
    pinnedStageGroupSummary,
    stageManagerInsights,
    onShowControlHints,
    onToggleStageManager,
    onOpenMissionControl,
    focusMode,
    onToggleFocusMode,
    activeStageGroup,
    activeUtilityCount,
    pinnedStageGroupId,
    onPinStageGroup,
    stageShelfEntries,
    editingStageGroupId,
    editingStageGroupLabel,
    onStageGroupLabelChange,
    onCommitRename,
    onCancelRename,
    onStartRename,
    onActivateStageGroup,
    stagePreviewAccent,
    onDuplicateStageGroup,
    onDeleteStageGroup,
    onSaveStageGroup,
    stageEntries,
    onStageEntrySelect,
    stageEntryStatusLabel,
    renderWindowIcon,
    hotCorners,
    onHotCornerToggle,
    hotCornerKeys,
    hotCornerSymbols,
    hotCornerActionLabel,
    formatHotCornerName,
    hasMinimisedWindows,
    minimisedWindowSummary,
    layoutOptions,
    activeLayoutMode,
    hasCustomLayout,
    onChangeLayoutMode,
    onApplyLayout,
    onResetLayout,
}) {
    const metrics = [
        { label: 'Scenes', value: stageManagerInsights.totalScenes },
        { label: 'Custom', value: stageManagerInsights.customScenes },
        { label: 'Utilities', value: stageManagerInsights.uniqueUtilities },
    ];

    return (
        <div className="pointer-events-auto fixed left-6 top-[132px] z-[46] hidden xl:flex w-[21.5rem] flex-col gap-4 rounded-[32px] border border-white/40 bg-white/35 p-5 shadow-[0_42px_120px_-50px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40">
            <div className="rounded-3xl border border-white/35 bg-gradient-to-br from-white/80 via-white/65 to-white/55 p-4 shadow-inner dark:border-white/10 dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-900/55">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">Stage Manager</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.32em] transition ${
                                    stageManagerEnabled
                                        ? 'border-brand-300/60 bg-brand-100/80 text-brand-700 dark:border-brand-400/60 dark:bg-brand-500/20 dark:text-brand-200'
                                        : 'border-slate-300/70 bg-white/60 text-slate-500 dark:border-white/15 dark:bg-slate-900/55 dark:text-slate-400'
                                }`}
                            >
                                <span className={`inline-flex h-2 w-2 rounded-full ${stageManagerEnabled ? 'bg-brand-500' : 'bg-slate-400 dark:bg-slate-500'}`} />
                                {stageManagerEnabled ? 'Active' : 'Paused'}
                            </span>
                            {pinnedStageGroupSummary ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/45 bg-white/70 px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.32em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300">
                                    <HiMiniStar className="h-3.5 w-3.5 text-amber-500 dark:text-amber-300" />
                                    Pinned · {pinnedStageGroupSummary.label}
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <button
                            type="button"
                            onClick={onShowControlHints}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-white/60 text-slate-500 transition hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/15 dark:bg-slate-900/55 dark:text-slate-300 dark:hover:text-brand-200"
                            aria-label="Show window control tips"
                        >
                            <HiOutlineQuestionMarkCircle className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onToggleStageManager}
                            aria-pressed={stageManagerEnabled}
                            className="inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-white/70 px-3.5 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-slate-600 transition hover:border-brand-300/60 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-brand-400/50 dark:bg-slate-900/55 dark:text-slate-200 dark:hover:border-brand-400/70 dark:hover:text-brand-200"
                        >
                            <HiOutlineViewColumns className="h-4 w-4" />
                            {stageManagerEnabled ? 'Pause Sets' : 'Enable Sets'}
                        </button>
                    </div>
                </div>
                <p className="mt-4 text-[0.7rem] leading-relaxed text-slate-500 dark:text-slate-400">
                    Curate workspaces that travel with you. Enable Stage Manager to keep utilities anchored to every scene while you multitask.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                    {metrics.map((metric) => (
                        <StageMetric key={metric.label} label={metric.label} value={metric.value} />
                    ))}
                </div>
                {layoutOptions.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-white/35 bg-white/65 p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/55">
                        <div className="flex items-center justify-between">
                            <p className="text-[0.58rem] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                                Layout preset
                            </p>
                            <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.5rem] uppercase tracking-[0.28em] ${
                                    hasCustomLayout
                                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200'
                                        : 'bg-white/60 text-slate-400 dark:bg-slate-900/55 dark:text-slate-400'
                                }`}
                            >
                                <HiOutlineSparkles className="h-3 w-3" />
                                {hasCustomLayout ? 'Custom memory' : 'Preset'}
                            </span>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            {layoutOptions.map((option) => {
                                const Icon = option.icon || HiOutlineSquares2X2;
                                const isActive = option.id === activeLayoutMode;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => onChangeLayoutMode(option.id)}
                                        className={`flex flex-col gap-2 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 ${
                                            isActive
                                                ? 'border-brand-300/70 bg-brand-50/70 text-brand-700 dark:border-brand-400/60 dark:bg-brand-500/15 dark:text-brand-200'
                                                : 'border-white/40 bg-white/70 text-slate-500 hover:border-brand-200/60 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300'
                                        }`}
                                        aria-pressed={isActive}
                                    >
                                        <div className="flex items-center justify-between text-[0.6rem] uppercase tracking-[0.28em]">
                                            <span className="inline-flex items-center gap-1">
                                                <Icon className="h-4 w-4" />
                                                {option.label}
                                            </span>
                                            {isActive ? (
                                                <HiOutlineCheckCircle className="h-3.5 w-3.5 text-brand-500 dark:text-brand-300" />
                                            ) : null}
                                        </div>
                                        <p className="text-[0.62rem] leading-relaxed tracking-normal text-slate-500 dark:text-slate-400">
                                            {option.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={onApplyLayout}
                                className="inline-flex items-center gap-2 rounded-full border border-brand-300/60 bg-white/70 px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-brand-600 transition hover:border-brand-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-brand-400/50 dark:bg-slate-900/55 dark:text-brand-200"
                            >
                                Reapply
                            </button>
                            <button
                                type="button"
                                onClick={onResetLayout}
                                disabled={!hasCustomLayout}
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.28em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 ${
                                    hasCustomLayout
                                        ? 'border-white/40 bg-white/70 text-slate-500 hover:border-rose-200/60 hover:text-rose-500 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300'
                                        : 'border-white/30 bg-white/50 text-slate-400 opacity-70 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-500'
                                }`}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={onOpenMissionControl}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 bg-white/65 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-brand-300/60 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-200 dark:hover:border-brand-400/60"
                    >
                        Mission Control
                    </button>
                    <button
                        type="button"
                        onClick={onToggleFocusMode}
                        className={`inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 ${
                            focusMode
                                ? 'border-brand-300 bg-brand-100 text-brand-600 dark:border-brand-400/60 dark:bg-brand-500/20 dark:text-brand-200'
                                : 'border-white/35 bg-white/65 text-slate-600 hover:border-brand-300/60 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-200'
                        }`}
                    >
                        {focusMode ? 'Exit Focus' : 'Focus Main'}
                    </button>
                </div>
            </div>
            <div className="rounded-3xl border border-white/35 bg-white/55 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/55">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                        <p className="text-[0.62rem] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Active Scene</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-100">
                            {activeStageGroup ? activeStageGroup.label : 'No scene selected'}
                        </p>
                        <p className="mt-2 text-[0.7rem] leading-relaxed text-slate-500 dark:text-slate-400">
                            {stageManagerEnabled
                                ? activeStageGroup
                                    ? `Showing ${activeStageGroup.windowTypes.length} window${activeStageGroup.windowTypes.length === 1 ? '' : 's'} with ${activeUtilityCount} utilit${activeUtilityCount === 1 ? 'y' : 'ies'} staged alongside the workspace.`
                                    : 'Choose a scene to stage companion tools alongside the workspace.'
                                : 'Disabled — windows remain wherever you leave them.'}
                        </p>
                    </div>
                    {activeStageGroup ? (
                        <button
                            type="button"
                            onClick={() => onPinStageGroup(activeStageGroup.id)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.28em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 ${
                                pinnedStageGroupId === activeStageGroup.id
                                    ? 'border-amber-300/70 bg-amber-100 text-amber-700 dark:border-amber-400/60 dark:bg-amber-500/20 dark:text-amber-200'
                                    : 'border-white/35 bg-white/65 text-slate-500 hover:border-brand-300/60 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300'
                            }`}
                        >
                            <HiMiniStar className="h-3.5 w-3.5" />
                            {pinnedStageGroupId === activeStageGroup.id ? 'Pinned' : 'Pin Scene'}
                        </button>
                    ) : null}
                </div>
            </div>
            <div className="flex flex-col gap-3">
                {stageShelfEntries.length > 0 ? (
                    stageShelfEntries.map((entry) => (
                        <StageSceneCard
                            key={entry.id}
                            entry={entry}
                            isEditing={editingStageGroupId === entry.id}
                            editingLabel={editingStageGroupLabel}
                            onLabelChange={onStageGroupLabelChange}
                            onCommitRename={onCommitRename}
                            onCancelRename={onCancelRename}
                            onStartRename={onStartRename}
                            onActivate={onActivateStageGroup}
                            onPin={onPinStageGroup}
                            onDuplicate={onDuplicateStageGroup}
                            onDelete={onDeleteStageGroup}
                            stagePreviewAccent={stagePreviewAccent}
                        />
                    ))
                ) : (
                    <p className="rounded-2xl border border-dashed border-white/45 bg-white/55 px-3 py-4 text-center text-[0.68rem] uppercase tracking-[0.28em] text-slate-400 dark:border-white/10 dark:bg-slate-900/45 dark:text-slate-500">
                        No stage sets saved yet
                    </p>
                )}
            </div>
            <button
                type="button"
                onClick={onSaveStageGroup}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-300 bg-white/45 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-600 transition hover:border-brand-400 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-brand-400/40 dark:bg-slate-900/45 dark:text-brand-300"
            >
                <HiOutlinePlus className="h-4 w-4" />
                Save Current Layout
            </button>
            <div className="rounded-3xl border border-white/35 bg-white/55 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/55">
                <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Window Shelf</p>
                <div className="mt-3 flex flex-col gap-2">
                    {stageEntries.map((entry) => (
                        <button
                            key={entry.type}
                            type="button"
                            onClick={() => onStageEntrySelect(entry)}
                            className={`group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-left text-sm transition hover:border-brand-200/60 hover:bg-white/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:hover:border-brand-400/40 dark:hover:bg-slate-900/60 ${
                                entry.status === 'open'
                                    ? 'border-brand-200/60 bg-white/70 shadow-sm dark:border-brand-400/40 dark:bg-slate-900/60'
                                    : entry.status === 'staged'
                                    ? 'border-dashed border-brand-200/60 bg-white/50 dark:border-brand-400/40 dark:bg-slate-900/50'
                                    : 'border-white/25 bg-white/45 dark:border-white/10 dark:bg-slate-900/50'
                            }`}
                        >
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/25 to-brand-600/35 text-brand-600 shadow-inner dark:text-brand-300">
                                {renderWindowIcon(entry.type)}
                            </span>
                            <span className="flex-1">
                                <span className="block text-slate-600 dark:text-slate-200">{entry.title}</span>
                                <span className="text-[0.62rem] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                                    {stageEntryStatusLabel(entry.status)}
                                </span>
                            </span>
                            <span className="text-[0.55rem] uppercase tracking-[0.3em] text-brand-500 opacity-0 transition group-hover:opacity-100 dark:text-brand-300">
                                Add
                            </span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="rounded-3xl border border-white/35 bg-white/55 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/55">
                <div className="flex items-center justify-between">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                        Hot Corners
                    </p>
                    <button
                        type="button"
                        onClick={onHotCornerToggle}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.32em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 ${
                            hotCorners.enabled
                                ? 'border-brand-200/70 bg-brand-100 text-brand-600 dark:border-brand-400/60 dark:bg-brand-500/20 dark:text-brand-200'
                                : 'border-white/40 bg-white/60 text-slate-500 hover:border-brand-200/60 hover:text-brand-600 dark:border-white/15 dark:bg-slate-900/55 dark:text-slate-300'
                        }`}
                    >
                        {hotCorners.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-[0.58rem] uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                    {hotCornerKeys.map((key) => (
                        <div
                            key={key}
                            className="rounded-xl border border-white/30 bg-white/60 px-3 py-2 text-slate-500 shadow-inner dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300"
                        >
                            <dt className="text-[0.55rem] uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
                                {hotCornerSymbols[key]} {formatHotCornerName(key)}
                            </dt>
                            <dd className="mt-1 text-[0.75rem] font-semibold normal-case tracking-[0.05em] text-slate-600 dark:text-slate-200">
                                {hotCornerActionLabel(hotCorners.corners?.[key])}
                            </dd>
                        </div>
                    ))}
                </dl>
                <p className="mt-3 text-[0.6rem] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                    Flick the cursor into a corner to trigger quick actions.
                </p>
            </div>
            {hasMinimisedWindows ? (
                <div className="rounded-3xl border border-dashed border-slate-300/70 bg-white/50 p-3 text-xs text-slate-500 dark:border-slate-600/60 dark:bg-slate-900/45 dark:text-slate-300">
                    Manual minimizes: {minimisedWindowSummary}
                </div>
            ) : null}
        </div>
    );
}

StageManagerPanel.propTypes = {
    stageManagerEnabled: PropTypes.bool.isRequired,
    pinnedStageGroupSummary: PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
    }),
    stageManagerInsights: PropTypes.shape({
        totalScenes: PropTypes.number.isRequired,
        customScenes: PropTypes.number.isRequired,
        uniqueUtilities: PropTypes.number.isRequired,
    }).isRequired,
    onShowControlHints: PropTypes.func.isRequired,
    onToggleStageManager: PropTypes.func.isRequired,
    onOpenMissionControl: PropTypes.func.isRequired,
    focusMode: PropTypes.bool.isRequired,
    onToggleFocusMode: PropTypes.func.isRequired,
    activeStageGroup: PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        windowTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
    }),
    activeUtilityCount: PropTypes.number.isRequired,
    pinnedStageGroupId: PropTypes.string,
    onPinStageGroup: PropTypes.func.isRequired,
    stageShelfEntries: PropTypes.arrayOf(
        PropTypes.shape({
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
        })
    ).isRequired,
    editingStageGroupId: PropTypes.string,
    editingStageGroupLabel: PropTypes.string.isRequired,
    onStageGroupLabelChange: PropTypes.func.isRequired,
    onCommitRename: PropTypes.func.isRequired,
    onCancelRename: PropTypes.func.isRequired,
    onStartRename: PropTypes.func.isRequired,
    onActivateStageGroup: PropTypes.func.isRequired,
    stagePreviewAccent: PropTypes.func.isRequired,
    onDuplicateStageGroup: PropTypes.func.isRequired,
    onDeleteStageGroup: PropTypes.func.isRequired,
    onSaveStageGroup: PropTypes.func.isRequired,
    stageEntries: PropTypes.arrayOf(
        PropTypes.shape({
            type: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            status: PropTypes.string.isRequired,
        })
    ).isRequired,
    onStageEntrySelect: PropTypes.func.isRequired,
    stageEntryStatusLabel: PropTypes.func.isRequired,
    renderWindowIcon: PropTypes.func.isRequired,
    hotCorners: PropTypes.shape({
        enabled: PropTypes.bool.isRequired,
        corners: PropTypes.object.isRequired,
    }).isRequired,
    onHotCornerToggle: PropTypes.func.isRequired,
    hotCornerKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
    hotCornerSymbols: PropTypes.object.isRequired,
    hotCornerActionLabel: PropTypes.func.isRequired,
    formatHotCornerName: PropTypes.func.isRequired,
    hasMinimisedWindows: PropTypes.bool.isRequired,
    minimisedWindowSummary: PropTypes.string.isRequired,
    layoutOptions: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            icon: PropTypes.elementType,
        })
    ).isRequired,
    activeLayoutMode: PropTypes.string.isRequired,
    hasCustomLayout: PropTypes.bool.isRequired,
    onChangeLayoutMode: PropTypes.func.isRequired,
    onApplyLayout: PropTypes.func.isRequired,
    onResetLayout: PropTypes.func.isRequired,
};

StageManagerPanel.defaultProps = {
    pinnedStageGroupSummary: null,
    activeStageGroup: null,
    editingStageGroupId: null,
    pinnedStageGroupId: null,
};
