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
      '@company/core': resolve(__dirname, '../core/src'),
      '@company/types': resolve(__dirname, '../types/src'),
      '@company/utils': resolve(__dirname, '../utils/src')
    }
  }
});