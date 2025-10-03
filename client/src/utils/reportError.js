const emitBrowserEvent = (name, detail) => {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new CustomEvent(name, { detail }));
};

const reportError = (error, errorInfo) => {
    const payload = {
        message: error?.message ?? 'Unknown error',
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
    };

    if (import.meta.env.DEV) {
        console.error('[ErrorBoundary] A rendering error was captured:', payload);
        emitBrowserEvent('app:error', payload);
        return;
    }

    try {
        emitBrowserEvent('app:error', payload);

        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon('/api/client-error', blob);
            return;
        }

        if (typeof fetch === 'function') {
            fetch('/api/client-error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                keepalive: true,
            }).catch(() => {
                // Silent catch to avoid recursive error handling.
            });
        }
    } catch (loggingError) {
        if (import.meta.env.DEV) {
            console.error('[ErrorBoundary] Failed to report error', loggingError);
        }
    }
};

export default reportError;
