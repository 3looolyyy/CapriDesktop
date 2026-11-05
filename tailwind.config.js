/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        cp: {
          50: '#fff0ee',
          100: '#ffd9d5',
          200: '#ffb8b2',
          300: '#ff8a7a',
          400: '#ff6f66',
          500: '#ff5f57',
          600: '#e04a43',
          700: '#a8433d',
          800: '#5c2320',
          900: '#2a1112',
          950: '#170a0b'
        },
        cyber: {
          dark: '#07080e',
          card: 'rgba(13, 16, 27, 0.85)',
          magenta: '#ff007f',
          cyan: '#00ff9f',
          blue: '#00e5ff',
          purple: '#9d4edd'
        }
      }
    }
  },
  plugins: []
}
