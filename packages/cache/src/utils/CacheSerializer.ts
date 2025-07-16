import { Result } from '@company/core';

export interface SerializerOptions {
  compress?: boolean;
  format?: 'json' | 'msgpack' | 'custom';
  customSerializer?: (value: any) => string;
  customDeserializer?: (data: string) => any;
}

export class CacheSerializer {
  private options: SerializerOptions;

  constructor(options: SerializerOptions = {}) {
    this.options = {
      compress: false,
      format: 'json',
      ...options
    };
  }

  /**
   * 값을 직렬화
   */
  serialize<T>(value: T): Result<string> {
    try {
      let serialized: string;

      if (this.options.customSerializer) {
        serialized = this.options.customSerializer(value);
      } else {
        switch (this.options.format) {
          case 'json':
            serialized = JSON.stringify(value);
            break;
          case 'msgpack':
            // MessagePack 형식 지원 (별도 라이브러리 필요시)
            serialized = this.serializeToMsgPack(value);
            break;
          default:
            serialized = JSON.stringify(value);
        }
      }

      // 타입 정보 포함
      const wrapper = {
        _type: this.getValueType(value),
        _serialized: true,
        _format: this.options.format,
        _compressed: false,
        data: serialized
      };

      return Result.success(JSON.stringify(wrapper));
    } catch (error) {
      return Result.failure('SERIALIZATION_FAILED', `직렬화 실패: ${error}`);
    }
  }

  /**
   * 직렬화된 데이터를 역직렬화
   */
  deserialize<T>(data: string): Result<T> {
    try {
      // 래퍼 확인
      let parsed: any;
      try {
        parsed = JSON.parse(data);
      } catch {
        // 래퍼 없는 레거시 데이터
        return Result.success(data as any);
      }

      // 직렬화된 데이터가 아니면 그대로 반환
      if (!parsed._serialized) {
        return Result.success(parsed);
      }

      let deserialized: any;

      if (this.options.customDeserializer) {
        deserialized = this.options.customDeserializer(parsed.data);
      } else {
        switch (parsed._format || 'json') {
          case 'json':
            deserialized = JSON.parse(parsed.data);
            break;
          case 'msgpack':
            deserialized = this.deserializeFromMsgPack(parsed.data);
            break;
          default:
            deserialized = JSON.parse(parsed.data);
        }
      }

      // 타입 복원
      return Result.success(this.restoreType(deserialized, parsed._type));
    } catch (error) {
      return Result.failure('DESERIALIZATION_FAILED', `역직렬화 실패: ${error}`);
    }
  }

