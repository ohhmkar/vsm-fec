/* eslint-env node */
module.exports = {
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:drizzle/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: true,
  },
  plugins: ['@typescript-eslint', 'drizzle'],
  root: true,
  rules: {
    'prefer-const': 'warn',
    'no-shadow': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-shadow': 'warn',
    '@typescript-eslint/no-unnecessary-condition': 'off',
  },
  ignorePatterns: [
    '.eslintrc.cjs',
    '.prettierrc.cjs',
    'node_modules',
    'dist',
    'old',
  ],
};
