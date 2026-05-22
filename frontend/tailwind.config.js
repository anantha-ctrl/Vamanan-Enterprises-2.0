/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gold-primary': '#D4AF37',
        'gold-secondary': '#C5A028',
        'dark-bg': '#05162E', // Premium Deepest Navy Blue
        'dark-card': '#0B2545', // Premium Midnight Navy Blue
        'light-bg': '#FFFFFF',
        'light-card': '#F9FAFB',
        // Premium Navy Blue overrides for default dark/black text colors
        black: '#0B2545',
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#475569',
          600: '#1E3A8A', // Deep Navy Blue
          700: '#1D4ED8', // Medium Navy Blue
          800: '#0F2C59', // Rich Navy Blue
          900: '#0B2545', // Midnight Navy Blue
          950: '#05162E', // Deepest Navy Blue
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#1E3A8A', // Deep Navy Blue
          700: '#1D4ED8', // Medium Navy Blue
          800: '#0F2C59', // Rich Navy Blue
          900: '#0B2545', // Midnight Navy Blue
          950: '#05162E', // Deepest Navy Blue
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
