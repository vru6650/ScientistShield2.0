import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    FaBook, FaProjectDiagram, FaQuestionCircle, FaPlus,
    FaThumbtack, FaShieldAlt, FaArrowsAlt, FaLaptopCode,
    FaTools, FaSearch, FaSignOutAlt, FaUser, FaCog, FaMoon, FaSun
} from 'react-icons/fa';
import { Avatar, Tooltip } from 'flowbite-react';

// --- Configuration ---
const navConfig = [
    {
        title: 'Main',
        items: [
            { to: '/tutorials', label: 'Tutorials', icon: FaBook },
            { to: '/quizzes', label: 'Quizzes', icon: FaQuestionCircle },
            { to: '/projects', label: 'Projects', icon: FaProjectDiagram },
        ]
    },
    {
        title: 'Workspace',
        items: [
            { to: '/tools', label: 'Tools Hub', icon: FaTools },
            { to: '/visualizer', label: 'Code Visualizer', icon: FaLaptopCode },
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

const NavItem = ({ to, icon: Icon, label, isCollapsed, variants }) => (
    <motion.div variants={variants}>
        <Tooltip content={label} placement="right" disabled={!isCollapsed}>
            <NavLink to={to} className={({ isActive }) => `relative flex items-center gap-4 p-2.5 rounded-lg transition-colors text-sm ${isActive ? 'bg-sky-500/20 text-sky-300' : 'text-neutral-400 hover:bg-white/10 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}>
                {({ isActive }) => (
                    <>
                        <AnimatePresence>{isActive && <motion.div layoutId="active-nav-indicator" className="absolute left-0 top-2 bottom-2 w-1 bg-sky-400 rounded-r-full" />}</AnimatePresence>
                        <motion.div whileHover={{ scale: 1.1, rotate: 5 }}><Icon size={isCollapsed ? 22 : 18} /></motion.div>
                        <AnimatePresence>{!isCollapsed && <span className="whitespace-nowrap">{label}</span>}</AnimatePresence>
                    </>
                )}
            </NavLink>
        </Tooltip>
    </motion.div>
);
NavItem.propTypes = { to: PropTypes.string.isRequired, icon: PropTypes.elementType.isRequired, label: PropTypes.string.isRequired, isCollapsed: PropTypes.bool.isRequired, variants: PropTypes.object };


// --- Main Sidebar Component ---
const AdvancedSidebar = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);
    const [isPinned, setIsPinned] = useState(true);
    const [isCommandMenuOpen, setCommandMenuOpen] = useState(false);
    const dragControls = useDragControls();

    const handleMouseEnter = () => !isPinned && setIsCollapsed(false);
    const handleMouseLeave = () => !isPinned && setIsCollapsed(true);

    useEffect(() => {
        const handleResize = () => { if (window.innerWidth < 768) { setIsCollapsed(true); setIsPinned(true); } };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            {!isPinned && !isCollapsed && <motion.div className="fixed inset-0 bg-black/30 z-30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}

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
                className="sidebar fixed top-4 left-4 z-40 h-[calc(100vh-2rem)] flex flex-col bg-neutral-900/60 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden"
            >
                <div className="aurora-bg" />

                <div className="relative z-10 flex flex-col h-full p-4">
                    <header className={`flex items-center gap-3 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'} py-2`}>
                        <AnimatePresence>{!isCollapsed && <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }} exit={{ opacity: 0, x: -20 }}><Link to="/" className="text-lg font-bold text-white">Scientist<span className="text-sky-400">Shield</span></Link></motion.div>}</AnimatePresence>
                        <div className="flex items-center">
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

                    <div className="py-4 shrink-0">
                        <button onClick={() => setCommandMenuOpen(true)} className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 ${isCollapsed ? 'justify-center' : ''}`}>
                            <FaSearch />
                            <AnimatePresence>
                                {!isCollapsed && <motion.span initial={{opacity:0}} animate={{opacity:1, transition: {delay: 0.2}}} exit={{opacity:0}} className="text-sm">Search...</motion.span>}
                            </AnimatePresence>
                            <AnimatePresence>
                                {!isCollapsed && <motion.kbd initial={{opacity:0}} animate={{opacity:1, transition: {delay: 0.3}}} exit={{opacity:0}} className="ml-auto text-xs border rounded px-1.5 py-0.5 border-white/20">⌘K</motion.kbd>}
                            </AnimatePresence>
                        </button>
                    </div>

                    <motion.nav variants={navItemsVariants} className="flex-1 flex flex-col gap-2 overflow-y-auto py-2 custom-scrollbar">
                        {navConfig.map(section => (
                            <div key={section.title} className="space-y-2">
                                <AnimatePresence>{!isCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }} exit={{ opacity: 0 }} className="px-2.5 text-xs font-bold uppercase text-neutral-500 tracking-wider">{section.title}</motion.span>}</AnimatePresence>
                                {section.items.map(item => <NavItem key={item.to} {...item} isCollapsed={isCollapsed} variants={navItemVariant} />)}
                            </div>
                        ))}
                        {currentUser?.isAdmin && (
                            <div className="space-y-2">
                                <AnimatePresence>{!isCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }} exit={{ opacity: 0 }} className="px-2.5 text-xs font-bold uppercase text-neutral-500 tracking-wider">Admin</motion.span>}</AnimatePresence>
                                <NavItem to="/create-post" icon={FaPlus} label="New Post" isCollapsed={isCollapsed} variants={navItemVariant}/>
                                <NavItem to="/dashboard?tab=users" icon={FaShieldAlt} label="Manage Users" isCollapsed={isCollapsed} variants={navItemVariant}/>
                            </div>
                        )}
                    </motion.nav>

                    <footer className="mt-auto space-y-3 shrink-0">
                        <UserProfile isCollapsed={isCollapsed} />
                    </footer>
                </div>
            </motion.aside>
        </>
    );
};

export default AdvancedSidebar;