import { NavLink, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import {
    FaBook,
    FaProjectDiagram,
    FaQuestionCircle,
    FaSignInAlt,
    FaPlus,
    FaRegBell,
    FaRegFileAlt,
    FaRegCreditCard,
    FaThumbtack,
    FaShieldAlt,
    FaLaptopCode,
} from 'react-icons/fa';
import { Avatar, Tooltip, Button } from 'flowbite-react';

// --- Reusable UI Sub-components ---

const SectionHeader = ({ label, isCollapsed }) => (
    <AnimatePresence>
        {!isCollapsed && (
            <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.2 } }}
                exit={{ opacity: 0 }}
                className="px-3 mt-6 mb-2 text-xs font-medium tracking-wider uppercase text-neutral-500 dark:text-neutral-400 flex justify-between items-center"
            >
                {label}
                <Tooltip content={`Add New ${label}`} placement="right">
                    <button className="text-neutral-500 hover:text-white transition-colors">
                        <FaPlus size={10} />
                    </button>
                </Tooltip>
            </motion.h3>
        )}
    </AnimatePresence>
);

const NavItem = ({ to, icon: Icon, label, isCollapsed }) => (
    <Tooltip content={label} placement="right" animation="duration-300" disabled={!isCollapsed}>
        <NavLink to={to}>
            {({ isActive }) => (
                <motion.div
                    whileHover={{ x: 5, backgroundColor: 'rgba(100, 116, 139, 0.1)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className={`
                        flex items-center gap-3 w-full px-3 py-2.5 rounded-lg font-medium text-left transition-colors duration-200 relative
                        ${isActive
                        ? 'bg-neutral-700/60 text-white'
                        : 'text-neutral-400 group-hover:text-white'
                    }
                        ${isCollapsed ? 'justify-center px-0' : ''}
                    `}
                >
                    <AnimatePresence>
                        {isActive && (
                            <motion.div
                                layoutId="active-nav-item-indicator"
                                className="absolute left-0 top-2 bottom-2 w-1 bg-accent-teal rounded-r-full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            />
                        )}
                    </AnimatePresence>

                    {Icon && (
                        <motion.div whileHover={{ scale: 1.1 }}>
                            <Icon className="h-5 w-5 flex-shrink-0" />
                        </motion.div>
                    )}

                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, transition: { delay: 0.1 } }}
                                exit={{ opacity: 0 }}
                                className="whitespace-nowrap"
                            >
                                {label}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </NavLink>
    </Tooltip>
);

// --- Main Sidebar Component ---
const Sidebar = ({ isCollapsed, isPinned, setIsPinned }) => {
    const { currentUser } = useSelector((state) => state.user);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e) => {
        const { currentTarget, clientX, clientY } = e;
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    };

    const mainNavItems = [
        { to: '/tutorials', label: 'Tutorials', icon: FaBook },
        { to: '/quizzes', label: 'Quizzes', icon: FaQuestionCircle },
        { to: '/projects', label: 'Projects', icon: FaProjectDiagram },
        { to: '/visualizer', label: 'Code Visualizer', icon: FaLaptopCode },
        { to: '/invoices', label: 'Invoices', icon: FaRegFileAlt },
        { to: '/wallet', label: 'Wallet', icon: FaRegCreditCard },
        { to: '/notification', label: 'Notification', icon: FaRegBell },
    ];

    return (
        <motion.aside
            animate={{ width: isCollapsed ? '5rem' : '16rem' }}
            transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
            className="sidebar hidden md:flex flex-col fixed top-0 left-0 z-40 h-[calc(100vh-2rem)] my-4 ml-4 rounded-2xl border backdrop-blur-lg bg-white/60 dark:bg-slate-900/60 shadow-lg"
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(148, 163, 184, 0.05), transparent 40%)`
                }}
            />
            <div className="relative z-10">
                <div className={`flex items-center p-4 border-b ${isCollapsed ? 'justify-center' : 'justify-between'}`} style={{ borderColor: 'var(--color-sidebar-border)' }}>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }} exit={{ opacity: 0 }}>
                                <Link to="/" className="text-xl font-bold">ScientistShield</Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <Tooltip content={isPinned ? "Unpin Sidebar" : "Pin Sidebar"} placement="right" animation="duration-300">
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsPinned(!isPinned)}
                            className="p-2 rounded-full hover:bg-neutral-700 transition-colors"
                        >
                            <motion.div animate={{ rotate: isPinned ? 0 : 45 }}>
                                <FaThumbtack className={isPinned ? 'text-white' : 'text-neutral-500'} />
                            </motion.div>
                        </motion.button>
                    </Tooltip>
                </div>

                <motion.div
                    whileHover={{ backgroundColor: 'rgba(100, 116, 139, 0.1)' }}
                    className={`p-4 border-b`}
                    style={{ borderColor: 'var(--color-sidebar-border)' }}
                >
                    {currentUser ? (
                        <Link to="/dashboard?tab=profile">
                            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                                <Avatar img={currentUser.profilePicture} rounded size="md" />
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto', transition: { delay: 0.2 } }} exit={{ opacity: 0, width: 0 }} className="text-sm overflow-hidden">
                                            <p className="font-semibold text-white truncate">{currentUser.username}</p>
                                            <p className="text-neutral-400 text-xs">Account Designer</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </Link>
                    ) : (
                        <NavItem to="/sign-in" icon={FaSignInAlt} label="Sign In" isCollapsed={isCollapsed} />
                    )}
                </motion.div>
            </div>

            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                <SectionHeader label="Main" isCollapsed={isCollapsed} />
                {currentUser?.isAdmin && (
                    <NavItem
                        to="/admin"
                        icon={FaShieldAlt}
                        label="Admin Panel"
                        isCollapsed={isCollapsed}
                    />
                )}

                {mainNavItems.map(item => <NavItem key={item.to} {...item} isCollapsed={isCollapsed} />)}
            </nav>

            <div className="p-4 mt-auto relative z-10">
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, transition: { delay: 0.2 } }}
                            exit={{ opacity: 0 }}
                            className="bg-neutral-800/80 p-4 rounded-lg text-center border"
                            style={{ borderColor: 'var(--color-sidebar-border)' }}
                        >
                            <h4 className="font-semibold text-white">Let's start!</h4>
                            <p className="text-xs text-neutral-400 mt-1 mb-3">Creating or starting new tasks couldn't be easier.</p>
                            <Link to="/create-post">
                                <Button gradientDuoTone="purpleToBlue" className="w-full">
                                    <FaPlus className="mr-2 h-3 w-3" /> Add New Task
                                </Button>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isCollapsed && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Link to="/create-post">
                                <Button gradientDuoTone="purpleToBlue" className="w-full h-12 flex items-center justify-center rounded-lg"><FaPlus /></Button>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.aside>
    );
};

export default Sidebar;