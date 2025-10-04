// client/src/components/Header.jsx
import { Avatar, Button, Navbar, Tooltip } from 'flowbite-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineSearch } from 'react-icons/ai';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

import { signoutSuccess } from '../redux/user/userSlice';
import CommandMenu from './CommandMenu';
import ControlCenter from './ControlCenter.jsx';
import LogoutConfirmationModal from './LogoutConfirmationModal';

// --- Reusable Components ---

function Magnetic({ children }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
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

  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { scrollY } = useScroll();
  const headerRef = useRef(null);

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

  const navContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const navItemVariants = {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0 },
  };

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
        <motion.header
            className="fixed top-0 left-0 right-0 z-50 p-space-sm sm:p-space-md"
            initial={{ y: -100 }}
            animate={{ y: isHeaderVisible ? 0 : -100 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          <div ref={headerRef} onMouseMove={handleMouseMove} className="relative mx-auto max-w-6xl">
            <motion.div
                className="absolute inset-0 h-full w-full rounded-radius-full border shadow-lg backdrop-blur-lg overflow-hidden"
                style={{
                  borderColor: theme === 'light' ? 'rgba(229, 231, 235, 0.7)' : 'rgba(55, 65, 81, 0.7)',
                  backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(23, 31, 42, 0.6)',
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
            </motion.div>
            <Navbar fluid rounded className="bg-transparent dark:bg-transparent relative z-10">
              <Link
                  to="/"
                  className="text-sm sm:text-xl font-semibold font-heading text-gray-700 dark:text-white"
              >
              <span className="px-space-sm py-space-xs bg-professional-gradient rounded-radius-lg text-white">
                Scientist
              </span>
                Shield
              </Link>
              <motion.div
                  className="hidden lg:flex items-center gap-space-xs"
                  variants={navContainerVariants}
                  initial="hidden"
                  animate="show"
              >
                {navLinks.map((link) => {
                  const isActive = path === link.path;
                  return (
                      <motion.div variants={navItemVariants} key={link.path}>
                        <Link
                            to={link.path}
                            className="relative px-space-md py-space-sm text-sm text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors link-premium"
                        >
                          {isActive && (
                              <motion.span
                                  layoutId="active-pill"
                                  className="absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded-radius-full"
                                  style={{ borderRadius: 9999 }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              />
                          )}
                          <span className="relative z-10">{link.label}</span>
                        </Link>
                      </motion.div>
                  );
                })}
              </motion.div>
              <div className="flex items-center gap-space-md md:order-2">
                <Magnetic>
                  <Tooltip content="Search (⌘+K)">
                    <Button
                        className="w-12 h-10"
                        color="gray"
                        pill
                        onClick={() => setIsCommandMenuOpen(true)}
                        aria-controls="command-menu"
                        aria-expanded={isCommandMenuOpen}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsCommandMenuOpen(true);
                          }
                        }}
                    >
                      <AiOutlineSearch />
                    </Button>
                  </Tooltip>
                </Magnetic>
                <Magnetic>
                  <ControlCenter />
                </Magnetic>
                {currentUser ? (
                    <div className="relative">
                      <Avatar
                          alt="user"
                          img={currentUser.profilePicture}
                          rounded
                          bordered
                          color="light-blue"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="cursor-pointer"
                          tabIndex={0}
                          aria-controls="user-menu"
                          aria-expanded={isDropdownOpen}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setIsDropdownOpen((prev) => !prev);
                            }
                            if (e.key === 'Escape') {
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
                                className="absolute right-0 mt-space-sm w-48 rounded-radius-lg shadow-lg dark:bg-gray-700 dark:border-gray-600 bg-white border border-gray-200 z-50 origin-top-right"
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
                ) : (
                    <Link to="/sign-in">
                      <Button gradientDuoTone="purpleToBlue" outline>
                        Sign In
                      </Button>
                    </Link>
                )}
                <Navbar.Toggle aria-label="Toggle navigation menu" />
              </div>
              <Navbar.Collapse>
                {navLinks.map((link) => (
                    <Navbar.Link active={path === link.path} as={'div'} key={link.path} className="lg:hidden">
                      <Link to={link.path}>{link.label}</Link>
                    </Navbar.Link>
                ))}
              </Navbar.Collapse>
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
