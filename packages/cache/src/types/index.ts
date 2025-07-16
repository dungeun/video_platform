/**
 * @company/cache - 타입 정의
 * 캐시 시스템 타입
 */

import { Result } from '@company/core';

// ===== 기본 타입 =====

export interface CacheEntry<T = any> {
  value: T;
  metadata: CacheMetadata;
}

export interface CacheMetadata {
  key: string;
  created: number;
  accessed: number;
  accessCount: number;
  ttl?: number;
  expires?: number;
  tags?: string[];
  namespace?: string;
  size?: number;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  namespace?: string;
  priority?: number;
}

export interface CacheQuery {
  namespace?: string;
  tags?: string[];
  pattern?: string;
  limit?: number;
  offset?: number;
}

// ===== 캐시 전략 인터페이스 =====

export interface CacheStrategy<T = any> {
  readonly name: string;
  readonly maxSize: number;
  readonly size: number;
  
  get(key: string): T | undefined;
  set(key: string, value: T, metadata: CacheMetadata): void;
  delete(key: string): boolean;
  has(key: string): boolean;
  clear(): void;
  
  keys(): string[];
  values(): T[];
  entries(): Array<[string, T]>;
  
  evict(): string | undefined;
  shouldEvict(): boolean;
  
  resize(newSize: number): void;
  prune(): number;
}

// ===== 캐시 전략 타입 =====

export enum CacheStrategyType {
  LRU = 'lru',     // Least Recently Used
  LFU = 'lfu',     // Least Frequently Used  
  FIFO = 'fifo',   // First In First Out
  RANDOM = 'random'
}

// ===== 캐시 매니저 설정 =====

export interface CacheConfig {
  strategy?: CacheStrategyType;
  maxSize?: number;
  ttl?: number;
  namespace?: string;
  autoCleanup?: boolean;
  cleanupInterval?: number;
  enableStats?: boolean;
  enableEvents?: boolean;
}

// ===== 캐시 이벤트 =====

export interface CacheEvent<T = any> {
  type: CacheEventType;
  key: string;
  value?: T;
  oldValue?: T;
  namespace?: string;
  reason?: string;
  timestamp: number;
}

export enum CacheEventType {
  SET = 'set',
  GET = 'get',
  HIT = 'hit',
  MISS = 'miss',
  DELETE = 'delete',
  EVICT = 'evict',
  EXPIRE = 'expire',
  CLEAR = 'clear'
}

export type CacheEventListener<T = any> = (event: CacheEvent<T>) => void;

// ===== 캐시 통계 =====

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  expirations: number;
  hitRate: number;
  missRate: number;
  size: number;
  maxSize: number;
  memoryUsage?: number;
}

export interface CacheMetrics {
  avgGetTime: number;
  avgSetTime: number;
  avgDeleteTime: number;
  operationsPerSecond: number;
  lastCleanup?: Date;
  uptime: number;
}

// ===== 캐시 스냅샷 =====

export interface CacheSnapshot<T = any> {
  version: string;
  strategy: CacheStrategyType;
  timestamp: number;
  entries: Array<{
    key: string;
    value: T;
    metadata: CacheMetadata;
  }>;
  stats?: CacheStats;
}

// ===== 캐시 워밍 =====

export interface CacheWarmEntry<T = any> {
  key: string;
  value: T;
  options?: CacheOptions;
}

// ===== 유틸리티 타입 =====

export type CacheKey = string;
export type CacheNamespace = string;
export type CacheTag = string;

export type CacheResult<T> = Result<T>;

// ===== 캐시 프로바이더 인터페이스 =====

export interface CacheProvider<T = any> {
  get(key: string): Promise<CacheResult<T | null>>;
  set(key: string, value: T, options?: CacheOptions): Promise<CacheResult<void>>;
  delete(key: string): Promise<CacheResult<void>>;
  has(key: string): Promise<CacheResult<boolean>>;
  clear(namespace?: string): Promise<CacheResult<void>>;
  
  getMany(keys: string[]): Promise<CacheResult<Map<string, T>>>;
  setMany(entries: Map<string, T>, options?: CacheOptions): Promise<CacheResult<void>>;
  deleteMany(keys: string[]): Promise<CacheResult<void>>;
  
  keys(query?: CacheQuery): Promise<CacheResult<string[]>>;
  values(query?: CacheQuery): Promise<CacheResult<T[]>>;
  entries(query?: CacheQuery): Promise<CacheResult<Array<[string, T]>>>;
  
  invalidateByTag(tag: string): Promise<CacheResult<number>>;
  invalidateByTags(tags: string[]): Promise<CacheResult<number>>;
  
  size(namespace?: string): Promise<CacheResult<number>>;
  getStats(): Promise<CacheResult<CacheStats>>;
  getMetrics(): Promise<CacheResult<CacheMetrics>>;
}

// ===== 메모리 관리 =====

export interface MemoryInfo {
  used: number;
  available: number;
  total: number;
  percentage: number;
}

export interface EvictionInfo {
  key: string;
  reason: EvictionReason;
  size?: number;
  age?: number;
  accessCount?: number;
}

export enum EvictionReason {
  SIZE = 'size',
  TTL = 'ttl',
  MANUAL = 'manual',
  MEMORY = 'memory'
}

// ===== 직렬화 =====

export interface CacheSerializer {
  serialize<T>(value: T): string;
  deserialize<T>(value: string): T;
}

// ===== 압축 =====

export interface CacheCompression {
  compress(data: string): Promise<string>;
  decompress(data: string): Promise<string>;
}