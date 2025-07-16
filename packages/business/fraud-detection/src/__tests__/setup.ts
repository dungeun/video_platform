import { vi } from 'vitest';

// Mock external APIs and services that might be called during tests
global.fetch = vi.fn();

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

// Mock Date.now for consistent testing
const mockDate = new Date('2023-01-01T00:00:00.000Z');
vi.setSystemTime(mockDate);

// Setup any global test configuration
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});