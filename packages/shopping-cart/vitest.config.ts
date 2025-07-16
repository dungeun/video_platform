import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@company/storage': resolve(__dirname, '../storage/src'),
      '@company/types': resolve(__dirname, '../types/src'),
      '@company/utils': resolve(__dirname, '../utils/src'),
      '@company/api-client': resolve(__dirname, '../api-client/src'),
    },
  },
});