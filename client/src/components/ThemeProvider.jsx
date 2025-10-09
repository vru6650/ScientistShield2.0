// client/src/components/ThemeProvider.jsx
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import SkipToContent from './SkipToContent.jsx';
import { Flowbite } from 'flowbite-react';
import { customFlowbiteTheme } from '../theme/flowbiteTheme.js';

export default function ThemeProvider({ children }) {
    const { theme } = useSelector((state) => state.theme);

    useEffect(() => {
        const root = window.document.documentElement;
        // Always apply chosen light/dark theme plus Big Sur style class
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        root.classList.add('bigsur');
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <div className={theme}>
            <Flowbite theme={{ theme: customFlowbiteTheme }}>
                <div
                    className='
                        bigsur-theme relative min-h-screen overflow-hidden
                        transition-colors duration-300
                    '
                >
                    {/* Layered macOS-style wallpaper glow */}
                    <div aria-hidden className='bigsur-backdrop' />
                    <div aria-hidden className='bigsur-haze' />
                    <div aria-hidden className='bigsur-highlight bigsur-highlight--left' />
                    <div aria-hidden className='bigsur-highlight bigsur-highlight--right' />

                    {/* Ambient aurora accents for large screens */}
                    <div className='bigsur-aurora pointer-events-none absolute inset-0 hidden md:block'>
                        <div className='bigsur-aurora__orb bigsur-aurora__orb--mint' />
                        <div className='bigsur-aurora__orb bigsur-aurora__orb--blue' />
                        <div className='bigsur-aurora__orb bigsur-aurora__orb--violet' />
                    </div>

                    {/* Subtle film grain for depth */}
                    <div className='bg-noise' />

                    {/* Content layer */}
                    <div className='relative z-10 flex min-h-screen flex-col'>
                        {/* Accessibility: offer a skip link for keyboard users */}
                        <SkipToContent targetId='main-content' />
                        {children}
                    </div>
                </div>
            </Flowbite>
        </div>
    );
}
