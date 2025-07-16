import '@testing-library/jest-dom';

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Mock payment methods
vi.mock('@modules/payment-toss', () => ({
  TossPaymentService: vi.fn().mockImplementation(() => ({
    processPayment: vi.fn().mockResolvedValue({ success: true, paymentId: 'pay_123' }),
    refund: vi.fn().mockResolvedValue({ success: true })
  }))
}));

// Setup test environment
beforeEach(() => {
  vi.clearAllMocks();
});