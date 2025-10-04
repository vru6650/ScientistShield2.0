import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import Header from './Header';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import BottomNav from './BottomNav';
import RouteProgressBar from './RouteProgressBar.jsx';
import PageAnnouncer from './PageAnnouncer.jsx';

export default function MainLayout() {
    const location = useLocation();

    return (
        <>
            <ScrollToTop />
            <RouteProgressBar />
            <Header />
            <PageAnnouncer />
            <div className="pt-20">
                <motion.main id="main-content" role="main" className="min-h-screen transition-all duration-300">
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
            </div>
            <Footer />
            <BottomNav />
        </>
    );
}
