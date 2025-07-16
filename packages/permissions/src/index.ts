/**
 * @company/permissions - 권한 관리 모듈
 * Ultra-fine-grained permission checking and access control
 * 
 * 이 모듈은 auth-core에서 분리된 순수한 권한 관리 기능을 제공합니다.
 * - 권한 확인 및 평가
 * - 역할 기반 접근 제어 (RBAC)
 * - 조건부 권한 처리
 * - 고성능 캐싱
 * - React 컴포넌트 및 훅
 */

// ===== 타입 정의 =====
export * from './types';

// ===== 서비스 =====
export {
  PermissionManager,
  PermissionEvaluator,
  PermissionCache,
  DefaultCacheStrategy,
  AggressiveCacheStrategy,
  ConservativeCacheStrategy
} from './services';

// ===== React 훅 =====
export {
  usePermission,
  usePermissionCache
} from './hooks';

// ===== React 컴포넌트 =====
export {
  ProtectedComponent,
  PermissionGate,
  PermissionDebugger,
  withPermissions,
  usePermissionGate
} from './components';

// ===== 프로바이더 =====
export {
  PermissionProvider,
  PermissionContext
} from './providers';

// ===== 유틸리티 =====
export * from './utils';

// ===== 기본 구성 =====
export const defaultPermissionConfig = {
  cacheEnabled: true,
  cacheTtl: 300, // 5분
  maxCacheSize: 1000,
  strictMode: false,
  enableDebugMode: process.env.NODE_ENV === 'development',
  defaultScope: 'user' as const
};

// ===== 모듈 정보 =====
export const moduleInfo = {
  name: '@company/permissions',
  version: '1.0.0',
  description: 'Ultra-fine-grained permission checking and access control',
  author: 'Company',
  license: 'MIT'
} as const;