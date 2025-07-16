/**
 * @company/core - Enterprise AI Module System Core
 * 
 * 모든 엔터프라이즈 모듈의 기반이 되는 핵심 라이브러리
 * Zero Error Architecture 기반으로 설계됨
 * 
 * @version 1.0.0
 * @author Enterprise AI Team
 */

// ===== 핵심 타입 =====
export * from './types';

// ===== 기반 클래스 =====
export { ModuleBase } from './base/ModuleBase';

// ===== 이벤트 시스템 =====
export { EventEmitter, EventBus } from './events/EventEmitter';

// ===== 에러 처리 =====
export { 
  ErrorHandler, 
  isModuleError, 
  getErrorMessage, 
  getErrorCode 
} from './error/ErrorHandler';

// ===== 로깅 시스템 =====
export { Logger, globalLogger } from './logging/Logger';

// ===== 모듈 레지스트리 =====
export { 
  ModuleRegistry, 
  moduleRegistry,
  type ModuleDependency,
  type ModuleRegistration 
} from './registry/ModuleRegistry';

// ===== 유틸리티 함수 =====

/**
 * 안전한 JSON 파싱 (Zero Error)
 */
export function safeJsonParse<T>(json: string): { success: boolean; data?: T; error?: string } {
  try {
    const data = JSON.parse(json) as T;
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'JSON 파싱 실패' 
    };
  }
}

/**
 * 안전한 JSON 문자열화 (Zero Error)
 */
export function safeJsonStringify(obj: any): { success: boolean; data?: string; error?: string } {
  try {
    const data = JSON.stringify(obj);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'JSON 문자열화 실패' 
    };
  }
}

/**
 * 지연 실행 유틸리티
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 재시도 로직 (Zero Error)
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
  } = {}
): Promise<{ success: boolean; data?: T; error?: any; attempts: number }> {
  const { maxAttempts = 3, delay: baseDelay = 1000, backoff = true } = options;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await operation();
      return { success: true, data, attempts: attempt };
    } catch (error) {
      lastError = error;
      
      if (attempt < maxAttempts) {
        const delayMs = backoff ? baseDelay * Math.pow(2, attempt - 1) : baseDelay;
        await delay(delayMs);
      }
    }
  }
  
  return { success: false, error: lastError, attempts: maxAttempts };
}

/**
 * 타임아웃이 있는 Promise (Zero Error)
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<{ success: boolean; data?: T; error?: string; timedOut: boolean }> {
  return Promise.race([
    promise.then(data => ({ success: true as const, data, timedOut: false as const })),
    delay(timeoutMs).then(() => ({ 
      success: false as const, 
      error: '시간 초과', 
      timedOut: true as const 
    }))
  ]).catch(error => ({
    success: false as const,
    error: error instanceof Error ? error.message : '실행 중 오류',
    timedOut: false as const
  }));
}

/**
 * 객체 깊은 복사 (Zero Error)
 */
export function deepClone<T>(obj: T): { success: boolean; data?: T; error?: string } {
  try {
    // JSON 방식 (제한적이지만 안전)
    const cloned = JSON.parse(JSON.stringify(obj)) as T;
    return { success: true, data: cloned };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '객체 복사 실패' 
    };
  }
}

/**
 * 배열을 청크로 분할
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) return [];
  
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 객체에서 null/undefined 값 제거
 */
export function compact<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value != null) {
      result[key as keyof T] = value;
    }
  }
  
  return result;
}

/**
 * 두 객체의 얕은 비교
 */
export function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  
  return true;
}

// ===== 모듈 정보 =====
export const CORE_MODULE_INFO = {
  name: '@company/core',
  version: '1.0.0',
  description: 'Enterprise AI Module System - Core Foundation',
  author: 'Enterprise AI Team',
  license: 'MIT'
} as const;

// ===== 시작 로그 =====
// Node.js 환경에서만 실행되는 초기화 로그
// (브라우저 환경에서는 무시됨)