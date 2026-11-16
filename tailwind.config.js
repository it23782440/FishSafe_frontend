/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  // NOTE: ./lib is included because status colour classes live in lib/sensorMeta.js.
  // Without it Tailwind never sees them and the badges can lose their colours.
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic surface tokens (values change with light/dark theme).
        bg: token('bg'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        line: token('line'),
        fg: token('fg'),
        muted: token('muted'),
        subtle: token('subtle'),
        brand: token('brand'),
        aqua: token('aqua'),
        nav: token('nav'),
        'nav-2': token('nav-2'),
        'nav-fg': token('nav-fg'),
        // Status colours (kept from the original config).
        safe: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        ink: token('fg'), // backwards-compatible alias
      },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.04), 0 1px 3px rgb(15 23 42 / 0.06)',
        lift: '0 8px 24px -8px rgb(15 23 42 / 0.18)',
      },
      keyframes: {
        ring: {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '100%': { transform: 'scale(2.1)', opacity: '0' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        ring: 'ring 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
        rise: 'rise 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
