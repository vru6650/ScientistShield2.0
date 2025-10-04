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
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <div className={theme}>
            <Flowbite theme={{ theme: customFlowbiteTheme }}>
                <div
                    className='
                        relative min-h-screen overflow-hidden
                        text-gray-700 dark:text-gray-200
                        bg-brand-radial dark:bg-brand-radial-dark
                        bg-[length:160%_160%] motion-safe:animate-bg-pan
                        transition-colors duration-300
                    '
                >
                    {/* Premium ambient aurora glows */}
                    <div className='pointer-events-none absolute inset-0 z-0 hidden md:block'>
                        <div className='absolute -top-24 -left-16 h-72 w-72 rounded-full blur-3xl opacity-[0.15] bg-gradient-to-br from-brand-400/40 via-accent-teal/30 to-brand-600/30 motion-safe:animate-float-aurora' />
                        <div className='absolute -bottom-24 -right-8 h-80 w-80 rounded-full blur-[90px] opacity-[0.12] bg-gradient-to-tr from-accent-teal/30 via-brand-300/30 to-brand-600/30 motion-safe:animate-float-aurora' />
                        <div className='absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl opacity-10 bg-gradient-to-br from-brand-500/30 to-purple-500/20 motion-safe:animate-pulse-glow-soft' />
                    </div>

                    {/* Subtle film grain for depth */}
                    <div className='bg-noise' />

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
