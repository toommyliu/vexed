module.exports = {
  compilerOptions: {
    warningFilter: (warning) =>
      !warning.filename?.includes("node_modules") &&
      !warning.code.startsWith("a11y"),
  },
};
