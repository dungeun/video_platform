import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/index.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@company/core': path.resolve(__dirname, '../core/src'),
      '@company/api-client': path.resolve(__dirname, '../api-client/src'),
      '@company/cache': path.resolve(__dirname, '../cache/src'),
      '@company/storage': path.resolve(__dirname, '../storage/src'),
      '@company/types': path.resolve(__dirname, '../types/src'),
      '@company/utils': path.resolve(__dirname, '../utils/src')
    }
  }
});