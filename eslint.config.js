/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    // Ignore everything except apps/electron/
    ignores: ["**/*", "!apps/electron/**"],
  },
];
