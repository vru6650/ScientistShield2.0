// client/src/hooks/useReadingSettings.js
import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'reading-preferences';

export const marginStyleMap = {
    narrow: '0.75rem',
    medium: '1.5rem',
    wide: '2.25rem',
};

const defaultSettings = {
    fontSize: 18,
    fontFamily: 'serif',
    lineHeight: 1.8,
    letterSpacing: 0,
    wordSpacing: 0, // New setting
    paragraphSpacing: 1.25, // New setting
    pageWidth: 'comfortable',
    pageMargin: 'medium',
    theme: 'auto',
    textAlign: 'left',
    brightness: 1,
};

const fontFamilyMap = {
    serif: `'Merriweather', 'Georgia', 'Cambria', "Times New Roman", Times, serif`,
    sans: `'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`,
    mono: `'Fira Code', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace`,
};

const widthStyleMap = {
    cozy: '640px',
    comfortable: '720px',
    spacious: '860px',
};

const themeClassMap = {
    day: 'reading-theme-day',
    sepia: 'reading-theme-sepia',
    mint: 'reading-theme-mint', // New theme class
    dusk: 'reading-theme-dusk', // New theme class
    night: 'reading-theme-night',
};

const getStoredSettings = () => {
    if (typeof window === 'undefined') {
        return defaultSettings;
    }
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return defaultSettings;
        }
        const parsed = JSON.parse(stored);
        return {
            ...defaultSettings,
            ...parsed,
        };
    } catch (error) {
        console.error('Failed to parse reading preferences:', error);
        return defaultSettings;
    }
};

export default function useReadingSettings() {
    const [settings, setSettings] = useState(getStoredSettings);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to persist reading preferences:', error);
        }
    }, [settings]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const resetSettings = () => setSettings(defaultSettings);

    const contentPadding = useMemo(
        () => marginStyleMap[settings.pageMargin] || marginStyleMap.medium,
        [settings.pageMargin]
    );

    const contentStyles = useMemo(() => ({
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        letterSpacing: `${settings.letterSpacing}em`,
        wordSpacing: `${settings.wordSpacing}em`, // New style
        textAlign: settings.textAlign,
        '--paragraph-spacing': `${settings.paragraphSpacing}em`, // New CSS variable for paragraph spacing
        fontFamily: fontFamilyMap[settings.fontFamily] || fontFamilyMap.serif,
        filter: `brightness(${settings.brightness})`,
        paddingInline: contentPadding,
    }), [
        settings.fontSize,
        settings.lineHeight,
        settings.letterSpacing,
        settings.wordSpacing,
        settings.fontFamily,
        settings.textAlign,
        settings.paragraphSpacing,
        settings.brightness,
        contentPadding
    ]);

    const contentMaxWidth = useMemo(() => widthStyleMap[settings.pageWidth] || widthStyleMap.comfortable, [settings.pageWidth]);

    const surfaceClass = useMemo(() => {
        if (settings.theme === 'auto') {
            return '';
        }
        return themeClassMap[settings.theme] || '';
    }, [settings.theme]);

    return {
        settings,
        updateSetting,
        resetSettings,
        contentStyles,
        contentMaxWidth,
        surfaceClass,
        contentPadding,
    };
}