import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
    FaBook, FaProjectDiagram, FaQuestionCircle, FaPlus,
    FaThumbtack, FaShieldAlt, FaArrowsAlt, FaLaptopCode,
    FaTools, FaSearch, FaSignOutAlt, FaUser, FaCog,
    FaCompass, FaBolt
} from 'react-icons/fa';
import { Avatar, Tooltip } from 'flowbite-react';
import ThemeToggle from './ThemeToggle';

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


const UserProfile = ({ isCollapsed }) => {
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
            <motion.div whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="relative">
                    <Avatar img={currentUser?.profilePicture} rounded size="sm" />
                    <motion.div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-neutral-800" initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.5, type: 'spring' } }} />
                </div>
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }} exit={{ opacity: 0, x: -10 }} className="text-sm leading-tight">
                            <p className="font-semibold text-white truncate">{currentUser?.username || 'Guest'}</p>
                            <p className="text-xs text-neutral-400">{currentUser ? (currentUser.isAdmin ? 'Admin' : 'Member') : 'Sign In'}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
            <AnimatePresence>
                {isOpen && (
                    <motion.ul variants={menuVariants} initial="closed" animate="open" exit="closed" className="absolute bottom-full left-0 mb-2 w-48 bg-neutral-800/80 backdrop-blur-md border border-white/10 rounded-lg shadow-xl overflow-hidden">
                        <li className="p-2 text-xs text-neutral-400 border-b border-white/10">Signed in as <span className="font-semibold text-white">{currentUser?.username || 'Guest'}</span></li>
                        <MenuItem icon={FaUser} label="View Profile" onClick={() => navigate('/dashboard?tab=profile')} />
                        <MenuItem icon={FaCog} label="Settings" onClick={() => navigate('/settings')} />
                        <MenuItem icon={FaSignOutAlt} label="Sign Out" onClick={handleSignOut} isDestructive />
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};
UserProfile.propTypes = { isCollapsed: PropTypes.bool.isRequired };


const MenuItem = ({ icon: Icon, label, onClick, isDestructive = false }) => (
    <li onClick={onClick} className={`flex items-center gap-3 p-2 text-sm cursor-pointer transition-colors ${isDestructive ? 'text-red-400 hover:bg-red-500/20' : 'text-neutral-200 hover:bg-white/10'}`}>
        <Icon /><span>{label}</span>
    </li>
);
MenuItem.propTypes = { icon: PropTypes.elementType.isRequired, label: PropTypes.string.isRequired, onClick: PropTypes.func.isRequired, isDestructive: PropTypes.bool };

const NavItem = ({ to, icon: Icon, label, description, isCollapsed, variants, onHover, onLeave }) => {
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
                                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500/25 via-sky-500/15 to-transparent"
                                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                    />
                                )}
                            </AnimatePresence>
                            <div
                                className={`relative flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 p-2.5 pl-3'} rounded-xl transition-all duration-200 ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-white'}`}
                            >
                                <span
                                    className={`flex items-center justify-center rounded-xl transition-all duration-200 ${isCollapsed ? 'h-11 w-11' : 'h-10 w-10'} ${isActive ? 'bg-gradient-to-br from-sky-400 via-sky-500 to-blue-500 text-white shadow-lg shadow-sky-500/40' : 'bg-white/5 text-sky-200/80 group-hover:bg-white/10 group-hover:text-white/90'}`}
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
                                            {description && <span className="text-xs text-neutral-400/90 group-hover:text-neutral-200/90 transition-colors">{description}</span>}
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
    onLeave: PropTypes.func
};

const QuickAction = ({ to, icon: Icon, label, description }) => (
    <Link
        to={to}
        className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-3 transition-all duration-200 hover:border-sky-400/40 hover:bg-white/10"
    >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/80 via-blue-500/70 to-indigo-500/80 text-white shadow-lg shadow-sky-500/30">
            <Icon size={18} />
        </span>
        <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">{label}</span>
            {description && <span className="text-xs text-neutral-300/80">{description}</span>}
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
    description: PropTypes.string
};


