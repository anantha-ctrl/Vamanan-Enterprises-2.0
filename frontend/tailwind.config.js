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
        'dark-bg': '#0B0B0B',
        'dark-card': '#161616',
        'light-bg': '#FFFFFF',
        'light-card': '#F9FAFB',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
