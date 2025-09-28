import { NavLink, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import React from 'react';
import {
    FaBook,
    FaProjectDiagram,
    FaQuestionCircle,
    FaLightbulb,
    FaSignInAlt,
    FaPlus,
    FaRegBell,
    FaRegFileAlt,
    FaRegCreditCard,
    FaThumbtack,
    FaShieldAlt,
    FaLaptopCode,
    FaTools,
} from 'react-icons/fa';
import { Avatar, Tooltip, Button } from 'flowbite-react';

// --- Reusable UI Sub-components ---

const SectionHeader = ({ label, isCollapsed }) => (
    <AnimatePresence>
        {!isCollapsed && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.2 } }}
                exit={{ opacity: 0 }}
                className="px-3 mt-6 mb-3 text-[0.65rem] font-semibold tracking-[0.35em] uppercase text-neutral-500 dark:text-neutral-400 flex items-center"
            >
                <span>{label}</span>
                <div className="ml-3 hidden h-px flex-1 rounded-full bg-gradient-to-r from-transparent via-neutral-500/30 to-transparent lg:block" />
                <Tooltip content={`Add New ${label}`} placement="right">
                    <button className="ml-3 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-500/40 text-neutral-500 transition-colors hover:border-white/70 hover:text-white">
                        <FaPlus size={10} />
                    </button>
                </Tooltip>
            </motion.div>
        )}
    </AnimatePresence>
);

