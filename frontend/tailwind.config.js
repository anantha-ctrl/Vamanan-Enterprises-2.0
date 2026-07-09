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
        'dark-bg': '#05162E',
        'dark-card': '#0B2545',
        'light-bg': '#FFFFFF',
        'light-card': '#F9FAFB',
        brand: {
          50:  '#eef4ff',
          100: '#d9e5ff',
          200: '#bcd2ff',
          300: '#8eb4ff',
          400: '#598bff',
          500: '#3563ff',
          600: '#1f42f5',
          700: '#1832e1',
          800: '#1a2cb6',
          900: '#1c2c8f',
        },
        gold: {
          50:  '#fbf8ef',
          100: '#f7eecc',
          200: '#eedb99',
          300: '#e5c566',
          400: '#dcb03f',
          500: '#d4af37',
          600: '#b8901f',
          700: '#946e1b',
          800: '#79591c',
          900: '#674a1b',
        },
        amber: {
          50:  '#fbf8ef',
          100: '#f7eecc',
          200: '#eedb99',
          300: '#e5c566',
          400: '#dcb03f',
          500: '#d4af37',
          600: '#b8901f',
          700: '#946e1b',
          800: '#79591c',
          900: '#674a1b',
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
