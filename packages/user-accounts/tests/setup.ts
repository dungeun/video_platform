import { vi } from 'vitest';

// Mock dependencies
vi.mock('@company/core', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })),
  ModuleBase: vi.fn()
}));

vi.mock('@company/database', () => ({
  DatabaseManager: vi.fn()
}));

vi.mock('@company/utils', () => ({
  // Add any utils mocks if needed
}));

vi.mock('@company/storage', () => ({
  // Add any storage mocks if needed
}));

vi.mock('@company/auth-core', () => ({
  // Add any auth-core mocks if needed
}));

// Mock external libraries
vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
  compare: vi.fn()
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-id-123')
}));

// Setup global test environment
beforeEach(() => {
  vi.clearAllMocks();
});