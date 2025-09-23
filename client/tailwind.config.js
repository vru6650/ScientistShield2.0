/** @type {import('tailwindcss').Config} */
import flowbite from 'flowbite/plugin';
import tailwindScrollbar from 'tailwind-scrollbar';
import typography from '@tailwindcss/typography'; // NEW: Import typography plugin
import forms from '@tailwindcss/forms'; // NEW: Import forms plugin

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    // NEW: Add a centered container with padding by default
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
      },
    },
    extend: {
      colors: {
        'professional-blue': {
          50: '#F0F7FF',
          100: '#E0EEFF',
          200: '#B8D4F7',
          300: '#8EBBEF',
          400: '#64A2E7',
          500: '#3A8ADF',
          600: '#1D72CE',
          700: '#1A5DA2',
          800: '#174878',
          900: '#143859',
        },
        'accent-teal': '#35B8A8',
        'subtle-gray': {
          50: '#F7F7F7',
          100: '#E9E9E9',
          200: '#D6D6D6',
          300: '#C2C2C2',
          400: '#AFAFAF',
          500: '#9B9B9B',
          600: '#878787',
          700: '#737373',
          800: '#5F5F5F',
          900: '#4A4A4A',
        },
        'matrix-green': '#00ff41',
        sidebar: {
          light: '#E0EEFF', // professional-blue-100
          dark: '#143859',  // professional-blue-900
        },
        // NEW: Add semantic colors for UI states
        'success': '#22c55e', // Green 500
        'warning': '#f97316', // Orange 500
        'danger': '#ef4444',  // Red 500
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '0.75rem',
        'space-lg': '1rem',
        'space-xl': '1.5rem',
        'space-2xl': '2rem',
        'space-3xl': '3rem',
        'space-4xl': '4rem',
        'space-5xl': '6rem',
      },
      borderRadius: {
        'radius-sm': '0.125rem',
        'radius-md': '0.375rem',
        'radius-lg': '0.5rem',
        'radius-full': '9999px',
      },
      backgroundImage: {
        'professional-gradient': 'linear-gradient(to right, #1a5da2, #3a8adf, #1d72ce)',
        // NEW: Add a conic gradient for background effects
        'conic-glow': 'conic-gradient(from 180deg at 50% 50%, #1d72ce 0deg, #3a8adf 120deg, #1a5da2 240deg, #1d72ce 360deg)',
      },
      // NEW: Add more keyframes for advanced animations
      keyframes: {
        'card-fade-in': {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      // NEW: Add more animations using the keyframes
      animation: {
        'card-fade-in': 'card-fade-in 0.8s ease-out forwards',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'shimmer': 'shimmer 1.5s infinite linear',
      },
    },
  },
  // NEW: Add the typography and forms plugins
  plugins: [flowbite, tailwindScrollbar, typography, forms],
};