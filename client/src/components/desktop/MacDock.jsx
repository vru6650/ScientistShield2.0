import PropTypes from 'prop-types';
import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineSparkles } from 'react-icons/hi2';

import { renderWindowIcon } from './windowIcons';

const STATUS_TONES = Object.freeze({
    open: {
        badge: 'from-emerald-400/90 via-emerald-500/80 to-cyan-400/80',
        dot: 'bg-emerald-400',
    },
    minimized: {
        badge: 'from-amber-400/90 via-amber-500/80 to-orange-400/80',
        dot: 'bg-amber-300',
    },
    staged: {
        badge: 'from-sky-400/90 via-sky-500/80 to-cyan-400/80',
        dot: 'bg-sky-400',
    },
    closed: {
        badge: 'from-slate-500/80 via-slate-500/70 to-slate-400/70',
        dot: 'bg-slate-500/60',
    },
});

const BASE_VARIANT = {
    rest: { scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
    hover: { scale: 1.15, y: -12, transition: { type: 'spring', stiffness: 260, damping: 20 } },
    focus: { scale: 1.05, y: -6, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

export default function MacDock({ entries, focusedId, onActivate }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [hoveredEntry, setHoveredEntry] = useState(null);

    const orderedEntries = useMemo(
        () =>
            entries.map((entry, index) => ({
                ...entry,
                label: entry.title || entry.id || entry.type,
                key: `${entry.id ?? entry.type}-${index}`,
            })),
        [entries]
    );

    const scaleForIndex = useCallback(
        (index) => {
            if (hoveredIndex === null) return 1;
            const distance = Math.abs(index - hoveredIndex);
            if (distance === 0) return 1.28;
            if (distance === 1) return 1.14;
            if (distance === 2) return 1.06;
            return 1.0;
        },
        [hoveredIndex]
    );

    const handleEnter = useCallback((entry, index) => {
        setHoveredIndex(index);
        setHoveredEntry(entry);
    }, []);

    const handleLeave = useCallback(() => {
        setHoveredIndex(null);
        setHoveredEntry(null);
    }, []);

    const handleActivate = useCallback(
        (entry) => {
            onActivate(entry);
        },
        [onActivate]
    );

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex justify-center">
            <motion.div
                className="pointer-events-auto relative flex items-end gap-3 rounded-[32px] border border-white/10 bg-slate-900/65 px-5 py-3 shadow-[0_28px_60px_-28px_rgba(15,23,42,0.75)] backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            >
                <AnimatePresence>
                    {hoveredEntry ? (
                        <motion.div
                            key={hoveredEntry.key}
                            className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-slate-900/85 px-3 py-1 text-[0.7rem] font-medium text-slate-100 shadow-lg"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.18 }}
                        >
                            {hoveredEntry.label}
                        </motion.div>
                    ) : null}
                </AnimatePresence>
                {orderedEntries.map((entry, index) => {
                    const statusTone = STATUS_TONES[entry.status] || STATUS_TONES.closed;
                    const scale = scaleForIndex(index);
                    const isFocused = (entry.id ?? entry.type) === focusedId;
                    const IconComponent = entry.iconComponent;
                    const fallbackIcon = renderWindowIcon(entry.type, 'h-7 w-7');

                    return (
                        <motion.button
                            key={entry.key}
                            type="button"
                            variants={BASE_VARIANT}
                            initial="rest"
                            animate="rest"
                            whileHover="hover"
                            whileTap="hover"
                            onHoverStart={() => handleEnter(entry, index)}
                            onHoverEnd={handleLeave}
                            onFocus={() => handleEnter(entry, index)}
                            onBlur={handleLeave}
                            onClick={() => handleActivate(entry)}
                            className="relative flex h-14 w-14 origin-bottom items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800/75 via-slate-900/70 to-slate-950/75 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.65)] transition-[transform,box-shadow] hover:shadow-[0_26px_60px_-30px_rgba(56,189,248,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
                            style={{ transform: `scale(${scale})` }}
                            aria-label={`Open ${entry.label}`}
                        >
                            <motion.div
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/60"
                                animate={{
                                    scale: isFocused ? 1.05 : 1,
                                    rotate: isFocused ? [0, 2, -2, 0] : 0,
                                }}
                                transition={{
                                    rotate: { repeat: isFocused ? Infinity : 0, duration: 4, ease: 'easeInOut' },
                                }}
                            >
                                {IconComponent ? (
                                    <IconComponent className="h-7 w-7 text-sky-300" />
                                ) : fallbackIcon ? (
                                    fallbackIcon
                                ) : (
                                    <HiOutlineSparkles className="h-6 w-6 text-sky-300" />
                                )}
                            </motion.div>
                            <motion.span
                                className="absolute inset-0 rounded-2xl"
                                animate={{ borderColor: isFocused ? 'rgba(59,130,246,0.55)' : 'rgba(255,255,255,0.18)' }}
                                transition={{ duration: 0.24 }}
                                style={{
                                    borderWidth: isFocused ? 2 : 1,
                                    borderStyle: 'solid',
                                }}
                            />
                            <span
                                className="pointer-events-none absolute -bottom-2 left-1/2 h-1.5 w-3 -translate-x-1/2 rounded-full bg-white/40"
                                style={{ backgroundColor: undefined }}
                            />
                            <span
                                className={`pointer-events-none absolute -bottom-2 left-1/2 h-1.5 w-3 -translate-x-1/2 rounded-full ${statusTone.dot}`}
                            />
                            <motion.div
                                className="pointer-events-none absolute inset-x-1 bottom-2 h-1 rounded-full bg-white/20"
                                animate={{ opacity: hoveredIndex === index ? 0.1 : 0.05 }}
                            />
                            <motion.div
                                className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-2xl bg-gradient-to-t ${statusTone.badge}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: hoveredIndex === index ? 0.3 : isFocused ? 0.2 : 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ mixBlendMode: 'screen' }}
                            />
                        </motion.button>
                    );
                })}
            </motion.div>
        </div>
    );
}

MacDock.propTypes = {
    entries: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string,
            type: PropTypes.string,
            title: PropTypes.string,
            status: PropTypes.string.isRequired,
            iconComponent: PropTypes.elementType,
        })
    ).isRequired,
    focusedId: PropTypes.string,
    onActivate: PropTypes.func.isRequired,
};

MacDock.defaultProps = {
    focusedId: null,
};
