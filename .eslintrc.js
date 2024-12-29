module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  parserOptions: {
    sourceType: 'module',
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  plugins: ['simple-import-sort'],
  rules: {
    curly: ['error', 'all'],
    'object-shorthand': 'error',
    'brace-style': ['error', '1tbs', {allowSingleLine: false}],

    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
  },
}
