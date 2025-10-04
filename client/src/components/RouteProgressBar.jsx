import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Lightweight route-change progress indicator to improve perceived performance.
// Shows a subtle animated bar at the top on navigation.
export default function RouteProgressBar() {
  const location = useLocation();
  const [active, setActive] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Trigger bar when the route path changes
    setActive(true);
    // Keep visible briefly; adjust if we later wire into data loading
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setActive(false), 450);
    return () => clearTimeout(timeoutRef.current);
  }, [location.pathname]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] overflow-hidden ${
        active ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-150`}
    >
      <div className="h-full w-1/3 animate-[progress_0.8s_ease-in-out_infinite] bg-gradient-to-r from-brand-400 via-accent-teal to-brand-600" />

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

