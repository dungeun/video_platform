/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@repo/types': path.resolve(__dirname, '../types/src'),
      '@repo/core': path.resolve(__dirname, '../core/src'),
      '@repo/storage': path.resolve(__dirname, '../storage/src'),
      '@repo/utils': path.resolve(__dirname, '../utils/src'),
    },
  },
});