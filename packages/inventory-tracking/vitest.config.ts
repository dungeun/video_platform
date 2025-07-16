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
        '**/*.config.*',
        '**/index.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@repo/core': path.resolve(__dirname, '../core/src'),
      '@repo/types': path.resolve(__dirname, '../types/src'),
      '@repo/utils': path.resolve(__dirname, '../utils/src'),
      '@repo/cache': path.resolve(__dirname, '../cache/src'),
      '@repo/database': path.resolve(__dirname, '../database/src'),
      '@repo/api-client': path.resolve(__dirname, '../api-client/src')
    }
  }
});