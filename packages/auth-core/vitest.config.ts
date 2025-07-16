import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@repo/core': resolve(__dirname, '../core/src'),
      '@repo/types': resolve(__dirname, '../types/src'),
      '@repo/utils': resolve(__dirname, '../utils/src')
    }
  }
});