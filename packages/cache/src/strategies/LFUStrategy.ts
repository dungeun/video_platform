/**
 * @repo/cache - LFU 캐시 전략
 * Least Frequently Used 캐시 전략 구현
 */

import { CacheStrategy, CacheMetadata, CacheEntry } from '../types';
import { Logger } from '@repo/core';

interface LFUEntry<T> extends CacheEntry<T> {
  frequency: number;
}

export class LFUStrategy<T = any> implements CacheStrategy<T> {
  public readonly name = 'LFU';
  private cache: Map<string, LFUEntry<T>>;
  private frequencyMap: Map<number, Set<string>>;
  private minFrequency: number;
  private _maxSize: number;
  private logger: Logger;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.frequencyMap = new Map();
    this.minFrequency = 0;
    this._maxSize = maxSize;
    this.logger = new Logger('LFUStrategy');
  }

  public get maxSize(): number {
    return this._maxSize;
  }

  public get size(): number {
    return this.cache.size;
  }

  /**
   * 값 조회 (빈도 증가)
   */
  public get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // 만료 확인
    if (entry.metadata.expires && Date.now() > entry.metadata.expires) {
      this.delete(key);
      return undefined;
    }

    // 빈도 업데이트
    this.updateFrequency(key, entry);
    
    // 메타데이터 업데이트
    entry.metadata.accessed = Date.now();
    entry.metadata.accessCount++;

    return entry.value;
  }

  /**
   * 값 설정
   */
  public set(key: string, value: T, metadata: CacheMetadata): void {
    // 기존 항목이 있는 경우
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.metadata = metadata;
      this.updateFrequency(key, entry);
      return;
    }

    // 용량 확인 및 필요시 제거
    while (this.shouldEvict()) {
      this.evict();
    }

    // 새 항목 추가
    const entry: LFUEntry<T> = {
      value,
      metadata,
      frequency: 1
    };

    this.cache.set(key, entry);
    this.addToFrequencyMap(key, 1);
    this.minFrequency = 1;
  }

  /**
   * 값 삭제
   */
  public delete(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // 빈도 맵에서 제거
    this.removeFromFrequencyMap(key, entry.frequency);
    
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
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 전체 초기화
   */
  public clear(): void {
    this.cache.clear();
    this.frequencyMap.clear();
    this.minFrequency = 0;
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
   * LFU 항목 제거
   */
  public evict(): string | undefined {
    const minFreqKeys = this.frequencyMap.get(this.minFrequency);
    
    if (!minFreqKeys || minFreqKeys.size === 0) {
      return undefined;
    }

    // 최소 빈도 중 가장 오래된 항목 선택
    const keyToEvict = minFreqKeys.values().next().value;
    
    if (keyToEvict !== undefined) {
      this.delete(keyToEvict);
      this.logger.debug('LFU 항목 제거', { 
        key: keyToEvict, 
        frequency: this.minFrequency 
      });
      return keyToEvict;
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

    // 새 크기보다 큰 경우 LFU 항목 제거
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
        this.delete(key);
        pruned++;
      }
    }

    if (pruned > 0) {
      this.logger.debug('만료 항목 정리', { count: pruned });
    }

    return pruned;
  }

  /**
   * 빈도 업데이트
   */
  private updateFrequency(key: string, entry: LFUEntry<T>): void {
    const oldFreq = entry.frequency;
    const newFreq = oldFreq + 1;

    // 이전 빈도에서 제거
    this.removeFromFrequencyMap(key, oldFreq);

    // 새 빈도에 추가
    entry.frequency = newFreq;
    this.addToFrequencyMap(key, newFreq);

    // 최소 빈도 업데이트
    if (oldFreq === this.minFrequency && this.frequencyMap.get(oldFreq)?.size === 0) {
      this.minFrequency++;
    }
  }

  /**
   * 빈도 맵에 추가
   */
  private addToFrequencyMap(key: string, frequency: number): void {
    if (!this.frequencyMap.has(frequency)) {
      this.frequencyMap.set(frequency, new Set());
    }
    this.frequencyMap.get(frequency)!.add(key);
  }

  /**
   * 빈도 맵에서 제거
   */
  private removeFromFrequencyMap(key: string, frequency: number): void {
    const keys = this.frequencyMap.get(frequency);
    if (keys) {
      keys.delete(key);
      if (keys.size === 0) {
        this.frequencyMap.delete(frequency);
      }
    }
  }

  /**
   * 캐시 통계
   */
  public getStats(): {
    size: number;
    maxSize: number;
    minFrequency: number;
    frequencyDistribution: Map<number, number>;
  } {
    const distribution = new Map<number, number>();
    
    for (const [freq, keys] of this.frequencyMap.entries()) {
      distribution.set(freq, keys.size);
    }

    return {
      size: this.cache.size,
      maxSize: this._maxSize,
      minFrequency: this.minFrequency,
      frequencyDistribution: distribution
    };
  }
}