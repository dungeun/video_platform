import { beforeAll, afterAll, afterEach } from 'vitest';

// Mock environment variables
beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

// Clean up after each test
afterEach(() => {
  // Clear any mocks
});

// Clean up after all tests
afterAll(() => {
  // Any global cleanup
});