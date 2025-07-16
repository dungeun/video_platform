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
      '@company/types': path.resolve(__dirname, '../types/src'),
      '@company/core': path.resolve(__dirname, '../core/src'),
      '@company/storage': path.resolve(__dirname, '../storage/src'),
      '@company/utils': path.resolve(__dirname, '../utils/src'),
    },
  },
});