import { Result } from '@company/core';

export interface MemoryInfo {
  used: number;
  limit: number;
  available: number;
  percentage: number;
  itemCount: number;
  averageItemSize: number;
}

export interface MemoryPressureHandler {
  onMemoryPressure: (info: MemoryInfo) => void;
  threshold: number; // 메모리 사용률 임계값 (0-1)
}

export class MemoryManager {
  private memoryLimit: number = 50 * 1024 * 1024; // 기본 50MB
  private currentUsage: number = 0;
  private itemCount: number = 0;
  private pressureHandlers: MemoryPressureHandler[] = [];
  private sizeCache: WeakMap<object, number> = new WeakMap();

  constructor(limitMB: number = 50) {
    this.memoryLimit = limitMB * 1024 * 1024;
  }

  /**
   * 값의 메모리 크기 계산 (바이트)
   */
  calculateSize(value: any): number {
    // 캐시된 크기 확인
    if (typeof value === 'object' && value !== null) {
      const cached = this.sizeCache.get(value);
      if (cached !== undefined) {
        return cached;
      }
    }

    let size = 0;

    switch (typeof value) {
      case 'string':
        // UTF-16 인코딩 고려 (2바이트 per char)
        size = value.length * 2;
        break;
      
      case 'number':
        size = 8; // 64비트 부동소수점
        break;
      
      case 'boolean':
        size = 4;
        break;
      
      case 'undefined':
        size = 0;
        break;
      
      case 'object':
        if (value === null) {
          size = 0;
        } else if (value instanceof Date) {
          size = 8;
        } else if (value instanceof RegExp) {
          size = value.source.length * 2 + 8;
        } else if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
          size = value.byteLength;
        } else if (Array.isArray(value)) {
          size = this.calculateArraySize(value);
        } else if (value instanceof Map) {
          size = this.calculateMapSize(value);
        } else if (value instanceof Set) {
          size = this.calculateSetSize(value);
        } else {
          size = this.calculateObjectSize(value);
        }
        break;
      
      case 'function':
        // 함수는 대략적인 크기 추정
        size = value.toString().length * 2;
        break;
      
      default:
        // 기본값
        size = 8;
    }

    // 객체인 경우 캐시에 저장
    if (typeof value === 'object' && value !== null) {
      this.sizeCache.set(value, size);
    }

