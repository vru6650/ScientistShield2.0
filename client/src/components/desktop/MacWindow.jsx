import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

// Dedicated Mac-like window component used by the desktop window manager.
export default function MacWindow({
    windowData,
    isFocused,
    children,
    onPointerDown,
    onClose,
    onMinimize,
    onZoom,
    onFocus,
    onResizeStart,
}) {
    const {
        id,
        title,
        x,
        y,
        width,
        height,
        z,
        allowClose,
        allowMinimize,
        allowZoom,
        type,
        icon,
        isMain,
    } = windowData;

    const handlePointerDown = (event) => {
        if (typeof onPointerDown === 'function') {
            onPointerDown(event, id);
        }
    };

    const handleFocus = () => {
        if (typeof onFocus === 'function') {
            onFocus(id);
        }
    };

    const handleClose = () => {
        if (allowClose && typeof onClose === 'function') {
            onClose(id);
        }
    };

    const handleMinimize = () => {
        if (allowMinimize && typeof onMinimize === 'function') {
            onMinimize(id);
        }
    };

    const handleZoom = () => {
        if (allowZoom && typeof onZoom === 'function') {
            onZoom(id);
        }
    };

    const startResize = (direction) => (event) => {
        if (typeof onResizeStart === 'function') {
            onResizeStart(event, id, direction);
        }
    };

    return (
        <motion.div
            layout
            data-window-id={id}
            data-window-type={type}
            data-focused={isFocused}
            className={`macos-window pointer-events-auto select-none ${isFocused ? 'macos-window--focused ring-2 ring-brand-300/60 dark:ring-brand-500/60' : 'ring-0'}`}
            style={{
                position: 'fixed',
                top: y,
                left: x,
                width,
                height,
                zIndex: z,
                cursor: 'default',
                touchAction: 'none',
                margin: 0,
            }}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onMouseDown={handleFocus}
            role="group"
            aria-label={`${title} window`}
        >
            <div className="macos-window__resize macos-window__resize--n" onPointerDown={startResize('n')} aria-hidden="true" />
            <div className="macos-window__resize macos-window__resize--s" onPointerDown={startResize('s')} aria-hidden="true" />
            <div className="macos-window__resize macos-window__resize--e" onPointerDown={startResize('e')} aria-hidden="true" />
            <div className="macos-window__resize macos-window__resize--w" onPointerDown={startResize('w')} aria-hidden="true" />
            <div className="macos-window__resize macos-window__resize--ne" onPointerDown={startResize('ne')} aria-hidden="true" />
            <div className="macos-window__resize macos-window__resize--nw" onPointerDown={startResize('nw')} aria-hidden="true" />
            <div className="macos-window__resize macos-window__resize--se" onPointerDown={startResize('se')} aria-hidden="true" />
            <div className="macos-window__resize macos-window__resize--sw" onPointerDown={startResize('sw')} aria-hidden="true" />
            <div
                className="macos-window__titlebar cursor-grab active:cursor-grabbing"
                onPointerDown={handlePointerDown}
                onDoubleClick={handleZoom}
                title={`Drag to move${allowZoom ? ' • Double-click to zoom' : ''}`}
                role="presentation"
            >
                <div className="macos-traffic-lights" aria-hidden="true">
                    <button
                        type="button"
                        className={`macos-traffic-light macos-traffic-light--close ${!allowClose ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110 transition'} `}
                        aria-label="Close window"
                        onClick={handleClose}
                        disabled={!allowClose}
                    >
                        <span className="macos-traffic-light__glyph macos-traffic-light__glyph--close" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className={`macos-traffic-light macos-traffic-light--minimize ${!allowMinimize ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110 transition'} `}
                        aria-label="Minimize window"
                        onClick={handleMinimize}
                        disabled={!allowMinimize}
                    >
                        <span className="macos-traffic-light__glyph macos-traffic-light__glyph--minimize" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className={`macos-traffic-light macos-traffic-light--zoom ${!allowZoom ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110 transition'} `}
                        aria-label="Zoom window"
                        onClick={handleZoom}
                        disabled={!allowZoom}
                    >
                        <span className="macos-traffic-light__glyph macos-traffic-light__glyph--zoom" aria-hidden="true" />
                    </button>
                </div>
                <div className="macos-window__title">
                    {icon ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/40 text-brand-600 shadow-inner">{icon}</span> : null}
                    <span className="truncate">{title}</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-slate-400 dark:text-slate-300">
                    {isMain ? 'Primary' : 'Utility'}
                </div>
            </div>
            <div className="macos-window__content">
                <div className="macos-window__body">
                    {children}
                </div>
            </div>
        </motion.div>
    );
}

MacWindow.propTypes = {
    windowData: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        z: PropTypes.number.isRequired,
        allowClose: PropTypes.bool,
        allowMinimize: PropTypes.bool,
        allowZoom: PropTypes.bool,
        type: PropTypes.string.isRequired,
        icon: PropTypes.node,
        isMain: PropTypes.bool,
    }).isRequired,
    isFocused: PropTypes.bool,
    children: PropTypes.node.isRequired,
    onPointerDown: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onMinimize: PropTypes.func.isRequired,
    onZoom: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
    onResizeStart: PropTypes.func.isRequired,
};

MacWindow.defaultProps = {
    isFocused: false,
};
