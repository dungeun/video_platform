/**
 * @repo/permissions - 권한 관리 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PermissionManager,
  PermissionEvaluator,
  PermissionCache,
  createPermission,
  createCondition,
  validatePermissions,
  PermissionAction,
  ConditionOperator,
  ScopeType
} from '../src';

describe('PermissionManager', () => {
  let permissionManager: PermissionManager;

  beforeEach(() => {
    permissionManager = new PermissionManager({
      cacheEnabled: true,
      cacheTtl: 60,
      maxCacheSize: 100
    });
  });

  describe('권한 확인', () => {
    it('기본 권한 확인이 작동해야 함', async () => {
      const userId = 'test-user';
      
      // 사용자 권한 로드 (모킹된 데이터)
      await permissionManager.loadUserPermissions(userId);
      
      // 기본 권한 확인
      const hasReadPermission = permissionManager.hasPermission(userId, 'profile.read');
      expect(hasReadPermission).toBe(true);
      
      const hasDeletePermission = permissionManager.hasPermission(userId, 'profile.delete');
      expect(hasDeletePermission).toBe(false);
    });

    it('역할 기반 권한 확인이 작동해야 함', async () => {
      const userId = 'test-user';
      
      await permissionManager.loadUserPermissions(userId);
      
      // 역할 확인
      const hasUserRole = permissionManager.hasRole(userId, 'user');
      expect(hasUserRole).toBe(true);
      
      const hasAdminRole = permissionManager.hasRole(userId, 'admin');
      expect(hasAdminRole).toBe(false);
    });

    it('여러 권한 확인이 작동해야 함', async () => {
      const userId = 'test-user';
      
      await permissionManager.loadUserPermissions(userId);
      
      // 여러 권한 중 하나라도 있는지 확인
      const hasAnyPermission = permissionManager.hasAnyPermission(
        userId,
        ['profile.read', 'profile.write', 'profile.delete']
      );
      expect(hasAnyPermission).toBe(true);
      
      // 모든 권한을 가지고 있는지 확인
      const hasAllPermissions = permissionManager.hasAllPermissions(
        userId,
        ['profile.read', 'profile.write']
      );
      expect(hasAllPermissions).toBe(false); // profile.write 권한이 없음
    });
  });

  describe('권한 평가', () => {
    it('조건부 권한 평가가 작동해야 함', async () => {
      const userId = 'test-user';
      
      await permissionManager.loadUserPermissions(userId);
      
      const context = {
        userId,
        resource: { id: 'test-profile', ownerId: userId },
        metadata: { organizationId: 'test-org' }
      };
      
      const result = permissionManager.evaluatePermission(
        userId,
        'profile.update',
        context,
        { includeReasons: true }
      );
      
      expect(result.granted).toBe(true);
      expect(result.reason).toBeDefined();
    });
  });

  describe('캐시 관리', () => {
    it('캐시가 올바르게 작동해야 함', async () => {
      const userId = 'test-user';
      
      await permissionManager.loadUserPermissions(userId);
      
      // 첫 번째 호출
      const start1 = Date.now();
      permissionManager.hasPermission(userId, 'profile.read');
      const duration1 = Date.now() - start1;
      
      // 두 번째 호출 (캐시됨)
      const start2 = Date.now();
      permissionManager.hasPermission(userId, 'profile.read');
      const duration2 = Date.now() - start2;
      
      // 캐시된 호출이 더 빨라야 함
      expect(duration2).toBeLessThanOrEqual(duration1);
      
      // 캐시 정보 확인
      const cacheInfo = permissionManager.getCacheInfo();
      expect(cacheInfo.size).toBeGreaterThan(0);
    });

    it('사용자별 캐시 정리가 작동해야 함', async () => {
      const userId = 'test-user';
      
      await permissionManager.loadUserPermissions(userId);
      permissionManager.hasPermission(userId, 'profile.read');
      
      // 캐시에 항목이 있는지 확인
      let cacheInfo = permissionManager.getCacheInfo();
      expect(cacheInfo.size).toBeGreaterThan(0);
      
      // 사용자 캐시 정리
      permissionManager.clearUserCache(userId);
      
      cacheInfo = permissionManager.getCacheInfo();
      expect(cacheInfo.size).toBe(0);
    });
  });
});

describe('PermissionEvaluator', () => {
  let evaluator: PermissionEvaluator;

  beforeEach(() => {
    evaluator = new PermissionEvaluator();
  });

  describe('조건 평가', () => {
    it('단순 조건 평가가 작동해야 함', () => {
      const permission = createPermission(
        'test-1',
        'profile',
        PermissionAction.UPDATE,
        [createCondition('userId', ConditionOperator.EQ, 'test-user')]
      );

      const context = {
        userId: 'test-user',
        resource: { ownerId: 'test-user' }
      };

      const result = evaluator.evaluatePermission(permission, context);
      expect(result.granted).toBe(true);
    });

    it('복합 조건 평가가 작동해야 함', () => {
      const permission = createPermission(
        'test-2',
        'document',
        PermissionAction.READ,
        [
          createCondition('metadata.organizationId', ConditionOperator.EQ, 'test-org'),
          createCondition('metadata.department', ConditionOperator.IN, ['dev', 'qa'])
        ]
      );

      const context = {
        userId: 'test-user',
        metadata: {
          organizationId: 'test-org',
          department: 'dev'
        }
      };

      const result = evaluator.evaluatePermission(permission, context);
      expect(result.granted).toBe(true);
    });

    it('조건 불만족 시 거부되어야 함', () => {
      const permission = createPermission(
        'test-3',
        'profile',
        PermissionAction.DELETE,
        [createCondition('userId', ConditionOperator.EQ, 'test-user')]
      );

      const context = {
        userId: 'different-user',
        resource: { ownerId: 'test-user' }
      };

      const result = evaluator.evaluatePermission(permission, context);
      expect(result.granted).toBe(false);
    });
  });

  describe('스코프 평가', () => {
    it('사용자 스코프 평가가 작동해야 함', () => {
      const permission = createPermission('test-4', 'profile', PermissionAction.READ);
      permission.scope = {
        type: ScopeType.USER,
        values: ['test-user', 'admin-user'],
        excludes: ['banned-user']
      };

      const context = {
        userId: 'test-user'
      };

      const result = evaluator.evaluatePermission(permission, context);
      expect(result.granted).toBe(true);
    });

    it('조직 스코프 평가가 작동해야 함', () => {
      const permission = createPermission('test-5', 'document', PermissionAction.READ);
      permission.scope = {
        type: ScopeType.ORGANIZATION,
        values: ['test-org'],
        excludes: []
      };

      const context = {
        userId: 'test-user',
        metadata: { organizationId: 'test-org' }
      };

      const result = evaluator.evaluatePermission(permission, context);
      expect(result.granted).toBe(true);
    });
  });
});

describe('PermissionCache', () => {
  let cache: PermissionCache;

  beforeEach(() => {
    cache = new PermissionCache({
      maxSize: 10,
      defaultTtl: 60
    });
  });

  describe('기본 캐시 동작', () => {
    it('값 저장 및 조회가 작동해야 함', () => {
      cache.set('test-key', true);
      
      const result = cache.get('test-key');
      expect(result).toBe(true);
    });

    it('존재하지 않는 키는 null을 반환해야 함', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('TTL 만료 후 값이 삭제되어야 함', (done) => {
      cache.set('test-key', true, 0.1); // 0.1초 TTL
      
      setTimeout(() => {
        const result = cache.get('test-key');
        expect(result).toBeNull();
        done();
      }, 150);
    });
  });

  describe('캐시 관리', () => {
    it('최대 크기 제한이 작동해야 함', () => {
      // 최대 크기보다 많은 항목 추가
      for (let i = 0; i < 15; i++) {
        cache.set(`key-${i}`, true);
      }
      
      const info = cache.getInfo();
      expect(info.size).toBeLessThanOrEqual(10);
    });

    it('패턴으로 삭제가 작동해야 함', () => {
      cache.set('user:123:profile.read', true);
      cache.set('user:123:profile.write', true);
      cache.set('user:456:profile.read', true);
      
      const deletedCount = cache.deleteByPattern(/^user:123:/);
      expect(deletedCount).toBe(2);
      
      expect(cache.get('user:123:profile.read')).toBeNull();
      expect(cache.get('user:456:profile.read')).toBe(true);
    });

    it('사용자별 삭제가 작동해야 함', () => {
      cache.set('user-123:profile.read', true);
      cache.set('user-123:profile.write', true);
      cache.set('user-456:profile.read', true);
      
      const deletedCount = cache.deleteByUserId('user-123');
      expect(deletedCount).toBe(2);
      
      expect(cache.get('user-123:profile.read')).toBeNull();
      expect(cache.get('user-456:profile.read')).toBe(true);
    });
  });
});

describe('Permission Helpers', () => {
  describe('권한 유틸리티', () => {
    it('권한명 생성이 올바르게 작동해야 함', () => {
      const permissionName = createPermission('test', 'user', PermissionAction.READ).name;
      expect(permissionName).toBe('user.read');
    });

    it('권한 검증이 올바르게 작동해야 함', () => {
      const permissions = [
        createPermission('1', 'user', PermissionAction.READ),
        createPermission('2', 'user', PermissionAction.WRITE),
        { id: '', name: '', resource: '', action: PermissionAction.DELETE } // 잘못된 권한
      ];

      const result = validatePermissions(permissions);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});