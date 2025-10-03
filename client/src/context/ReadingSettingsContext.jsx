import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import useReadingSettings from '../hooks/useReadingSettings';

export const ReadingSettingsContext = createContext(null);

export const ReadingSettingsProvider = ({ children }) => {
    const value = useReadingSettings();

    return <ReadingSettingsContext.Provider value={value}>{children}</ReadingSettingsContext.Provider>;
};

ReadingSettingsProvider.propTypes = {
    children: PropTypes.node,
};

export const useReadingSettingsContext = () => {
    const context = useContext(ReadingSettingsContext);

    if (!context) {
        throw new Error('useReadingSettingsContext must be used within a ReadingSettingsProvider');
    }

    return context;
};
