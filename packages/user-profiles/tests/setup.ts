import { vi } from 'vitest';

// Mock @company/core
vi.mock('@company/core', () => ({
  ModuleBase: class MockModuleBase {
    protected logger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    };
    
    protected emit = vi.fn();
    
    constructor(public name: string) {}
  }
}));

// Mock @company/database
vi.mock('@company/database', () => ({
  DatabaseManager: class MockDatabaseManager {
    query = vi.fn();
    connect = vi.fn();
    disconnect = vi.fn();
  }
}));

// Global test utilities
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};