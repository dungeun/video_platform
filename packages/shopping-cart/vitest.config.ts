import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@repo/storage': resolve(__dirname, '../storage/src'),
      '@repo/types': resolve(__dirname, '../types/src'),
      '@repo/utils': resolve(__dirname, '../utils/src'),
      '@repo/api-client': resolve(__dirname, '../api-client/src'),
    },
  },
});