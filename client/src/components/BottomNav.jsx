import { Link, useLocation } from 'react-router-dom';
import { FaBook, FaHome, FaQuestionCircle, FaUser, FaLaptopCode, FaLightbulb, FaTools } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle.jsx';


const items = [
    { to: '/', label: 'Home', icon: FaHome },
    { to: '/tutorials', label: 'Tutorials', icon: FaBook },
    { to: '/quizzes', label: 'Quizzes', icon: FaQuestionCircle },
    { to: '/tools', label: 'Tools', icon: FaTools },
    { to: '/problems', label: 'Problems', icon: FaLightbulb },
    { to: '/visualizer', label: 'Code Visualizer', icon: FaLaptopCode }
];

export default function BottomNav() {
    const { currentUser } = useSelector((state) => state.user);
    const location = useLocation();

    const activeClass =
        'bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-500 text-white shadow-lg shadow-cyan-500/40 ring-2 ring-white/40 dark:ring-white/20';
    const inactiveClass =
        'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-200 shadow-md shadow-gray-900/10';

    return (
        <nav className="fixed bottom-6 left-1/2 z-50 flex w-full max-w-4xl -translate-x-1/2 justify-center px-4 pointer-events-none">
            <motion.ul
                className="pointer-events-auto flex items-end gap-4 rounded-3xl border border-white/30 bg-white/70 p-3 backdrop-blur-xl shadow-2xl shadow-cyan-500/20 dark:border-white/10 dark:bg-gray-900/60"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
            >
                {items.map(({ to, label, icon: Icon }) => {
                    const active = location.pathname === to;

                    return (
                        <motion.li key={to} className="relative">
                            <Link to={to} aria-label={label} className="group flex flex-col items-center">
                                <motion.div
                                    className="flex flex-col items-center"
                                    initial={false}
                                    animate={{ scale: active ? 1.15 : 1, y: active ? -8 : 0 }}
                                    whileHover={{ scale: 1.2, y: -10 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                >
                                    <div
                                        className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
                                            active ? activeClass : inactiveClass
                                        }`}
                                    >
                                        <Icon className="text-2xl" />
                                    </div>
                                    <span className="pointer-events-none mt-2 text-[11px] font-semibold tracking-wide text-gray-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-gray-200">
                                        {label}
                                    </span>
                                </motion.div>
                            </Link>
                        </motion.li>
                    );
                })}
                {currentUser && (
                    <motion.li className="relative">
                        <Link to="/dashboard" aria-label="Dashboard" className="group flex flex-col items-center">
                            <motion.div
                                className="flex flex-col items-center"
                                initial={false}
                                animate={{ scale: location.pathname.startsWith('/dashboard') ? 1.15 : 1, y: location.pathname.startsWith('/dashboard') ? -8 : 0 }}
                                whileHover={{ scale: 1.2, y: -10 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            >
                                <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
                                        location.pathname.startsWith('/dashboard') ? activeClass : inactiveClass
                                    }`}
                                >
                                    <FaUser className="text-2xl" />
                                </div>
                                <span className="pointer-events-none mt-2 text-[11px] font-semibold tracking-wide text-gray-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-gray-200">
                                    Dashboard
                                </span>
                            </motion.div>
                        </Link>
                    </motion.li>
                )}
                <motion.li className="relative">
                    <div className="group flex flex-col items-center">
                        <motion.div
                            className="flex flex-col items-center"
                            initial={false}
                            whileHover={{ scale: 1.15, y: -8 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        >
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${inactiveClass}`}>
                                <ThemeToggle className="h-10 w-10 rounded-2xl !bg-transparent !dark:bg-transparent !text-gray-600 dark:!text-gray-200 text-xl" />
                            </div>
                            <span className="pointer-events-none mt-2 text-[11px] font-semibold tracking-wide text-gray-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-gray-200">
                                Theme
                            </span>
                        </motion.div>
                    </div>
                </motion.li>
            </motion.ul>
        </nav>
    );
}