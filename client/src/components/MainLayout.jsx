import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

import Header from './Header';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import useResizable from '../hooks/useResizable'; // Hook for resizable sidebar

export default function MainLayout() {
    const location = useLocation();

    // Sidebar State
    const [isPinned, setIsPinned] = useState(() =>
        JSON.parse(localStorage.getItem('sidebar-pinned')) || false
    );
    const [isHovering, setIsHovering] = useState(false);

    // Resizable Sidebar Hook
    const { width: sidebarWidth, isResizing, startResizing } = useResizable(256, 220, 400);

    useEffect(() => {
        localStorage.setItem('sidebar-pinned', JSON.stringify(isPinned));
    }, [isPinned]);

    const isSidebarCollapsed = !isPinned && !isHovering;
    const currentSidebarWidth = isSidebarCollapsed ? 80 : sidebarWidth;

    return (
        <>
            <ScrollToTop />
            <Header />
            <div className="flex pt-20"> {/* Add padding top to account for fixed header */}
                <motion.div
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    className="relative z-40 hidden md:block"
                    animate={{ width: currentSidebarWidth }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <Sidebar
                        isCollapsed={isSidebarCollapsed}
                        isPinned={isPinned}
                        setIsPinned={setIsPinned}
                    />
                    <div
                        onMouseDown={startResizing}
                        className={`absolute top-0 right-0 h-full w-2 cursor-col-resize select-none ${isResizing ? 'bg-blue-500/50' : ''}`}
                    />
                </motion.div>

                <motion.main
                    className="flex-1 min-h-screen"
                    animate={{ marginLeft: isSidebarCollapsed ? '5rem' : `${sidebarWidth}px` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </motion.main>
            </div>
            <Footer />
            <BottomNav />
        </>
    );
}