import React from 'react';

export default function SkipToContent({ targetId = 'main-content' }) {
  return (
    <a
      href={`#${targetId}`}
      className="skip-link"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}

