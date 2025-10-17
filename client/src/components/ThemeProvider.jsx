// client/src/components/ThemeProvider.jsx
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { Flowbite } from 'flowbite-react';
import { customFlowbiteTheme } from '../theme/flowbiteTheme.js';
import SkipToContent from './SkipToContent.jsx';
import MacWallpaper from './MacWallpaper.jsx';

export default function ThemeProvider({ children }) {
    const { theme } = useSelector((state) => state.theme);

    useEffect(() => {
        const root = window.document.documentElement;
        // Always apply chosen light/dark theme plus Big Sur style class
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        root.classList.add('bigsur');
        root.setAttribute('data-theme', theme === 'dark' ? 'macos-dark' : 'macos-light');
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <div className={`${theme} macos-theme`}>
            <Flowbite theme={{ theme: customFlowbiteTheme }}>
                <div
                    className='
                        macos-desktop relative min-h-screen overflow-hidden
                        text-gray-700 dark:text-gray-200
                        transition-colors duration-300
                    '
                >
                    <MacWallpaper mode={theme} />

                    {/* Content layer */}
                    <div className='relative z-10'>
                        {/* Accessibility: offer a skip link for keyboard users */}
                        <SkipToContent targetId='main-content' />
                        {children}
                    </div>
                </div>
            </Flowbite>
        </div>
    );
}
