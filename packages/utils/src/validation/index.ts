/**
 * @company/utils - 검증 유틸리티
 */

import { Result as CoreResult } from '@company/core';

// Utils에서 사용할 Result 타입 (에러를 문자열로 처리)
export type Result<T> = CoreResult<T, string>;

// ===== 기본 타입 검증 =====

/**
 * 문자열 검증
 */
export function isString(value: any): Result<boolean> {
  try {
    return { success: true, data: typeof value === 'string' };
  } catch (error) {
    return { success: false, error: `문자열 검증 실패: ${error}` };
  }
}

/**
 * 숫자 검증
 */
export function isNumber(value: any): Result<boolean> {
  try {
    return { success: true, data: typeof value === 'number' && !isNaN(value) && isFinite(value) };
  } catch (error) {
    return { success: false, error: `숫자 검증 실패: ${error}` };
  }
}

/**
 * 불린 검증
 */
export function isBoolean(value: any): Result<boolean> {
  try {
    return { success: true, data: typeof value === 'boolean' };
  } catch (error) {
    return { success: false, error: `불린 검증 실패: ${error}` };
  }
}

/**
 * 객체 검증
 */
export function isObject(value: any): Result<boolean> {
  try {
    return { success: true, data: typeof value === 'object' && value !== null && !Array.isArray(value) };
  } catch (error) {
    return { success: false, error: `객체 검증 실패: ${error}` };
  }
}

/**
 * 배열 검증
 */
export function isArray(value: any): Result<boolean> {
  try {
    return { success: true, data: Array.isArray(value) };
  } catch (error) {
    return { success: false, error: `배열 검증 실패: ${error}` };
  }
}

/**
 * 함수 검증
 */
export function isFunction(value: any): Result<boolean> {
  try {
    return { success: true, data: typeof value === 'function' };
  } catch (error) {
    return { success: false, error: `함수 검증 실패: ${error}` };
  }
}

/**
 * null/undefined 검증
 */
export function isNull(value: any): Result<boolean> {
  try {
    return { success: true, data: value === null || value === undefined };
  } catch (error) {
    return { success: false, error: `null 검증 실패: ${error}` };
  }
}

// ===== 문자열 검증 =====

/**
 * 빈 문자열 검증
 */
export function isEmptyString(value: any): Result<boolean> {
  try {
    if (typeof value !== 'string') {
      return { success: true, data: false };
    }
    return { success: true, data: value.length === 0 };
  } catch (error) {
    return { success: false, error: `빈 문자열 검증 실패: ${error}` };
  }
}

/**
 * 공백 문자열 검증
 */
export function isBlankString(value: any): Result<boolean> {
  try {
    if (typeof value !== 'string') {
      return { success: true, data: false };
    }
    return { success: true, data: value.trim().length === 0 };
  } catch (error) {
    return { success: false, error: `공백 문자열 검증 실패: ${error}` };
  }
}

/**
 * 이메일 형식 검증
 */
