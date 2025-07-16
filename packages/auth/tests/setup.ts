/**
 * @company/auth - Test Setup
 */

import { beforeEach, vi } from 'vitest';

// Mock window object
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
  },
  writable: true,
});

// Clean up before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});