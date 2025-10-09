import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    // After navigation, move keyboard focus to main content for accessibility
    // Delay slightly to allow layout/route transition to render
    const t = setTimeout(() => {
      const main = document.getElementById('main-content');
      if (main && typeof main.focus === 'function') {
        main.focus({ preventScroll: true });
      }
    }, 60);
    return () => clearTimeout(t);
  }, [pathname]);
  return null;
};

export default ScrollToTop;
