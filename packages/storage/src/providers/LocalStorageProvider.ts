/**
 * @repo/storage - LocalStorage 프로바이더
 * 브라우저 LocalStorage 기반 스토리지
 */

import { Logger, Result } from '@repo/core';
import { 
  StorageProvider, 
  StorageType, 
  StorageOptions, 
  StorageQuery,
  LocalStorageConfig,
  StorageValue,
  StorageMetadata,
  StorageSerializer as IStorageSerializer
} from '../types';
import { StorageSerializer } from '../utils/StorageSerializer';

export class LocalStorageProvider implements StorageProvider {
  public readonly name: string = 'LocalStorage';
  public readonly type: StorageType = StorageType.LOCAL;
  protected logger: Logger;
  protected config: Required<LocalStorageConfig>;
  protected serializer: IStorageSerializer;

  constructor(config?: LocalStorageConfig) {
    this.logger = new Logger('LocalStorageProvider');
    this.config = {
      prefix: 'app',
      separator: ':',
      serializer: config?.serializer || new StorageSerializer(),
      maxSize: 5 * 1024 * 1024, // 5MB
      ...config
    };
    this.serializer = this.config.serializer || new StorageSerializer();
  }

  /**
   * LocalStorage 사용 가능 여부
   */
  public get isAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      
      const testKey = '__localStorage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 용량 제한 (대략적인 추정)
   */
  public get capacity(): number {
    return this.config.maxSize;
  }

  // ===== 기본 작업 =====

  /**
   * 값 조회
   */
  public async get<T>(key: string): Promise<Result<T | null>> {
    try {
      if (!this.isAvailable) {
        return { success: false, error: new Error('LocalStorage를 사용할 수 없습니다') };
      }

      const fullKey = this.getFullKey(key);
      const item = localStorage.getItem(fullKey);
      
      if (!item) {
        return { success: true, data: null };
      }

      const stored: StorageValue<T> = this.serializer.deserialize(item);
      
      // 만료 확인
      if (stored.metadata?.expires && Date.now() > stored.metadata.expires) {
        await this.delete(key);
        return { success: true, data: null };
      }

      return { success: true, data: stored.data };

    } catch (error) {
      this.logger.error('값 조회 실패', { key, error });
      return { success: false, error: new Error('값 조회 중 오류가 발생했습니다') };
    }
  }

