// client/src/components/LanguageSelector.jsx
import React from 'react';
import { motion } from 'framer-motion';
import Button from './ui/Button';

const languages = ['javascript', 'cpp', 'python', 'java'];

export default function LanguageSelector({ selectedLanguage, setSelectedLanguage }) {
    return (
        <motion.div
            layout
            className="flex flex-wrap items-center gap-space-sm"
        >
            {languages.map((lang) => (
                <Button
                    as={motion.button}
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`text-sm font-semibold ${
                        selectedLanguage === lang
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-gray-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {lang.toUpperCase()}
                </Button>
            ))}
        </motion.div>
    );
}