import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import {
    FaBolt,
    FaBook,
    FaCrown,
    FaFire,
    FaCompass,
    FaProjectDiagram,
    FaQuestionCircle,
    FaRocket,
    FaSignInAlt,
    FaPlus,
    FaRegBell,
    FaRegFileAlt,
    FaRegCreditCard,
    FaThumbtack,
    FaShieldAlt,
    FaLightbulb,
    FaRegClock,
    FaLaptopCode,
    FaChevronLeft,
    FaChevronRight,
    FaUsers,
    FaMoon,
} from 'react-icons/fa';
import { Avatar, Tooltip, Button } from 'flowbite-react';

// --- Reusable UI Sub-components ---

const SectionHeader = ({ label, isCollapsed, actionLabel, onAction }) => (
    <AnimatePresence>
        {!isCollapsed && (
            <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.2 } }}
                exit={{ opacity: 0 }}
                className="px-3 mt-6 mb-2 text-xs font-medium tracking-wider uppercase text-neutral-500 dark:text-neutral-400 flex justify-between items-center"
            >
                {label}
                {actionLabel && (
                    <Tooltip content={actionLabel} placement="right">
                        <button
                            className="text-neutral-500 hover:text-white transition-colors"
                            onClick={onAction}
                            type="button"
                        >
                            <FaPlus size={10} />
                        </button>
                    </Tooltip>
                )}
            </motion.h3>
        )}
    </AnimatePresence>
);

