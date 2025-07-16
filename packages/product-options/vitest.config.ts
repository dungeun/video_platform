import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/']
    }
  },
  resolve: {
    alias: {
      '@modules/core': path.resolve(__dirname, '../core/src'),
      '@modules/types': path.resolve(__dirname, '../types/src'),
      '@modules/database': path.resolve(__dirname, '../database/src'),
      '@modules/cache': path.resolve(__dirname, '../cache/src')
    }
  }
});