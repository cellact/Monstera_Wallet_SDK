module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    jest: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  globals: {
    __MONSTERA_VERSION__: 'readonly'
  },
  extends: ['eslint:recommended'],
  ignorePatterns: ['dist/', 'build/', 'node_modules/']
};
