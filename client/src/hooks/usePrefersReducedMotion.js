import { useState, useEffect } from 'react';

const query = '(prefers-reduced-motion: reduce)';

const getInitialState = () => typeof window !== 'undefined' ? window.matchMedia(query).matches : false;

export default function usePrefersReducedMotion() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialState);

    useEffect(() => {
        const mediaQueryList = window.matchMedia(query);
        const listener = (event) => {
            setPrefersReducedMotion(event.matches);
        };
        mediaQueryList.addEventListener('change', listener);
        return () => {
            mediaQueryList.removeEventListener('change', listener);
        };
    }, []);

    return prefersReducedMotion;
}