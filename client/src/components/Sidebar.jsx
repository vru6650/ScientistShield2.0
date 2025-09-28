import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
    FaBook, FaProjectDiagram, FaQuestionCircle, FaPlus,
    FaThumbtack, FaShieldAlt, FaArrowsAlt, FaLaptopCode,
    FaTools, FaSearch, FaSignOutAlt, FaUser, FaCog,
    FaCompass, FaBolt, FaPlay, FaRegCalendarCheck
} from 'react-icons/fa';
import { Avatar, Tooltip } from 'flowbite-react';
import ThemeToggle from './ThemeToggle';

const classNames = (...classes) => classes.filter(Boolean).join(' ');

const sidebarThemes = {
    dark: {
        container: {
            bg: 'bg-gradient-to-br from-[#160b2d]/95 via-[#1b1f3f]/90 to-[#050b1a]/95',
            border: 'border-white/10',
            shadow: 'shadow-[0_48px_120px_-60px_rgba(129,140,248,0.55)]',
            rail: 'from-[#fb923c]/55 via-[#f472b6]/30 to-transparent'
        },
        glows: [
            '-left-24 top-24 h-64 w-64 bg-[#fb923c]/25',
            '-right-28 top-1/3 h-72 w-72 bg-[#f472b6]/20',
            'left-1/4 bottom-0 h-56 w-56 bg-[#60a5fa]/20'
        ],
        headerBg: 'bg-white/10',
        headerBorder: 'border border-white/10',
        nav: {
            activeGlow: 'bg-gradient-to-r from-[#f97316]/25 via-[#f472b6]/20 to-transparent',
            activeText: 'text-white',
            inactiveText: 'text-neutral-300 group-hover:text-white',
            iconWrapper: 'bg-white/10 text-slate-200 group-hover:bg-white/20 group-hover:text-white',
            activeIconWrapper: 'bg-gradient-to-br from-[#f97316] via-[#f43f5e] to-[#6366f1] text-white shadow-[0_18px_38px_-18px_rgba(244,114,182,0.45)]',
            description: 'text-neutral-400/90 group-hover:text-neutral-200/90'
        },
        quickAction: {
            container: 'border-white/10 bg-white/10 hover:border-white/20 hover:bg-white/15',
            label: 'text-white',
            description: 'text-neutral-200/80'
        },
        profileCard: 'border-white/10 bg-white/10',
        tagline: 'text-neutral-300/90',
        sectionLabel: 'text-neutral-400',
        command: {
            container: 'border-white/10 bg-white/10 text-neutral-200 hover:border-white/20 hover:text-white',
            key: 'border-white/20 bg-white/5 text-neutral-100',
            description: 'text-neutral-300/80'
        },
        pinButton: 'text-neutral-300 hover:text-white hover:bg-white/10',
        dragHandle: 'text-neutral-300 hover:text-white hover:bg-white/10',
        footerCard: 'border-white/10 bg-white/10',
        themeToggle: 'border border-white/10 bg-slate-900/80 text-white shadow-[0_18px_38px_-18px_rgba(15,23,42,0.65)]',
        activeTask: {
            gradient: 'bg-gradient-to-br from-[#f97316] via-[#f43f5e] to-[#6366f1]',
            text: 'text-white',
            button: 'bg-white/20 text-white hover:bg-white/30',
            iconHalo: 'bg-white/30',
            buttonRing: 'focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'
        },
        collapsedTaskButton: 'bg-gradient-to-br from-[#f97316] via-[#f43f5e] to-[#6366f1] text-white shadow-[0_22px_45px_-18px_rgba(244,114,182,0.45)]',
        preview: {
            container: 'bg-[#0f172a]/95 border border-white/10 text-white shadow-[0_30px_80px_-40px_rgba(124,58,237,0.6)]',
            title: 'text-white',
            description: 'text-neutral-300/80'
        },
        menu: {
            background: 'bg-neutral-900/95 border border-white/10',
            text: 'text-neutral-200',
            destructive: 'text-red-400 hover:bg-red-500/20'
        }
    },
    light: {
        container: {
            bg: 'bg-gradient-to-br from-[#fff5e8]/95 via-[#fde4f2]/90 to-[#e5f1ff]/95',
            border: 'border-white/60',
            shadow: 'shadow-[0_48px_110px_-60px_rgba(253,186,116,0.45)]',
            rail: 'from-[#fb923c]/70 via-[#f472b6]/30 to-transparent'
        },
        glows: [
            '-left-24 top-20 h-64 w-64 bg-[#fb923c]/35',
            '-right-28 top-1/3 h-72 w-72 bg-[#f472b6]/25',
            'left-1/3 bottom-0 h-52 w-52 bg-[#60a5fa]/25'
        ],
        headerBg: 'bg-white/70',
        headerBorder: 'border border-white/70',
        nav: {
            activeGlow: 'bg-gradient-to-r from-[#fb923c]/25 via-[#f472b6]/20 to-transparent',
            activeText: 'text-slate-900',
            inactiveText: 'text-slate-500 group-hover:text-slate-900',
            iconWrapper: 'bg-white/80 text-slate-500 group-hover:bg-white group-hover:text-slate-900',
            activeIconWrapper: 'bg-gradient-to-br from-[#fb923c] via-[#f472b6] to-[#6366f1] text-white shadow-[0_18px_38px_-18px_rgba(244,114,182,0.45)]',
            description: 'text-slate-400 group-hover:text-slate-600'
        },
        quickAction: {
            container: 'border-white/70 bg-white/80 hover:border-[#fbcfe8] hover:bg-white',
            label: 'text-slate-800',
            description: 'text-slate-500'
        },
        profileCard: 'border-white/70 bg-white/70',
        tagline: 'text-slate-500',
        sectionLabel: 'text-slate-500',
        command: {
            container: 'border-white/70 bg-white/80 text-slate-600 hover:border-[#fbcfe8] hover:text-slate-900',
            key: 'border-slate-200 bg-white text-slate-500',
            description: 'text-slate-500'
        },
        pinButton: 'text-slate-500 hover:text-slate-900 hover:bg-white/70',
        dragHandle: 'text-slate-500 hover:text-slate-900 hover:bg-white/70',
        footerCard: 'border-white/70 bg-white/80',
        themeToggle: 'border border-white/70 bg-white text-slate-700 shadow-[0_18px_38px_-18px_rgba(148,163,184,0.35)]',
        activeTask: {
            gradient: 'bg-gradient-to-br from-[#fb923c] via-[#f472b6] to-[#6366f1]',
            text: 'text-white',
            button: 'bg-white/30 text-white hover:bg-white/40',
            iconHalo: 'bg-white/30',
            buttonRing: 'focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'
        },
        collapsedTaskButton: 'bg-gradient-to-br from-[#fb923c] via-[#f472b6] to-[#6366f1] text-white shadow-[0_22px_45px_-18px_rgba(244,114,182,0.45)]',
        preview: {
            container: 'bg-white/95 border border-slate-200 text-slate-700 shadow-[0_30px_80px_-40px_rgba(251,146,60,0.35)]',
            title: 'text-slate-800',
            description: 'text-slate-500'
        },
        menu: {
            background: 'bg-white/95 border border-slate-200',
            text: 'text-slate-600',
            destructive: 'text-rose-500 hover:bg-rose-100'
        }
    }
};

