/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./public/**/*.html",
    "./src/renderer/game/ui.ts",
    "./src/renderer/game/ui-utils.ts",
    "./src/renderer/game/flash-interop.ts",
    "./src/renderer/game/util/addCheckbox.ts",
    "./src/renderer/game/scripts/**/*.ts",
    "./src/renderer/manager/**/*.ts",

    "./src/**/*.{html,js,svelte,ts}",
  ],
  theme: {
    extend: {
      colors: {
        "background-primary": "#111111",
        "background-secondary": "#1a1a1a",
      },
    },
  },
  plugins: [],
};
