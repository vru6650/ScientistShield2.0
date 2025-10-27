import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';
import {
    HiOutlineArrowsPointingOut,
    HiOutlineArrowUpLeft,
    HiOutlineCommandLine,
    HiOutlinePause,
    HiOutlineQuestionMarkCircle,
    HiOutlineSparkles,
    HiOutlineXMark,
} from 'react-icons/hi2';

const CONTROL_ACTIONS = [
    {
        id: 'close',
        title: 'Close',
        description: 'Click the red control or press ⌘W to close the active window.',
        accent: 'from-rose-500 via-orange-400 to-amber-400',
        shortcut: '⌘W',
    },
    {
        id: 'minimize',
        title: 'Minimize',
        description: 'Click the yellow control or press ⌘M to tuck windows into the shelf.',
        accent: 'from-amber-300 via-yellow-300 to-lime-300',
        shortcut: '⌘M',
    },
    {
        id: 'maximize',
        title: 'Zoom',
        description: 'Click the green control or press ⌃⌘F to toggle immersive view.',
        accent: 'from-emerald-400 via-teal-400 to-sky-400',
        shortcut: '⌃⌘F',
    },
];

export default function WindowControlHints({
    visible,
    onDismiss,
    onNeverShow,
    onShowMissionControl,
}) {
    return (
        <AnimatePresence>
            {visible ? (
                <motion.aside
                    key="desktop-control-hints"
                    initial={{ opacity: 0, y: -12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.96 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="pointer-events-auto fixed inset-x-0 top-24 z-[70] flex justify-center px-4"
                    role="dialog"
                    aria-modal="false"
                    aria-label="Window control shortcut guide"
                >
                    <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/60 bg-white/85 px-6 py-5 text-slate-700 shadow-[0_48px_120px_-52px_rgba(14,116,244,0.55)] ring-1 ring-white/60 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-100 dark:ring-white/10">
                        <div className="absolute -top-20 right-12 h-32 w-32 rounded-full bg-gradient-to-br from-sky-200/60 via-blue-200/30 to-transparent blur-3xl dark:from-sky-500/20 dark:via-indigo-500/15" aria-hidden />
                        <div className="absolute -bottom-24 left-6 h-36 w-36 rounded-full bg-gradient-to-br from-rose-200/40 via-orange-200/25 to-transparent blur-3xl dark:from-rose-500/15 dark:via-orange-500/10" aria-hidden />

                        <div className="relative flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 shadow-inner ring-1 ring-sky-500/25 dark:bg-sky-500/20 dark:text-sky-200 dark:ring-sky-400/30">
                                    <HiOutlineCommandLine className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                                        Desktop tips
                                    </p>
                                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                                        Master the window controls
                                    </h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onNeverShow}
                                    className="inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 transition hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/60 dark:text-slate-500 dark:hover:text-rose-300"
                                >
                                    <HiOutlinePause className="h-4 w-4" aria-hidden />
                                    Never show
                                </button>
                                <button
                                    type="button"
                                    onClick={onDismiss}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-white/60 text-slate-500 shadow-sm transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:text-white"
                                    aria-label="Dismiss window control tips"
                                >
                                    <HiOutlineXMark className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
                            {CONTROL_ACTIONS.map((action) => (
                                <div
                                    key={action.id}
                                    className="group flex h-full flex-col justify-between rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/70"
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${action.accent} text-white shadow-md`}
                                            aria-hidden
                                        >
                                            {action.id === 'close' && <HiOutlineArrowUpLeft className="h-5 w-5" />}
                                            {action.id === 'minimize' && <HiOutlineArrowsPointingOut className="h-5 w-5" />}
                                            {action.id === 'maximize' && <HiOutlineSparkles className="h-5 w-5" />}
                                        </span>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                                                {action.title}
                                            </p>
                                            <p className="text-[0.9rem] font-semibold text-slate-800 dark:text-white">
                                                {action.shortcut}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                                        {action.description}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="relative mt-5 flex flex-col gap-4 rounded-2xl border border-dashed border-slate-200/70 p-4 text-sm text-slate-600 dark:border-slate-700/70 dark:text-slate-300">
                            <div className="flex items-start gap-3">
                                <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 shadow-inner ring-1 ring-brand-300/20 dark:bg-brand-400/15 dark:text-brand-200 dark:ring-brand-300/25">
                                    <HiOutlineQuestionMarkCircle className="h-5 w-5" />
                                </span>
                                <p>
                                    Hold <strong className="font-semibold text-slate-800 dark:text-white">⌥ (Option)</strong> while clicking to unlock power moves—close all utility windows, stash secondary panes, or enter focus mode instantly.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onShowMissionControl}
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-200/70 bg-brand-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-600 transition hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200/60 dark:border-brand-400/60 dark:bg-brand-500/20 dark:text-brand-200"
                                >
                                    <HiOutlineArrowsPointingOut className="h-4 w-4" />
                                    Mission Control
                                </button>
                                <span className="text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                                    Press Space for Quick Look
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.aside>
            ) : null}
        </AnimatePresence>
    );
}

WindowControlHints.propTypes = {
    visible: PropTypes.bool.isRequired,
    onDismiss: PropTypes.func.isRequired,
    onNeverShow: PropTypes.func.isRequired,
    onShowMissionControl: PropTypes.func.isRequired,
};
