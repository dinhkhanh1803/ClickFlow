import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import globals from 'globals';

const typedRules = {
  ...tseslint.configs['recommended-type-checked'].rules,
  'no-undef': 'off'
};

export default [
  { ignores: ['dist/**'] },
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
      parser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname }
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: typedRules
  },
  {
    files: ['test/**/*.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.vitest } },
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off'
    }
  }
];
