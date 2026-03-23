/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#e8edf4',
          100: '#c5d0e2',
          200: '#9fb0ce',
          300: '#7891ba',
          400: '#587bab',
          500: '#3a659c',
          600: '#2d5690',
          700: '#1e3a5f',  // PRIMARY — Navy principal
          800: '#162d4b',
          900: '#0e1e32',
        },
        gold: {
          50:  '#fdf6e8',
          100: '#fae8c0',
          200: '#f5d48f',
          300: '#efbf5e',
          400: '#e8aa38',
          500: '#D4A03A',  // PRIMARY — Gold principal
          600: '#b8882e',
          700: '#9a7024',
          800: '#7c581b',
          900: '#5e4012',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
