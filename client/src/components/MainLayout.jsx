import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

import Footer from './Footer';
import Header from './Header';
import ScrollToTop from './ScrollToTop';
import BottomNav from './BottomNav';
import RouteProgressBar from './RouteProgressBar.jsx';
import PageAnnouncer from './PageAnnouncer.jsx';
import RestOverlay from './RestOverlay';

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
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="container">
                            <Outlet />
                        </div>
                    </motion.div>
                </AnimatePresence>
            </motion.main>
            <Footer />
            <BottomNav />
        </>
    );
}