export function isEmail(value: any): Result<boolean> {
  try {
    if (typeof value !== 'string') {
      return { success: true, data: false };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return { success: true, data: emailRegex.test(value) };
  } catch (error) {
    return { success: false, error: `이메일 검증 실패: ${error}` };
  }
}

/**
 * URL 형식 검증
 */
export function isUrl(value: any): Result<boolean> {
  try {
    if (typeof value !== 'string') {
      return { success: true, data: false };
    }
    
    try {
      new URL(value);
      return { success: true, data: true };
    } catch {
      return { success: true, data: false };
    }
  } catch (error) {
    return { success: false, error: `URL 검증 실패: ${error}` };
  }
}

/**
 * UUID 형식 검증
 */
export function isUuid(value: any): Result<boolean> {
  try {
    if (typeof value !== 'string') {
      return { success: true, data: false };
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return { success: true, data: uuidRegex.test(value) };
  } catch (error) {
    return { success: false, error: `UUID 검증 실패: ${error}` };
  }
}

/**
 * 전화번호 형식 검증 (한국)
 */
export function isKoreanPhoneNumber(value: any): Result<boolean> {
  try {
    if (typeof value !== 'string') {
      return { success: true, data: false };
    }
    
    const phoneRegex = /^(\+82|0)(2|[1-9]{2})-?[0-9]{3,4}-?[0-9]{4}$/;
    return { success: true, data: phoneRegex.test(value) };
  } catch (error) {
    return { success: false, error: `전화번호 검증 실패: ${error}` };
  }
}

/**
 * 주민등록번호 형식 검증
 */
export function isKoreanSSN(value: any): Result<boolean> {
  try {
    if (typeof value !== 'string') {
      return { success: true, data: false };
    }
    
    const ssnRegex = /^\d{6}-\d{7}$/;
    if (!ssnRegex.test(value)) {
      return { success: true, data: false };
    }
    
    // 간단한 체크섬 검증
    const numbers = value.replace('-', '');
    const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
    let sum = 0;
    
    for (let i = 0; i < 12; i++) {
      sum += parseInt(numbers[i]) * weights[i];
    }
    
    const checkDigit = (11 - (sum % 11)) % 10;
    return { success: true, data: checkDigit === parseInt(numbers[12]) };
  } catch (error) {
    return { success: false, error: `주민등록번호 검증 실패: ${error}` };
  }
}

// ===== 숫자 검증 =====

/**
 * 정수 검증
 */
export function isInteger(value: any): Result<boolean> {
  try {
    return { success: true, data: Number.isInteger(value) };
  } catch (error) {
    return { success: false, error: `정수 검증 실패: ${error}` };
  }
}

/**
 * 양수 검증
 */
export function isPositive(value: any): Result<boolean> {
  try {
    if (typeof value !== 'number' || isNaN(value)) {
      return { success: true, data: false };
    }
    return { success: true, data: value > 0 };
  } catch (error) {
    return { success: false, error: `양수 검증 실패: ${error}` };
  }
}

/**
 * 음수 검증
 */
export function isNegative(value: any): Result<boolean> {
  try {
    if (typeof value !== 'number' || isNaN(value)) {
      return { success: true, data: false };
    }
    return { success: true, data: value < 0 };
  } catch (error) {
    return { success: false, error: `음수 검증 실패: ${error}` };
  }
}

/**
 * 0 이상 검증
 */
export function isNonNegative(value: any): Result<boolean> {
  try {
    if (typeof value !== 'number' || isNaN(value)) {
      return { success: true, data: false };
    }
    return { success: true, data: value >= 0 };
  } catch (error) {
    return { success: false, error: `0 이상 검증 실패: ${error}` };
  }
}

/**
 * 범위 내 숫자 검증
 */
export function isInRange(value: any, min: number, max: number): Result<boolean> {
  try {
    if (typeof value !== 'number' || isNaN(value)) {
      return { success: true, data: false };
    }
    
    if (min > max) {
      return { success: false, error: '최솟값이 최댓값보다 큽니다' };
    }
    
    return { success: true, data: value >= min && value <= max };
  } catch (error) {
    return { success: false, error: `범위 검증 실패: ${error}` };
  }
}

// ===== 날짜 검증 =====

/**
 * 유효한 날짜 검증
 */
export function isValidDate(value: any): Result<boolean> {
  try {
    if (!(value instanceof Date)) {
      return { success: true, data: false };
    }
    return { success: true, data: !isNaN(value.getTime()) };
  } catch (error) {
    return { success: false, error: `날짜 검증 실패: ${error}` };
  }
}

/**
 * 미래 날짜 검증
 */
export function isFutureDate(value: any): Result<boolean> {
  try {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      return { success: true, data: false };
    }
    
    const now = new Date();
    return { success: true, data: value.getTime() > now.getTime() };
  } catch (error) {
    return { success: false, error: `미래 날짜 검증 실패: ${error}` };
  }
}

/**
 * 과거 날짜 검증
 */
export function isPastDate(value: any): Result<boolean> {
  try {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      return { success: true, data: false };
    }
    
    const now = new Date();
    return { success: true, data: value.getTime() < now.getTime() };
  } catch (error) {
    return { success: false, error: `과거 날짜 검증 실패: ${error}` };
  }
}