  /**
   * 안전한 직렬화 (순환 참조 처리)
   */
  safeSerialize<T>(value: T): Result<string> {
    try {
      const seen = new WeakSet();
      
      const serialized = JSON.stringify(value, (key, val) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) {
            return '[Circular Reference]';
          }
          seen.add(val);
        }
        
        // 특수 타입 처리
        if (val instanceof Date) {
          return { _type: 'Date', value: val.toISOString() };
        }
        if (val instanceof RegExp) {
          return { _type: 'RegExp', source: val.source, flags: val.flags };
        }
        if (val instanceof Map) {
          return { _type: 'Map', entries: Array.from(val.entries()) };
        }
        if (val instanceof Set) {
          return { _type: 'Set', values: Array.from(val.values()) };
        }
        if (ArrayBuffer.isView(val) || val instanceof ArrayBuffer) {
          return { _type: 'ArrayBuffer', data: Array.from(new Uint8Array(val as any)) };
        }
        
        return val;
      });

      return Result.success(serialized);
    } catch (error) {
      return Result.failure('SAFE_SERIALIZATION_FAILED', `안전한 직렬화 실패: ${error}`);
    }
  }

  /**
   * 안전한 역직렬화
   */
  safeDeserialize<T>(data: string): Result<T> {
    try {
      const deserialized = JSON.parse(data, (key, val) => {
        if (val && typeof val === 'object' && val._type) {
          switch (val._type) {
            case 'Date':
              return new Date(val.value);
            case 'RegExp':
              return new RegExp(val.source, val.flags);
            case 'Map':
              return new Map(val.entries);
            case 'Set':
              return new Set(val.values);
            case 'ArrayBuffer':
              return new Uint8Array(val.data).buffer;
          }
        }
        return val;
      });

      return Result.success(deserialized);
    } catch (error) {
      return Result.failure('SAFE_DESERIALIZATION_FAILED', `안전한 역직렬화 실패: ${error}`);
    }
  }

  /**
   * 바이너리 직렬화
   */
  toBinary(value: any): Result<Uint8Array> {
    try {
      const serialized = JSON.stringify(value);
      const encoder = new TextEncoder();
      const binary = encoder.encode(serialized);
      return Result.success(binary);
    } catch (error) {
      return Result.failure('BINARY_SERIALIZATION_FAILED', `바이너리 직렬화 실패: ${error}`);
    }
  }

  /**
   * 바이너리 역직렬화
   */
  fromBinary(binary: Uint8Array): Result<any> {
    try {
      const decoder = new TextDecoder();
      const serialized = decoder.decode(binary);
      const value = JSON.parse(serialized);
      return Result.success(value);
    } catch (error) {
      return Result.failure('BINARY_DESERIALIZATION_FAILED', `바이너리 역직렬화 실패: ${error}`);
    }
  }

  /**
   * Base64 인코딩
   */
  toBase64(value: any): Result<string> {
    try {
      const serialized = JSON.stringify(value);
      const base64 = btoa(unescape(encodeURIComponent(serialized)));
      return Result.success(base64);
    } catch (error) {
      return Result.failure('BASE64_ENCODING_FAILED', `Base64 인코딩 실패: ${error}`);
    }
  }

  /**
   * Base64 디코딩
   */
  fromBase64(base64: string): Result<any> {
    try {
      const serialized = decodeURIComponent(escape(atob(base64)));
      const value = JSON.parse(serialized);
      return Result.success(value);
    } catch (error) {
      return Result.failure('BASE64_DECODING_FAILED', `Base64 디코딩 실패: ${error}`);
    }
  }

  /**
   * 크기 계산 (바이트)
   */
  calculateSize(value: any): number {
    try {
      const serialized = JSON.stringify(value);
      return new Blob([serialized]).size;
    } catch {
      return 0;
    }
  }

  /**
   * 깊은 복사
   */
  deepClone<T>(value: T): Result<T> {
    const serialized = this.safeSerialize(value);
    if (serialized.isFailure) {
      return Result.failure('DEEP_CLONE_FAILED', '깊은 복사 실패');
    }
    
    return this.safeDeserialize<T>(serialized.data);
  }

  private getValueType(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (value instanceof Date) return 'Date';
    if (value instanceof RegExp) return 'RegExp';
    if (value instanceof Map) return 'Map';
    if (value instanceof Set) return 'Set';
    if (Array.isArray(value)) return 'Array';
    if (ArrayBuffer.isView(value)) return 'TypedArray';
    if (value instanceof ArrayBuffer) return 'ArrayBuffer';
    return typeof value;
  }

  private restoreType(value: any, type: string): any {
    // 타입별 복원 로직
    switch (type) {
      case 'Date':
        return new Date(value);
      case 'RegExp':
        return new RegExp(value.source, value.flags);
      case 'Map':
        return new Map(value);
      case 'Set':
        return new Set(value);
      default:
        return value;
    }
  }

  private serializeToMsgPack(value: any): string {
    // 간단한 MessagePack 유사 구현
    // 실제로는 msgpack 라이브러리 사용 권장
    return JSON.stringify({
      _msgpack: true,
      data: value
    });
  }

  private deserializeFromMsgPack(data: string): any {
    const parsed = JSON.parse(data);
    if (parsed._msgpack) {
      return parsed.data;
    }
    return parsed;
  }
}

export const defaultSerializer = new CacheSerializer();