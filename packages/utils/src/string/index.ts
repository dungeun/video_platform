/**
 * @repo/utils - 문자열 처리 유틸리티
 */

import { Result as CoreResult } from '@repo/core';

// Utils에서 사용할 Result 타입 (에러를 문자열로 처리)
export type Result<T> = CoreResult<T, string>;

// ===== 문자열 변환 =====

/**
 * 카멜케이스로 변환
 */
export function toCamelCase(str: string): Result<string> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    const camelCase = str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
    
    return { success: true, data: camelCase };
  } catch (error) {
    return { success: false, error: `카멜케이스 변환 실패: ${error}` };
  }
}

/**
 * 파스칼케이스로 변환
 */
export function toPascalCase(str: string): Result<string> {
  try {
    const camelResult = toCamelCase(str);
    if (!camelResult.success) {
      return camelResult;
    }
    
    const pascalCase = camelResult.data!.charAt(0).toUpperCase() + camelResult.data!.slice(1);
    return { success: true, data: pascalCase };
  } catch (error) {
    return { success: false, error: `파스칼케이스 변환 실패: ${error}` };
  }
}

/**
 * 스네이크케이스로 변환
 */
export function toSnakeCase(str: string): Result<string> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    const snakeCase = str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    
    return { success: true, data: snakeCase };
  } catch (error) {
    return { success: false, error: `스네이크케이스 변환 실패: ${error}` };
  }
}

/**
 * 케밥케이스로 변환
 */
export function toKebabCase(str: string): Result<string> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    const kebabCase = str
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return { success: true, data: kebabCase };
  } catch (error) {
    return { success: false, error: `케밥케이스 변환 실패: ${error}` };
  }
}

/**
 * 타이틀케이스로 변환
 */
export function toTitleCase(str: string): Result<string> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    const titleCase = str
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
    
    return { success: true, data: titleCase };
  } catch (error) {
    return { success: false, error: `타이틀케이스 변환 실패: ${error}` };
  }
}

// ===== 문자열 검증 =====

/**
 * 빈 문자열인지 확인
 */
export function isEmpty(str: string): Result<boolean> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    return { success: true, data: str.length === 0 };
  } catch (error) {
    return { success: false, error: `빈 문자열 검증 실패: ${error}` };
  }
}

/**
 * 공백만 포함된 문자열인지 확인
 */
export function isBlank(str: string): Result<boolean> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    return { success: true, data: str.trim().length === 0 };
  } catch (error) {
    return { success: false, error: `공백 문자열 검증 실패: ${error}` };
  }
}

/**
 * 숫자로만 이루어진 문자열인지 확인
 */
export function isNumeric(str: string): Result<boolean> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    return { success: true, data: /^\d+$/.test(str) };
  } catch (error) {
    return { success: false, error: `숫자 문자열 검증 실패: ${error}` };
  }
}

/**
 * 알파벳으로만 이루어진 문자열인지 확인
 */
export function isAlpha(str: string): Result<boolean> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    return { success: true, data: /^[a-zA-Z]+$/.test(str) };
  } catch (error) {
    return { success: false, error: `알파벳 문자열 검증 실패: ${error}` };
  }
}

/**
 * 알파벳과 숫자로만 이루어진 문자열인지 확인
 */
export function isAlphaNumeric(str: string): Result<boolean> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    return { success: true, data: /^[a-zA-Z0-9]+$/.test(str) };
  } catch (error) {
    return { success: false, error: `알파뉴메릭 문자열 검증 실패: ${error}` };
  }
}

/**
 * 유효한 이메일 형식인지 확인
 */
export function isEmail(str: string): Result<boolean> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return { success: true, data: emailRegex.test(str) };
  } catch (error) {
    return { success: false, error: `이메일 검증 실패: ${error}` };
  }
}

/**
 * 유효한 URL 형식인지 확인
 */
export function isUrl(str: string): Result<boolean> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    try {
      new URL(str);
      return { success: true, data: true };
    } catch {
      return { success: true, data: false };
    }
  } catch (error) {
    return { success: false, error: `URL 검증 실패: ${error}` };
  }
}

// ===== 문자열 조작 =====

/**
 * 문자열 자르기 (말줄임표 추가)
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): Result<string> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    if (maxLength < 0) {
      return { success: false, error: '최대 길이는 0 이상이어야 합니다' };
    }
    
    if (str.length <= maxLength) {
      return { success: true, data: str };
    }
    
    const truncated = str.slice(0, maxLength - suffix.length) + suffix;
    return { success: true, data: truncated };
  } catch (error) {
    return { success: false, error: `문자열 자르기 실패: ${error}` };
  }
}

/**
 * 문자열 패딩 (좌측)
 */
export function padLeft(str: string, length: number, padChar: string = ' '): Result<string> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    if (length < 0) {
      return { success: false, error: '길이는 0 이상이어야 합니다' };
    }
    
    if (str.length >= length) {
      return { success: true, data: str };
    }
    
    const padLength = length - str.length;
    const padding = padChar.repeat(Math.ceil(padLength / padChar.length)).slice(0, padLength);
    
    return { success: true, data: padding + str };
  } catch (error) {
    return { success: false, error: `좌측 패딩 실패: ${error}` };
  }
}

/**
 * 문자열 패딩 (우측)
 */
