/**
 * @repo/storage - 타입 정의
 * 스토리지 시스템 타입
 */

import { Result } from '@repo/core';

// ===== 기본 타입 =====

export interface StorageValue<T = any> {
  data: T;
  metadata?: StorageMetadata;
}

export interface StorageMetadata {
  created: number;
  updated: number;
  expires?: number;
  tags?: string[];
  version?: number;
  checksum?: string;
}

export interface StorageOptions {
  ttl?: number; // Time to live in milliseconds
  encrypt?: boolean;
  compress?: boolean;
  namespace?: string;
  version?: number;
  tags?: string[];
}

export interface StorageQuery {
  prefix?: string;
  tags?: string[];
  beforeDate?: Date;
  afterDate?: Date;
  limit?: number;
  offset?: number;
  namespace?: string;
}

// ===== 스토리지 프로바이더 인터페이스 =====

export interface StorageProvider {
  readonly name: string;
  readonly type: StorageType;
  readonly isAvailable: boolean;
  readonly capacity?: number;

  // 기본 작업
  get<T>(key: string): Promise<Result<T | null>>;
  set<T>(key: string, value: T, options?: StorageOptions): Promise<Result<void>>;
  delete(key: string): Promise<Result<void>>;
  exists(key: string): Promise<Result<boolean>>;
  
  // 배치 작업
  getMany<T>(keys: string[]): Promise<Result<Map<string, T>>>;
  setMany<T>(entries: Map<string, T>, options?: StorageOptions): Promise<Result<void>>;
  deleteMany(keys: string[]): Promise<Result<void>>;
  
  // 쿼리 작업
  keys(query?: StorageQuery): Promise<Result<string[]>>;
  values<T>(query?: StorageQuery): Promise<Result<T[]>>;
  entries<T>(query?: StorageQuery): Promise<Result<Array<[string, T]>>>;
  
  // 유틸리티
  clear(namespace?: string): Promise<Result<void>>;
  size(namespace?: string): Promise<Result<number>>;
  
  // 라이프사이클
  initialize?(): Promise<Result<void>>;
  destroy?(): Promise<Result<void>>;
}

// ===== 스토리지 타입 =====

export enum StorageType {
  LOCAL = 'local',
  SESSION = 'session',
  INDEXED_DB = 'indexedDB',
  MEMORY = 'memory',
  COOKIE = 'cookie',
  CACHE = 'cache'
}

// ===== 로컬 스토리지 타입 =====

export interface LocalStorageConfig {
  prefix?: string;
  separator?: string;
  serializer?: StorageSerializer;
  maxSize?: number;
}

// ===== 세션 스토리지 타입 =====

export interface SessionStorageConfig extends LocalStorageConfig {
  // 세션 스토리지 특화 설정
}

// ===== IndexedDB 타입 =====

export interface IndexedDBConfig {
  databaseName: string;
  version?: number;
  stores: IndexedDBStoreConfig[];
  onUpgrade?: (db: IDBDatabase, oldVersion: number, newVersion: number) => void;
}

export interface IndexedDBStoreConfig {
  name: string;
  keyPath?: string;
  autoIncrement?: boolean;
  indexes?: IndexedDBIndexConfig[];
}

export interface IndexedDBIndexConfig {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
  multiEntry?: boolean;
}

// ===== 메모리 스토리지 타입 =====

export interface MemoryStorageConfig {
  maxSize?: number;
  evictionPolicy?: EvictionPolicy;
  ttl?: number;
}

export enum EvictionPolicy {
  LRU = 'lru', // Least Recently Used
  LFU = 'lfu', // Least Frequently Used
  FIFO = 'fifo', // First In First Out
  RANDOM = 'random'
}

// ===== 쿠키 스토리지 타입 =====

export interface CookieStorageConfig {
  domain?: string;
  path?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
  maxAge?: number;
}

// ===== 캐시 스토리지 타입 =====

export interface CacheStorageConfig {
  cacheName: string;
  version?: string;
  maxAge?: number;
  maxEntries?: number;
}

// ===== 시리얼라이저 =====

export interface StorageSerializer {
  serialize<T>(value: T): string;
  deserialize<T>(value: string): T;
}

// ===== 암호화 =====

export interface StorageEncryption {
  encrypt(data: string, key?: string): Promise<string>;
  decrypt(data: string, key?: string): Promise<string>;
}

// ===== 압축 =====

export interface StorageCompression {
  compress(data: string): Promise<string>;
  decompress(data: string): Promise<string>;
}

// ===== 스토리지 이벤트 =====

export interface StorageEvent<T = any> {
  type: StorageEventType;
  key: string;
  oldValue?: T;
  newValue?: T;
  namespace?: string;
  timestamp: number;
}

export enum StorageEventType {
  SET = 'set',
  DELETE = 'delete',
  CLEAR = 'clear',
  EXPIRE = 'expire'
}

// ===== 스토리지 리스너 =====

export type StorageListener<T = any> = (event: StorageEvent<T>) => void;

// ===== 스토리지 통계 =====

export interface StorageStats {
  provider: string;
  type: StorageType;
  totalSize: number;
  usedSize: number;
  availableSize: number;
  itemCount: number;
  namespaces: string[];
  oldestItem?: Date;
  newestItem?: Date;
}

// ===== 스토리지 마이그레이션 =====

export interface StorageMigration {
  version: number;
  migrate: (oldData: any) => any;
  rollback?: (newData: any) => any;
}

export interface MigrationOptions {
  fromVersion: number;
  toVersion: number;
  migrations: StorageMigration[];
  onProgress?: (current: number, total: number) => void;
}

// ===== 유틸리티 타입 =====

export type StorageKey = string;
export type StorageNamespace = string;

export type StorageResult<T> = Result<T>;

export interface StorageAdapter {
  get(key: string): any;
  set(key: string, value: any): void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
}

// ===== 스토리지 설정 =====

export interface StorageConfig {
  defaultProvider?: StorageType;
  providers?: {
    [key in StorageType]?: any;
  };
  encryption?: StorageEncryption;
  compression?: StorageCompression;
  serializer?: StorageSerializer;
  namespace?: string;
  prefix?: string;
  ttl?: number;
  autoCleanup?: boolean;
  cleanupInterval?: number;
}