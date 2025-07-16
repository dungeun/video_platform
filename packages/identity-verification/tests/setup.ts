import '@testing-library/jest-dom';

// Mock window.open for popup tests
global.window.open = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
};