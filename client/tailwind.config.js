/** @type {import('tailwindcss').Config} */
import flowbite from 'flowbite/plugin';
import tailwindScrollbar from 'tailwind-scrollbar';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
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
      },
      keyframes: {
        'card-fade-in': {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'card-fade-in': 'card-fade-in 0.8s ease-out forwards',
      },
    },
  },
  plugins: [flowbite, tailwindScrollbar],
};