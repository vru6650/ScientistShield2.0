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
        // Brand alias palette refreshed for the Aurora Horizon theme
        brand: {
          50: '#F5F7FF',
          100: '#E6EDFF',
          200: '#CDD9FF',
          300: '#B0C3FF',
          400: '#8EA6FF',
          500: '#6C85FF',
          600: '#4C62F5',
          700: '#3B4BD5',
          800: '#303CB0',
          900: '#272F8A',
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
          50: '#F5F7FF',
          100: '#E6EDFF',
          200: '#CDD9FF',
          300: '#B0C3FF',
          400: '#8EA6FF',
          500: '#6C85FF',
          600: '#4C62F5',
          700: '#3B4BD5',
          800: '#303CB0',
          900: '#272F8A',
        },
        // Sunset accent used for CTAs and progress indicators
        flare: {
          50: '#FFF8F1',
          100: '#FFEEDD',
          200: '#FED7BC',
          300: '#FBB48E',
          400: '#F68A57',
          500: '#F26B2A',
          600: '#E0521B',
          700: '#BE4017',
          800: '#9B3317',
          900: '#7D2A15',
        },
        'accent-teal': '#2DD4BF',
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
          light: '#EEF0FF', // updated brand-100
          dark: '#1A1E36',  // deeper night surface
        },
        // NEW: Add semantic colors for UI states
        'success': '#22c55e', // Green 500
        'warning': '#f97316', // Orange 500
        'danger': '#ef4444',  // Red 500
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
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
        'professional-gradient': 'linear-gradient(135deg, #6C85FF 0%, #4C62F5 50%, #8EA6FF 100%)',
        // NEW: Add a conic gradient for background effects
        'conic-glow': 'conic-gradient(from 180deg at 50% 50%, #6C85FF 0deg, #4C62F5 120deg, #F26B2A 240deg, #6C85FF 360deg)',
        // App-wide soft radial brand backgrounds (light/dark)
        'brand-radial': 'radial-gradient(1400px 600px at 50% -10%, rgba(108,133,255,0.16), transparent 60%), radial-gradient(1000px 360px at 90% 8%, rgba(45,212,191,0.14), transparent 65%), radial-gradient(1200px 420px at 10% 12%, rgba(242,107,42,0.12), transparent 65%)',
        'brand-radial-dark': 'radial-gradient(1400px 600px at 50% -10%, rgba(76,98,245,0.22), transparent 60%), radial-gradient(1200px 420px at 85% 12%, rgba(45,212,191,0.16), transparent 65%), radial-gradient(1200px 420px at 10% 80%, rgba(242,107,42,0.12), transparent 60%)',
      },
      boxShadow: {
        soft: '0 16px 32px -16px rgba(15, 23, 42, 0.2)',
        elevated: '0 30px 60px -24px rgba(15, 23, 42, 0.32)',
        glow: '0 0 0 8px rgba(108, 133, 255, 0.22)',
      },
      dropShadow: {
        glow: '0 0 14px rgba(108, 133, 255, 0.55)',
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
