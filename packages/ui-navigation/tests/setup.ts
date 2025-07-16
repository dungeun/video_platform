/**
 * Test Setup for @company/ui-navigation
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// DOM 환경 설정
beforeAll(() => {
  // 전역 설정
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  // Navigator 설정
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });

  // localStorage mock
  const localStorageMock = {
    getItem: (key: string) => null,
    setItem: (key: string, value: string) => {},
    removeItem: (key: string) => {},
    clear: () => {},
    length: 0,
    key: (index: number) => null,
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
});

beforeEach(() => {
  // 각 테스트 전 초기화
  document.body.innerHTML = '';
});

afterEach(() => {
  // 각 테스트 후 정리
  document.body.innerHTML = '';
});

afterAll(() => {
  // 전역 정리
});