const NavItem = ({ to, icon: Icon, label, isCollapsed }) => (
    <Tooltip content={label} placement="right" animation="duration-300" disabled={!isCollapsed}>
        <NavLink to={to}>
            {({ isActive }) => (
                <motion.div
                    whileHover={isCollapsed ? { scale: 1.05 } : { x: 6 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200
                        ${isActive
                        ? 'text-white'
                        : 'text-neutral-400 hover:text-white'}
                        ${isCollapsed ? 'justify-center px-0' : ''}
                    `}
                >
                    <AnimatePresence>
                        {isActive && (
                            <motion.div
                                layoutId="active-nav-item-indicator"
                                className="absolute inset-0 rounded-xl border border-sky-300/30 bg-gradient-to-r from-sky-500/20 via-transparent to-transparent shadow-[0_12px_32px_-16px_rgba(15,23,42,0.65)]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            />
                        )}
                    </AnimatePresence>

                    {Icon && (
                        <motion.div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white shadow-inner dark:border-slate-600/40 dark:bg-slate-900/40" whileHover={{ scale: 1.08 }}>
                            <Icon className="h-4 w-4" />
                        </motion.div>
                    )}

                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0, transition: { delay: 0.1 } }}
                                exit={{ opacity: 0, x: -6 }}
                                className="relative z-10 whitespace-nowrap"
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

const MessageItem = ({ name, avatar, isCollapsed }) => (
    <Link to="#">
        <motion.div
            whileHover={!isCollapsed ? { x: 6 } : { scale: 1.04 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-neutral-400 transition-colors hover:text-white"
        >
            <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-inner dark:border-slate-600/50 dark:bg-slate-900/50">
                <Avatar img={avatar} rounded size="xs" />
            </div>
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        className="relative z-10 whitespace-nowrap"
                    >
                        {name}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.div>
    </Link>
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
        { to: '/problems', label: 'Problem Solving', icon: FaLightbulb },
        { to: '/projects', label: 'Projects', icon: FaProjectDiagram },
        { to: '/tools', label: 'Tools Hub', icon: FaTools },
        { to: '/visualizer', label: 'Code Visualizer', icon: FaLaptopCode },
        { to: '/invoices', label: 'Invoices', icon: FaRegFileAlt },
        { to: '/wallet', label: 'Wallet', icon: FaRegCreditCard },
        { to: '/notification', label: 'Notification', icon: FaRegBell },
    ];

    const messages = [
        { name: 'Erik Gunsel', avatar: 'https://i.pravatar.cc/150?u=erik' },
        { name: 'Emily Smith', avatar: 'https://i.pravatar.cc/150?u=emily' },
        { name: 'Arthur Adell', avatar: 'https://i.pravatar.cc/150?u=arthur' },
    ];

    return (
        <motion.aside
            animate={{ width: isCollapsed ? '5rem' : '17.5rem' }}
            transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
            className="sidebar relative hidden md:flex flex-col fixed top-0 left-0 z-40 h-[calc(100vh-2rem)] my-4 ml-4 overflow-hidden rounded-3xl backdrop-blur-xl"
            onMouseMove={handleMouseMove}
        >
            <div className="pointer-events-none absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-transparent dark:from-slate-900/25" />
                <div className="absolute left-14 top-12 h-36 w-36 rounded-full bg-sky-400/25 blur-3xl opacity-70 dark:bg-sky-400/20" />
                <div className="absolute right-[-35%] bottom-[-20%] h-64 w-64 rounded-full bg-indigo-500/20 blur-[120px] opacity-60" />
            </div>
            <motion.div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(148, 163, 184, 0.08), transparent 45%)`
                }}
            />
            <div className="relative z-10 flex h-full flex-col">
                <div className={`flex items-start ${isCollapsed ? 'justify-center px-3 py-5' : 'justify-between px-5 py-6'} border-b border-white/10 dark:border-slate-700/60`}>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }} exit={{ opacity: 0, y: -8 }}>
                                <Link to="/" className="block">
                                    <span className="block text-lg font-semibold text-white">Scientist<span className="text-sky-300">Shield</span></span>
                                    <span className="mt-1 block text-[0.65rem] font-medium uppercase tracking-[0.4em] text-sky-200/70">Knowledge Suite</span>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <Tooltip content={isPinned ? "Unpin Sidebar" : "Pin Sidebar"} placement="right" animation="duration-300">
                        <motion.button
                            whileHover={{ scale: 1.08, rotate: 10 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setIsPinned(!isPinned)}
                            className="rounded-full border border-white/10 p-2.5 text-neutral-400 transition-colors hover:border-white/40 hover:text-white"
                        >
                            <motion.div animate={{ rotate: isPinned ? 0 : 45 }}>
                                <FaThumbtack className={isPinned ? 'text-sky-300' : 'text-inherit'} />
                            </motion.div>
                        </motion.button>
                    </Tooltip>
                </div>

                <motion.div
                    whileHover={!isCollapsed ? { backgroundColor: 'rgba(255,255,255,0.06)' } : {}}
                    className={`border-b border-white/10 px-4 py-4 transition-colors dark:border-slate-700/60 ${isCollapsed ? 'flex justify-center' : ''}`}
                >
                    {currentUser ? (
                        <Link to="/dashboard?tab=profile" className="group block w-full">
                            <div className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 transition-colors group-hover:border-white/30 group-hover:bg-white/15 dark:border-slate-700/50 dark:bg-slate-900/40 ${isCollapsed ? 'justify-center' : ''}`}>
                                <Avatar img={currentUser.profilePicture} rounded size="md" />
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.15 } }} exit={{ opacity: 0, x: -10 }} className="overflow-hidden text-sm">
                                            <p className="font-semibold text-white truncate">{currentUser.username}</p>
                                            <p className="text-xs text-neutral-300/80">View profile & settings</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </Link>
                    ) : (
                        <NavItem to="/sign-in" icon={FaSignInAlt} label="Sign In" isCollapsed={isCollapsed} />
                    )}
                </motion.div>

                <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'space-y-4 px-2 py-4' : 'space-y-6 px-5 py-6'}`}>
                    <div className={`${isCollapsed ? 'space-y-1' : 'space-y-2 rounded-2xl border border-white/10 bg-white/10 p-3 shadow-inner dark:border-slate-700/40 dark:bg-slate-900/35'}`}>
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
                    </div>

                    <div className={`${isCollapsed ? 'space-y-1' : 'space-y-2 rounded-2xl border border-white/10 bg-white/10 p-3 shadow-inner dark:border-slate-700/40 dark:bg-slate-900/35'}`}>
                        <SectionHeader label="Messages" isCollapsed={isCollapsed} />
                        {messages.map(msg => <MessageItem key={msg.name} {...msg} isCollapsed={isCollapsed} />)}
                    </div>
                </nav>

                <div className="relative z-10 mt-auto px-4 pb-5">
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                                exit={{ opacity: 0, y: 12 }}
                                className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/75 via-slate-900/50 to-slate-900/80 p-5 text-center shadow-2xl"
                            >
                                <h4 className="text-base font-semibold text-white">Ready for your next sprint?</h4>
                                <p className="mt-2 text-xs text-neutral-300">Create a task and keep your research momentum going.</p>
                                <Link to="/create-post" className="mt-4 block">
                                    <Button gradientDuoTone="purpleToBlue" className="w-full">
                                        <FaPlus className="mr-2 h-3 w-3" /> New Task
                                    </Button>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <AnimatePresence>
                        {isCollapsed && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                                <Tooltip content="Create a new task" placement="right">
                                    <Link to="/create-post">
                                        <Button gradientDuoTone="purpleToBlue" className="flex h-12 w-full items-center justify-center rounded-2xl">
                                            <FaPlus />
                                        </Button>
                                    </Link>
                                </Tooltip>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.aside>
    );
};

export default Sidebar;