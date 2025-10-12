import clsx from 'clsx';

const STATUS_THEMES = {
    active: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-100',
    suspended: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
    returning: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
    base: 'border-violet-500/40 bg-violet-500/10 text-violet-100',
    resolved: 'border-slate-700/60 bg-slate-800/60 text-slate-200',
};

const StackCanvas = ({ step }) => {
    const frames = Array.isArray(step?.stack) ? step.stack : [];
    const currentFrameId = step?.highlights?.currentFrame ?? null;
    const returnValue = step?.highlights?.returnValue ?? null;
    const hasFrames = frames.length > 0;

    return (
        <div className="relative flex h-full w-full flex-col bg-slate-950/70">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-950/60 to-slate-950" />
            <div className="relative z-10 flex flex-1 flex-col justify-end px-6 pb-6 pt-10">
                {hasFrames ? (
                    <div className="flex flex-col-reverse gap-3">
                        {frames.map((frame, index) => {
                            const theme = STATUS_THEMES[frame.status] ?? STATUS_THEMES.resolved;
                            const isActive = currentFrameId && frame.id === currentFrameId;
                            const isTop = index === frames.length - 1;

                            return (
                                <div
                                    key={frame.id}
                                    className={clsx(
                                        'rounded-xl border px-4 py-3 shadow-[0_0_22px_rgba(14,165,233,0.12)] transition',
                                        theme,
                                        isActive ? 'ring-2 ring-cyan-400/70 ring-offset-2 ring-offset-slate-950/70' : '',
                                    )}
                                >
                                    <div className="flex items-center justify-between text-xs uppercase tracking-widest">
                                        <span className="text-slate-300">Frame #{frame.depth}</span>
                                        <span className="font-semibold text-slate-200">{frame.label}</span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-200">
                                        <span className="font-mono text-slate-300">n = {frame.value}</span>
                                        {frame.result !== null ? (
                                            <span className="font-mono text-emerald-200">result = {frame.result}</span>
                                        ) : null}
                                        <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/80">
                                            {frame.status}
                                        </span>
                                        {isTop && returnValue !== null ? (
                                            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-200">
                                                return {returnValue}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Call stack empty — recursion has fully unwound.
                    </div>
                )}
            </div>
            {step?.message ? (
                <div className="relative z-10 border-t border-slate-800/70 bg-slate-950/70 px-6 py-3 text-sm text-cyan-200">
                    {step.message}
                </div>
            ) : null}
        </div>
    );
};

export default StackCanvas;
