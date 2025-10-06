// client/src/components/Header.jsx
import { Avatar, Tooltip } from 'flowbite-react';
import { Link, useLocation } from 'react-router-dom';
import { AiOutlineSearch } from 'react-icons/ai';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useEffect, useState, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { HiOutlineBars3, HiOutlineXMark, HiOutlinePencilSquare } from 'react-icons/hi2';

import { signoutSuccess } from '../redux/user/userSlice';
import CommandMenu from './CommandMenu';
import LogoutConfirmationModal from './LogoutConfirmationModal';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';

// --- Reusable Components ---

function Magnetic({ children }) {
    const ref = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (event) => {
        if (!ref.current) {
            return;
        }

        const { clientX, clientY } = event;
        const { height, width, left, top } = ref.current.getBoundingClientRect();
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        setPosition({ x: middleX * 0.1, y: middleY * 0.1 });
    };

    const reset = () => setPosition({ x: 0, y: 0 });
    const { x, y } = position;

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            animate={{ x, y }}
            transition={{ type: 'spring', stiffness: 350, damping: 5, mass: 0.5 }}
        >
            {children}
        </motion.div>
    );
}

Magnetic.propTypes = {
    children: PropTypes.node.isRequired,
};

const spotlightColors = {
    light: 'rgba(108, 133, 255, 0.18)',
    dark: 'rgba(142, 166, 255, 0.18)',
};

const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Projects', path: '/projects' },
    { label: 'Tools', path: '/tools' },
    { label: 'Problem Solving', path: '/problems' },
    { label: 'Code Visualizer', path: '/visualizer' },
];

