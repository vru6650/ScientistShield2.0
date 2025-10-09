import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext({
  notify: () => {},
});

let idSeed = 0;

function ToastItem({ toast, onClose }) {
  const { id, title, description, status = 'info', duration = 3000 } = toast;

  const accentByStatus = {
    success: 'from-emerald-400 via-emerald-500 to-emerald-600',
    error: 'from-rose-400 via-rose-500 to-rose-600',
    warning: 'from-amber-400 via-amber-500 to-amber-600',
    info: 'from-brand-400 via-brand-500 to-brand-600',
  };

  const ringByStatus = {
    success: 'ring-emerald-300/60',
    error: 'ring-rose-300/60',
    warning: 'ring-amber-300/60',
    info: 'ring-brand-300/60',
  };

  // auto close
  React.useEffect(() => {
    if (duration === Infinity) return undefined;
    const t = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(t);
  }, [id, duration, onClose]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/90 ${ringByStatus[status]}`}
      role="status"
      aria-live="polite"
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentByStatus[status]}`} />
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-2.5 w-2.5 flex-none rounded-full bg-gradient-to-br from-white/60 to-white/20 shadow-inner" />
        <div className="min-w-0 flex-1">
          {title ? (
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          ) : null}
          {description ? (
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onClose(id)}
          className="-m-1 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/70 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          aria-label="Dismiss notification"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </motion.li>
  );
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const queueRef = useRef([]);

  const close = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((opts) => {
    const toast = { id: ++idSeed, ...opts };
    setToasts((prev) => [toast, ...prev].slice(0, 4));
    return toast.id;
  }, []);

  const api = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Container */}
      <div className="pointer-events-none fixed inset-0 z-[70] flex flex-col items-end p-4 sm:p-6">
        <ol className="pointer-events-auto ml-auto flex w-full max-w-sm flex-col gap-3">
          <AnimatePresence initial={false}>
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onClose={close} />
            ))}
          </AnimatePresence>
        </ol>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

