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
        '**/*.config.*',
        '**/mockData.ts',
        'dist/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@company/core': path.resolve(__dirname, '../core/src'),
      '@company/database': path.resolve(__dirname, '../database/src'),
      '@company/types': path.resolve(__dirname, '../types/src'),
      '@company/utils': path.resolve(__dirname, '../utils/src')
    }
  }
});