// --- Main Header Component ---
export default function Header() {
    const path = useLocation().pathname;
    const dispatch = useDispatch();
    const { currentUser } = useSelector((state) => state.user);
    const { theme } = useSelector((state) => state.theme);
    const prefersReducedMotion = usePrefersReducedMotion();

    const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);

    const { scrollY } = useScroll();
    const headerRef = useRef(null);

    const handleMouseMove = (event) => {
        if (!headerRef.current) {
            return;
        }

        const { clientX, clientY } = event;
        const { left, top } = headerRef.current.getBoundingClientRect();
        headerRef.current.style.setProperty('--mouse-x', `${clientX - left}px`);
        headerRef.current.style.setProperty('--mouse-y', `${clientY - top}px`);
    };

    useMotionValueEvent(scrollY, 'change', (latest) => {
        const previous = scrollY.getPrevious();
        if (latest > previous && latest > 150) {
            setIsHeaderVisible(false);
        } else {
            setIsHeaderVisible(true);
        }
    });

    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setIsCommandMenuOpen(true);
            }

            if (event.key === 'Escape') {
                setIsDropdownOpen(false);
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [path]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent background scroll when the mobile menu is open for better focus/UX
    useEffect(() => {
        if (isMobileMenuOpen) {
            const original = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = original;
            };
        }
        return undefined;
    }, [isMobileMenuOpen]);

    const handleSignout = async () => {
        setIsSigningOut(true);
        try {
            await fetch('/api/user/signout', { method: 'POST' });
            dispatch(signoutSuccess());
        } catch (error) {
            console.log(error.message);
        } finally {
            setIsSigningOut(false);
            setIsLogoutModalOpen(false);
        }
    };

    const confirmSignout = () => {
        setIsDropdownOpen(false);
        setIsLogoutModalOpen(true);
    };

    const dropdownVariants = useMemo(() => {
        const d = prefersReducedMotion ? 0 : 0.2;
        return {
            hidden: { opacity: 0, scale: 0.9, y: -10 },
            visible: {
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { duration: d },
            },
            exit: { opacity: 0, scale: 0.9, y: -10, transition: { duration: d } },
        };
    }, [prefersReducedMotion]);

    return (
        <>
            <motion.header
                className="fixed top-0 left-0 right-0 z-50 p-space-sm sm:p-space-md"
                initial={{ y: prefersReducedMotion ? 0 : -100 }}
                animate={{ y: isHeaderVisible ? 0 : -100 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: 'easeInOut' }}
            >
                <div ref={headerRef} onMouseMove={handleMouseMove} className="relative mx-auto max-w-6xl">
                    <motion.div
                        className="absolute inset-0 h-full w-full rounded-[28px] border backdrop-blur-2xl"
                        style={{
                            background: 'var(--color-surface-raised)',
                            borderColor: theme === 'light' ? 'var(--color-border)' : 'var(--color-border-strong)',
                            boxShadow:
                                theme === 'light'
                                    ? '0 22px 64px -32px rgba(39, 47, 138, 0.35)'
                                    : '0 24px 68px -28px rgba(4, 9, 26, 0.7)',
                        }}
                    >
                        {!prefersReducedMotion && (
                            <motion.div
                                className="absolute inset-0"
                                style={{
                                    backgroundImage: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${
                                        theme === 'light' ? spotlightColors.light : spotlightColors.dark
                                    }, transparent 45%)`,
                                }}
                            />
                        )}
                    </motion.div>

                    <div className="relative z-10 flex flex-col gap-5 px-4 py-5 sm:px-6 lg:px-7">
                        <div className="grid grid-cols-12 items-center gap-4">
                            <div className="col-span-12 md:col-span-4 flex items-center gap-4">
                                <Link
                                    to="/"
                                    className="group inline-flex items-center gap-3 text-lg font-semibold tracking-tight text-ink-800 dark:text-white"
                                >
                                    <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/30">
                                        <span className="text-base font-bold">SS</span>
                                    </span>
                                    <span className="flex flex-col leading-tight">
                                        <span className="text-xs uppercase tracking-[0.32em] text-gray-500 dark:text-gray-400">
                                            Scientist
                                        </span>
                                        <span>Shield</span>
                                    </span>
                                </Link>
                                <div className="hidden sm:flex flex-col text-xs leading-tight text-gray-500 dark:text-gray-400">
                                    <span className="uppercase tracking-[0.32em] text-[10px] text-gray-400 dark:text-gray-500">
                                        Studio Workspace
                                    </span>
                                    <span className="font-semibold text-ink-700 dark:text-white">
                                        Learn, build, and publish faster.
                                    </span>
                                </div>
                            </div>

                            <nav className="col-span-12 hidden lg:flex items-center justify-center gap-1 rounded-3xl border border-white/50 bg-white/70 p-1 shadow-sm dark:border-gray-700/50 dark:bg-gray-900/60" aria-label="Primary">
                                {navLinks.map((link) => {
                                    const isActive = path === link.path;
                                    return (
                                        <motion.div key={link.path} whileHover={{ y: -2 }}>
                                            <Link
                                                to={link.path}
                                                className={`relative inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                                                    isActive
                                                        ? 'text-brand-600 dark:text-brand-200'
                                                        : 'text-ink-500 hover:text-brand-600 dark:text-ink-200 dark:hover:text-brand-200'
                                                }`}
                                                aria-current={isActive ? 'page' : undefined}
                                            >
                                                {isActive ? (
                                                    <motion.span
                                                        layoutId="header-active-pill"
                                                        className="absolute inset-0 rounded-2xl bg-brand-500/10 ring-1 ring-brand-500/30 dark:bg-brand-400/15 dark:ring-brand-400/30"
                                                        transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 28 }}
                                                    />
                                                ) : null}
                                                <span className="relative z-10">{link.label}</span>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </nav>

                            <div className="col-span-12 flex flex-wrap items-center justify-end gap-2 sm:gap-3 lg:col-span-3">
                                <Magnetic>
                                    <Tooltip content="Open universal search (⌘+K)">
                                        <button
                                            type="button"
                                            onClick={() => setIsCommandMenuOpen(true)}
                                            aria-controls="command-menu"
                                            aria-expanded={isCommandMenuOpen}
                                            className="hidden md:inline-flex min-w-[210px] items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/75 px-3 py-2 text-sm font-medium text-gray-500 shadow-sm transition hover:bg-white hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200 dark:hover:text-brand-200"
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <AiOutlineSearch className="h-4 w-4" />
                                                <span>Search the library</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                                ⌘<span>K</span>
                                            </span>
                                        </button>
                                    </Tooltip>
                                </Magnetic>

                                <button
                                    type="button"
                                    onClick={() => setIsCommandMenuOpen(true)}
                                    aria-label="Open search"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/75 text-gray-600 hover:bg-white hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200 dark:hover:text-brand-200 md:hidden"
                                >
                                    <AiOutlineSearch className="h-5 w-5" />
                                </button>

                                {currentUser ? (
                                    <>
                                        <Link
                                            to="/create-post"
                                            className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/40"
                                        >
                                            <HiOutlinePencilSquare className="h-4 w-4" />
                                            New Post
                                        </Link>
                                        <div className="hidden xl:flex flex-col text-right text-xs leading-tight text-gray-500 dark:text-gray-400">
                                            <span className="uppercase tracking-[0.32em] text-[10px] text-gray-400 dark:text-gray-500">
                                                Welcome back
                                            </span>
                                            <span className="font-semibold text-ink-700 dark:text-white">@{currentUser.username}</span>
                                        </div>
                                        <div className="relative">
                                            <Avatar
                                                alt="user"
                                                img={currentUser.profilePicture}
                                                rounded
                                                bordered
                                                color="light-blue"
                                                className="cursor-pointer ring-2 ring-transparent transition hover:ring-brand-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                                                onClick={() => setIsDropdownOpen((previous) => !previous)}
                                                tabIndex={0}
                                                aria-controls="user-menu"
                                                aria-expanded={isDropdownOpen}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                        event.preventDefault();
                                                        setIsDropdownOpen((previous) => !previous);
                                                    }
                                                    if (event.key === 'Escape') {
                                                        setIsDropdownOpen(false);
                                                    }
                                                }}
                                            />
                                            <AnimatePresence>
                                                {isDropdownOpen && (
                                                    <motion.div
                                                        variants={dropdownVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        exit="exit"
                                                        id="user-menu"
                                                        role="menu"
                                                        className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl border border-white/60 bg-white/90 p-1 shadow-[0_22px_45px_-28px_rgba(39,47,138,0.55)] backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-900/90"
                                                    >
                                                        <div className="px-4 py-3 text-sm">
                                                            <span className="block font-semibold text-gray-700 dark:text-gray-100">@{currentUser.username}</span>
                                                            <span className="block truncate text-gray-500 dark:text-gray-400">{currentUser.email}</span>
                                                        </div>
                                                        <hr className="border-gray-200/60 dark:border-gray-800/60" />
                                                        {currentUser.isAdmin ? (
                                                            <div className="py-1">
                                                                <Link to="/admin" onClick={() => setIsDropdownOpen(false)}>
                                                                    <span className="block rounded-xl px-4 py-2 text-sm text-gray-600 transition hover:bg-brand-500/10 hover:text-brand-600 dark:text-gray-200 dark:hover:bg-brand-500/15 dark:hover:text-brand-300">
                                                                        Admin Panel
                                                                    </span>
                                                                </Link>
                                                                <Link to="/dashboard?tab=dash" onClick={() => setIsDropdownOpen(false)}>
                                                                    <span className="block rounded-xl px-4 py-2 text-sm text-gray-600 transition hover:bg-brand-500/10 hover:text-brand-600 dark:text-gray-200 dark:hover:bg-brand-500/15 dark:hover:text-brand-300">
                                                                        Dashboard
                                                                    </span>
                                                                </Link>
                                                            </div>
                                                        ) : null}
                                                        <Link to="/dashboard?tab=profile" onClick={() => setIsDropdownOpen(false)}>
                                                            <span className="block rounded-xl px-4 py-2 text-sm text-gray-600 transition hover:bg-brand-500/10 hover:text-brand-600 dark:text-gray-200 dark:hover:bg-brand-500/15 dark:hover:text-brand-300">
                                                                Profile
                                                            </span>
                                                        </Link>
                                                        <hr className="border-gray-200/60 dark:border-gray-800/60" />
                                                        <button
                                                            type="button"
                                                            onClick={confirmSignout}
                                                            className="w-full rounded-xl px-4 py-2 text-left text-sm font-semibold text-red-500 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/60"
                                                        >
                                                            Sign out
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </>
                                ) : (
                                    <Link
                                        to="/sign-in"
                                        className="inline-flex items-center gap-2 rounded-2xl border border-white/60 bg-white/75 px-4 py-2 text-sm font-semibold text-ink-600 shadow-sm hover:bg-white hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-ink-100"
                                    >
                                        Sign In
                                    </Link>
                                )}

                            </div>
                        </div>

                        <div className="flex flex-col gap-3 lg:hidden">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-1 items-center gap-2 overflow-x-auto rounded-2xl border border-white/60 bg-white/80 px-2 py-2 shadow-sm dark:border-gray-700/60 dark:bg-gray-900/80">
                                    {navLinks.map((link) => {
                                        const isActive = path === link.path;
                                        return (
                                            <Link
                                                key={link.path}
                                                to={link.path}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`whitespace-nowrap rounded-2xl px-3 py-1.5 text-xs font-semibold transition ${
                                                    isActive
                                                        ? 'bg-brand-500/15 text-brand-600 ring-1 ring-brand-500/30 dark:bg-brand-400/15 dark:text-brand-200'
                                                        : 'text-ink-500 hover:text-brand-600 dark:text-ink-200 dark:hover:text-brand-200'
                                                }`}
                                                aria-current={isActive ? 'page' : undefined}
                                            >
                                                {link.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsMobileMenuOpen((previous) => !previous)}
                                    className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/80 text-gray-700 transition hover:bg-white dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200"
                                    aria-label="Toggle navigation menu"
                                    aria-expanded={isMobileMenuOpen}
                                    aria-controls="mobile-menu-panel"
                                >
                                    {isMobileMenuOpen ? (
                                        <HiOutlineXMark className="h-5 w-5" />
                                    ) : (
                                        <HiOutlineBars3 className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {isMobileMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -12 }}
                                    transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: 'easeOut' }}
                                    className="mt-3 rounded-2xl border border-white/60 bg-white/90 p-4 text-sm shadow-xl backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-900/90 lg:hidden"
                                    id="mobile-menu-panel"
                                >
                                    <div className="mb-4 flex flex-col gap-2 md:hidden">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCommandMenuOpen(true);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-left font-semibold text-ink-600 shadow-sm hover:bg-white hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-ink-100"
                                        >
                                            Explore the workspace
                                        </button>
                                        {currentUser ? (
                                            <Link
                                                to="/create-post"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/40"
                                            >
                                                <HiOutlinePencilSquare className="h-4 w-4" />
                                                New Post
                                            </Link>
                                        ) : null}
                                    </div>

                                    <nav className="space-y-2">
                                        {navLinks.map((link) => (
                                            <Link
                                                key={link.path}
                                                to={link.path}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`flex items-center justify-between rounded-xl px-3 py-2 transition ${
                                                    path === link.path
                                                        ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-200'
                                                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                                }`}
                                                aria-current={path === link.path ? 'page' : undefined}
                                            >
                                                <span>{link.label}</span>
                                                {path === link.path ? <span className="text-xs font-semibold uppercase">Active</span> : null}
                                            </Link>
                                        ))}
                                    </nav>
                                    <div className="mt-4 flex flex-col gap-2">
                                        {currentUser ? (
                                            <>
                                                <Link
                                                    to="/dashboard?tab=profile"
                                                    onClick={() => {
                                                        setIsMobileMenuOpen(false);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="rounded-xl px-3 py-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                                >
                                                    Profile
                                                </Link>
                                                {currentUser.isAdmin ? (
                                                    <>
                                                        <Link
                                                            to="/admin"
                                                            onClick={() => setIsMobileMenuOpen(false)}
                                                            className="rounded-xl px-3 py-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                                        >
                                                            Admin Panel
                                                        </Link>
                                                        <Link
                                                            to="/dashboard?tab=dash"
                                                            onClick={() => setIsMobileMenuOpen(false)}
                                                            className="rounded-xl px-3 py-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                                        >
                                                            Dashboard
                                                        </Link>
                                                    </>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsMobileMenuOpen(false);
                                                        confirmSignout();
                                                    }}
                                                    className="rounded-xl px-3 py-2 text-left font-semibold text-red-500 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/60"
                                                >
                                                    Sign out
                                                </button>
                                            </>
                                        ) : (
                                            <Link
                                                to="/sign-in"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-3 py-2 font-semibold text-white shadow-md shadow-indigo-500/30"
                                            >
                                                Sign In
                                            </Link>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.header>
            {/* Background overlay for mobile menu to focus user attention */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.button
                        type="button"
                        aria-label="Close menu"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                    />
                )}
            </AnimatePresence>
            <CommandMenu isOpen={isCommandMenuOpen} onClose={() => setIsCommandMenuOpen(false)} />
            <LogoutConfirmationModal
                show={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleSignout}
                processing={isSigningOut}
            />
        </>
    );
}