// --- Configuration ---
const navConfig = [
    {
        title: 'Main',
        items: [
            {
                to: '/tutorials',
                label: 'Tutorials',
                description: 'Curated learning paths & chapters',
                icon: FaBook
            },
            {
                to: '/quizzes',
                label: 'Quizzes',
                description: 'Assessments to validate progress',
                icon: FaQuestionCircle
            },
            {
                to: '/projects',
                label: 'Projects',
                description: 'Hands-on builds & case studies',
                icon: FaProjectDiagram
            },
        ]
    },
    {
        title: 'Workspace',
        items: [
            {
                to: '/tools',
                label: 'Tools Hub',
                description: 'Productivity boosters & utilities',
                icon: FaTools
            },
            {
                to: '/visualizer',
                label: 'Code Visualizer',
                description: 'Step through algorithms in real time',
                icon: FaLaptopCode
            },
        ]
    },
];

// --- Child Components ---

const CommandMenu = ({ isOpen, setIsOpen }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const commands = [
        { type: 'link', to: '/tutorials', label: 'Tutorials', icon: FaBook },
        { type: 'link', to: '/quizzes', label: 'Quizzes', icon: FaQuestionCircle },
        { type: 'link', to: '/projects', label: 'Projects', icon: FaProjectDiagram },
        { type: 'action', label: 'Create New Post', icon: FaPlus, action: () => console.log('Create Post') },
    ];

    const filteredCommands = commands.filter(cmd =>
        cmd.label?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onKeyDown = useCallback((e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsOpen(!isOpen);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    }, [isOpen, setIsOpen]);

    useEffect(() => {
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onKeyDown]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50"
                    onClick={() => setIsOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-neutral-800/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 border-b border-white/10 p-4">
                            <FaSearch className="text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search for pages or actions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent text-white placeholder-neutral-400 focus:ring-0 border-0"
                                autoFocus
                            />
                        </div>
                        <div className="p-2 max-h-80 overflow-y-auto">
                            {filteredCommands.map((cmd, i) => (
                                <Link to={cmd.to || '#'} key={i} className="block" onClick={() => setIsOpen(false)}>
                                    <motion.div
                                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                                        className="flex items-center gap-4 p-3 rounded-lg text-sm text-neutral-200"
                                    >
                                        {cmd.icon && <cmd.icon />}
                                        <span>{cmd.label}</span>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
CommandMenu.propTypes = { isOpen: PropTypes.bool.isRequired, setIsOpen: PropTypes.func.isRequired };


const UserProfile = ({ isCollapsed, isDark }) => {
    const { currentUser } = useSelector((state) => state.user);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleSignOut = () => { navigate('/sign-in'); };

    const menuVariants = {
        open: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
        closed: { opacity: 0, y: -20, transition: { duration: 0.2 } }
    };

    return (
        <div className="relative">
            <motion.div
                whileHover={isDark ? { backgroundColor: 'rgba(255, 255, 255, 0.1)' } : { backgroundColor: 'rgba(15, 23, 42, 0.06)' }}
                onClick={() => setIsOpen(!isOpen)}
                className={classNames('flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors', isCollapsed ? 'justify-center' : '', isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100/80')}
            >
                <div className="relative">
                    <Avatar img={currentUser?.profilePicture} rounded size="sm" />
                    <motion.div className={classNames('absolute bottom-0 right-0 w-3 h-3 rounded-full border-2', isDark ? 'bg-green-400 border-neutral-800' : 'bg-emerald-400 border-white')} initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.5, type: 'spring' } }} />
                </div>
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }} exit={{ opacity: 0, x: -10 }} className="text-sm leading-tight">
                            <p className={classNames('font-semibold truncate', isDark ? 'text-white' : 'text-slate-800')}>{currentUser?.username || 'Guest'}</p>
                            <p className={classNames('text-xs', isDark ? 'text-neutral-400' : 'text-slate-500')}>{currentUser ? (currentUser.isAdmin ? 'Admin' : 'Member') : 'Sign In'}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        variants={menuVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className={classNames('absolute bottom-full left-0 mb-2 w-52 overflow-hidden rounded-xl backdrop-blur-md shadow-xl', isDark ? 'bg-neutral-900/95 border border-white/10' : 'bg-white/95 border border-slate-200')}
                    >
                        <li className={classNames('p-3 text-xs border-b', isDark ? 'text-neutral-400 border-white/10' : 'text-slate-500 border-slate-200/80')}>
                            Signed in as <span className={classNames('font-semibold', isDark ? 'text-white' : 'text-slate-800')}>{currentUser?.username || 'Guest'}</span>
                        </li>
                        <MenuItem icon={FaUser} label="View Profile" onClick={() => navigate('/dashboard?tab=profile')} isDark={isDark} />
                        <MenuItem icon={FaCog} label="Settings" onClick={() => navigate('/settings')} isDark={isDark} />
                        <MenuItem icon={FaSignOutAlt} label="Sign Out" onClick={handleSignOut} isDestructive isDark={isDark} />
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};
UserProfile.propTypes = { isCollapsed: PropTypes.bool.isRequired, isDark: PropTypes.bool.isRequired };


const MenuItem = ({ icon: Icon, label, onClick, isDestructive = false, isDark }) => {
    const destructiveClass = isDark ? 'text-red-400 hover:bg-red-500/20' : 'text-rose-500 hover:bg-rose-100';
    const defaultClass = isDark ? 'text-neutral-200 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100';

    return (
        <li
            onClick={onClick}
            className={classNames('flex items-center gap-3 p-2 text-sm cursor-pointer transition-colors', isDestructive ? destructiveClass : defaultClass)}
        >
            <Icon /><span>{label}</span>
        </li>
    );
};
MenuItem.propTypes = { icon: PropTypes.elementType.isRequired, label: PropTypes.string.isRequired, onClick: PropTypes.func.isRequired, isDestructive: PropTypes.bool, isDark: PropTypes.bool };

const NavItem = ({ to, icon: Icon, label, description, isCollapsed, variants, onHover, onLeave, themeConfig }) => {
    const itemRef = useRef(null);

    const handleHover = useCallback(() => {
        if (isCollapsed && onHover && itemRef.current) {
            onHover({ label, description, icon: Icon }, itemRef.current);
        }
    }, [Icon, description, isCollapsed, label, onHover]);

    const handleLeave = useCallback(() => {
        if (onLeave) {
            onLeave();
        }
    }, [onLeave]);

    return (
        <motion.div
            ref={itemRef}
            variants={variants}
            onMouseEnter={handleHover}
            onFocus={handleHover}
            onMouseLeave={handleLeave}
            onBlur={handleLeave}
        >
            <Tooltip content={label} placement="right" disabled={!isCollapsed}>
                <NavLink to={to} className="group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent">
                    {({ isActive }) => (
                        <>
                            <AnimatePresence>
                                {isActive && (
                                    <motion.span
                                        layoutId="sidebar-active-card"
                                        className={classNames('absolute inset-0 rounded-xl', themeConfig.nav.activeGlow)}
                                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                    />
                                )}
                            </AnimatePresence>
                            <div
                                className={classNames(
                                    'relative flex items-center rounded-xl transition-all duration-200',
                                    isCollapsed ? 'justify-center p-2.5' : 'gap-3 p-2.5 pl-3',
                                    isActive ? themeConfig.nav.activeText : themeConfig.nav.inactiveText
                                )}
                            >
                                <span
                                    className={classNames(
                                        'flex items-center justify-center rounded-xl transition-all duration-200',
                                        isCollapsed ? 'h-11 w-11' : 'h-10 w-10',
                                        isActive ? themeConfig.nav.activeIconWrapper : themeConfig.nav.iconWrapper
                                    )}
                                >
                                    <Icon size={isCollapsed ? 22 : 18} />
                                </span>
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -8 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col"
                                        >
                                            <span className="font-medium leading-tight">{label}</span>
                                            {description && <span className={classNames('text-xs transition-colors', themeConfig.nav.description)}>{description}</span>}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </NavLink>
            </Tooltip>
        </motion.div>
    );
};
NavItem.propTypes = {
    to: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    isCollapsed: PropTypes.bool.isRequired,
    variants: PropTypes.object,
    onHover: PropTypes.func,
    onLeave: PropTypes.func,
    themeConfig: PropTypes.object.isRequired
};

const QuickAction = ({ to, icon: Icon, label, description, themeConfig }) => (
    <Link
        to={to}
        className={classNames('relative flex items-center gap-3 overflow-hidden rounded-2xl p-3 transition-all duration-200', themeConfig.quickAction.container)}
    >
        <span className={classNames('flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-[0_18px_38px_-18px_rgba(244,114,182,0.45)]', themeConfig.activeTask.gradient)}>
            <Icon size={18} />
        </span>
        <div className="flex flex-col">
            <span className={classNames('text-sm font-semibold', themeConfig.quickAction.label)}>{label}</span>
            {description && <span className={classNames('text-xs', themeConfig.quickAction.description)}>{description}</span>}
        </div>
        <motion.span
            aria-hidden
            className="pointer-events-none absolute -right-8 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-sky-500/10 blur-2xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
        />
    </Link>
);
QuickAction.propTypes = {
    to: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    themeConfig: PropTypes.object.isRequired
};


const ActiveTaskCard = ({ isCollapsed, themeConfig }) => {
    if (isCollapsed) {
        return (
            <Tooltip content="Resume Active Task" placement="right">
                <Link
                    to="/dashboard?tab=tasks"
                    className={classNames('flex h-12 w-12 items-center justify-center rounded-2xl transition-transform hover:-translate-y-0.5 focus:outline-none', themeConfig.collapsedTaskButton, themeConfig.activeTask.buttonRing)}
                >
                    <FaPlay className="text-sm" />
                </Link>
            </Tooltip>
        );
    }

    return (
        <motion.div
            layout
            className={classNames('relative overflow-hidden rounded-3xl p-5 text-sm', themeConfig.activeTask.gradient, themeConfig.activeTask.text)}
            whileHover={{ translateY: -2 }}
        >
            <div className="absolute inset-0 opacity-60">
                <div className={classNames('absolute -left-6 top-6 h-24 w-24 rounded-full blur-3xl', themeConfig.activeTask.iconHalo)} />
                <div className={classNames('absolute -right-4 bottom-0 h-28 w-28 rounded-full blur-3xl', themeConfig.activeTask.iconHalo)} />
            </div>

            <div className="relative flex items-start gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white">
                    <FaRegCalendarCheck />
                    <span className={classNames('absolute -inset-1 rounded-2xl blur-lg opacity-60', themeConfig.activeTask.iconHalo)} />
                </div>
                <div className="flex-1">
                    <p className="text-[11px] uppercase tracking-[0.35em] opacity-90">Active Task</p>
                    <h4 className="text-lg font-semibold leading-tight">Build Neural Security Scanner</h4>
                    <p className="mt-1 text-xs opacity-90">Continue lesson 4 · Interface hardening</p>
                </div>
            </div>

            <div className="relative mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs opacity-90">
                    <span className="flex h-2 w-2 rounded-full bg-white/80" />
                    <span>Due today · 45% done</span>
                </div>
                <Link
                    to="/dashboard?tab=tasks"
                    className={classNames('inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors focus:outline-none', themeConfig.activeTask.button, themeConfig.activeTask.buttonRing)}
                >
                    Resume
                    <FaPlay className="text-[10px]" />
                </Link>
            </div>
        </motion.div>
    );
};
ActiveTaskCard.propTypes = {
    isCollapsed: PropTypes.bool.isRequired,
    themeConfig: PropTypes.object.isRequired
};


const CollapsedPreview = ({ preview, themeConfig }) => (
    <AnimatePresence>
        {preview && (
            <motion.div
                key={preview.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className={classNames('pointer-events-none fixed left-28 z-[60] w-60 max-w-xs overflow-hidden rounded-2xl p-4 backdrop-blur-xl', themeConfig.preview.container)}
                style={{ top: preview.top }}
            >
                <div className="flex items-center gap-3">
                    <span className={classNames('flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-[0_18px_38px_-18px_rgba(244,114,182,0.45)]', themeConfig.activeTask.gradient)}>
                        {preview.icon && React.createElement(preview.icon, { size: 18 })}
                    </span>
                    <div className="flex flex-col">
                        <span className={classNames('text-sm font-semibold', themeConfig.preview.title)}>{preview.label}</span>
                        {preview.description && (
                            <span className={classNames('text-xs', themeConfig.preview.description)}>
                                {preview.description}
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);
CollapsedPreview.propTypes = {
    preview: PropTypes.shape({
        label: PropTypes.string,
        description: PropTypes.string,
        icon: PropTypes.elementType,
        top: PropTypes.number
    }),
    themeConfig: PropTypes.object.isRequired
};


// --- Main Sidebar Component ---
const AdvancedSidebar = ({ isCollapsed: controlledCollapsed, isPinned: controlledPinned, setIsPinned: externalSetIsPinned }) => {
    const { currentUser } = useSelector((state) => state.user);
    const { theme } = useSelector((state) => state.theme);
    const [internalCollapsed, setInternalCollapsed] = useState(() => window.innerWidth < 768);
    const [internalPinned, setInternalPinned] = useState(true);
    const [isCommandMenuOpen, setCommandMenuOpen] = useState(false);
    const [collapsedPreview, setCollapsedPreview] = useState(null);
    const dragControls = useDragControls();

    const isCollapseControlled = typeof controlledCollapsed === 'boolean';
    const isPinnedControlled = typeof controlledPinned === 'boolean';

    const isCollapsed = isCollapseControlled ? controlledCollapsed : internalCollapsed;
    const isPinned = isPinnedControlled ? controlledPinned : internalPinned;
    const setIsPinned = externalSetIsPinned || setInternalPinned;
    const isDark = theme === 'dark';
    const themeConfig = sidebarThemes[isDark ? 'dark' : 'light'];
    const quickActions = [
        {
            to: '/dashboard',
            label: 'Dashboard Overview',
            description: 'Resume where you left off',
            icon: FaCompass
        },
        {
            to: '/tryit',
            label: 'Interactive Playground',
            description: 'Experiment with ideas in real time',
            icon: FaBolt
        },
        ...(currentUser?.isAdmin
            ? [{
                to: '/create-post',
                label: 'Create New Content',
                description: 'Launch tutorials and resources',
                icon: FaPlus
            }]
            : [])
    ];

    const updateCollapsed = useCallback((value) => {
        if (!isCollapseControlled) {
            setInternalCollapsed(value);
        }
    }, [isCollapseControlled]);

    const handleMouseEnter = useCallback(() => {
        if (!isPinned && !isCollapseControlled) {
            updateCollapsed(false);
        }
    }, [isPinned, isCollapseControlled, updateCollapsed]);

    const handleMouseLeave = useCallback(() => {
        if (!isPinned && !isCollapseControlled) {
            updateCollapsed(true);
        }
    }, [isPinned, isCollapseControlled, updateCollapsed]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                if (!isCollapseControlled) {
                    setInternalCollapsed(true);
                }
                if (!isPinnedControlled) {
                    setInternalPinned(true);
                }
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isCollapseControlled, isPinnedControlled]);

    useEffect(() => {
        if (!isCollapsed) {
            setCollapsedPreview(null);
        }
    }, [isCollapsed]);

    useEffect(() => {
        if (!collapsedPreview) return;
        const handleScroll = () => setCollapsedPreview(null);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [collapsedPreview]);

    const showCollapsedPreview = useCallback((item, node) => {
        if (!node || !isCollapsed) return;
        const rect = node.getBoundingClientRect();
        const verticalCenter = rect.top + rect.height / 2;
        const top = Math.min(
            window.innerHeight - 140,
            Math.max(96, verticalCenter - 36)
        );

        setCollapsedPreview({
            label: item.label,
            description: item.description,
            icon: item.icon,
            top
        });
    }, [isCollapsed]);

    const clearCollapsedPreview = useCallback(() => {
        setCollapsedPreview(null);
    }, []);

    const overlayActive = !isPinned && !isCollapsed;

    const containerVariants = {
        open: { width: '18rem', transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } },
        closed: { width: '5.5rem', transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } }
    };

    const navItemsVariants = {
        open: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
        closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
    };

    const navItemVariant = {
        open: { y: 0, opacity: 1, transition: { y: { stiffness: 1000, velocity: -100 } } },
        closed: { y: 50, opacity: 0, transition: { y: { stiffness: 1000 } } }
    };

    return (
        <>
            <CommandMenu isOpen={isCommandMenuOpen} setIsOpen={setCommandMenuOpen} />
            {overlayActive && (
                <motion.div
                    className="fixed inset-0 z-30 bg-black/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />
            )}

            <CollapsedPreview preview={isCollapsed ? collapsedPreview : null} themeConfig={themeConfig} />

            <motion.aside
                drag={!isPinned}
                dragControls={dragControls}
                dragConstraints={{ top: 16, left: 16, right: window.innerWidth - 300, bottom: window.innerHeight - 500 }}
                dragElastic={0.1}
                variants={containerVariants}
                initial={false}
                animate={isCollapsed ? 'closed' : 'open'}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={classNames(
                    'sidebar group fixed top-6 left-6 z-40 flex h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-3xl p-0 backdrop-blur-2xl',
                    themeConfig.container.bg,
                    themeConfig.container.border,
                    themeConfig.container.shadow
                )}
            >
                <AnimatePresence>
                    {isCollapsed && (
                        <motion.div
                            key="collapsed-rail"
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.25 }}
                            className={classNames('pointer-events-none absolute inset-y-5 left-2 w-[3px] rounded-full bg-gradient-to-b', themeConfig.container.rail)}
                        />
                    )}
                </AnimatePresence>

                <div className="pointer-events-none absolute inset-0 opacity-90">
                    {themeConfig.glows.map((glow, index) => (
                        <div key={index} className={classNames('absolute rounded-full blur-3xl', glow)} />
                    ))}
                </div>

                <div className="relative z-10 flex h-full flex-col p-5">
                    <header
                        className={classNames(
                            'flex items-center gap-3 rounded-2xl px-4 py-3 backdrop-blur-md transition-all',
                            themeConfig.headerBorder,
                            themeConfig.headerBg,
                            isCollapsed ? 'justify-center' : 'justify-between'
                        )}
                    >
                        <div className={classNames('flex items-center', isCollapsed ? 'gap-3' : 'gap-4')}>
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
                                <span className="h-2.5 w-2.5 rounded-full bg-[#facc15]" />
                                <span className="h-2.5 w-2.5 rounded-full bg-[#4ade80]" />
                            </div>
                            <motion.span
                                layout
                                className={classNames('flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-semibold uppercase tracking-tight text-white shadow-[0_18px_38px_-18px_rgba(244,114,182,0.45)]', themeConfig.activeTask.gradient)}
                            >
                                SS
                            </motion.span>
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0, transition: { delay: 0.15 } }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="flex flex-col"
                                    >
                                        <Link to="/" className="text-left">
                                            <span className={classNames('text-lg font-semibold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                                                Scientist<span className="bg-gradient-to-r from-[#fb923c] via-[#f472b6] to-[#6366f1] bg-clip-text text-transparent">Shield</span>
                                            </span>
                                            <span className={classNames('block text-xs font-medium uppercase tracking-[0.35em]', themeConfig.tagline)}>
                                                Learning hub
                                            </span>
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {!isPinned && (
                                <Tooltip content="Drag to Move">
                                    <motion.button
                                        type="button"
                                        onPointerDown={(e) => dragControls.start(e)}
                                        className={classNames('cursor-grab rounded-full p-2 transition-colors active:cursor-grabbing', themeConfig.dragHandle)}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <FaArrowsAlt />
                                    </motion.button>
                                </Tooltip>
                            )}
                            <Tooltip content={isPinned ? "Unpin to Move" : "Pin Sidebar"} placement="right">
                                <motion.button
                                    type="button"
                                    onClick={() => setIsPinned(!isPinned)}
                                    className={classNames('rounded-full p-2 transition-colors', themeConfig.pinButton)}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <FaThumbtack className={classNames('transition-colors', isPinned ? 'text-amber-200' : '')} />
                                </motion.button>
                            </Tooltip>
                        </div>
                    </header>

                    <div className="shrink-0 py-5">
                        <button
                            onClick={() => setCommandMenuOpen(true)}
                            className={classNames('group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl p-3 transition-all duration-200', themeConfig.command.container, isCollapsed ? 'justify-center' : '')}
                        >
                            <span className={classNames('flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-[0_18px_38px_-18px_rgba(244,114,182,0.45)]', themeConfig.activeTask.gradient)}>
                                <FaSearch />
                            </span>
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -8 }}
                                        className="flex flex-col text-left"
                                    >
                                        <span className={classNames('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                                            Search the library
                                        </span>
                                        <span className={classNames('text-xs', themeConfig.command.description)}>Find tutorials, quizzes, and tools</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.kbd
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                                        exit={{ opacity: 0, y: 6 }}
                                        className={classNames('ml-auto rounded-lg px-2 py-1 text-xs tracking-widest', themeConfig.command.key)}
                                    >
                                        ⌘K
                                    </motion.kbd>
                                )}
                            </AnimatePresence>
                            <motion.span
                                aria-hidden
                                className={classNames('pointer-events-none absolute -right-10 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full blur-3xl transition-opacity', isDark ? 'bg-white/10' : 'bg-[#fbcfe8]/60')}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                            />
                        </button>
                    </div>

                    <motion.nav variants={navItemsVariants} className="custom-scrollbar flex-1 space-y-5 overflow-y-auto py-1 pr-1">
                        {navConfig.map(section => (
                            <div key={section.title} className="space-y-3">
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                                            exit={{ opacity: 0, y: -6 }}
                                            className={classNames('px-2.5 text-xs font-semibold uppercase tracking-[0.35em]', themeConfig.sectionLabel)}
                                        >
                                            {section.title}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                <div className="space-y-1.5">
                                    {section.items.map(item => (
                                        <NavItem
                                            key={item.to}
                                            {...item}
                                            isCollapsed={isCollapsed}
                                            variants={navItemVariant}
                                            onHover={showCollapsedPreview}
                                            onLeave={clearCollapsedPreview}
                                            themeConfig={themeConfig}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                        {currentUser?.isAdmin && (
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                                            exit={{ opacity: 0, y: -6 }}
                                            className={classNames('px-2.5 text-xs font-semibold uppercase tracking-[0.35em]', themeConfig.sectionLabel)}
                                        >
                                            Admin
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                <div className="space-y-1.5">
                                    <NavItem
                                        to="/create-post"
                                        icon={FaPlus}
                                        label="New Post"
                                        description="Publish fresh knowledge"
                                        isCollapsed={isCollapsed}
                                        variants={navItemVariant}
                                        onHover={showCollapsedPreview}
                                        onLeave={clearCollapsedPreview}
                                        themeConfig={themeConfig}
                                    />
                                    <NavItem
                                        to="/dashboard?tab=users"
                                        icon={FaShieldAlt}
                                        label="Manage Users"
                                        description="Moderate members & roles"
                                        isCollapsed={isCollapsed}
                                        variants={navItemVariant}
                                        onHover={showCollapsedPreview}
                                        onLeave={clearCollapsedPreview}
                                        themeConfig={themeConfig}
                                    />
                                </div>
                            </div>
                        )}
                    </motion.nav>

                    {!isCollapsed && quickActions.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <span className={classNames('px-2.5 text-xs font-semibold uppercase tracking-[0.35em]', themeConfig.sectionLabel)}>Quick Access</span>
                            <div className="space-y-2">
                                {quickActions.map((action) => (
                                    <QuickAction key={action.to} {...action} themeConfig={themeConfig} />
                                ))}
                            </div>
                        </div>
                    )}

                    <footer className="mt-auto shrink-0 space-y-4 pt-4">
                        <div className={classNames(isCollapsed ? 'flex justify-center' : '')}>
                            <ActiveTaskCard isCollapsed={isCollapsed} themeConfig={themeConfig} />
                        </div>
                        <div className={classNames('flex items-center gap-3 rounded-2xl p-3', themeConfig.footerCard, isCollapsed ? 'justify-center' : 'justify-between')}>
                            <UserProfile isCollapsed={isCollapsed} isDark={isDark} />
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                                        <ThemeToggle className={classNames('h-11 w-11', themeConfig.themeToggle)} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {isCollapsed && (
                            <div className="flex justify-center">
                                <ThemeToggle className={classNames('h-11 w-11', themeConfig.themeToggle)} />
                            </div>
                        )}
                    </footer>
                </div>
            </motion.aside>
        </>
    );
};

AdvancedSidebar.propTypes = {
    isCollapsed: PropTypes.bool,
    isPinned: PropTypes.bool,
    setIsPinned: PropTypes.func
};

export default AdvancedSidebar;