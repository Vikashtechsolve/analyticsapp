/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8fafc',
          border: '#e2e8f0',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)',
        panel: '0 4px 6px -1px rgb(15 23 42 / 0.05), 0 2px 4px -2px rgb(15 23 42 / 0.05)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'hof-shimmer': {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        'hof-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'hof-glow': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.65' },
        },
        'hof-rise': {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'hof-pedestal': {
          '0%': { opacity: '0', transform: 'scaleY(0)' },
          '100%': { opacity: '1', transform: 'scaleY(1)' },
        },
        'hof-sparkle': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.55s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'scale-in': 'scale-in 0.45s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
        'hof-shimmer': 'hof-shimmer 4s linear infinite',
        'hof-float': 'hof-float 3s ease-in-out infinite',
        'hof-glow': 'hof-glow 2.5s ease-in-out infinite',
        'hof-rise': 'hof-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'hof-pedestal': 'hof-pedestal 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'hof-sparkle': 'hof-sparkle 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
