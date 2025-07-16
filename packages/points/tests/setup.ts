import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock storage
vi.mock('@modules/storage', () => ({
  StorageManager: vi.fn().mockImplementation(() => {
    const storage = new Map();
    return {
      get: vi.fn((key: string) => Promise.resolve(storage.get(key))),
      set: vi.fn((key: string, value: any) => {
        storage.set(key, value);
        return Promise.resolve();
      }),
      remove: vi.fn((key: string) => {
        storage.delete(key);
        return Promise.resolve();
      }),
      clear: vi.fn(() => {
        storage.clear();
        return Promise.resolve();
      })
    };
  })
}));

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));