import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn().mockResolvedValue({
    transaction: vi.fn().mockReturnValue({
      objectStore: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(undefined),
        put: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        getAll: vi.fn().mockResolvedValue([])
      })
    })
  }),
  deleteDatabase: vi.fn().mockResolvedValue(undefined)
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock
});

// Mock fetch
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
console.warn = vi.fn();
console.error = vi.fn();