/**
 * 날짜 범위 검증
 */
export function isDateInRange(value: any, startDate: Date, endDate: Date): Result<boolean> {
  try {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      return { success: true, data: false };
    }
    
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      return { success: false, error: '시작 날짜가 유효하지 않습니다' };
    }
    
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      return { success: false, error: '종료 날짜가 유효하지 않습니다' };
    }
    
    if (startDate.getTime() > endDate.getTime()) {
      return { success: false, error: '시작 날짜가 종료 날짜보다 늦습니다' };
    }
    
    const valueTime = value.getTime();
    return { success: true, data: valueTime >= startDate.getTime() && valueTime <= endDate.getTime() };
  } catch (error) {
    return { success: false, error: `날짜 범위 검증 실패: ${error}` };
  }
}

// ===== 배열 검증 =====

/**
 * 빈 배열 검증
 */
export function isEmptyArray(value: any): Result<boolean> {
  try {
    if (!Array.isArray(value)) {
      return { success: true, data: false };
    }
    return { success: true, data: value.length === 0 };
  } catch (error) {
    return { success: false, error: `빈 배열 검증 실패: ${error}` };
  }
}

/**
 * 배열 길이 검증
 */
export function isArrayLength(value: any, length: number): Result<boolean> {
  try {
    if (!Array.isArray(value)) {
      return { success: true, data: false };
    }
    
    if (length < 0) {
      return { success: false, error: '길이는 0 이상이어야 합니다' };
    }
    
    return { success: true, data: value.length === length };
  } catch (error) {
    return { success: false, error: `배열 길이 검증 실패: ${error}` };
  }
}

/**
 * 배열 최소 길이 검증
 */
export function isArrayMinLength(value: any, minLength: number): Result<boolean> {
  try {
    if (!Array.isArray(value)) {
      return { success: true, data: false };
    }
    
    if (minLength < 0) {
      return { success: false, error: '최소 길이는 0 이상이어야 합니다' };
    }
    
    return { success: true, data: value.length >= minLength };
  } catch (error) {
    return { success: false, error: `배열 최소 길이 검증 실패: ${error}` };
  }
}

/**
 * 배열 최대 길이 검증
 */
export function isArrayMaxLength(value: any, maxLength: number): Result<boolean> {
  try {
    if (!Array.isArray(value)) {
      return { success: true, data: false };
    }
    
    if (maxLength < 0) {
      return { success: false, error: '최대 길이는 0 이상이어야 합니다' };
    }
    
    return { success: true, data: value.length <= maxLength };
  } catch (error) {
    return { success: false, error: `배열 최대 길이 검증 실패: ${error}` };
  }
}

// ===== 문자열 길이 검증 =====

/**
 * 문자열 최소 길이 검증
 */
export function isMinLength(value: any, minLength: number): Result<boolean> {
  try {
    if (typeof value !== 'string') {
      return { success: true, data: false };
    }
    
    if (minLength < 0) {
      return { success: false, error: '최소 길이는 0 이상이어야 합니다' };
    }
    
    return { success: true, data: value.length >= minLength };
  } catch (error) {
    return { success: false, error: `최소 길이 검증 실패: ${error}` };
  }
}

/**
 * 문자열 최대 길이 검증
 */
export function isMaxLength(value: any, maxLength: number): Result<boolean> {
  try {
    if (typeof value !== 'string') {
      return { success: true, data: false };
    }
    
    if (maxLength < 0) {
      return { success: false, error: '최대 길이는 0 이상이어야 합니다' };
    }
    
    return { success: true, data: value.length <= maxLength };
  } catch (error) {
    return { success: false, error: `최대 길이 검증 실패: ${error}` };
  }
}