  /**
   * 값 저장
   */
  public async set<T>(key: string, value: T, options?: StorageOptions): Promise<Result<void>> {
    try {
      if (!this.isAvailable) {
        return { success: false, error: new Error('LocalStorage를 사용할 수 없습니다') };
      }

      const fullKey = this.getFullKey(key, options?.namespace);
      const now = Date.now();
      
      const metadata: StorageMetadata = {
        created: now,
        updated: now
      };

      if (options?.version !== undefined) {
        metadata.version = options.version;
      }
      if (options?.tags !== undefined) {
        metadata.tags = options.tags;
      }
      if (options?.ttl) {
        metadata.expires = now + options.ttl;
      }

      const stored: StorageValue<T> = {
        data: value,
        metadata
      };

      const serialized = this.serializer.serialize(stored);
      
      // 크기 확인
      if (serialized.length > this.config.maxSize) {
        return { success: false, error: new Error('저장할 데이터가 너무 큽니다') };
      }

      localStorage.setItem(fullKey, serialized);
      
      return { success: true };

    } catch (error) {
      this.logger.error('값 저장 실패', { key, error });
      
      // 용량 초과 에러 처리
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        return { success: false, error: new Error('저장 공간이 부족합니다') };
      }
      
      return { success: false, error: new Error('값 저장 중 오류가 발생했습니다') };
    }
  }

  /**
   * 값 삭제
   */
  public async delete(key: string): Promise<Result<void>> {
    try {
      if (!this.isAvailable) {
        return { success: false, error: new Error('LocalStorage를 사용할 수 없습니다') };
      }

      const fullKey = this.getFullKey(key);
      localStorage.removeItem(fullKey);
      
      return { success: true };

    } catch (error) {
      this.logger.error('값 삭제 실패', { key, error });
      return { success: false, error: new Error('값 삭제 중 오류가 발생했습니다') };
    }
  }

  /**
   * 키 존재 여부 확인
   */
  public async exists(key: string): Promise<Result<boolean>> {
    try {
      if (!this.isAvailable) {
        return { success: false, error: new Error('LocalStorage를 사용할 수 없습니다') };
      }

      const fullKey = this.getFullKey(key);
      const exists = localStorage.getItem(fullKey) !== null;
      
      return { success: true, data: exists };

    } catch (error) {
      this.logger.error('키 존재 확인 실패', { key, error });
      return { success: false, error: new Error('키 존재 확인 중 오류가 발생했습니다') };
    }
  }

  // ===== 배치 작업 =====

  /**
   * 여러 값 조회
   */
  public async getMany<T>(keys: string[]): Promise<Result<Map<string, T>>> {
    try {
      const results = new Map<string, T>();
      
      for (const key of keys) {
        const result = await this.get<T>(key);
        if (result.success && result.data !== null) {
          results.set(key, result.data!);
        }
      }
      
      return { success: true, data: results };

    } catch (error) {
      this.logger.error('다중 값 조회 실패', { error });
      return { success: false, error: new Error('다중 값 조회 중 오류가 발생했습니다') };
    }
  }

  /**
   * 여러 값 저장
   */
  public async setMany<T>(entries: Map<string, T>, options?: StorageOptions): Promise<Result<void>> {
    try {
      for (const [key, value] of entries) {
        const result = await this.set(key, value, options);
        if (!result.success) {
          return result;
        }
      }
      
      return { success: true };

    } catch (error) {
      this.logger.error('다중 값 저장 실패', { error });
      return { success: false, error: new Error('다중 값 저장 중 오류가 발생했습니다') };
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
      this.logger.error('다중 값 삭제 실패', { error });
      return { success: false, error: new Error('다중 값 삭제 중 오류가 발생했습니다') };
    }
  }

  // ===== 쿼리 작업 =====

  /**
   * 키 목록 조회
   */
  public async keys(query?: StorageQuery): Promise<Result<string[]>> {
    try {
      if (!this.isAvailable) {
        return { success: false, error: new Error('LocalStorage를 사용할 수 없습니다') };
      }

      const prefix = this.getFullKey('', query?.namespace);
      const keys: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith(prefix)) {
          // 프리픽스 제거
          const cleanKey = key.substring(prefix.length);
          
          // 쿼리 필터 적용
          if (query?.prefix && !cleanKey.startsWith(query.prefix)) {
            continue;
          }
          
          keys.push(cleanKey);
        }
      }
      
      // 제한 적용
      if (query?.limit) {
        const offset = query.offset || 0;
        return { success: true, data: keys.slice(offset, offset + query.limit) };
      }
      
      return { success: true, data: keys };

    } catch (error) {
      this.logger.error('키 목록 조회 실패', { error });
      return { success: false, error: new Error('키 목록 조회 중 오류가 발생했습니다') };
    }
  }

  /**
   * 값 목록 조회
   */
  public async values<T>(query?: StorageQuery): Promise<Result<T[]>> {
    try {
      const keysResult = await this.keys(query);
      
      if (!keysResult.success) {
        return { success: false, error: keysResult.error || new Error('키 목록 조회 실패') };
      }
      
      const values: T[] = [];
      
      for (const key of keysResult.data!) {
        const result = await this.get<T>(key);
        if (result.success && result.data !== null) {
          values.push(result.data!);
        }
      }
      
      return { success: true, data: values };

    } catch (error) {
      this.logger.error('값 목록 조회 실패', { error });
      return { success: false, error: new Error('값 목록 조회 중 오류가 발생했습니다') };
    }
  }

  /**
   * 키-값 쌍 목록 조회
   */
  public async entries<T>(query?: StorageQuery): Promise<Result<Array<[string, T]>>> {
    try {
      const keysResult = await this.keys(query);
      
      if (!keysResult.success) {
        return { success: false, error: keysResult.error || new Error('키 목록 조회 실패') };
      }
      
      const entries: Array<[string, T]> = [];
      
      for (const key of keysResult.data!) {
        const result = await this.get<T>(key);
        if (result.success && result.data !== null) {
          entries.push([key, result.data!]);
        }
      }
      
      return { success: true, data: entries };

    } catch (error) {
      this.logger.error('엔트리 목록 조회 실패', { error });
      return { success: false, error: new Error('엔트리 목록 조회 중 오류가 발생했습니다') };
    }
  }

  // ===== 유틸리티 =====

  /**
   * 스토리지 초기화
   */
  public async clear(namespace?: string): Promise<Result<void>> {
    try {
      if (!this.isAvailable) {
        return { success: false, error: new Error('LocalStorage를 사용할 수 없습니다') };
      }

      const prefix = this.getFullKey('', namespace);
      const keysToRemove: string[] = [];
      
      // 삭제할 키 수집
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      
      // 키 삭제
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
      
      this.logger.info('스토리지 초기화 완료', { 
        namespace, 
        removedCount: keysToRemove.length 
      });
      
      return { success: true };

    } catch (error) {
      this.logger.error('스토리지 초기화 실패', { error });
      return { success: false, error: new Error('스토리지 초기화 중 오류가 발생했습니다') };
    }
  }

  /**
   * 스토리지 크기 조회
   */
  public async size(namespace?: string): Promise<Result<number>> {
    try {
      if (!this.isAvailable) {
        return { success: false, error: new Error('LocalStorage를 사용할 수 없습니다') };
      }

      const prefix = this.getFullKey('', namespace);
      let totalSize = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            // 키와 값의 크기를 대략적으로 계산 (UTF-16 고려)
            totalSize += (key.length + value.length) * 2;
          }
        }
      }
      
      return { success: true, data: totalSize };

    } catch (error) {
      this.logger.error('스토리지 크기 조회 실패', { error });
      return { success: false, error: new Error('스토리지 크기 조회 중 오류가 발생했습니다') };
    }
  }

  // ===== 내부 메소드 =====

  /**
   * 전체 키 생성
   */
  protected getFullKey(key: string, namespace?: string): string {
    const parts = [this.config.prefix];
    
    if (namespace) {
      parts.push(namespace);
    }
    
    if (key) {
      parts.push(key);
    }
    
    return parts.join(this.config.separator);
  }

  /**
   * 만료된 항목 정리
   */
  public async cleanup(): Promise<number> {
    if (!this.isAvailable) {
      return 0;
    }

    const prefix = this.getFullKey('');
    let cleanedCount = 0;
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith(prefix)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const stored: StorageValue = this.serializer.deserialize(value);
            
            if (stored.metadata?.expires && Date.now() > stored.metadata.expires) {
              localStorage.removeItem(key);
              cleanedCount++;
            }
          }
        } catch {
          // 파싱 실패한 항목은 무시
        }
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.info('만료된 항목 정리 완료', { cleanedCount });
    }
    
    return cleanedCount;
  }
}