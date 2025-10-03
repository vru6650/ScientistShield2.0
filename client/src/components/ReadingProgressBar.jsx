// src/components/ReadingProgressBar.jsx

import React, { useState, useEffect } from 'react';

const ReadingProgressBar = () => {
    const [scrollProgress, setScrollProgress] = useState(0);

    /**
     * Handles the scroll event to calculate the reading progress.
     * The progress is the percentage of the page that has been scrolled.
     */
    const handleScroll = () => {
        const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = window.scrollY;

        if (totalHeight > 0) {
            const progress = (scrolled / totalHeight) * 100;
            setScrollProgress(progress);
        } else {
            setScrollProgress(0);
        }
    };

    // Set up and clean up the scroll event listener
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Style for the progress bar
    const progressBarStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${scrollProgress}%`,
        height: '4px',
        backgroundColor: '#3b82f6', // A nice blue color, feel free to change!
        zIndex: 50,
        transition: 'width 0.1s ease-out',
    };

    return <div style={progressBarStyle} />;
};

export default ReadingProgressBar;