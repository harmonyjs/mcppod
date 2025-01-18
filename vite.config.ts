/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import tmp from 'tmp';

export default defineConfig({
  plugins: [tsconfigPaths()],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.ts',
      formats: ['es']
    },
    rollupOptions: {
      external: [
        /^node:/,
        /^@modelcontextprotocol\/sdk/,
        /^node_modules/,
        'pino',
        'tmp',
        'zod'
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js'
      }
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['json', 'text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.{test,spec}.ts'],
      // @ts-ignore
      reportsDirectory: process.env.COVERAGE_REPORTS_DIR ?? tmp.dirSync().name,
    },
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
    },
  },
});
