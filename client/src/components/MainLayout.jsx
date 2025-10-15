import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Header from './Header';
import ScrollToTop from './ScrollToTop';
import BottomNav from './BottomNav';
import RouteProgressBar from './RouteProgressBar.jsx';
import PageAnnouncer from './PageAnnouncer.jsx';
import RestOverlay from './RestOverlay';
import MacWindowManager from './desktop/MacWindowManager.jsx';

export default function MainLayout() {
    const location = useLocation();
    // Global UI effects (from Control Center)
    const readEffects = () => {
        try { return JSON.parse(localStorage.getItem('ui.effects.v1') || 'null') || { brightness: 1, contrast: 1, veil: 0, reduceMotion: false }; } catch { return { brightness: 1, contrast: 1, veil: 0, reduceMotion: false }; }
    };
    const [effects, setEffects] = useState(readEffects);
    useEffect(() => {
        const onChange = (e) => setEffects(readEffects());
        window.addEventListener('ui-effects-changed', onChange);
        window.addEventListener('storage', onChange);
        return () => {
            window.removeEventListener('ui-effects-changed', onChange);
            window.removeEventListener('storage', onChange);
        };
    }, []);

    const windowTitle = useMemo(() => {
        const pathname = location.pathname;
        if (pathname === '/' || pathname === '') return 'Scientist Shield · Home';
        const segments = pathname.split('/').filter(Boolean);
        const last = segments[segments.length - 1] || 'Home';
        const formatted = last
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
        return `Scientist Shield · ${formatted}`;
    }, [location.pathname]);

    const renderMainContent = useCallback(() => <Outlet />, [location.key]);

    return (
        <>
            <ScrollToTop />
            <RouteProgressBar />
            <Header />
            {/* Veil overlay for focus dimming */}
            {effects.veil > 0 ? (
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 z-[45]"
                    style={{ backgroundColor: `rgba(2,6,23,${effects.veil})` }}
                />
            ) : null}
            <RestOverlay />
            <PageAnnouncer />
            <motion.main
                id="main-content"
                role="main"
                tabIndex={-1}
                className="min-h-screen pt-20 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/70"
                style={{ filter: `brightness(${effects.brightness || 1}) contrast(${effects.contrast || 1})` }}
            >
                <MacWindowManager
                    windowTitle={windowTitle}
                    renderMainContent={renderMainContent}
                />
            </motion.main>
            <BottomNav />
        </>
    );
}
