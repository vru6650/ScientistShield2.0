import { useState, useEffect, useCallback } from 'react';

const useResizable = (initialWidth = 256, minWidth = 200, maxWidth = 400) => {
    const [isResizing, setIsResizing] = useState(false);
    const [width, setWidth] = useState(() => {
        const savedWidth = localStorage.getItem('sidebar-width');
        return savedWidth ? parseInt(savedWidth, 10) : initialWidth;
    });

    const startResizing = useCallback(() => {
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
        localStorage.setItem('sidebar-width', width);
    }, [width]);

    const resize = useCallback(
        (mouseMoveEvent) => {
            if (isResizing) {
                const newWidth = mouseMoveEvent.clientX;
                if (newWidth >= minWidth && newWidth <= maxWidth) {
                    setWidth(newWidth);
                }
            }
        },
        [isResizing, minWidth, maxWidth]
    );

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    return { width, isResizing, startResizing };
};

export default useResizable;