const CollapsedPreview = ({ preview }) => (
    <AnimatePresence>
        {preview && (
            <motion.div
                key={preview.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-none fixed left-28 z-[60] w-60 max-w-xs overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-[0_30px_80px_-40px_rgba(14,116,144,0.6)] backdrop-blur-xl"
                style={{ top: preview.top }}
            >
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 text-white shadow-lg shadow-sky-500/30">
                        {preview.icon && React.createElement(preview.icon, { size: 18 })}
                    </span>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{preview.label}</span>
                        {preview.description && (
                            <span className="text-xs text-neutral-300/80">
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
    })
};


// --- Main Sidebar Component ---
const AdvancedSidebar = ({ isCollapsed: controlledCollapsed, isPinned: controlledPinned, setIsPinned: externalSetIsPinned }) => {
    const { currentUser } = useSelector((state) => state.user);
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

            <CollapsedPreview preview={isCollapsed ? collapsedPreview : null} />

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
                className="sidebar group fixed top-6 left-6 z-40 flex h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-900/90 p-0 shadow-[0px_40px_80px_-50px_rgba(14,116,144,0.7)] backdrop-blur-2xl"
            >
                <AnimatePresence>
                    {isCollapsed && (
                        <motion.div
                            key="collapsed-rail"
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.25 }}
                            className="pointer-events-none absolute inset-y-5 left-2 w-[3px] rounded-full bg-gradient-to-b from-sky-400/70 via-sky-500/40 to-transparent"
                        />
                    )}
                </AnimatePresence>

                <div className="pointer-events-none absolute inset-0 opacity-80">
                    <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
                    <div className="absolute -right-28 top-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
                    <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
                </div>

                <div className="relative z-10 flex h-full flex-col p-5">
                    <header className={`flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5/50 px-4 py-3 backdrop-blur-sm transition-all ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0, transition: { delay: 0.15 } }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex items-center gap-3"
                                >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-blue-600 text-lg font-bold text-white shadow-lg shadow-sky-500/40">SS</span>
                                    <Link to="/" className="text-lg font-semibold tracking-tight text-white">
                                        Scientist<span className="text-sky-300">Shield</span>
                                        <span className="block text-xs font-normal uppercase tracking-[0.35em] text-neutral-300/80">Learning Hub</span>
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="flex items-center gap-1.5">
                            {!isPinned && (
                                <Tooltip content="Drag to Move">
                                    <motion.div onPointerDown={(e) => dragControls.start(e)} className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 cursor-grab active:cursor-grabbing"><FaArrowsAlt /></motion.div>
                                </Tooltip>
                            )}
                            <Tooltip content={isPinned ? "Unpin to Move" : "Pin Sidebar"} placement="right">
                                <motion.button onClick={() => setIsPinned(!isPinned)} className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10" whileTap={{ scale: 0.9 }}><FaThumbtack className={`transition-colors ${isPinned ? 'text-sky-400' : ''}`} /></motion.button>
                            </Tooltip>
                        </div>
                    </header>

                    <div className="shrink-0 py-5">
                        <button onClick={() => setCommandMenuOpen(true)} className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-3 text-neutral-300 transition-all duration-200 hover:border-sky-400/40 hover:text-white ${isCollapsed ? 'justify-center' : ''}`}>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/80 via-blue-500/80 to-indigo-500/80 text-white shadow-lg shadow-sky-500/30">
                                <FaSearch />
                            </span>
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="flex flex-col text-left">
                                        <span className="text-sm font-semibold">Search the library</span>
                                        <span className="text-xs text-neutral-300/80">Find tutorials, quizzes, and tools</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.kbd initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }} exit={{ opacity: 0, y: 6 }} className="ml-auto rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs tracking-widest text-neutral-200">
                                        ⌘K
                                    </motion.kbd>
                                )}
                            </AnimatePresence>
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
                                            className="px-2.5 text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400"
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
                                            className="px-2.5 text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400"
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
                                    />
                                </div>
                            </div>
                        )}
                    </motion.nav>

                    {!isCollapsed && quickActions.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <span className="px-2.5 text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400">Quick Access</span>
                            <div className="space-y-2">
                                {quickActions.map((action) => (
                                    <QuickAction key={action.to} {...action} />
                                ))}
                            </div>
                        </div>
                    )}

                    <footer className="mt-auto shrink-0 space-y-4 pt-4">
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3 rounded-2xl border border-white/5 bg-white/5 p-3`}> 
                            <UserProfile isCollapsed={isCollapsed} />
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                                        <ThemeToggle className="h-11 w-11 border border-white/10 bg-slate-900/80 text-white shadow-lg shadow-sky-500/20" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {isCollapsed && (
                            <div className="flex justify-center">
                                <ThemeToggle className="h-11 w-11 border border-white/10 bg-slate-900/80 text-white shadow-lg shadow-sky-500/20" />
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