const common = require("eslint-config-neon/common");
const node = require("eslint-config-neon/node");
const prettier = require("eslint-config-neon/prettier");
const typescript = require("eslint-config-neon/typescript");
const browser = require("eslint-config-neon/browser");

const merge = require("lodash.merge");

const commonFiles = ".ts";

const commonRuleset = merge(...common, { files: [`./src/**/*${commonFiles}`] });

const nodeRuleset = merge(...node, {
  files: [`./src/main/**/*${commonFiles}`],
});

const browserRuleset = merge(...browser, {
  files: [`./src/renderer/**/*${commonFiles}`],
});

const typeScriptRuleset = merge(...typescript, {
  files: [`./src/**/*${commonFiles}`],
  languageOptions: {
    parserOptions: {
      project: ["tsconfig.eslint.json"],
    },
  },
  rules: {
    //  https://github.com/typescript-eslint/typescript-eslint/issues/1824
    "@stylistic/ts/indent": "off",
    "unicorn/prefer-node-protocol": "off",
  },
});

const prettierRuleset = merge(...prettier, {
  files: [`./src/**/*${commonFiles}`],
});

/** @type {import('eslint').Linter.Config[]} */
const rules = [
  {
    ignores: [
      "./node_modules/",
      ".git/",
      "./dist/",
      "./build/",
      "./scripts/",
      "./src/**/index.d.ts",
    ],
  },
  commonRuleset,
  nodeRuleset,
  browserRuleset,
  typeScriptRuleset,
  {
    files: ["./**/*.ts"],
  },
  prettierRuleset,
];

module.exports = rules;