export function padRight(str: string, length: number, padChar: string = ' '): Result<string> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    if (length < 0) {
      return { success: false, error: '길이는 0 이상이어야 합니다' };
    }
    
    if (str.length >= length) {
      return { success: true, data: str };
    }
    
    const padLength = length - str.length;
    const padding = padChar.repeat(Math.ceil(padLength / padChar.length)).slice(0, padLength);
    
    return { success: true, data: str + padding };
  } catch (error) {
    return { success: false, error: `우측 패딩 실패: ${error}` };
  }
}

/**
 * 문자열 뒤집기
 */
export function reverse(str: string): Result<string> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    const reversed = str.split('').reverse().join('');
    return { success: true, data: reversed };
  } catch (error) {
    return { success: false, error: `문자열 뒤집기 실패: ${error}` };
  }
}

/**
 * 특정 문자/문자열 개수 세기
 */
export function countOccurrences(str: string, searchStr: string): Result<number> {
  try {
    if (typeof str !== 'string' || typeof searchStr !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    if (searchStr.length === 0) {
      return { success: true, data: 0 };
    }
    
    const count = (str.match(new RegExp(searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    return { success: true, data: count };
  } catch (error) {
    return { success: false, error: `문자열 개수 세기 실패: ${error}` };
  }
}

// ===== 문자열 검색/치환 =====

/**
 * 문자열 포함 여부 확인 (대소문자 무시)
 */
export function containsIgnoreCase(str: string, searchStr: string): Result<boolean> {
  try {
    if (typeof str !== 'string' || typeof searchStr !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    const contains = str.toLowerCase().includes(searchStr.toLowerCase());
    return { success: true, data: contains };
  } catch (error) {
    return { success: false, error: `문자열 검색 실패: ${error}` };
  }
}

/**
 * 문자열 시작 여부 확인 (대소문자 무시)
 */
export function startsWithIgnoreCase(str: string, searchStr: string): Result<boolean> {
  try {
    if (typeof str !== 'string' || typeof searchStr !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    const startsWith = str.toLowerCase().startsWith(searchStr.toLowerCase());
    return { success: true, data: startsWith };
  } catch (error) {
    return { success: false, error: `문자열 시작 검사 실패: ${error}` };
  }
}

/**
 * 문자열 끝 여부 확인 (대소문자 무시)
 */
export function endsWithIgnoreCase(str: string, searchStr: string): Result<boolean> {
  try {
    if (typeof str !== 'string' || typeof searchStr !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    const endsWith = str.toLowerCase().endsWith(searchStr.toLowerCase());
    return { success: true, data: endsWith };
  } catch (error) {
    return { success: false, error: `문자열 끝 검사 실패: ${error}` };
  }
}

/**
 * 모든 문자열 치환
 */
export function replaceAll(str: string, searchStr: string, replaceStr: string): Result<string> {
  try {
    if (typeof str !== 'string' || typeof searchStr !== 'string' || typeof replaceStr !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    if (searchStr.length === 0) {
      return { success: true, data: str };
    }
    
    const replaced = str.split(searchStr).join(replaceStr);
    return { success: true, data: replaced };
  } catch (error) {
    return { success: false, error: `문자열 치환 실패: ${error}` };
  }
}

// ===== 특수 문자열 처리 =====

/**
 * HTML 엔티티 이스케이프
 */
export function escapeHtml(str: string): Result<string> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    const entityMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;'
    };
    
    const escaped = str.replace(/[&<>"'\/]/g, (char) => entityMap[char]);
    return { success: true, data: escaped };
  } catch (error) {
    return { success: false, error: `HTML 이스케이프 실패: ${error}` };
  }
}

/**
 * HTML 엔티티 언이스케이프
 */
export function unescapeHtml(str: string): Result<string> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    const entityMap: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x2F;': '/'
    };
    
    const unescaped = str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x2F;/g, (entity) => entityMap[entity]);
    return { success: true, data: unescaped };
  } catch (error) {
    return { success: false, error: `HTML 언이스케이프 실패: ${error}` };
  }
}

/**
 * 정규식 특수문자 이스케이프
 */
export function escapeRegex(str: string): Result<string> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return { success: true, data: escaped };
  } catch (error) {
    return { success: false, error: `정규식 이스케이프 실패: ${error}` };
  }
}

// ===== 문자열 생성 =====

/**
 * 랜덤 문자열 생성
 */
export function generateRandomString(
  length: number = 10,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): Result<string> {
  try {
    if (length < 0) {
      return { success: false, error: '길이는 0 이상이어야 합니다' };
    }
    
    if (charset.length === 0) {
      return { success: false, error: '문자셋이 비어있습니다' };
    }
    
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      result += charset[randomIndex];
    }
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: `랜덤 문자열 생성 실패: ${error}` };
  }
}

/**
 * 슬러그 생성 (URL-friendly 문자열)
 */
export function generateSlug(str: string): Result<string> {
  try {
    if (typeof str !== 'string') {
      return { success: false, error: '입력값이 문자열이 아닙니다' };
    }
    
    const slug = str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // 특수문자 제거
      .replace(/[\s_-]+/g, '-') // 공백과 언더스코어를 하이픈으로
      .replace(/^-+|-+$/g, ''); // 앞뒤 하이픈 제거
    
    return { success: true, data: slug };
  } catch (error) {
    return { success: false, error: `슬러그 생성 실패: ${error}` };
  }
}