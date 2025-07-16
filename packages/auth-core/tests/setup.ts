/**
 * 테스트 환경 설정
 */

import { vi } from 'vitest';

// localStorage 모킹
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
});

// sessionStorage 모킹
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
});

// fetch 모킹
global.fetch = vi.fn();

// console 경고 숨기기
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn()
};