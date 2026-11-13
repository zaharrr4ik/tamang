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
          ink: 'var(--app-ink)',
          'ink-soft': 'var(--app-ink-soft)',
          accent: 'var(--app-accent)',
          'accent-soft': 'var(--app-accent-soft)',
          'accent-contrast': 'var(--app-accent-contrast)',
          success: 'var(--app-success)',
          danger: 'var(--app-danger)',
          screen: 'var(--app-screen)',
          'screen-deep': 'var(--app-screen-deep)',
          floor: 'var(--app-floor)',
          'floor-line': 'var(--app-floor-line)',
          blue: 'var(--app-blue)',
          'blue-soft': 'var(--app-blue-soft)',
          'blue-contrast': 'var(--app-blue-contrast)',
          yellow: 'var(--app-yellow)',
          purple: 'var(--app-purple)',
          orange: 'var(--app-orange)',
        },
      },
      borderRadius: {
        app: 'var(--app-radius)',
        'app-sm': 'var(--app-radius-sm)',
      },
      borderWidth: {
        3: '3px',
        5: '5px',
      },
      boxShadow: {
        app: 'var(--app-shadow)',
        pixel: 'var(--app-pixel-shadow)',
        'pixel-sm': 'var(--app-pixel-shadow-sm)',
        'pixel-lg': 'var(--app-pixel-shadow-lg)',
      },
      fontFamily: {
        app: ['"Pixelify Sans"', '"Press Start 2P"', 'ui-monospace', 'monospace'],
        display: ['"Press Start 2P"', '"Pixelify Sans"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pop: {
          '0%': { transform: 'scale(0.92)' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        float: 'float 3.2s ease-in-out infinite',
        pop: 'pop 260ms steps(3, end) both',
      },
    },
  },
  plugins: [],
};
