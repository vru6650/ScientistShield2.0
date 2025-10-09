import React from 'react';

// Simple macOS traffic lights (close, minimize, zoom)
// Usage: <MacWindowControls className="hidden sm:flex" />
export default function MacWindowControls({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-hidden>
      <span
        className="inline-block h-3 w-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
        title="Close"
      />
      <span
        className="inline-block h-3 w-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
        title="Minimize"
      />
      <span
        className="inline-block h-3 w-3 rounded-full bg-[#28c840] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
        title="Zoom"
      />
    </div>
  );
}

