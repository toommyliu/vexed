/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './public/**/*.html',
    './src/renderer/game/ui.ts',
    './src/renderer/game/ui-utils.ts',
    './src/renderer/game/scripts/**/*.ts',
    './src/renderer/manager/**/*.ts',
  ],
  theme: {},
  plugins: [],
};
