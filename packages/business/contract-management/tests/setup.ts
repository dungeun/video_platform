import { beforeEach, vi } from 'vitest';

// Mock environment variables
process.env.CONTRACT_ENCRYPTION_KEY = 'test-encryption-key';
process.env.APP_URL = 'http://localhost:3000';

// Mock external dependencies
vi.mock('pdfkit', () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    fontSize: vi.fn().mockReturnThis(),
    font: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    moveDown: vi.fn().mockReturnThis(),
    fillColor: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
    stroke: vi.fn().mockReturnThis(),
    addPage: vi.fn().mockReturnThis(),
    switchToPage: vi.fn().mockReturnThis(),
    end: vi.fn(),
    y: 100,
    x: 50,
    page: { width: 600, height: 800 },
    bufferedPageRange: () => ({ count: 1 })
  }))
}));

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});