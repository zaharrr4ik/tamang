/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--app-bg)',
          card: 'var(--app-card)',
          text: 'var(--app-text)',
          hint: 'var(--app-hint)',
          border: 'var(--app-border)',
          accent: 'var(--app-accent)',
          'accent-soft': 'var(--app-accent-soft)',
          'accent-contrast': 'var(--app-accent-contrast)',
          success: 'var(--app-success)',
          danger: 'var(--app-danger)',
        },
      },
      borderRadius: {
        app: 'var(--app-radius)',
        'app-sm': 'var(--app-radius-sm)',
      },
      boxShadow: {
        app: 'var(--app-shadow)',
      },
      fontFamily: {
        app: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0.4' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        pop: 'pop 180ms ease-out',
      },
    },
  },
  plugins: [],
};
