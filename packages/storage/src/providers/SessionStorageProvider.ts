/**
 * @company/storage - SessionStorage 프로바이더
 * 브라우저 SessionStorage 기반 스토리지
 */

import { LocalStorageProvider } from './LocalStorageProvider';
import { StorageType, SessionStorageConfig, StorageValue } from '../types';
import { Logger } from '@company/core';

export class SessionStorageProvider extends LocalStorageProvider {
  public override readonly name = 'SessionStorage';
  public override readonly type = StorageType.SESSION;

  constructor(config?: SessionStorageConfig) {
    super(config);
    this.logger = new Logger('SessionStorageProvider');
  }

  /**
   * SessionStorage 사용 가능 여부
   */
  public override get isAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) {
        return false;
      }
      
      const testKey = '__sessionStorage_test__';
      window.sessionStorage.setItem(testKey, 'test');
      window.sessionStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 값 조회 - sessionStorage 사용
   */
  public override async get<T>(key: string): Promise<import('@company/core').Result<T | null>> {
    try {
      if (!this.isAvailable) {
        return { success: false, error: new Error('SessionStorage를 사용할 수 없습니다') };
      }

      const fullKey = this.getFullKey(key);
      const item = sessionStorage.getItem(fullKey);
      
      if (!item) {
        return { success: true, data: null };
      }

      const stored = this.serializer.deserialize<StorageValue<T>>(item);
      
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
   * 값 저장 - sessionStorage 사용
   */
  public override async set<T>(key: string, value: T, options?: import('../types').StorageOptions): Promise<import('@company/core').Result<void>> {
    try {
      if (!this.isAvailable) {
        return { success: false, error: new Error('SessionStorage를 사용할 수 없습니다') };
      }

      const fullKey = this.getFullKey(key, options?.namespace);
      const now = Date.now();
      
      const metadata = {
        created: now,
        updated: now,
        version: options?.version,
        tags: options?.tags,
        expires: options?.ttl ? now + options.ttl : undefined
      };

      const stored = {
        data: value,
        metadata
      };

      const serialized = this.serializer.serialize(stored);
      
      // 크기 확인
      if (serialized.length > this.config.maxSize) {
        return { success: false, error: new Error('저장할 데이터가 너무 큽니다') };
      }

      sessionStorage.setItem(fullKey, serialized);
      
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
   * 값 삭제 - sessionStorage 사용
   */
  public override async delete(key: string): Promise<import('@company/core').Result<void>> {
    try {
      if (!this.isAvailable) {
        return { success: false, error: new Error('SessionStorage를 사용할 수 없습니다') };
      }

      const fullKey = this.getFullKey(key);
      sessionStorage.removeItem(fullKey);
      
      return { success: true };

    } catch (error) {
      this.logger.error('값 삭제 실패', { key, error });
      return { success: false, error: new Error('값 삭제 중 오류가 발생했습니다') };
    }
  }

  /**
   * 키 존재 여부 확인 - sessionStorage 사용
   */
  public override async exists(key: string): Promise<import('@company/core').Result<boolean>> {
    try {
      if (!this.isAvailable) {
        return { success: false, error: new Error('SessionStorage를 사용할 수 없습니다') };
      }

      const fullKey = this.getFullKey(key);
      const exists = sessionStorage.getItem(fullKey) !== null;
      
      return { success: true, data: exists };

    } catch (error) {
      this.logger.error('키 존재 확인 실패', { key, error });
      return { success: false, error: new Error('키 존재 확인 중 오류가 발생했습니다') };
    }
  }

  /**
   * 키 목록 조회 - sessionStorage 사용
   */
  public override async keys(query?: import('../types').StorageQuery): Promise<import('@company/core').Result<string[]>> {
    try {
      if (!this.isAvailable) {
        return { success: false, error: new Error('SessionStorage를 사용할 수 없습니다') };
      }

      const prefix = this.getFullKey('', query?.namespace);
      const keys: string[] = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        
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
   * 스토리지 초기화 - sessionStorage 사용
   */
  public override async clear(namespace?: string): Promise<import('@company/core').Result<void>> {
    try {
      if (!this.isAvailable) {
        return { success: false, error: new Error('SessionStorage를 사용할 수 없습니다') };
      }

      const prefix = this.getFullKey('', namespace);
      const keysToRemove: string[] = [];
      
      // 삭제할 키 수집
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      
      // 키 삭제
      for (const key of keysToRemove) {
        sessionStorage.removeItem(key);
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
   * 스토리지 크기 조회 - sessionStorage 사용
   */
  public override async size(namespace?: string): Promise<import('@company/core').Result<number>> {
    try {
      if (!this.isAvailable) {
        return { success: false, error: new Error('SessionStorage를 사용할 수 없습니다') };
      }

      const prefix = this.getFullKey('', namespace);
      let totalSize = 0;
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const value = sessionStorage.getItem(key);
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

  /**
   * 만료된 항목 정리 - sessionStorage 사용
   */
  public override async cleanup(): Promise<number> {
    if (!this.isAvailable) {
      return 0;
    }

    const prefix = this.getFullKey('');
    let cleanedCount = 0;
    
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      
      if (key && key.startsWith(prefix)) {
        try {
          const value = sessionStorage.getItem(key);
          if (value) {
            const stored = this.serializer.deserialize<StorageValue>(value);
            
            if (stored.metadata?.expires && Date.now() > stored.metadata.expires) {
              sessionStorage.removeItem(key);
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