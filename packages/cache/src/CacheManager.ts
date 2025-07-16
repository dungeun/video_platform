/**
 * @repo/cache - 캐시 매니저
 * 캐시 전략을 사용한 캐시 관리
 */

import { ModuleBase, Result, EventEmitter } from '@repo/core';
import {
  CacheProvider,
  CacheStrategy,
  CacheConfig,
  CacheOptions,
  CacheQuery,
  CacheStats,
  CacheMetrics,
  CacheEvent,
  CacheEventType,
  CacheEventListener,
  CacheMetadata,
  CacheSnapshot,
  CacheWarmEntry,
  MemoryInfo
} from './types';
import { CacheStrategyType } from './types';
import { LRUStrategy, LFUStrategy, FIFOStrategy } from './strategies';

export class CacheManager<T = any> extends ModuleBase implements CacheProvider<T> {
  private strategy: CacheStrategy<T>;
  private cacheConfig: Required<CacheConfig>;
  private stats: CacheStats;
  private metrics: {
    getTime: number[];
    setTime: number[];
    deleteTime: number[];
    startTime: number;
    lastCleanup: number;
  };
  private cleanupInterval: NodeJS.Timeout | undefined;
  private tagIndex: Map<string, Set<string>> = new Map();

  constructor(config?: CacheConfig) {
    super({
      name: '@repo/cache',
      version: '1.0.0',
      description: 'Enterprise Cache Manager'
    });

    this.cacheConfig = {
      strategy: CacheStrategyType.LRU,
      maxSize: 100,
      ttl: 0,
      namespace: 'default',
      autoCleanup: true,
      cleanupInterval: 60000, // 1분
      enableStats: true,
      enableEvents: true,
      ...config
    };

    this.strategy = this.createStrategy(this.cacheConfig.strategy);
    this.eventEmitter = new EventEmitter();
    this.stats = this.initStats();
    this.metrics = {
      getTime: [],
      setTime: [],
      deleteTime: [],
      startTime: Date.now(),
      lastCleanup: Date.now()
    };

    if (this.cacheConfig.autoCleanup) {
      this.startAutoCleanup();
    }

    this.logger.info('캐시 매니저 초기화', {
      strategy: this.cacheConfig.strategy,
      maxSize: this.cacheConfig.maxSize
    });
  }

  // ===== 기본 작업 =====

