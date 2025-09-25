// src/hooks/useActiveToc.js
import { useState, useEffect, useRef } from 'react';

// This function "throttles" a function, ensuring it's not called too frequently.
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

export const useActiveToc = (headingIds) => {
    const [activeId, setActiveId] = useState('');
    const observer = useRef();

    useEffect(() => {
        const handleObserver = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveId(entry.target.id);
                }
            });
        };

        // Disconnect previous observer if it exists
        if (observer.current) {
            observer.current.disconnect();
        }

        // Create a new Intersection Observer
        observer.current = new IntersectionObserver(handleObserver, {
            rootMargin: '-20% 0px -80% 0px', // Highlights when heading is in the top 20% of the screen
        });

        const elements = headingIds.map(id => document.getElementById(id)).filter(el => el);
        elements.forEach(el => observer.current.observe(el));

        // Cleanup function
        return () => observer.current?.disconnect();

    }, [headingIds]);

    return activeId;
};