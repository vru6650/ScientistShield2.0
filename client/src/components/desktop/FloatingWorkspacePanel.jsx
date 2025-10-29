import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useCallback } from 'react';
import { HiOutlineXMark } from 'react-icons/hi2';

import StageManagerPanel from './StageManagerPanel.jsx';

export default function FloatingWorkspacePanel({
    open,
    onClose,
    className,
    ...panelProps
}) {
    const handleBackdropClick = useCallback(() => {
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    key="floating-workspace-panel"
                    className="fixed inset-0 z-[74] flex items-center justify-center p-4 sm:p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Workspace scenes"
                >
                    <motion.div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xl dark:bg-slate-950/55"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleBackdropClick}
                    />
                    <motion.div
                        className="relative z-[1] w-full max-w-4xl"
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 24, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/70 text-slate-500 shadow-sm transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/10 dark:bg-slate-900/65 dark:text-slate-300 dark:hover:text-white"
                            aria-label="Close workspace panel"
                        >
                            <HiOutlineXMark className="h-5 w-5" />
                        </button>
                        <StageManagerPanel
                            {...panelProps}
                            variant="floating"
                            className={className}
                        />
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}

FloatingWorkspacePanel.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    ...StageManagerPanel.propTypes,
};

FloatingWorkspacePanel.defaultProps = {
    open: false,
    onClose: () => {},
    className: StageManagerPanel.defaultProps.className,
};
