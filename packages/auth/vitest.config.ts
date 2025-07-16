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
        'tests/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@repo/core': path.resolve(__dirname, '../core/src'),
      '@repo/types': path.resolve(__dirname, '../types/src'),
      '@repo/utils': path.resolve(__dirname, '../utils/src'),
      '@repo/api-client': path.resolve(__dirname, '../api-client/src')
    }
  }
});