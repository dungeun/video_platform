import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@repo/api-client': path.resolve(__dirname, '../api-client/src'),
      '@repo/auth-core': path.resolve(__dirname, '../auth-core/src'),
      '@repo/cache': path.resolve(__dirname, '../cache/src'),
      '@repo/core': path.resolve(__dirname, '../core/src'),
      '@repo/storage': path.resolve(__dirname, '../storage/src'),
      '@repo/types': path.resolve(__dirname, '../types/src'),
      '@repo/utils': path.resolve(__dirname, '../utils/src')
    }
  }
});