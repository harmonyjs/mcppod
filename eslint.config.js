import js from '@eslint/js';
import * as tsParser from '@typescript-eslint/parser';
import * as tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

export default [
    js.configs.recommended,
    prettier,
    {
        files: ['src/**/*.ts'],
        ignores: ['dist/**/*'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.es2021
            },
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: './tsconfig.json',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            'import': importPlugin
        },
        rules: {
            // TypeScript specific rules
            '@typescript-eslint/no-explicit-any': 'error',
            // '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/no-unsafe-assignment': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'error',
            '@typescript-eslint/no-unsafe-call': 'error',
            '@typescript-eslint/no-unsafe-return': 'error',

            // General rules
            'no-console': 'warn',
            'no-debugger': 'error',
            'no-duplicate-imports': 'off', // Disable core rule
            'import/no-duplicates': 'error', // Enable plugin rule

            // Turned off in favor of @typescript-eslint/no-unused-vars
            'no-unused-vars': 'off',
        },
    },
];
