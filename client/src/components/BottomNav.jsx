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

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-50">
            <ul className="flex justify-around items-center p-2">
                {items.map(({ to, label, icon: Icon }) => {
                    const active = location.pathname === to;
                    return (
                        <li key={to}>
                            <Link to={to} aria-label={label}>
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className={`flex flex-col items-center text-xs ${active ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    <Icon className="text-xl" />
                                    <span className="mt-1">{label}</span>
                                </motion.div>
                            </Link>
                        </li>
                    );
                })}
                {currentUser && (
                    <li>
                        <Link to="/dashboard" aria-label="Dashboard">
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className={`flex flex-col items-center text-xs ${location.pathname.startsWith('/dashboard') ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                <FaUser className="text-xl" />
                                <span className="mt-1">Dashboard</span>
                            </motion.div>
                        </Link>
                    </li>
                )}
                <li>
                    <ThemeToggle />
                </li>
            </ul>
        </nav>
    );
}