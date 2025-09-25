import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';
import './FooterWave.css'; // Ensure your CSS is up-to-date with the latest enhancements

export default function FooterWave() {
    const containerRef = useRef(null);

    // --- Parallax Scroll Effect Logic ---
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });
    // Adjust transform values for more pronounced or subtle parallax if desired
    const y1 = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]); // Slightly less aggressive parallax for top wave
    const y2 = useTransform(scrollYProgress, [0, 1], ["-25%", "25%"]); // More pronounced parallax for background wave

    // --- Spotlight Mouse Effect Logic ---
    const mouseX = useMotionValue(0);
    // Use useSpring for a smoother, more fluid motion. Tuned damping/stiffness.
    const smoothMouseX = useSpring(mouseX, { damping: 18, stiffness: 250 }); // Slightly softer spring

    const handleMouseMove = (e) => {
        const { currentTarget, clientX } = e;
        const { left, width } = currentTarget.getBoundingClientRect();
        // Update mouseX with a value from 0 to 100 based on mouse position
        // Clamp the value to ensure it stays within 0-100% to prevent mask issues at edges
        mouseX.set(Math.max(0, Math.min(100, ((clientX - left) / width) * 100)));
    };

    // Transform the smooth mouse X position into a CSS percentage value
    const maskPosition = useTransform(smoothMouseX, (val) => `${val}%`);

    return (
        <div
            ref={containerRef}
            // Increased min-h slightly, adjusted mb-[top] to use a small positive margin
            // Added custom class 'footer-wave-container' for potential global styling if needed
            className="relative w-full h-[12vh] mt-[-10px] min-h-[120px] max-h-[180px] overflow-hidden interactive-wave"
            onMouseMove={handleMouseMove}
            // Pass the CSS variable to the style prop
            style={{ '--mouse-x': maskPosition }}
        >
            {/* Background Wave - Slower parallax, darker/more opaque */}
            <motion.svg
                style={{ y: y2 }}
                className="absolute bottom-0 w-[calc(100%+1.3px)] h-full animate-wave"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
            >
                {/* Deeper color, higher opacity for background wave */}
                <path d="M900,112.7c-25.7-8.39-51.4-16.86-77.1-25.54C750.8,62,625.1,23.8,500.3,15.74C375.4,7.67,250.7,23.4,125.1,62.13C0,100.86,0,120,0,120H1200V112.7Z" className="shape-fill opacity-80 fill-current text-gray-300 dark:text-gray-700"></path>
            </motion.svg>

            {/* Foreground Wave - Faster parallax, lighter/less opaque */}
            <motion.svg
                style={{ y: y1 }}
                className="absolute bottom-0 w-[calc(100%+1.3px)] h-full" // Removed animate-wave as it's for the background layer
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
            >
                {/* Lighter color, slightly less opaque for foreground wave */}
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-17,148.6-33.1,229.82-26.43,81.22,6.67,143.79,34.31,209.72,64.62,65.93,30.31,121.23,54.86,182.7,66.6,61.47,11.73,126.34,16.18,188.43,12.33,62.1-3.84,113.62-18.33,159.21-32.14V120H0V58.46Z" className="shape-fill opacity-70 fill-current text-gray-200 dark:text-gray-800"></path>
            </motion.svg>
        </div>
    );
}