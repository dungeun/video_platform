/**
 * @repo/types - Enterprise AI Module System Types
 * 
 * 모든 엔터프라이즈 모듈에서 사용하는 공통 타입 정의
 * 
 * @version 1.0.0
 * @author Enterprise AI Team
 */

// ===== 공통 기본 타입 =====
export * from './common';

// ===== 인증/인가 타입 =====
export * from './auth';

// ===== 비즈니스 도메인 타입 =====
export * from './business';

// ===== UI/UX 타입 =====
export * from './ui';

// ===== 검증 스키마 (Zod) =====
export * from './schemas';

// ===== 타입 가드 유틸리티 =====

/**
 * 값이 null 또는 undefined가 아닌지 확인
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * 값이 문자열인지 확인
 */
export function isString(value: any): value is string {
  return typeof value === 'string';
}

/**
 * 값이 숫자인지 확인
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 값이 불린인지 확인
 */
export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 값이 객체인지 확인 (null 제외)
 */
export function isObject(value: any): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 값이 배열인지 확인
 */
export function isArray<T>(value: any): value is T[] {
  return Array.isArray(value);
}

/**
 * 값이 함수인지 확인
 */
export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}

/**
 * 값이 Date 객체인지 확인
 */
export function isDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * 값이 유효한 이메일 형식인지 확인
 */
export function isEmail(value: any): value is string {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * 값이 유효한 URL 형식인지 확인
 */
export function isUrl(value: any): value is string {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * 값이 유효한 UUID 형식인지 확인
 */
export function isUuid(value: any): value is string {
  if (!isString(value)) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * 값이 빈 문자열이 아닌지 확인
 */
export function isNotEmptyString(value: any): value is string {
  return isString(value) && value.trim().length > 0;
}

/**
 * 값이 양수인지 확인
 */
export function isPositiveNumber(value: any): value is number {
  return isNumber(value) && value > 0;
}

/**
 * 값이 0 이상의 수인지 확인
 */
export function isNonNegativeNumber(value: any): value is number {
  return isNumber(value) && value >= 0;
}

/**
 * 값이 정수인지 확인
 */
export function isInteger(value: any): value is number {
  return isNumber(value) && Number.isInteger(value);
}

/**
 * 객체가 특정 키를 가지고 있는지 확인
 */
export function hasProperty<T extends object, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, any> {
  return isObject(obj) && key in obj;
}

/**
 * 값이 특정 타입의 배열인지 확인
 */
export function isArrayOf<T>(
  value: any,
  typeGuard: (item: any) => item is T
): value is T[] {
  return isArray(value) && value.every(typeGuard);
}

// ===== 변환 유틸리티 =====

/**
 * 값을 안전하게 문자열로 변환
 */
export function toString(value: any): string {
  if (value === null || value === undefined) return '';
  if (isString(value)) return value;
  if (isNumber(value) || isBoolean(value)) return String(value);
  if (isDate(value)) return value.toISOString();
  if (isObject(value) || isArray(value)) return JSON.stringify(value);
  return String(value);
}

/**
 * 값을 안전하게 숫자로 변환
 */
export function toNumber(value: any): number | null {
  if (isNumber(value)) return value;
  if (isString(value)) {
    const parsed = Number(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * 값을 안전하게 불린으로 변환
 */
export function toBoolean(value: any): boolean {
  if (isBoolean(value)) return value;
  if (isString(value)) {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on';
  }
  if (isNumber(value)) return value !== 0;
  return Boolean(value);
}

/**
 * 값을 안전하게 Date로 변환
 */
export function toDate(value: any): Date | null {
  if (isDate(value)) return value;
  if (isString(value) || isNumber(value)) {
    const date = new Date(value);
    return isDate(date) ? date : null;
  }
  return null;
}

/**
 * 깊은 복사 (JSON 기반)
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (isDate(obj)) return new Date(obj.getTime()) as unknown as T;
  if (isArray(obj)) return obj.map(deepClone) as unknown as T;
  if (isObject(obj)) {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}

/**
 * 객체에서 null/undefined 값 제거
 */
export function removeNullish<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * 객체에서 빈 값 제거 (null, undefined, 빈 문자열, 빈 배열, 빈 객체)
 */
export function removeEmpty<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    const value = obj[key];
    if (value !== null && 
        value !== undefined && 
        value !== '' && 
        !(isArray(value) && value.length === 0) &&
        !(isObject(value) && Object.keys(value).length === 0)) {
      result[key] = value;
    }
  }
  return result;
}

// ===== 모듈 정보 =====
export const TYPES_MODULE_INFO = {
  name: '@repo/types',
  version: '1.0.0',
  description: 'Enterprise AI Module System - Common Types',
  author: 'Enterprise AI Team',
  license: 'MIT'
} as const;