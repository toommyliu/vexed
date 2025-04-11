/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./public/**/*.html'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f111a',
          panel: '#1c1e2a',
          input: '#141622',
          border: '#2d3748',
          highlight: '#9f7aea',
          accent: '#7e22ce',
          success: '#a3e635',
          danger: '#ef4444',
          warning: '#f59e0b',
          text: {
            primary: '#f8fafc',
            secondary: '#cbd5e1',
            muted: '#94a3b8',
          },
        },
      },
    },
  },
  plugins: [],
};
