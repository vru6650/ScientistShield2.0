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
        // WhiteSur / macOS-inspired brand palette (accent blue)
        // 500 matches macOS Big Sur blue (#0A84FF)
        brand: {
          50: '#f2f7ff',
          100: '#e6f0ff',
          200: '#cfe3ff',
          300: '#a9ceff',
          400: '#73b2ff',
          500: '#0A84FF',
          600: '#007aff',
          700: '#0064d1',
          800: '#004ea3',
          900: '#003a7a',
        },
        // Neutral ink-like scale for better surfaces/typography contrast
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
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
        // Prefer macOS system fonts for a Big Sur look, fallback to existing
        heading: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Poppins',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        body: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
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
        'professional-gradient': 'linear-gradient(to right, #0064d1, #0A84FF, #007aff)',
        // NEW: Add a conic gradient for background effects
        'conic-glow': 'conic-gradient(from 180deg at 50% 50%, #1d72ce 0deg, #3a8adf 120deg, #1a5da2 240deg, #1d72ce 360deg)',
        // App-wide soft radial brand backgrounds (light/dark)
        'brand-radial': 'radial-gradient(1200px 600px at 50% -10%, rgba(10,132,255,0.14), transparent 60%), radial-gradient(1000px 400px at 90% 10%, rgba(53,184,168,0.12), transparent 60%)',
        'brand-radial-dark': 'radial-gradient(1200px 600px at 50% -10%, rgba(10,132,255,0.18), transparent 60%), radial-gradient(1000px 400px at 90% 10%, rgba(10,132,255,0.12), transparent 60%)',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(16, 24, 40, 0.06)',
        elevated: '0 10px 30px -12px rgba(16, 24, 40, 0.25)',
        glow: '0 0 0 6px rgba(58, 138, 223, 0.15)',
      },
      dropShadow: {
        glow: '0 0 12px rgba(58, 138, 223, 0.45)',
      },
      // NEW: Add more keyframes for advanced animations
      keyframes: {
        'card-fade-in': {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'bg-pan': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'float-aurora': {
          '0%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(10px, -8px, 0) scale(1.05)' },
          '100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
        },
        'pulse-glow-soft': {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '0.4' },
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
        'bg-pan': 'bg-pan 18s ease infinite',
        'float-aurora': 'float-aurora 12s ease-in-out infinite',
        'pulse-glow-soft': 'pulse-glow-soft 8s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'shimmer': 'shimmer 1.5s infinite linear',
      },
    },
  },
  // NEW: Add the typography and forms plugins
  plugins: [flowbite, tailwindScrollbar, typography, forms],
};
