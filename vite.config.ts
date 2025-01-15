/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import tmp from 'tmp';

export default defineConfig({
  plugins: [tsconfigPaths()],
  build: {
    outDir: 'dist',
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.{test,spec}.ts'],
      // @ts-ignore
      reportsDirectory: tmp.dirSync().name,
    },
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
    },
  },
});
