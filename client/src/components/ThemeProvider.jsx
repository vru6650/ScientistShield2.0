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
                        text-ink-700 dark:text-ink-200
                        bg-brand-radial dark:bg-brand-radial-dark
                        bg-[length:150%_150%] motion-safe:animate-bg-pan
                        transition-colors duration-300 selection:bg-brand-500/30
                    '
                >
                    {/* Ambient gradients that respond softly to motion */}
                    <div className='pointer-events-none absolute inset-0 z-0 hidden md:block'>
                        <div className='absolute -top-24 -left-24 h-80 w-80 rounded-full blur-[110px] opacity-40 bg-gradient-to-br from-brand-400/60 via-brand-200/50 to-transparent motion-safe:animate-float-aurora' />
                        <div className='absolute -bottom-24 -right-16 h-96 w-96 rounded-full blur-[130px] opacity-35 bg-gradient-to-tr from-flare-400/40 via-brand-300/45 to-brand-600/40 motion-safe:animate-float-aurora' />
                        <div className='absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl opacity-25 bg-gradient-to-br from-brand-500/45 via-accent-teal/35 to-transparent motion-safe:animate-pulse-glow-soft' />
                        <div className='absolute top-16 right-1/3 h-40 w-40 rounded-full blur-[90px] opacity-20 bg-flare-300/60 motion-safe:animate-float-aurora' />
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
