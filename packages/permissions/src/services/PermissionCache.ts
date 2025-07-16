/**
 * @company/permissions - 권한 캐시 서비스
 * High-performance caching for permission evaluations
 */

import { Logger } from '@company/core';
import {
  PermissionCache as ICacheEntry,
  PermissionContext,
  CacheInfo,
  PermissionError,
  PermissionErrorCode
} from '../types';

export interface CacheStrategy {
  shouldCache(key: string, value: boolean, context?: PermissionContext): boolean;
  getTtl(key: string, value: boolean, context?: PermissionContext): number;
}

export interface CacheOptions {
  maxSize: number;
  defaultTtl: number;
  enableCompression: boolean;
  enableStats: boolean;
  strategy?: CacheStrategy;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  hitRate: number;
}

export class PermissionCache {
  private logger: Logger;
  private cache: Map<string, ICacheEntry> = new Map();
  private options: CacheOptions;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    hitRate: 0
  };
  private accessOrder: string[] = []; // LRU tracking

  constructor(options: Partial<CacheOptions> = {}) {
    this.logger = new Logger('PermissionCache');
    this.options = {
      maxSize: 1000,
      defaultTtl: 300, // 5 minutes
      enableCompression: false,
      enableStats: true,
      ...options
    };

    this.logger.info('PermissionCache 초기화 완료', { options: this.options });

    // 정기적인 정리 작업 시작
    this.startCleanupTimer();
  }

  /**
   * 캐시에서 값 조회
   */
  public get(key: string): boolean | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.recordMiss();
      return null;
    }

    // TTL 확인
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.recordMiss();
      return null;
    }

    // LRU 업데이트
    this.updateAccessOrder(key);
    this.recordHit();
    
    return entry.result;
  }

  /**
   * 캐시에 값 저장
   */
  public set(key: string, value: boolean, ttl?: number, context?: PermissionContext): void {
    // 캐시 전략 확인
    if (this.options.strategy && !this.options.strategy.shouldCache(key, value, context)) {
      return;
    }

    // 캐시 크기 제한 확인
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }

    const finalTtl = ttl || 
      (this.options.strategy?.getTtl(key, value, context)) || 
      this.options.defaultTtl;

    const entry: ICacheEntry = {
      key,
      result: value,
      timestamp: Date.now(),
      ttl: finalTtl,
      metadata: {
        context: this.options.enableCompression ? this.compressContext(context) : context,
        accessCount: 1
      }
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.recordSet();

    this.logger.debug('캐시 항목 저장', { key, value, ttl: finalTtl });
  }

  /**
   * 캐시에서 항목 삭제
   */
  public delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
      this.recordDelete();
      this.logger.debug('캐시 항목 삭제', { key });
    }
    return deleted;
  }

  /**
   * 패턴으로 캐시 항목들 삭제
   */
  public deleteByPattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let deletedCount = 0;

    const keysToDelete = Array.from(this.cache.keys()).filter(key => regex.test(key));
    
    keysToDelete.forEach(key => {
      if (this.delete(key)) {
        deletedCount++;
      }
    });

    this.logger.debug('패턴으로 캐시 삭제', { pattern: pattern.toString(), deletedCount });
    return deletedCount;
  }

  /**
   * 사용자별 캐시 삭제
   */
  public deleteByUserId(userId: string): number {
    return this.deleteByPattern(`^${userId}:`);
  }

  /**
   * 전체 캐시 정리
   */
  public clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.accessOrder = [];
    this.logger.info('전체 캐시 정리 완료', { deletedCount: size });
  }

  /**
   * 만료된 항목들 정리
   */
  public cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    const expiredKeys = Array.from(this.cache.entries())
      .filter(([, entry]) => this.isExpired(entry, now))
      .map(([key]) => key);

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      cleanedCount++;
    });

    if (cleanedCount > 0) {
      this.logger.debug('만료된 캐시 정리 완료', { cleanedCount });
    }

    return cleanedCount;
  }

  /**
   * 캐시 정보 조회
   */
  public getInfo(): CacheInfo {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values())
      .filter(entry => !this.isExpired(entry, now));

    return {
      size: this.cache.size,
      hitRate: this.calculateHitRate(),
      lastCleared: new Date(), // TODO: track actual last clear time
      entries: validEntries.length
    };
  }

  /**
   * 캐시 통계 조회
   */
  public getStats(): CacheStats {
    return {
      ...this.stats,
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * 통계 초기화
   */
  public resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0
    };
    
    this.logger.debug('캐시 통계 초기화 완료');
  }

  /**
   * 캐시 사전 로딩
   */
  public async warmup(
    keys: string[],
    loader: (key: string) => Promise<boolean>
  ): Promise<void> {
    this.logger.info('캐시 워밍업 시작', { keyCount: keys.length });

    const promises = keys.map(async (key) => {
      try {
        const value = await loader(key);
        this.set(key, value);
      } catch (error) {
        this.logger.warn('캐시 워밍업 실패', { key, error });
      }
    });

    await Promise.all(promises);
    this.logger.info('캐시 워밍업 완료');
  }

  /**
   * 메모리 사용량 추정
   */
  public getMemoryUsage(): {
    entries: number;
    estimatedBytes: number;
    averageEntrySize: number;
  } {
    const entries = this.cache.size;
    
    // 샘플링을 통한 평균 크기 추정
    const sampleSize = Math.min(10, entries);
    const sampleEntries = Array.from(this.cache.values()).slice(0, sampleSize);
    
    const sampleBytes = sampleEntries.reduce((total, entry) => {
      return total + this.estimateEntrySize(entry);
    }, 0);

    const averageEntrySize = sampleSize > 0 ? sampleBytes / sampleSize : 0;
    const estimatedBytes = averageEntrySize * entries;

    return {
      entries,
      estimatedBytes,
      averageEntrySize
    };
  }

  // ===== Private Methods =====

  private isExpired(entry: ICacheEntry, now?: number): boolean {
    const currentTime = now || Date.now();
    return currentTime - entry.timestamp > entry.ttl * 1000;
  }

  private updateAccessOrder(key: string): void {
    // LRU: 기존 키 제거 후 끝에 추가
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private evictLeastRecentlyUsed(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    const lruKey = this.accessOrder[0];
    this.cache.delete(lruKey);
    this.removeFromAccessOrder(lruKey);
    this.recordEviction();

    this.logger.debug('LRU 캐시 제거', { key: lruKey });
  }

  private compressContext(context?: PermissionContext): any {
    if (!context) {
      return null;
    }

    // 간단한 컨텍스트 압축 (필요한 필드만 유지)
    return {
      userId: context.userId,
      resourceId: context.resource?.id,
      action: context.action,
      ip: context.environment?.ipAddress,
      location: context.environment?.location?.country
    };
  }

  private estimateEntrySize(entry: ICacheEntry): number {
    // JSON 직렬화를 통한 대략적인 크기 추정
    try {
      return JSON.stringify(entry).length * 2; // UTF-16 문자당 2바이트
    } catch {
      return 100; // 기본 추정값
    }
  }

  private calculateHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  private recordHit(): void {
    if (this.options.enableStats) {
      this.stats.hits++;
    }
  }

  private recordMiss(): void {
    if (this.options.enableStats) {
      this.stats.misses++;
    }
  }

  private recordSet(): void {
    if (this.options.enableStats) {
      this.stats.sets++;
    }
  }

  private recordDelete(): void {
    if (this.options.enableStats) {
      this.stats.deletes++;
    }
  }

  private recordEviction(): void {
    if (this.options.enableStats) {
      this.stats.evictions++;
    }
  }

  private startCleanupTimer(): void {
    // 1분마다 만료된 항목 정리
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }
}

// ===== Built-in Cache Strategies =====

export class DefaultCacheStrategy implements CacheStrategy {
  shouldCache(key: string, value: boolean): boolean {
    // 거부된 권한은 짧은 시간만 캐싱
    return true;
  }

  getTtl(key: string, value: boolean): number {
    // 허용된 권한은 길게, 거부된 권한은 짧게 캐싱
    return value ? 300 : 60; // 5분 vs 1분
  }
}

export class AggressiveCacheStrategy implements CacheStrategy {
  shouldCache(): boolean {
    return true;
  }

  getTtl(key: string, value: boolean): number {
    return value ? 900 : 300; // 15분 vs 5분
  }
}

export class ConservativeCacheStrategy implements CacheStrategy {
  shouldCache(key: string, value: boolean): boolean {
    // 허용된 권한만 캐싱
    return value;
  }

  getTtl(): number {
    return 60; // 1분
  }
}