/**
 * @company/storage - Enterprise Storage Module
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
export { StorageManager } from './StorageManager';
export { LocalStorageProvider } from './providers/LocalStorageProvider';
export { SessionStorageProvider } from './providers/SessionStorageProvider';
export { MemoryStorageProvider } from './providers/MemoryStorageProvider';
export { IndexedDBProvider } from './providers/IndexedDBProvider';
export { StorageSerializer } from './utils/StorageSerializer';
export { StorageEncryption, EncryptedStorageProvider, defaultEncryption } from './utils/StorageEncryption';
export { StorageCompression, CompressedStorageProvider, defaultCompression } from './utils/StorageCompression';
export { QuotaManager, defaultQuotaManager } from './utils/QuotaManager';
export { StorageSync, defaultStorageSync } from './utils/StorageSync';
export { BackupRestore, defaultBackupRestore } from './utils/BackupRestore';
export type { EncryptionOptions, EncryptedData, CompressionOptions, CompressedData, QuotaInfo, QuotaConfig, QuotaAllocation, SyncConfig, SyncResult, SyncState, BackupConfig, BackupMetadata, BackupData, RestoreOptions, RestoreResult } from './utils/StorageEncryption';
export type { StorageValue, StorageMetadata, StorageOptions, StorageQuery, StorageProvider, StorageConfig, LocalStorageConfig, SessionStorageConfig, IndexedDBConfig, IndexedDBStoreConfig, IndexedDBIndexConfig, MemoryStorageConfig, CookieStorageConfig, CacheStorageConfig, StorageSerializer as IStorageSerializer, StorageEncryption, StorageCompression, StorageAdapter, StorageEvent, StorageListener, StorageStats, StorageMigration, MigrationOptions, StorageKey, StorageNamespace, StorageResult } from './types';
export { StorageType, StorageEventType, EvictionPolicy } from './types';
import { StorageManager } from './StorageManager';
import { StorageConfig } from './types';
/**
 * 스토리지 매니저 생성
 */
export declare function createStorageManager(config?: StorageConfig): StorageManager;
/**
 * 기본 설정으로 스토리지 매니저 생성
 */
export declare function createDefaultStorageManager(): StorageManager;
/**
 * 브라우저 스토리지 지원 확인
 */
export declare function checkStorageSupport(): {
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
    cookies: boolean;
};
/**
 * 스토리지 용량 추정
 */
export declare function estimateStorageQuota(): Promise<{
    usage: number;
    quota: number;
    percent: number;
} | null>;
/**
 * 스토리지 지속성 요청
 */
export declare function requestPersistentStorage(): Promise<boolean>;
/**
 * 스토리지 지속성 확인
 */
export declare function isStoragePersistent(): Promise<boolean>;
export declare const DEFAULT_STORAGE_CONFIG: Partial<StorageConfig>;
export declare const STORAGE_LIMITS: {
    localStorage: number;
    sessionStorage: number;
    cookie: number;
    indexedDB: number;
};
export declare const STORAGE_MODULE_INFO: {
    readonly name: "@company/storage";
    readonly version: "1.0.0";
    readonly description: "Enterprise Storage Module with Multiple Providers";
    readonly author: "Enterprise AI Team";
    readonly license: "MIT";
};
//# sourceMappingURL=index.d.ts.map