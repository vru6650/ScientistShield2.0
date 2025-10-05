// client/src/components/ThemeProvider.jsx
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import SkipToContent from './SkipToContent.jsx';
import { Flowbite } from 'flowbite-react';
import { customFlowbiteTheme } from '../theme/flowbiteTheme.js';
import { setResolvedTheme } from '../redux/theme/themeSlice.js';

export default function ThemeProvider({ children }) {
    const dispatch = useDispatch();
    const { theme, preference } = useSelector((state) => state.theme);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        root.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // When in system mode, react to OS preference changes and update the applied theme
    useEffect(() => {
        if (preference !== 'system') return;
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = (e) => dispatch(setResolvedTheme(e.matches ? 'dark' : 'light'));
        // Initial sync just in case
        apply(mql);
        mql.addEventListener ? mql.addEventListener('change', apply) : mql.addListener(apply);
        return () => {
            mql.removeEventListener ? mql.removeEventListener('change', apply) : mql.removeListener(apply);
        };
    }, [dispatch, preference]);

    return (
        <div className={theme} data-theme={theme}>
            <Flowbite theme={{ theme: customFlowbiteTheme }}>
                <div className='app-shell text-[color:var(--theme-text-primary)]'>
                    <div className='theme-ambient pointer-events-none' aria-hidden='true'>
                        <div className='theme-ambient-core' />
                        <div className='theme-ambient-glow theme-ambient-glow--tl motion-safe:animate-float-aurora' />
                        <div className='theme-ambient-glow theme-ambient-glow--br motion-safe:animate-float-aurora' />
                        <div className='theme-ambient-glow theme-ambient-glow--center motion-safe:animate-pulse-glow-soft' />
                    </div>
                    <div className='theme-grain' aria-hidden='true' />
                    <div className='app-shell__content'>
                        <SkipToContent targetId='main-content' />
                        {children}
                    </div>
                </div>
            </Flowbite>
        </div>
    );
}
