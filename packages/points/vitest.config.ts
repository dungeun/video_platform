import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@modules/storage': path.resolve(__dirname, '../storage/src'),
      '@modules/core': path.resolve(__dirname, '../core/src'),
      '@modules/types': path.resolve(__dirname, '../types/src')
    }
  }
});