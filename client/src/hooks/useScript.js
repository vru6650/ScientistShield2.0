import { useEffect, useState } from 'react';

const cachedStatuses = new Map();

export const useScript = (src) => {
    const [status, setStatus] = useState(() => cachedStatuses.get(src) ?? 'idle');

    useEffect(() => {
        if (!src) return () => {};

        const cached = cachedStatuses.get(src);
        if (cached === 'ready') {
            setStatus('ready');
            return () => {};
        }
        if (cached === 'error') {
            setStatus('error');
            return () => {};
        }

        let script = document.querySelector(`script[src="${src}"]`);
        let mounted = true;

        const handleLoad = () => {
            cachedStatuses.set(src, 'ready');
            if (mounted) setStatus('ready');
        };

        const handleError = () => {
            cachedStatuses.set(src, 'error');
            if (mounted) setStatus('error');
        };

        if (!script) {
            script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = handleLoad;
            script.onerror = handleError;
            document.body.appendChild(script);
        } else {
            script.addEventListener('load', handleLoad);
            script.addEventListener('error', handleError);
        }

        return () => {
            mounted = false;
            if (script) {
                script.removeEventListener('load', handleLoad);
                script.removeEventListener('error', handleError);
            }
        };
    }, [src]);

    return status;
};

