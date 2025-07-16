/**
 * @repo/storage - Enterprise Storage Module
 * 
 * 다양한 스토리지 프로바이더를 통합 관리하는 엔터프라이즈 스토리지 모듈
 * - LocalStorage, SessionStorage, Memory, IndexedDB 지원
 * - TTL, 암호화, 압축 기능
 * - 이벤트 기반 변경 감지
 * - Zero Error Architecture
 * 
 * @version 1.0.0
 * @author Enterprise AI Team
 */

// ===== 핵심 클래스 =====
export { StorageManager } from './StorageManager';

// ===== 프로바이더 =====
export { LocalStorageProvider } from './providers/LocalStorageProvider';
export { SessionStorageProvider } from './providers/SessionStorageProvider';
export { MemoryStorageProvider } from './providers/MemoryStorageProvider';
export { IndexedDBProvider } from './providers/IndexedDBProvider';

// ===== 유틸리티 =====
export { StorageSerializer } from './utils/StorageSerializer';
export { 
  StorageEncryption, 
  EncryptedStorageProvider, 
  defaultEncryption 
} from './utils/StorageEncryption';
export { 
  StorageCompression, 
  CompressedStorageProvider, 
  defaultCompression 
} from './utils/StorageCompression';
export { 
  QuotaManager, 
  defaultQuotaManager 
} from './utils/QuotaManager';
export { 
  StorageSync, 
  defaultStorageSync 
} from './utils/StorageSync';
export { 
  BackupRestore, 
  defaultBackupRestore 
} from './utils/BackupRestore';

// ===== 유틸리티 타입 추가 =====
export type {
  EncryptionOptions,
  EncryptedData,
  CompressionOptions,
  CompressedData,
  QuotaInfo,
  QuotaConfig,
  QuotaAllocation,
  SyncConfig,
  SyncResult,
  SyncState,
  BackupConfig,
  BackupMetadata,
  BackupData,
  RestoreOptions,
  RestoreResult
} from './utils/StorageEncryption';

// ===== 타입 정의 =====
export type {
  // 기본 타입
  StorageValue,
  StorageMetadata,
  StorageOptions,
  StorageQuery,
  
  // 프로바이더 인터페이스
  StorageProvider,
  
  // 설정 타입
  StorageConfig,
  LocalStorageConfig,
  SessionStorageConfig,
  IndexedDBConfig,
  IndexedDBStoreConfig,
  IndexedDBIndexConfig,
  MemoryStorageConfig,
  CookieStorageConfig,
  CacheStorageConfig,
  
  // 유틸리티 인터페이스
  StorageSerializer as IStorageSerializer,
  StorageEncryption,
  StorageCompression,
  StorageAdapter,
  
  // 이벤트 타입
  StorageEvent,
  StorageListener,
  
  // 통계 타입
  StorageStats,
  
  // 마이그레이션 타입
  StorageMigration,
  MigrationOptions,
  
  // 유틸리티 타입
  StorageKey,
  StorageNamespace,
  StorageResult
} from './types';

// ===== 열거형 =====
export { 
  StorageType, 
  StorageEventType,
  EvictionPolicy 
} from './types';

// ===== 팩토리 함수 =====

import { StorageManager } from './StorageManager';
import { StorageConfig, StorageType } from './types';

/**
 * 스토리지 매니저 생성
 */
export function createStorageManager(config?: StorageConfig): StorageManager {
  return new StorageManager(config);
}

/**
 * 기본 설정으로 스토리지 매니저 생성
 */
export function createDefaultStorageManager(): StorageManager {
  return new StorageManager({
    defaultProvider: StorageType.LOCAL,
    autoCleanup: true,
    cleanupInterval: 60000,
    namespace: 'app',
    ttl: 24 * 60 * 60 * 1000 // 24시간
  });
}

// ===== 헬퍼 함수 =====

/**
 * 브라우저 스토리지 지원 확인
 */
export function checkStorageSupport(): {
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  cookies: boolean;
} {
  return {
    localStorage: typeof window !== 'undefined' && 'localStorage' in window,
    sessionStorage: typeof window !== 'undefined' && 'sessionStorage' in window,
    indexedDB: typeof window !== 'undefined' && 'indexedDB' in window,
    cookies: typeof document !== 'undefined' && 'cookie' in document
  };
}

/**
 * 스토리지 용량 추정
 */
export async function estimateStorageQuota(): Promise<{
  usage: number;
  quota: number;
  percent: number;
} | null> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    
    return {
      usage,
      quota,
      percent: quota > 0 ? (usage / quota) * 100 : 0
    };
  } catch {
    return null;
  }
}

/**
 * 스토리지 지속성 요청
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return false;
  }

  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * 스토리지 지속성 확인
 */
export async function isStoragePersistent(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persisted) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}

// ===== 상수 =====

export const DEFAULT_STORAGE_CONFIG: Partial<StorageConfig> = {
  defaultProvider: StorageType.LOCAL,
  namespace: 'app',
  prefix: '@company',
  ttl: 24 * 60 * 60 * 1000, // 24시간
  autoCleanup: true,
  cleanupInterval: 60000 // 1분
};

export const STORAGE_LIMITS = {
  localStorage: 5 * 1024 * 1024, // 5MB
  sessionStorage: 5 * 1024 * 1024, // 5MB
  cookie: 4096, // 4KB
  indexedDB: Infinity // 브라우저별로 다름
};

// ===== 모듈 정보 =====

export const STORAGE_MODULE_INFO = {
  name: '@repo/storage',
  version: '1.0.0',
  description: 'Enterprise Storage Module with Multiple Providers',
  author: 'Enterprise AI Team',
  license: 'MIT'
} as const;