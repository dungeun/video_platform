import { beforeEach, vi } from 'vitest';

// Mock environment variables
process.env.SOCIAL_MEDIA_ENCRYPTION_KEY = 'test-encryption-key';
process.env.SOCIAL_MEDIA_WEBHOOK_SECRET = 'test-webhook-secret';

// Mock external dependencies
vi.mock('axios', () => ({
  default: {
    create: () => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }),
    post: vi.fn()
  }
}));

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});