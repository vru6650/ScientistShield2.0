import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Announces route changes for screen readers
export default function PageAnnouncer() {
  const location = useLocation();
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const path = location.pathname || '/';
    node.textContent = `Navigated to ${path}`;
  }, [location.pathname]);

  return (
    <div
      ref={ref}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}