/**
 * 문자열 정확한 길이 검증
 */
export function isExactLength(value: any, length: number): Result<boolean> {
  try {
    if (typeof value !== 'string') {
      return { success: true, data: false };
    }
    
    if (length < 0) {
      return { success: false, error: '길이는 0 이상이어야 합니다' };
    }
    
    return { success: true, data: value.length === length };
  } catch (error) {
    return { success: false, error: `정확한 길이 검증 실패: ${error}` };
  }
}

// ===== 정규식 검증 =====

/**
 * 정규식 패턴 매치 검증
 */
export function isPattern(value: any, pattern: RegExp): Result<boolean> {
  try {
    if (typeof value !== 'string') {
      return { success: true, data: false };
    }
    
    if (!(pattern instanceof RegExp)) {
      return { success: false, error: '유효한 정규식이 아닙니다' };
    }
    
    return { success: true, data: pattern.test(value) };
  } catch (error) {
    return { success: false, error: `정규식 검증 실패: ${error}` };
  }
}

/**
 * 알파벳만 포함 검증
 */
export function isAlpha(value: any): Result<boolean> {
  try {
    if (typeof value !== 'string') {
      return { success: true, data: false };
    }
    
    const alphaRegex = /^[a-zA-Z]+$/;
    return { success: true, data: alphaRegex.test(value) };
  } catch (error) {
    return { success: false, error: `알파벳 검증 실패: ${error}` };
  }
}

/**
 * 숫자만 포함 검증
 */
export function isNumeric(value: any): Result<boolean> {
  try {
    if (typeof value !== 'string') {
      return { success: true, data: false };
    }
    
    const numericRegex = /^\d+$/;
    return { success: true, data: numericRegex.test(value) };
  } catch (error) {
    return { success: false, error: `숫자 문자열 검증 실패: ${error}` };
  }
}

/**
 * 알파벳과 숫자만 포함 검증
 */
export function isAlphaNumeric(value: any): Result<boolean> {
  try {
    if (typeof value !== 'string') {
      return { success: true, data: false };
    }
    
    const alphaNumericRegex = /^[a-zA-Z0-9]+$/;
    return { success: true, data: alphaNumericRegex.test(value) };
  } catch (error) {
    return { success: false, error: `알파뉴메릭 검증 실패: ${error}` };
  }
}

// ===== 복합 검증 =====

/**
 * 여러 검증 함수를 모두 통과하는지 확인
 */
export function validateAll(
  value: any,
  validators: Array<(value: any) => Result<boolean>>
): Result<boolean> {
  try {
    if (!Array.isArray(validators)) {
      return { success: false, error: '검증자 목록이 배열이 아닙니다' };
    }
    
    for (const validator of validators) {
      if (typeof validator !== 'function') {
        return { success: false, error: '검증자가 함수가 아닙니다' };
      }
      
      const result = validator(value);
      if (!result.success) {
        return result;
      }
      
      if (!result.data) {
        return { success: true, data: false };
      }
    }
    
    return { success: true, data: true };
  } catch (error) {
    return { success: false, error: `복합 검증 실패: ${error}` };
  }
}

/**
 * 여러 검증 함수 중 하나라도 통과하는지 확인
 */
export function validateAny(
  value: any,
  validators: Array<(value: any) => Result<boolean>>
): Result<boolean> {
  try {
    if (!Array.isArray(validators)) {
      return { success: false, error: '검증자 목록이 배열이 아닙니다' };
    }
    
    for (const validator of validators) {
      if (typeof validator !== 'function') {
        return { success: false, error: '검증자가 함수가 아닙니다' };
      }
      
      const result = validator(value);
      if (!result.success) {
        continue; // 에러는 무시하고 다음 검증자 시도
      }
      
      if (result.data) {
        return { success: true, data: true };
      }
    }
    
    return { success: true, data: false };
  } catch (error) {
    return { success: false, error: `복합 검증 실패: ${error}` };
  }
}