    return size;
  }

  /**
   * 실제 메모리 사용량 조회
   */
  getActualMemoryUsage(): MemoryInfo {
    const used = this.currentUsage;
    const limit = this.memoryLimit;
    const available = Math.max(0, limit - used);
    const percentage = limit > 0 ? (used / limit) * 100 : 0;
    const averageItemSize = this.itemCount > 0 ? used / this.itemCount : 0;

    return {
      used,
      limit,
      available,
      percentage,
      itemCount: this.itemCount,
      averageItemSize
    };
  }

  /**
   * 메모리 한계 설정
   */
  setMemoryLimit(bytes: number): Result<void> {
    if (bytes < 0) {
      return Result.failure('INVALID_MEMORY_LIMIT', '메모리 한계는 0 이상이어야 합니다');
    }

    this.memoryLimit = bytes;
    this.checkMemoryPressure();
    
    return Result.success(undefined);
  }

  /**
   * 메모리 한계 설정 (MB 단위)
   */
  setMemoryLimitMB(megabytes: number): Result<void> {
    return this.setMemoryLimit(megabytes * 1024 * 1024);
  }

  /**
   * 메모리 압박 핸들러 등록
   */
  enableMemoryPressureHandling(handler?: MemoryPressureHandler): void {
    if (handler) {
      this.pressureHandlers.push(handler);
    } else {
      // 기본 핸들러 등록
      this.pressureHandlers.push({
        threshold: 0.9, // 90% 사용시
        onMemoryPressure: (info) => {
          console.warn('메모리 압박 감지:', {
            used: `${(info.used / 1024 / 1024).toFixed(2)}MB`,
            percentage: `${info.percentage.toFixed(1)}%`
          });
        }
      });
    }
  }

  /**
   * 메모리 사용량 추가
   */
  addMemoryUsage(bytes: number): Result<void> {
    const newUsage = this.currentUsage + bytes;
    
    if (this.memoryLimit > 0 && newUsage > this.memoryLimit) {
      return Result.failure('MEMORY_LIMIT_EXCEEDED', '메모리 한계 초과');
    }

    this.currentUsage = newUsage;
    this.itemCount++;
    this.checkMemoryPressure();
    
    return Result.success(undefined);
  }

  /**
   * 메모리 사용량 감소
   */
  removeMemoryUsage(bytes: number): void {
    this.currentUsage = Math.max(0, this.currentUsage - bytes);
    this.itemCount = Math.max(0, this.itemCount - 1);
  }

  /**
   * 메모리 사용량 초기화
   */
  reset(): void {
    this.currentUsage = 0;
    this.itemCount = 0;
    this.sizeCache = new WeakMap();
  }

  /**
   * 메모리 압박 확인
   */
  private checkMemoryPressure(): void {
    const info = this.getActualMemoryUsage();
    const usageRatio = info.percentage / 100;

    for (const handler of this.pressureHandlers) {
      if (usageRatio >= handler.threshold) {
        handler.onMemoryPressure(info);
      }
    }
  }

  /**
   * 배열 크기 계산
   */
  private calculateArraySize(arr: any[]): number {
    let size = 8; // 배열 객체 오버헤드
    
    for (const item of arr) {
      size += this.calculateSize(item) + 8; // 각 요소 + 참조
    }
    
    return size;
  }

  /**
   * 객체 크기 계산
   */
  private calculateObjectSize(obj: any): number {
    let size = 8; // 객체 오버헤드
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // 키 크기 + 값 크기 + 프로퍼티 오버헤드
        size += key.length * 2 + this.calculateSize(obj[key]) + 16;
      }
    }
    
    return size;
  }

  /**
   * Map 크기 계산
   */
  private calculateMapSize(map: Map<any, any>): number {
    let size = 16; // Map 객체 오버헤드
    
    map.forEach((value, key) => {
      size += this.calculateSize(key) + this.calculateSize(value) + 16;
    });
    
    return size;
  }

  /**
   * Set 크기 계산
   */
  private calculateSetSize(set: Set<any>): number {
    let size = 16; // Set 객체 오버헤드
    
    set.forEach(value => {
      size += this.calculateSize(value) + 8;
    });
    
    return size;
  }

  /**
   * 메모리 사용 예측
   */
  canAllocate(bytes: number): boolean {
    if (this.memoryLimit <= 0) return true;
    return (this.currentUsage + bytes) <= this.memoryLimit;
  }

  /**
   * 메모리 통계
   */
  getMemoryStats(): {
    totalAllocated: number;
    totalFreed: number;
    peakUsage: number;
    allocationCount: number;
  } {
    // 실제 구현에서는 더 상세한 통계 추적
    return {
      totalAllocated: this.currentUsage,
      totalFreed: 0,
      peakUsage: this.currentUsage,
      allocationCount: this.itemCount
    };
  }

  /**
   * 가비지 컬렉션 힌트
   */
  suggestGC(): void {
    // WeakMap 정리
    this.sizeCache = new WeakMap();
    
    // 브라우저/Node.js 환경에 따른 GC 힌트
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  }

  /**
   * 메모리 덤프 (디버깅용)
   */
  dumpMemoryInfo(): string {
    const info = this.getActualMemoryUsage();
    
    return [
      '=== 캐시 메모리 정보 ===',
      `사용량: ${(info.used / 1024 / 1024).toFixed(2)}MB / ${(info.limit / 1024 / 1024).toFixed(2)}MB`,
      `사용률: ${info.percentage.toFixed(1)}%`,
      `항목 수: ${info.itemCount}`,
      `평균 크기: ${(info.averageItemSize / 1024).toFixed(2)}KB`,
      `여유 공간: ${(info.available / 1024 / 1024).toFixed(2)}MB`
    ].join('\n');
  }
}

export const defaultMemoryManager = new MemoryManager();