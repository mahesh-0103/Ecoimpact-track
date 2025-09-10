/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terra: {
          dark: '#0a192f',
          darker: '#020c1b',
          accent: '#64ffda',
          'accent-glow': '#64ffda80',
          primary: '#e6f1ff',
          secondary: '#8892b0',
          panel: '#112240',
          'panel-light': '#233554',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(100, 255, 218, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(100, 255, 218, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};