const NavItem = ({ to, icon: Icon, label, isCollapsed, badge }) => (
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
                        ${isCollapsed ? 'justify-center px-0' : 'justify-between'}
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

                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        {Icon && (
                            <motion.div whileHover={{ scale: 1.1 }} className={`rounded-lg p-2 ${isActive ? 'bg-neutral-800/60 text-white' : 'bg-neutral-700/30 text-neutral-300'} ${isCollapsed ? 'p-2.5' : ''}`}>
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
                    </div>

                    <AnimatePresence>
                        {!isCollapsed && badge && (
                            <motion.span
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
                                exit={{ opacity: 0, y: -4 }}
                                className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200"
                            >
                                {badge}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </NavLink>
    </Tooltip>
);

const QuickActionButton = ({ icon: Icon, label, sublabel, to }) => (
    <Link
        to={to}
        className="group flex items-center gap-3 rounded-xl border border-white/5 bg-gradient-to-r from-slate-800/40 to-slate-900/40 px-3 py-3 transition-all duration-200 hover:from-slate-800/80 hover:to-slate-900/80"
    >
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500/30">
            <Icon className="h-4 w-4" />
        </span>
        <span className="flex flex-col text-left">
            <span className="text-sm font-semibold text-white">{label}</span>
            <span className="text-xs text-neutral-400 group-hover:text-neutral-200/80">{sublabel}</span>
        </span>
    </Link>
);

// --- Main Sidebar Component ---
const Sidebar = ({ isCollapsed, isPinned, onTogglePin, onToggleCollapse, expandedWidth }) => {
    const { currentUser } = useSelector((state) => state.user);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [focusMode, setFocusMode] = useState(false);

    const handleMouseMove = (e) => {
        const { currentTarget, clientX, clientY } = e;
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    };

    const workspaceNavItems = [
        { to: '/tutorials', label: 'Tutorials', icon: FaBook, badge: 'Focus' },
        { to: '/quizzes', label: 'Quizzes', icon: FaQuestionCircle },
        { to: '/projects', label: 'Projects', icon: FaProjectDiagram },
        { to: '/visualizer', label: 'Code Visualizer', icon: FaLaptopCode, badge: 'Beta' },
        { to: '/invoices', label: 'Invoices', icon: FaRegFileAlt },
        { to: '/wallet', label: 'Wallet', icon: FaRegCreditCard },
        { to: '/notification', label: 'Notification', icon: FaRegBell },
    ];

    const explorerNavItems = [
        { to: '/tools', label: 'Learning Tools', icon: FaLightbulb },
        { to: '/dashboard', label: 'Daily Planner', icon: FaRegClock, badge: 'New' },
        { to: '/problems', label: 'Practice Arena', icon: FaFire, badge: 'Hot' },
        { to: '/search', label: 'Discover Content', icon: FaCompass },
        { to: '/tryit', label: 'Interactive Playground', icon: FaLaptopCode },
    ];

    const statusHighlights = [
        {
            label: 'Learning streak',
            value: '5 days',
            sublabel: 'Keep it up!',
            icon: FaFire,
        },
        {
            label: 'Active projects',
            value: '3',
            sublabel: 'Progressing smoothly',
            icon: FaBolt,
        },
        {
            label: 'Community reach',
            value: '128',
            sublabel: 'Peers engaged',
            icon: FaUsers,
        },
    ];

    const sidebarTargetWidth = expandedWidth ? `${expandedWidth}px` : '16rem';

    return (
        <motion.aside
            animate={{ width: isCollapsed ? '5rem' : sidebarTargetWidth }}
            transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
            className="sidebar hidden md:flex flex-col relative z-40 min-h-[calc(100vh-2rem)] my-4 ml-4 rounded-2xl border backdrop-blur-lg bg-white/60 dark:bg-slate-900/60 shadow-lg"
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(148, 163, 184, 0.08), transparent 50%)`
                }}
            />
            <div className="relative z-10">
                <div
                    className={`flex ${isCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'} p-4 border-b transition-all duration-200`}
                    style={{ borderColor: 'var(--color-sidebar-border)' }}
                >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }} exit={{ opacity: 0 }}>
                                    <Link to="/" className="text-xl font-bold">ScientistShield</Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <Tooltip content={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"} placement="right" animation="duration-300">
                            <motion.button
                                whileHover={{ scale: 1.05, rotate: isCollapsed ? 0 : -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onToggleCollapse}
                                className="ml-0 p-2 rounded-full bg-neutral-700/30 text-neutral-200 hover:bg-neutral-700/60 transition-colors"
                                type="button"
                                aria-label={isCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
                            >
                                {isCollapsed ? <FaChevronRight className="h-4 w-4" /> : <FaChevronLeft className="h-4 w-4" />}
                            </motion.button>
                        </Tooltip>
                    </div>
                    <Tooltip content={isPinned ? "Unpin Sidebar" : "Pin Sidebar"} placement="right" animation="duration-300">
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onTogglePin}
                            className="p-2 rounded-full bg-neutral-700/20 hover:bg-neutral-700/50 transition-colors"
                            type="button"
                            aria-label={isPinned ? 'Unpin sidebar from workspace' : 'Pin sidebar open'}
                        >
                            <motion.div animate={{ rotate: isPinned ? 0 : 45 }}>
                                <FaThumbtack className={isPinned ? 'text-white' : 'text-neutral-500'} />
                            </motion.div>
                        </motion.button>
                    </Tooltip>
                </div>

                <motion.div
                    whileHover={{ backgroundColor: 'rgba(100, 116, 139, 0.08)' }}
                    className="p-4 border-b"
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

                    {currentUser && !isCollapsed && (
                        <div className="mt-4 space-y-3">
                            <div className="space-y-2">
                                <QuickActionButton
                                    to="/tutorials"
                                    icon={FaRocket}
                                    label="Continue learning"
                                    sublabel="Jump back into your last tutorial"
                                />
                                <QuickActionButton
                                    to="/projects"
                                    icon={FaBolt}
                                    label="Create a new project"
                                    sublabel="Spin up an idea in seconds"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {statusHighlights.map(({ label, value, sublabel, icon: HighlightIcon }) => (
                                    <motion.div
                                        key={label}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative overflow-hidden rounded-xl border border-white/5 bg-white/5 p-3 text-[11px] text-neutral-100 dark:bg-slate-900/40 backdrop-blur"
                                    >
                                        <div className="absolute -right-3 -top-4 h-12 w-12 rounded-full bg-emerald-400/10 blur-2xl" />
                                        <div className="relative space-y-1">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200/80">
                                                <HighlightIcon className="h-3.5 w-3.5" />
                                                {label}
                                            </span>
                                            <p className="text-sm font-semibold text-white">{value}</p>
                                            <p className="text-[10px] text-neutral-300">{sublabel}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-transparent p-4">
                                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/20 blur-3xl" />
                                <div className="relative flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <p className="flex items-center gap-2 text-sm font-semibold text-white">
                                            <FaMoon className="h-4 w-4 text-emerald-200" />
                                            Focus mode
                                        </p>
                                        <p className="text-xs text-neutral-200/80">
                                            Reduce distractions and keep essential tools pinned for your next sprint.
                                        </p>
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.94 }}
                                        onClick={() => setFocusMode((prev) => !prev)}
                                        aria-pressed={focusMode}
                                        className={`relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${focusMode ? 'bg-white text-emerald-600 shadow-lg shadow-emerald-500/40' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                                        type="button"
                                    >
                                        <span className={`h-2 w-2 rounded-full ${focusMode ? 'bg-emerald-500' : 'bg-white/70'}`} />
                                        {focusMode ? 'Focus Enabled' : 'Enable Focus'}
                                    </motion.button>
                                </div>
                                <AnimatePresence>
                                    {focusMode && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-[11px] text-emerald-100"
                                        >
                                            Quick tip: You can pin the sidebar to keep your favorite resources within reach while staying in focus mode.
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                <SectionHeader label="Workspace" isCollapsed={isCollapsed} actionLabel="Add quick shortcut" />
                {currentUser?.isAdmin && (
                    <NavItem
                        to="/admin"
                        icon={FaShieldAlt}
                        label="Admin Panel"
                        isCollapsed={isCollapsed}
                        badge="Admin"
                    />
                )}

                {workspaceNavItems.map(item => <NavItem key={item.to} {...item} isCollapsed={isCollapsed} />)}

                <SectionHeader label="Explore" isCollapsed={isCollapsed} />
                {explorerNavItems.map(item => <NavItem key={item.to} {...item} isCollapsed={isCollapsed} />)}
            </nav>

            <div className="p-4 mt-auto relative z-10">
                {!isCollapsed && (
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-slate-900/40 p-4">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.45),_transparent_55%)]" />
                        <div className="relative flex flex-col gap-3">
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                                <FaCrown className="h-4 w-4 text-amber-300" />
                                Upgrade to Pro
                            </span>
                            <p className="text-xs text-neutral-200/80">
                                Unlock personalized mentorship, advanced analytics, and priority support to accelerate your learning journey.
                            </p>
                            <Link to="/pricing" className="self-start">
                                <Button color="light" size="xs" className="bg-white/90 text-slate-900 hover:bg-white">
                                    Explore plans
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </motion.aside>
    );
};

export default Sidebar;