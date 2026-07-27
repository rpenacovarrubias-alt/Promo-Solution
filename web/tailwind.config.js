/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta aprobada en design-demos/dashboard/*.html — debe coincidir
        // exacto con la del dashboard (src/tailwind.config.js: navy/gold).
        navy: {
          50:  '#eef1f8',
          100: '#d8e0ee',
          200: '#b5c2dc',
          300: '#8a9cc0',
          400: '#5a70a0',
          500: '#3a5080',
          600: '#223868',  // navy-mid del prototipo
          700: '#17264A',  // PRIMARY — Navy principal (aprobado)
          800: '#142244',
          900: '#101B34',  // navy-deep del prototipo
        },
        gold: {
          50:  '#fdf6e8',
          100: '#f8f0de',
          200: '#f3e6c7',
          300: '#edd9ac',
          400: '#e4c888',  // gold-light del prototipo
          500: '#C9A15A',  // PRIMARY — Gold principal (aprobado)
          600: '#a8823f',
          700: '#8a6a32',
          800: '#6b5126',
          900: '#4d3a1a',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
