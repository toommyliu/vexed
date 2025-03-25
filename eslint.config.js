const browser = require('eslint-config-neon/browser');
const common = require('eslint-config-neon/common');
const node = require('eslint-config-neon/node');
const prettier = require('eslint-config-neon/prettier');
const typescript = require('eslint-config-neon/typescript');
const merge = require('lodash.merge');

const commonFiles = '.ts';
const jsFiles = '.js';

const commonRuleset = merge(...common, { files: [`**/*${commonFiles}`] });

const nodeRuleset = merge(...node, {
  files: [`**/main/${commonFiles}`, `**/main/${jsFiles}`],
});

const browserRuleset = merge(...browser, {
  files: [`**/renderer/${commonFiles}`],
});

const typeScriptRuleset = merge(...typescript, {
  files: [`**/*${commonFiles}`],
  languageOptions: {
    parserOptions: {
      project: ['tsconfig.eslint.json'],
    },
  },
  rules: {
    '@typescript-eslint/quotes': ['error', 'single'],
  },
});

const jsRuleset = merge(...common, ...node, ...prettier, {
  files: [`**/*${jsFiles}`],
});

const prettierRuleset = merge(...prettier, { files: [`**/*${commonFiles}`] });

/** @type {import('eslint').Linter.Config[]} */
const rules = [
  {
    ignores: [
      '**/node_modules/',
      '.git/',
      '**/dist/',
      '**/build/',
      'index.d.ts',
    ],
  },
  commonRuleset,
  nodeRuleset,
  {
    files: ['./scripts/**/*.js'],
  },
  browserRuleset,
  typeScriptRuleset,
  jsRuleset,
  {
    files: ['**/*.ts'],
  },
  prettierRuleset,
];

module.exports = rules;
