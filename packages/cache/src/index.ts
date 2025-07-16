/**
 * @company/cache - Enterprise Cache Module
 * 
 * 다양한 캐시 전략을 지원하는 엔터프라이즈 캐시 모듈
 * - LRU, LFU, FIFO 전략 지원
 * - TTL 기반 자동 만료
 * - 태그 기반 무효화
 * - 캐시 통계 및 메트릭
 * - Zero Error Architecture
 * 
 * @version 1.0.0
 * @author Enterprise AI Team
 */

// ===== 핵심 클래스 =====
export { CacheManager } from './CacheManager';

// ===== 캐시 전략 =====
export { LRUStrategy } from './strategies/LRUStrategy';
export { LFUStrategy } from './strategies/LFUStrategy';
export { FIFOStrategy } from './strategies/FIFOStrategy';

// ===== 유틸리티 =====
export { 
  CacheSerializer, 
  defaultSerializer 
} from './utils/CacheSerializer';
export { 
  CacheCompressor, 
  defaultCompressor 
} from './utils/CacheCompressor';
export { 
  MemoryManager, 
  defaultMemoryManager 
} from './utils/MemoryManager';
export { 
  CacheWarmer, 
  SmartCacheWarmer 
} from './utils/CacheWarmer';

export type {
  SerializerOptions,
  CompressionOptions,
  MemoryPressureHandler,
  WarmupConfig,
  WarmupResult
} from './utils/index';

// ===== 타입 정의 =====
export type {
  // 기본 타입
  CacheEntry,
  CacheMetadata,
  CacheOptions,
  CacheQuery,
  
  // 전략 인터페이스
  CacheStrategy,
  
  // 설정 타입
  CacheConfig,
  
  // 이벤트 타입
  CacheEvent,
  CacheEventListener,
  
  // 통계 타입
  CacheStats,
  CacheMetrics,
  
  // 스냅샷 타입
  CacheSnapshot,
  CacheWarmEntry,
  
  // 프로바이더 인터페이스
  CacheProvider,
  
  // 메모리 관리
  MemoryInfo,
  EvictionInfo,
  
  // 유틸리티 인터페이스
  CacheCompression,
  
  // 유틸리티 타입
  CacheKey,
  CacheNamespace,
  CacheTag,
  CacheResult
} from './types';

// ===== 열거형 =====
export { 
  CacheStrategyType,
  CacheEventType,
  EvictionReason
} from './types';

// ===== 팩토리 함수 =====

import { CacheManager } from './CacheManager';
import { CacheConfig } from './types';

/**
 * 캐시 매니저 생성
 */
export function createCacheManager<T = any>(config?: CacheConfig): CacheManager<T> {
  return new CacheManager<T>(config);
}

/**
 * LRU 캐시 생성
 */
export function createLRUCache<T = any>(maxSize: number = 100, ttl?: number): CacheManager<T> {
  const config: CacheConfig = {
    strategy: 'lru' as any,
    maxSize
  };
  if (ttl !== undefined) {
    config.ttl = ttl;
  }
  return new CacheManager<T>(config);
}

/**
 * LFU 캐시 생성
 */
export function createLFUCache<T = any>(maxSize: number = 100, ttl?: number): CacheManager<T> {
  const config: CacheConfig = {
    strategy: 'lfu' as any,
    maxSize
  };
  if (ttl !== undefined) {
    config.ttl = ttl;
  }
  return new CacheManager<T>(config);
}

/**
 * FIFO 캐시 생성
 */
export function createFIFOCache<T = any>(maxSize: number = 100, ttl?: number): CacheManager<T> {
  const config: CacheConfig = {
    strategy: 'fifo' as any,
    maxSize
  };
  if (ttl !== undefined) {
    config.ttl = ttl;
  }
  return new CacheManager<T>(config);
}

// ===== 헬퍼 함수 =====

/**
 * 캐시 키 생성
 */
export function createCacheKey(...parts: string[]): string {
  return parts.filter(Boolean).join(':');
}

/**
 * TTL 계산 (초 단위)
 */
export function calculateTTL(seconds: number): number {
  return seconds * 1000;
}

/**
 * TTL 계산 (분 단위)
 */
export function calculateTTLMinutes(minutes: number): number {
  return minutes * 60 * 1000;
}

/**
 * TTL 계산 (시간 단위)
 */
export function calculateTTLHours(hours: number): number {
  return hours * 60 * 60 * 1000;
}

/**
 * TTL 계산 (일 단위)
 */
export function calculateTTLDays(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

// ===== 상수 =====

export const DEFAULT_CACHE_CONFIG: Partial<CacheConfig> = {
  strategy: 'lru' as any,
  maxSize: 100,
  ttl: 0,
  namespace: 'default',
  autoCleanup: true,
  cleanupInterval: 60000,
  enableStats: true,
  enableEvents: true
};

export const CACHE_LIMITS = {
  maxSize: 10000,
  maxTTL: 30 * 24 * 60 * 60 * 1000, // 30일
  maxNamespaceLength: 50,
  maxKeyLength: 250,
  maxTagLength: 50
};

// ===== 모듈 정보 =====

export const CACHE_MODULE_INFO = {
  name: '@company/cache',
  version: '1.0.0',
  description: 'Enterprise Cache Module with Multiple Strategies',
  author: 'Enterprise AI Team',
  license: 'MIT'
} as const;