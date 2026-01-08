import pluginVue from 'eslint-plugin-vue';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
const config = [
  ...ts.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  ...astro.configs.recommended,
  {
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  },
  {
    files: ['*.d.ts', '**/*.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    ignores: ['dist/**', '.astro/**'],
  },
  {
    files: ['*.ts', '**/*.ts', '*.vue', '**/*.vue'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'comma-dangle': ['error', 'always-multiline'],
      'no-console': 'off', // Allow console for debugging
    },
  },
  {
    files: ['*.vue', '**/*.vue'],
    rules: {
      // Disable formatting rules - Prettier handles this
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/attributes-order': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
    },
  },
];
if (!config.extends) config.extends = [];
config.extends.push('prettier');

export default config;
