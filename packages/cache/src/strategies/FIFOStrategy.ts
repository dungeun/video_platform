/**
 * @company/cache - FIFO 캐시 전략
 * First In First Out 캐시 전략 구현
 */

import { CacheStrategy, CacheMetadata, CacheEntry } from '../types';
import { Logger } from '@company/core';

export class FIFOStrategy<T = any> implements CacheStrategy<T> {
  public readonly name = 'FIFO';
  private cache: Map<string, CacheEntry<T>>;
  private _maxSize: number;
  private logger: Logger;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this._maxSize = maxSize;
    this.logger = new Logger('FIFOStrategy');
  }

  public get maxSize(): number {
    return this._maxSize;
  }

  public get size(): number {
    return this.cache.size;
  }

  /**
   * 값 조회 (순서 변경 없음)
   */
  public get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // 만료 확인
    if (entry.metadata.expires && Date.now() > entry.metadata.expires) {
      this.cache.delete(key);
      return undefined;
    }

    // 메타데이터만 업데이트 (순서는 변경하지 않음)
    entry.metadata.accessed = Date.now();
    entry.metadata.accessCount++;

    return entry.value;
  }

  /**
   * 값 설정
   */
  public set(key: string, value: T, metadata: CacheMetadata): void {
    // 기존 항목이 있는 경우 업데이트만 (순서 유지)
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.metadata = metadata;
      return;
    }

    // 용량 확인 및 필요시 제거
    while (this.shouldEvict()) {
      this.evict();
    }

    // 새 항목 추가 (맵의 끝에 추가됨)
    const entry: CacheEntry<T> = { value, metadata };
    this.cache.set(key, entry);
  }

  /**
   * 값 삭제
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 키 존재 여부
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // 만료 확인
    if (entry.metadata.expires && Date.now() > entry.metadata.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 전체 초기화
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * 모든 키 반환
   */
  public keys(): string[] {
    this.prune(); // 만료된 항목 제거
    return Array.from(this.cache.keys());
  }

  /**
   * 모든 값 반환
   */
  public values(): T[] {
    this.prune(); // 만료된 항목 제거
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  /**
   * 모든 항목 반환
   */
  public entries(): Array<[string, T]> {
    this.prune(); // 만료된 항목 제거
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value]);
  }

  /**
   * FIFO 항목 제거 (가장 먼저 추가된 항목)
   */
  public evict(): string | undefined {
    // Map의 첫 번째 항목이 가장 오래된 항목 (FIFO)
    const firstKey = this.cache.keys().next().value;
    
    if (firstKey !== undefined) {
      this.cache.delete(firstKey);
      this.logger.debug('FIFO 항목 제거', { key: firstKey });
      return firstKey;
    }

    return undefined;
  }

  /**
   * 제거 필요 여부
   */
  public shouldEvict(): boolean {
    return this.cache.size >= this._maxSize;
  }

  /**
   * 캐시 크기 조정
   */
  public resize(newSize: number): void {
    if (newSize < 1) {
      throw new Error('캐시 크기는 1 이상이어야 합니다');
    }

    this._maxSize = newSize;

    // 새 크기보다 큰 경우 FIFO 항목 제거
    while (this.cache.size > this._maxSize) {
      this.evict();
    }
  }

  /**
   * 만료된 항목 정리
   */
  public prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata.expires && now > entry.metadata.expires) {
        this.cache.delete(key);
        pruned++;
      }
    }

    if (pruned > 0) {
      this.logger.debug('만료 항목 정리', { count: pruned });
    }

    return pruned;
  }

  /**
   * 캐시 통계
   */
  public getStats(): {
    size: number;
    maxSize: number;
    oldestKey?: string;
    newestKey?: string;
    averageAge?: number;
  } {
    const keys = Array.from(this.cache.keys());
    const now = Date.now();
    
    let totalAge = 0;
    for (const entry of this.cache.values()) {
      totalAge += now - entry.metadata.created;
    }

    const stats: {
      size: number;
      maxSize: number;
      oldestKey?: string;
      newestKey?: string;
      averageAge?: number;
    } = {
      size: this.cache.size,
      maxSize: this._maxSize
    };

    if (keys.length > 0) {
      stats.oldestKey = keys[0]!;
      stats.newestKey = keys[keys.length - 1]!;
    }
    if (this.cache.size > 0) {
      stats.averageAge = totalAge / this.cache.size;
    }

    return stats;
  }
}