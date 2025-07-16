/**
 * @repo/permissions - 테스트 설정
 */

import { beforeAll, afterAll, vi } from 'vitest';

// 글로벌 테스트 설정
beforeAll(() => {
  // 콘솔 출력 최소화
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  
  // Date.now() 모킹 (일관된 테스트를 위해)
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
});

afterAll(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// 테스트 유틸리티
export const createMockPermissionContext = (overrides = {}) => ({
  userId: 'test-user',
  resource: { id: 'test-resource', ownerId: 'test-user' },
  action: 'read',
  environment: {
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    time: {
      timestamp: new Date(),
      timezone: 'UTC',
      businessHours: true,
      dayOfWeek: 1
    }
  },
  metadata: {
    organizationId: 'test-org',
    departmentId: 'test-dept'
  },
  ...overrides
});

export const createMockPermission = (overrides = {}) => ({
  id: 'test-permission',
  name: 'test.read',
  resource: 'test',
  action: 'read',
  conditions: [],
  ...overrides
});

export const createMockRole = (overrides = {}) => ({
  id: 'test-role',
  name: 'user',
  description: 'Test user role',
  permissions: [],
  isSystem: false,
  ...overrides
});