  /**
   * 값 조회
   */
  public async get(key: string): Promise<Result<T | null>> {
    const start = Date.now();

    try {
      const fullKey = this.getFullKey(key);
      const value = this.strategy.get(fullKey);

      if (value === undefined) {
        this.updateStats('miss');
        this.emitCacheEvent({
          type: CacheEventType.MISS,
          key,
          timestamp: Date.now()
        });
        return { success: true, data: null };
      }

      this.updateStats('hit');
      this.emitCacheEvent({
        type: CacheEventType.HIT,
        key,
        value,
        timestamp: Date.now()
      });

      return { success: true, data: value };

    } catch (error) {
      this.logger.error('캐시 조회 실패', { key, error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('캐시 조회 실패') 
      };
    } finally {
      this.recordMetric('get', Date.now() - start);
    }
  }

  /**
   * 값 설정
   */
  public async set(key: string, value: T, options?: CacheOptions): Promise<Result<void>> {
    const start = Date.now();

    try {
      const fullKey = this.getFullKey(key);
      const now = Date.now();
      
      const metadata: CacheMetadata = {
        key: fullKey,
        created: now,
        accessed: now,
        accessCount: 0,
        namespace: this.cacheConfig.namespace
      };

      if (options?.ttl || this.cacheConfig.ttl) {
        const ttl = options?.ttl || this.cacheConfig.ttl;
        metadata.ttl = ttl;
        metadata.expires = now + ttl;
      }

      if (options?.tags) {
        metadata.tags = options.tags;
        // 태그 인덱스 업데이트
        this.updateTagIndex(fullKey, options.tags);
      }

      this.strategy.set(fullKey, value, metadata);
      
      this.updateStats('set');
      this.emitCacheEvent({
        type: CacheEventType.SET,
        key,
        value,
        timestamp: now
      });

      return { success: true };

    } catch (error) {
      this.logger.error('캐시 설정 실패', { key, error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('캐시 설정 실패') 
      };
    } finally {
      this.recordMetric('set', Date.now() - start);
    }
  }

  /**
   * 값 삭제
   */
  public async delete(key: string): Promise<Result<void>> {
    const start = Date.now();

    try {
      const fullKey = this.getFullKey(key);
      const deleted = this.strategy.delete(fullKey);

      if (deleted) {
        // 태그 인덱스에서 제거
        this.removeFromTagIndex(fullKey);
        
        this.updateStats('delete');
        this.emitCacheEvent({
          type: CacheEventType.DELETE,
          key,
          timestamp: Date.now()
        });
      }

      return { success: true };

    } catch (error) {
      this.logger.error('캐시 삭제 실패', { key, error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('캐시 삭제 실패') 
      };
    } finally {
      this.recordMetric('delete', Date.now() - start);
    }
  }

  /**
   * 키 존재 여부
   */
  public async has(key: string): Promise<Result<boolean>> {
    try {
      const fullKey = this.getFullKey(key);
      const exists = this.strategy.has(fullKey);
      return { success: true, data: exists };
    } catch (error) {
      this.logger.error('캐시 확인 실패', { key, error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('캐시 확인 실패') 
      };
    }
  }

  /**
   * 캐시 초기화
   */
  public async clear(namespace?: string): Promise<Result<void>> {
    try {
      if (namespace && namespace !== this.cacheConfig.namespace) {
        // 특정 네임스페이스만 삭제
        const keys = this.strategy.keys();
        const prefix = `${namespace}:`;
        
        for (const key of keys) {
          if (key.startsWith(prefix)) {
            this.strategy.delete(key);
          }
        }
      } else {
        // 전체 초기화
        this.strategy.clear();
      }

      const event: CacheEvent<T> = {
        type: CacheEventType.CLEAR,
        key: '',
        timestamp: Date.now()
      };
      if (namespace) {
        event.namespace = namespace;
      }
      this.emitCacheEvent(event);

      return { success: true };

    } catch (error) {
      this.logger.error('캐시 초기화 실패', { namespace, error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('캐시 초기화 실패') 
      };
    }
  }

  // ===== 배치 작업 =====

  /**
   * 여러 값 조회
   */
  public async getMany(keys: string[]): Promise<Result<Map<string, T>>> {
    try {
      const results = new Map<string, T>();
      
      for (const key of keys) {
        const result = await this.get(key);
        if (result.success && result.data !== null) {
          results.set(key, result.data as T);
        }
      }

      return { success: true, data: results };

    } catch (error) {
      this.logger.error('다중 캐시 조회 실패', { error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('다중 캐시 조회 실패') 
      };
    }
  }

  /**
   * 여러 값 설정
   */
  public async setMany(
    entries: Map<string, T>, 
    options?: CacheOptions
  ): Promise<Result<void>> {
    try {
      for (const [key, value] of entries) {
        const result = await this.set(key, value, options);
        if (!result.success) {
          return result;
        }
      }

      return { success: true };

    } catch (error) {
      this.logger.error('다중 캐시 설정 실패', { error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('다중 캐시 설정 실패') 
      };
    }
  }

  /**
   * 여러 값 삭제
   */
  public async deleteMany(keys: string[]): Promise<Result<void>> {
    try {
      for (const key of keys) {
        const result = await this.delete(key);
        if (!result.success) {
          return result;
        }
      }

      return { success: true };

    } catch (error) {
      this.logger.error('다중 캐시 삭제 실패', { error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('다중 캐시 삭제 실패') 
      };
    }
  }

  // ===== 쿼리 작업 =====

  /**
   * 키 목록 조회
   */
  public async keys(query?: CacheQuery): Promise<Result<string[]>> {
    try {
      let keys = this.strategy.keys();

      // 네임스페이스 필터
      if (query?.namespace) {
        const prefix = `${query.namespace}:`;
        keys = keys.filter(key => key.startsWith(prefix));
      }

      // 패턴 필터
      if (query?.pattern) {
        const regex = new RegExp(query.pattern);
        keys = keys.filter(key => regex.test(key));
      }

      // 페이지네이션
      if (query?.limit) {
        const offset = query.offset || 0;
        keys = keys.slice(offset, offset + query.limit);
      }

      // 프리픽스 제거
      keys = keys.map(key => this.removePrefix(key));

      return { success: true, data: keys };

    } catch (error) {
      this.logger.error('키 목록 조회 실패', { error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('키 목록 조회 실패') 
      };
    }
  }

  /**
   * 값 목록 조회
   */
  public async values(query?: CacheQuery): Promise<Result<T[]>> {
    try {
      const keysResult = await this.keys(query);
      
      if (!keysResult.success) {
        return { success: false, error: keysResult.error || new Error('키 목록 조회 실패') };
      }

      const values: T[] = [];
      
      for (const key of keysResult.data!) {
        const result = await this.get(key);
        if (result.success && result.data !== null) {
          values.push(result.data as T);
        }
      }

      return { success: true, data: values };

    } catch (error) {
      this.logger.error('값 목록 조회 실패', { error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('값 목록 조회 실패') 
      };
    }
  }

  /**
   * 항목 목록 조회
   */
  public async entries(query?: CacheQuery): Promise<Result<Array<[string, T]>>> {
    try {
      const keysResult = await this.keys(query);
      
      if (!keysResult.success) {
        return { success: false, error: keysResult.error || new Error('키 목록 조회 실패') };
      }

      const entries: Array<[string, T]> = [];
      
      for (const key of keysResult.data!) {
        const result = await this.get(key);
        if (result.success && result.data !== null) {
          entries.push([key, result.data as T]);
        }
      }

      return { success: true, data: entries };

    } catch (error) {
      this.logger.error('항목 목록 조회 실패', { error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('항목 목록 조회 실패') 
      };
    }
  }

  // ===== 태그 기반 무효화 =====

  /**
   * 태그로 캐시 무효화
   */
  public async invalidateByTag(tag: string): Promise<Result<number>> {
    return this.invalidateByTags([tag]);
  }

  /**
   * 여러 태그로 캐시 무효화
   */
  public async invalidateByTags(tags: string[]): Promise<Result<number>> {
    try {
      const tagSet = new Set(tags);
      let invalidated = 0;
      const keysToInvalidate = new Set<string>();

      // 태그 인덱스를 사용하여 효율적으로 키 찾기
      for (const tag of tagSet) {
        const keys = this.tagIndex.get(tag);
        if (keys) {
          keys.forEach(key => keysToInvalidate.add(key));
        }
      }

      // 찾은 키들 무효화
      for (const key of keysToInvalidate) {
        const deleted = this.strategy.delete(key);
        if (deleted) {
          this.removeFromTagIndex(key);
          invalidated++;
        }
      }

      this.logger.info('태그 기반 캐시 무효화', { tags, invalidated });
      return { success: true, data: invalidated };

    } catch (error) {
      this.logger.error('태그 기반 무효화 실패', { tags, error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('태그 기반 무효화 실패') 
      };
    }
  }

  // ===== 통계 및 메트릭 =====

  /**
   * 캐시 크기
   */
  public async size(namespace?: string): Promise<Result<number>> {
    try {
      if (namespace && namespace !== this.cacheConfig.namespace) {
        const keys = this.strategy.keys();
        const prefix = `${namespace}:`;
        const count = keys.filter(key => key.startsWith(prefix)).length;
        return { success: true, data: count };
      }

      return { success: true, data: this.strategy.size };

    } catch (error) {
      this.logger.error('캐시 크기 조회 실패', { error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('캐시 크기 조회 실패') 
      };
    }
  }

  /**
   * 캐시 통계
   */
  public async getStats(): Promise<Result<CacheStats>> {
    try {
      return { success: true, data: { ...this.stats } };
    } catch (error) {
      this.logger.error('통계 조회 실패', { error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('통계 조회 실패') 
      };
    }
  }

  /**
   * 캐시 메트릭
   */
  public async getMetrics(): Promise<Result<CacheMetrics>> {
    try {
      const avgGetTime = this.calculateAverage(this.metrics.getTime);
      const avgSetTime = this.calculateAverage(this.metrics.setTime);
      const avgDeleteTime = this.calculateAverage(this.metrics.deleteTime);
      
      const totalOps = this.stats.hits + this.stats.misses + 
                      this.stats.sets + this.stats.deletes;
      const uptime = Date.now() - this.metrics.startTime;
      const opsPerSecond = totalOps / (uptime / 1000);

      return {
        success: true,
        data: {
          avgGetTime,
          avgSetTime,
          avgDeleteTime,
          operationsPerSecond: opsPerSecond,
          lastCleanup: new Date(this.metrics.lastCleanup),
          uptime
        }
      };
    } catch (error) {
      this.logger.error('메트릭 조회 실패', { error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('메트릭 조회 실패') 
      };
    }
  }

  // ===== 메모리 관리 =====

  /**
   * 메모리 사용량
   */
  public async getMemoryUsage(): Promise<Result<MemoryInfo>> {
    try {
      // 간단한 추정 (실제로는 더 정확한 계산 필요)
      const estimatedSize = this.strategy.size * 1024; // 항목당 1KB 가정
      
      return {
        success: true,
        data: {
          used: estimatedSize,
          available: Number.MAX_SAFE_INTEGER - estimatedSize,
          total: Number.MAX_SAFE_INTEGER,
          percentage: 0
        }
      };
    } catch (error) {
      this.logger.error('메모리 사용량 조회 실패', { error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('메모리 사용량 조회 실패') 
      };
    }
  }

  /**
   * 캐시 크기 조정
   */
  public async resize(newSize: number): Promise<Result<void>> {
    try {
      this.strategy.resize(newSize);
      this.logger.info('캐시 크기 조정', { newSize });
      return { success: true };
    } catch (error) {
      this.logger.error('캐시 크기 조정 실패', { newSize, error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('캐시 크기 조정 실패') 
      };
    }
  }

  /**
   * 수동 정리
   */
  public async prune(): Promise<Result<number>> {
    try {
      const pruned = this.strategy.prune();
      this.metrics.lastCleanup = Date.now();
      this.logger.info('캐시 정리 완료', { pruned });
      return { success: true, data: pruned };
    } catch (error) {
      this.logger.error('캐시 정리 실패', { error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('캐시 정리 실패') 
      };
    }
  }

  // ===== 고급 기능 =====

  /**
   * 캐시 워밍
   */
  public async warm(entries: CacheWarmEntry<T>[]): Promise<Result<void>> {
    try {
      for (const entry of entries) {
        await this.set(entry.key, entry.value, entry.options);
      }
      
      this.logger.info('캐시 워밍 완료', { count: entries.length });
      return { success: true };
    } catch (error) {
      this.logger.error('캐시 워밍 실패', { error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('캐시 워밍 실패') 
      };
    }
  }

  /**
   * 캐시 직렬화
   */
  public async serialize(): Promise<Result<CacheSnapshot<T>>> {
    try {
      const entries = this.strategy.entries();
      const snapshot: CacheSnapshot<T> = {
        version: '1.0.0',
        strategy: this.cacheConfig.strategy,
        timestamp: Date.now(),
        entries: entries.map(([key, value]) => ({
          key,
          value,
          metadata: {
            key,
            created: Date.now(),
            accessed: Date.now(),
            accessCount: 0
          }
        })),
        stats: { ...this.stats }
      };

      return { success: true, data: snapshot };
    } catch (error) {
      this.logger.error('캐시 직렬화 실패', { error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('캐시 직렬화 실패') 
      };
    }
  }

  /**
   * 캐시 역직렬화
   */
  public async deserialize(snapshot: CacheSnapshot<T>): Promise<Result<void>> {
    try {
      // 전략이 다른 경우 경고
      if (snapshot.strategy !== this.cacheConfig.strategy) {
        this.logger.warn('스냅샷 전략이 현재 전략과 다름', {
          snapshot: snapshot.strategy,
          current: this.cacheConfig.strategy
        });
      }

      // 기존 캐시 초기화
      this.strategy.clear();

      // 항목 복원
      for (const entry of snapshot.entries) {
        this.strategy.set(entry.key, entry.value, entry.metadata);
      }

      this.logger.info('캐시 역직렬화 완료', { 
        count: snapshot.entries.length 
      });
      
      return { success: true };
    } catch (error) {
      this.logger.error('캐시 역직렬화 실패', { error });
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('캐시 역직렬화 실패') 
      };
    }
  }

  // ===== 이벤트 =====

  /**
   * 캐시 이벤트 리스너 등록
   */
  public onCacheEvent(event: CacheEventType, listener: CacheEventListener<T>): string {
    if (this.cacheConfig.enableEvents) {
      return this.eventEmitter.on(event, listener as any);
    }
    return '';
  }

  /**
   * 캐시 이벤트 리스너 제거
   */
  public offCacheEvent(subscriptionId: string): void {
    this.eventEmitter.off(subscriptionId);
  }

  /**
   * 일회성 캐시 이벤트 리스너
   */
  public onceCacheEvent(event: CacheEventType, listener: CacheEventListener<T>): string {
    if (this.cacheConfig.enableEvents) {
      return this.eventEmitter.once(event, listener as any);
    }
    return '';
  }

  // ===== 내부 메소드 =====

  /**
   * 전략 생성
   */
  private createStrategy(type: CacheStrategyType): CacheStrategy<T> {
    switch (type) {
      case CacheStrategyType.LRU:
        return new LRUStrategy<T>(this.cacheConfig.maxSize);
      case CacheStrategyType.LFU:
        return new LFUStrategy<T>(this.cacheConfig.maxSize);
      case CacheStrategyType.FIFO:
        return new FIFOStrategy<T>(this.cacheConfig.maxSize);
      default:
        throw new Error(`지원하지 않는 캐시 전략: ${type}`);
    }
  }

  /**
   * 전체 키 생성
   */
  private getFullKey(key: string): string {
    return `${this.cacheConfig.namespace}:${key}`;
  }

  /**
   * 프리픽스 제거
   */
  private removePrefix(key: string): string {
    const prefix = `${this.cacheConfig.namespace}:`;
    return key.startsWith(prefix) ? key.substring(prefix.length) : key;
  }

  /**
   * 통계 초기화
   */
  private initStats(): CacheStats {
    return {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      expirations: 0,
      hitRate: 0,
      missRate: 0,
      size: 0,
      maxSize: this.cacheConfig.maxSize
    };
  }

  /**
   * 통계 업데이트
   */
  private updateStats(type: 'hit' | 'miss' | 'set' | 'delete' | 'evict' | 'expire'): void {
    if (!this.cacheConfig.enableStats) return;

    switch (type) {
      case 'hit':
        this.stats.hits++;
        break;
      case 'miss':
        this.stats.misses++;
        break;
      case 'set':
        this.stats.sets++;
        break;
      case 'delete':
        this.stats.deletes++;
        break;
      case 'evict':
        this.stats.evictions++;
        break;
      case 'expire':
        this.stats.expirations++;
        break;
    }

    // 히트율 계산
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
    this.stats.missRate = total > 0 ? this.stats.misses / total : 0;
    this.stats.size = this.strategy.size;
  }

  /**
   * 캐시 이벤트 발생
   */
  private emitCacheEvent(event: CacheEvent<T>): void {
    if (this.cacheConfig.enableEvents) {
      // ModuleEvent 형식으로 변환하여 발생
      this.emit(event.type, {
        cacheEvent: event,
        key: event.key,
        value: event.value,
        timestamp: event.timestamp
      });
    }
  }

  /**
   * 메트릭 기록
   */
  private recordMetric(type: 'get' | 'set' | 'delete', time: number): void {
    if (!this.cacheConfig.enableStats) return;

    const metrics = this.metrics[`${type}Time`];
    metrics.push(time);

    // 최대 100개까지만 유지
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * 평균 계산
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  /**
   * 자동 정리 시작
   */
  private startAutoCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.prune();
    }, this.cacheConfig.cleanupInterval);
  }

  /**
   * 자동 정리 중지
   */
  private stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * 태그 인덱스 업데이트
   */
  private updateTagIndex(key: string, tags: string[]): void {
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  /**
   * 태그 인덱스에서 제거
   */
  private removeFromTagIndex(key: string): void {
    // 모든 태그에서 해당 키 제거
    for (const [tag, keys] of this.tagIndex) {
      keys.delete(key);
      if (keys.size === 0) {
        this.tagIndex.delete(tag);
      }
    }
  }

  /**
   * 모듈 초기화 구현
   */
  protected async onInitialize(): Promise<Result<void>> {
    return { success: true };
  }

  /**
   * 모듈 정리 구현
   */
  protected async onDestroy(): Promise<Result<void>> {
    this.stopAutoCleanup();
    this.strategy.clear();
    this.eventEmitter.removeAllListeners();
    return { success: true };
  }

  /**
   * 헬스 체크 구현
   */
  public async healthCheck(): Promise<Result<boolean>> {
    try {
      // 캐시 전략이 정상적으로 작동하는지 확인
      const testKey = '__health_check__';
      const testValue = Date.now();
      
      this.strategy.set(testKey, testValue as any, {
        key: testKey,
        created: Date.now(),
        accessed: Date.now(),
        accessCount: 0
      });
      
      const retrieved = this.strategy.get(testKey);
      this.strategy.delete(testKey);
      
      return { 
        success: true, 
        data: retrieved === testValue 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('헬스체크 실패') 
      };
    }
  }
}