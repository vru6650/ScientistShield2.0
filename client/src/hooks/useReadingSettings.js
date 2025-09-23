import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'reading-preferences';

const defaultSettings = {
    fontSize: 18,
    fontFamily: 'serif',
    lineHeight: 1.8,
    letterSpacing: 0,
    pageWidth: 'comfortable',
    theme: 'auto',
    textAlign: 'left',
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

    const contentStyles = useMemo(() => ({
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        letterSpacing: `${settings.letterSpacing}em`,
        fontFamily: fontFamilyMap[settings.fontFamily] || fontFamilyMap.serif,
        textAlign: settings.textAlign,
    }), [settings.fontSize, settings.lineHeight, settings.letterSpacing, settings.fontFamily, settings.textAlign]);

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
    };
}
