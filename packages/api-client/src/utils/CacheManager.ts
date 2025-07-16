/**
 * @company/api-client - 캐시 관리자
 * HTTP 응답 캐싱 관리
 */

import { Logger } from '@company/core';
import { CacheConfig, CacheEntry, CacheStorage, HttpRequestConfig, HttpResponse } from '../types';

export class CacheManager {
  private logger: Logger;
  private storage: CacheStorage;
  private config: CacheConfig;
  private defaultTTL = 5 * 60 * 1000; // 5분

  constructor(config?: CacheConfig) {
    this.logger = new Logger('CacheManager');
    this.config = config || { enabled: false };
    this.storage = config?.storage || new MemoryCacheStorage();
  }

  /**
   * 캐시 초기화
   */
  public async initialize(): Promise<void> {
    if (this.config.enabled) {
      await this.storage.clear();
      this.logger.info('캐시 매니저 초기화 완료');
    }
  }

  /**
   * 캐시에서 응답 조회
   */
  public async get(config: HttpRequestConfig): Promise<HttpResponse | null> {
    if (!this.config.enabled) {
      return null;
    }

    const key = this.generateCacheKey(config);
    const entry = await this.storage.get(key);

    if (!entry) {
      return null;
    }

    // TTL 확인
    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      await this.storage.delete(key);
      this.logger.debug('캐시 만료', { key });
      return null;
    }

    this.logger.debug('캐시 히트', { key });
    return entry.data;
  }

  /**
   * 캐시에 응답 저장
   */
  public async set(config: HttpRequestConfig, response: HttpResponse): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // 캐시 가능 여부 확인
    if (this.config.shouldCache && !this.config.shouldCache(response)) {
      return;
    }

    const key = this.generateCacheKey(config);
    const ttl = this.config.ttl || this.defaultTTL;

    const entry: CacheEntry = {
      data: response,
      timestamp: Date.now(),
      ttl
    };

    await this.storage.set(key, entry);
    this.logger.debug('캐시 저장', { key, ttl });
  }

  /**
   * 캐시 제거
   */
  public async delete(config: HttpRequestConfig): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const key = this.generateCacheKey(config);
    await this.storage.delete(key);
    this.logger.debug('캐시 제거', { key });
  }

  /**
   * 전체 캐시 제거
   */
  public async clear(): Promise<void> {
    await this.storage.clear();
    this.logger.info('전체 캐시 제거 완료');
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(config: HttpRequestConfig): string {
    if (this.config.key) {
      if (typeof this.config.key === 'function') {
        return this.config.key(config);
      }
      return this.config.key;
    }

    // 기본 키 생성: method + url + params
    const parts = [
      config.method || 'GET',
      config.url || '',
      JSON.stringify(config.params || {})
    ];

    return parts.join(':');
  }

  /**
   * 캐시 통계 조회
   */
  public async getStats(): Promise<{
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    // 실제 구현에서는 storage에서 통계를 관리
    return {
      size: 0,
      hits: 0,
      misses: 0,
      hitRate: 0
    };
  }

  /**
   * 패턴으로 캐시 제거
   */
  public async deleteByPattern(pattern: string | RegExp): Promise<number> {
    // 실제 구현에서는 storage에서 패턴 매칭 지원
    this.logger.info('패턴으로 캐시 제거', { pattern: pattern.toString() });
    return 0;
  }

  /**
   * 캐시 갱신
   */
  public async refresh(config: HttpRequestConfig): Promise<void> {
    await this.delete(config);
    this.logger.debug('캐시 갱신 요청', { url: config.url });
  }
}

/**
 * 메모리 기반 캐시 스토리지
 */
export class MemoryCacheStorage implements CacheStorage {
  private cache: Map<string, CacheEntry> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger('MemoryCacheStorage');
  }

  async get(key: string): Promise<CacheEntry | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, value: CacheEntry): Promise<void> {
    this.cache.set(key, value);
    
    // 메모리 관리를 위한 크기 제한
    if (this.cache.size > 1000) {
      // 가장 오래된 항목 제거 (LRU)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * 만료된 항목 정리
   */
  public cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.timestamp + entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      this.logger.debug('만료된 캐시 정리', { count: expiredKeys.length });
    }
  }

  /**
   * 캐시 크기 조회
   */
  public size(): number {
    return this.cache.size;
  }
}