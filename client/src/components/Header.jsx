// client/src/components/Header.jsx
import { Avatar, Navbar } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { AiOutlineSearch } from 'react-icons/ai';
import { useEffect, useState, useRef } from 'react';

import { signoutSuccess } from '../redux/user/userSlice';
import CommandMenu from './CommandMenu';
import LogoutConfirmationModal from './LogoutConfirmationModal';
import ControlCenter from './ControlCenter';

// No nav links — header shows only logo and profile

// --- Main Header Component ---
export default function Header() {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const { theme } = useSelector((state) => state.theme);

  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { scrollY } = useScroll();
  const headerRef = useRef(null);
  const profileRef = useRef(null);

  const handleMouseMove = (e) => {
    if (headerRef.current) {
      const { clientX, clientY } = e;
      const { left, top } = headerRef.current.getBoundingClientRect();
      headerRef.current.style.setProperty('--mouse-x', `${clientX - left}px`);
      headerRef.current.style.setProperty('--mouse-y', `${clientY - top}px`);
    }
  };

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) {
      setIsHeaderVisible(false);
    } else {
      setIsHeaderVisible(true);
    }
    setIsScrolled(latest > 12);
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandMenuOpen(true);
      }
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return undefined;
    const onDocClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isDropdownOpen]);

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

  // Removed nav animations

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.9, y: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
      },
    },
    exit: { opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.2 } },
  };

  return (
      <>
        {/* Accessible skip link */}
        <a
          href="#main-content"
          className="sr-only focus:absolute focus:left-3 focus:top-2 focus:z-[60] focus:rounded-md focus:bg-white/90 focus:px-3 focus:py-1 focus:text-sm focus:text-slate-800 focus:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:focus:bg-slate-900/90 dark:focus:text-slate-100"
        >
          Skip to content
        </a>
        <motion.header
            className={`fixed top-0 left-0 right-0 z-50 transition-[padding] duration-200 ${
              isScrolled ? 'p-2 sm:p-3' : 'p-space-sm sm:p-space-md'
            }`}
            initial={{ y: -100 }}
            animate={{ y: isHeaderVisible ? 0 : -100 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          <div ref={headerRef} onMouseMove={handleMouseMove} className="relative mx-auto max-w-6xl">
            <motion.div
                className={`absolute inset-0 h-full w-full rounded-radius-full overflow-hidden toolbar-translucent ${isScrolled ? 'shadow-xl' : 'shadow-lg'}`}
                style={{
                  '--spotlight-color-light': 'rgba(200, 200, 200, 0.1)',
                  '--spotlight-color-dark': 'rgba(255, 255, 255, 0.05)',
                }}
            >
              <motion.div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${
                        theme === 'light' ? 'var(--spotlight-color-light)' : 'var(--spotlight-color-dark)'
                    }, transparent 35%)`,
                  }}
              />
              {/* subtle bottom hairline for separation */}
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-x-4 bottom-0 h-px ${
                  theme === 'light'
                    ? 'bg-gradient-to-r from-transparent via-white/60 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-slate-500/30 to-transparent'
                }`}
              />
            </motion.div>
            <Navbar fluid rounded className="bg-transparent dark:bg-transparent relative z-10">
              <div className="flex items-center gap-3">
                <Link
                    to="/"
                    className="text-sm sm:text-xl font-semibold font-heading text-gray-700 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-radius-md"
                    aria-label="Go to home"
                >
                  <span className="px-space-sm py-space-xs bg-professional-gradient rounded-radius-lg text-white">
                    Scientist
                  </span>
                  {' '}Shield
                </Link>
              </div>
              {/* Nav links removed */}
              <div className="flex items-center gap-space-md md:order-2">
                {/* Search launcher with ⌘K hint */}
                <button
                  type="button"
                  title="Search (⌘K)"
                  aria-label="Search"
                  onClick={() => setIsCommandMenuOpen(true)}
                  className={`hidden sm:inline-flex h-11 items-center gap-2 rounded-full border px-3 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                    isScrolled ? 'bg-white/80 border-white/50 dark:bg-slate-900/70 dark:border-white/10' : 'bg-white/70 border-white/40 dark:bg-slate-900/60 dark:border-white/10'
                  } dark:text-slate-200`}
                >
                  <AiOutlineSearch className="h-5 w-5" />
                  <span className="text-sm">Search</span>
                  <span className="ml-1 rounded-md bg-slate-900/5 px-1.5 py-0.5 text-[0.65rem] font-semibold text-slate-500 ring-1 ring-slate-900/10 dark:bg-slate-100/10 dark:text-slate-300 dark:ring-white/10">
                    ⌘K
                  </span>
                </button>
                {/* Control Center trigger */}
                <ControlCenter onOpenCommandMenu={() => setIsCommandMenuOpen(true)} />
                {currentUser ? (
                    <div className="relative" ref={profileRef}>
                      <button
                        type="button"
                        title="Open profile menu"
                        className={`group inline-flex items-center justify-center h-11 w-11 rounded-full border shadow-sm backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                          isDropdownOpen
                            ? 'bg-white/90 border-white/50 dark:bg-slate-900/80 dark:border-white/10'
                            : 'bg-white/70 border-white/40 hover:bg-white/80 dark:bg-slate-900/60 dark:border-white/10 dark:hover:bg-slate-900/70'
                        }`}
                        aria-controls="user-menu"
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="menu"
                        onClick={() => setIsDropdownOpen((v) => !v)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsDropdownOpen((prev) => !prev);
                          }
                          if (e.key === 'Escape') {
                            setIsDropdownOpen(false);
                          }
                        }}
                      >
                        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
                          <Avatar alt={currentUser.username || 'Profile'} img={currentUser.profilePicture} rounded className="h-9 w-9" />
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                variants={dropdownVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                id="user-menu"
                                role="menu"
                                className="absolute right-0 mt-space-sm w-56 rounded-radius-lg shadow-xl card-surface z-50 origin-top-right"
                            >
                              <div className="p-space-lg">
                                <span className="block text-sm">@{currentUser.username}</span>
                                <span className="block text-sm font-medium truncate text-gray-500 dark:text-gray-400">
                            {currentUser.email}
                          </span>
                              </div>
                              <hr className="dark:border-gray-600" />
                              {currentUser.isAdmin && (
                                  <>
                                    <Link to={'/admin'} onClick={() => setIsDropdownOpen(false)}>
                                      <div className="block px-space-lg py-space-sm text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                                        Admin Panel
                                      </div>
                                    </Link>
                                    <Link to={'/dashboard?tab=dash'} onClick={() => setIsDropdownOpen(false)}>
                                      <div className="block px-space-lg py-space-sm text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                                        Dashboard
                                      </div>
                                    </Link>
                                    <hr className="dark:border-gray-600" />
                                  </>
                              )}
                              <Link to={'/dashboard?tab=profile'} onClick={() => setIsDropdownOpen(false)}>
                                <div className="block px-space-lg py-space-sm text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                                  Profile
                                </div>
                              </Link>
                              <hr className="dark:border-gray-600" />
                              <div
                                  className="block px-space-lg py-space-sm text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 cursor-pointer"
                                  onClick={confirmSignout}
                                  role='button'
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      confirmSignout();
                                    }
                                  }}
                              >
                                Sign out
                              </div>
                            </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                ) : null}
              </div>
              {/* Mobile collapse removed */}
            </Navbar>
          </div>
        </motion.header>
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
