import { vi } from 'vitest';

// Mock date
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-01-15'));

// Mock fetch
global.fetch = vi.fn();

// Mock window
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});