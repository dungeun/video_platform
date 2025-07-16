/**
 * @company/storage - 스토리지 시리얼라이저
 * 데이터 직렬화/역직렬화 유틸리티
 */

import { StorageSerializer as IStorageSerializer } from '../types';
import { Logger } from '@company/core';

export class StorageSerializer implements IStorageSerializer {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('StorageSerializer');
  }

  /**
   * 값을 문자열로 직렬화
   */
  public serialize<T>(value: T): string {
    try {
      return JSON.stringify(value, this.replacer);
    } catch (error) {
      this.logger.error('직렬화 실패', { error });
      throw new Error('데이터 직렬화에 실패했습니다');
    }
  }

  /**
   * 문자열을 원래 값으로 역직렬화
   */
  public deserialize<T>(value: string): T {
    try {
      return JSON.parse(value, this.reviver);
    } catch (error) {
      this.logger.error('역직렬화 실패', { error });
      throw new Error('데이터 역직렬화에 실패했습니다');
    }
  }

  /**
   * JSON.stringify replacer
   * 특수 타입 처리
   */
  private replacer(key: string, value: any): any {
    // Date 객체
    if (value instanceof Date) {
      return {
        __type: 'Date',
        value: value.toISOString()
      };
    }

    // RegExp 객체
    if (value instanceof RegExp) {
      return {
        __type: 'RegExp',
        source: value.source,
        flags: value.flags
      };
    }

    // Map 객체
    if (value instanceof Map) {
      return {
        __type: 'Map',
        value: Array.from(value.entries())
      };
    }

    // Set 객체
    if (value instanceof Set) {
      return {
        __type: 'Set',
        value: Array.from(value)
      };
    }

    // Buffer/Uint8Array
    if (value instanceof Uint8Array) {
      return {
        __type: 'Uint8Array',
        value: Array.from(value)
      };
    }

    // undefined 값
    if (value === undefined) {
      return {
        __type: 'undefined'
      };
    }

    // NaN
    if (typeof value === 'number' && isNaN(value)) {
      return {
        __type: 'NaN'
      };
    }

    // Infinity
    if (value === Infinity) {
      return {
        __type: 'Infinity'
      };
    }

    if (value === -Infinity) {
      return {
        __type: '-Infinity'
      };
    }

    return value;
  }

  /**
   * JSON.parse reviver
   * 특수 타입 복원
   */
  private reviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type) {
      switch (value.__type) {
        case 'Date':
          return new Date(value.value);
          
        case 'RegExp':
          return new RegExp(value.source, value.flags);
          
        case 'Map':
          return new Map(value.value);
          
        case 'Set':
          return new Set(value.value);
          
        case 'Uint8Array':
          return new Uint8Array(value.value);
          
        case 'undefined':
          return undefined;
          
        case 'NaN':
          return NaN;
          
        case 'Infinity':
          return Infinity;
          
        case '-Infinity':
          return -Infinity;
      }
    }

    return value;
  }

  /**
   * 값이 직렬화 가능한지 확인
   */
  public isSerializable(value: any): boolean {
    try {
      JSON.stringify(value, this.replacer);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 순환 참조 검사
   */
  public hasCircularReference(obj: any): boolean {
    const seen = new WeakSet();
    
    function detect(obj: any): boolean {
      if (obj && typeof obj === 'object') {
        if (seen.has(obj)) {
          return true;
        }
        seen.add(obj);
        
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && detect(obj[key])) {
            return true;
          }
        }
      }
      return false;
    }
    
    return detect(obj);
  }

  /**
   * 객체 깊은 복사
   */
  public deepClone<T>(value: T): T {
    return this.deserialize(this.serialize(value));
  }

  /**
   * 크기 계산 (바이트)
   */
  public getSize(value: any): number {
    const serialized = this.serialize(value);
    // UTF-16 인코딩 고려
    return new Blob([serialized]).size;
  }
}