/**
 * @company/utils - 객체 처리 유틸리티
 */

import { Result as CoreResult } from '@company/core';

// Utils에서 사용할 Result 타입 (에러를 문자열로 처리)
export type Result<T> = CoreResult<T, string>;

// ===== 객체 검증 =====

/**
 * 빈 객체인지 확인
 */
export function isEmpty(obj: object): Result<boolean> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    return { success: true, data: Object.keys(obj).length === 0 };
  } catch (error) {
    return { success: false, error: `빈 객체 검증 실패: ${error}` };
  }
}

/**
 * 객체가 특정 키를 가지고 있는지 확인
 */
export function hasKey(obj: object, key: string | number | symbol): Result<boolean> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    return { success: true, data: key in obj };
  } catch (error) {
    return { success: false, error: `키 존재 검증 실패: ${error}` };
  }
}

/**
 * 객체가 특정 키들을 모두 가지고 있는지 확인
 */
export function hasKeys(obj: object, keys: (string | number | symbol)[]): Result<boolean> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    if (!Array.isArray(keys)) {
      return { success: false, error: '키 목록이 배열이 아닙니다' };
    }
    
    const hasAllKeys = keys.every(key => key in obj);
    return { success: true, data: hasAllKeys };
  } catch (error) {
    return { success: false, error: `다중 키 존재 검증 실패: ${error}` };
  }
}

// ===== 객체 조작 =====

/**
 * 깊은 복사
 */
export function deepClone<T>(obj: T): Result<T> {
  try {
    if (obj === null || typeof obj !== 'object') {
      return { success: true, data: obj };
    }
    
    if (obj instanceof Date) {
      return { success: true, data: new Date(obj.getTime()) as unknown as T };
    }
    
    if (obj instanceof Array) {
      const clonedArray = obj.map(item => {
        const cloneResult = deepClone(item);
        return cloneResult.success ? cloneResult.data : item;
      });
      return { success: true, data: clonedArray as unknown as T };
    }
    
    if (typeof obj === 'object') {
      const clonedObj = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const cloneResult = deepClone(obj[key]);
          (clonedObj as any)[key] = cloneResult.success ? cloneResult.data : obj[key];
        }
      }
      return { success: true, data: clonedObj };
    }
    
    return { success: true, data: obj };
  } catch (error) {
    return { success: false, error: `깊은 복사 실패: ${error}` };
  }
}

/**
 * 얕은 복사
 */
export function shallowClone<T extends object>(obj: T): Result<T> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    const cloned = { ...obj };
    return { success: true, data: cloned };
  } catch (error) {
    return { success: false, error: `얕은 복사 실패: ${error}` };
  }
}

/**
 * 객체 병합 (얕은 병합)
 */
export function merge<T extends object, U extends object>(target: T, source: U): Result<T & U> {
  try {
    if (typeof target !== 'object' || target === null) {
      return { success: false, error: '대상 객체가 유효하지 않습니다' };
    }
    
    if (typeof source !== 'object' || source === null) {
      return { success: false, error: '소스 객체가 유효하지 않습니다' };
    }
    
    const merged = { ...target, ...source };
    return { success: true, data: merged };
  } catch (error) {
    return { success: false, error: `객체 병합 실패: ${error}` };
  }
}

/**
 * 깊은 병합
 */
export function deepMerge<T extends object, U extends object>(target: T, source: U): Result<T & U> {
  try {
    if (typeof target !== 'object' || target === null) {
      return { success: false, error: '대상 객체가 유효하지 않습니다' };
    }
    
    if (typeof source !== 'object' || source === null) {
      return { success: false, error: '소스 객체가 유효하지 않습니다' };
    }
    
    const result = { ...target } as any;
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = result[key];
        
        if (
          typeof sourceValue === 'object' &&
          sourceValue !== null &&
          !Array.isArray(sourceValue) &&
          typeof targetValue === 'object' &&
          targetValue !== null &&
          !Array.isArray(targetValue)
        ) {
          const mergeResult = deepMerge(targetValue, sourceValue);
          result[key] = mergeResult.success ? mergeResult.data : sourceValue;
        } else {
          result[key] = sourceValue;
        }
      }
    }
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: `깊은 병합 실패: ${error}` };
  }
}

// ===== 객체 변환 =====

/**
 * 객체의 키-값 쌍을 배열로 변환
 */
export function toPairs<T>(obj: Record<string, T>): Result<[string, T][]> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    const pairs = Object.entries(obj);
    return { success: true, data: pairs };
  } catch (error) {
    return { success: false, error: `키-값 쌍 변환 실패: ${error}` };
  }
}

/**
 * 키-값 쌍 배열을 객체로 변환
 */
export function fromPairs<T>(pairs: [string, T][]): Result<Record<string, T>> {
  try {
    if (!Array.isArray(pairs)) {
      return { success: false, error: '입력값이 배열이 아닙니다' };
    }
    
    const obj: Record<string, T> = {};
    
    for (const pair of pairs) {
      if (!Array.isArray(pair) || pair.length !== 2) {
        return { success: false, error: '유효하지 않은 키-값 쌍입니다' };
      }
      
      const [key, value] = pair;
      if (typeof key !== 'string') {
        return { success: false, error: '키는 문자열이어야 합니다' };
      }
      
      obj[key] = value;
    }
    
    return { success: true, data: obj };
  } catch (error) {
    return { success: false, error: `객체 변환 실패: ${error}` };
  }
}

/**
 * 객체의 키만 추출
 */
export function keys<T extends object>(obj: T): Result<(keyof T)[]> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    const objectKeys = Object.keys(obj) as (keyof T)[];
    return { success: true, data: objectKeys };
  } catch (error) {
    return { success: false, error: `키 추출 실패: ${error}` };
  }
}

/**
 * 객체의 값만 추출
 */
export function values<T>(obj: Record<string, T>): Result<T[]> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    const objectValues = Object.values(obj);
    return { success: true, data: objectValues };
  } catch (error) {
    return { success: false, error: `값 추출 실패: ${error}` };
  }
}

// ===== 객체 필터링 =====

/**
 * 특정 키들만 선택
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Result<Pick<T, K>> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    if (!Array.isArray(keys)) {
      return { success: false, error: '키 목록이 배열이 아닙니다' };
    }
    
    const picked = {} as Pick<T, K>;
    
    for (const key of keys) {
      if (key in obj) {
        picked[key] = obj[key];
      }
    }
    
    return { success: true, data: picked };
  } catch (error) {
    return { success: false, error: `키 선택 실패: ${error}` };
  }
}

/**
 * 특정 키들 제외
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Result<Omit<T, K>> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    if (!Array.isArray(keys)) {
      return { success: false, error: '키 목록이 배열이 아닙니다' };
    }
    
    const keySet = new Set(keys);
    const omitted = {} as Omit<T, K>;
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && !keySet.has(key as any)) {
        (omitted as any)[key] = obj[key];
      }
    }
    
    return { success: true, data: omitted };
  } catch (error) {
    return { success: false, error: `키 제외 실패: ${error}` };
  }
}

/**
 * null과 undefined 값 제거
 */
export function compact<T extends Record<string, any>>(obj: T): Result<Partial<T>> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    const compacted: Partial<T> = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && obj[key] != null) {
        compacted[key] = obj[key];
      }
    }
    
    return { success: true, data: compacted };
  } catch (error) {
    return { success: false, error: `null/undefined 제거 실패: ${error}` };
  }
}

/**
 * falsy 값 제거
 */
export function removeFalsy<T extends Record<string, any>>(obj: T): Result<Partial<T>> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    const filtered: Partial<T> = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && obj[key]) {
        filtered[key] = obj[key];
      }
    }
    
    return { success: true, data: filtered };
  } catch (error) {
    return { success: false, error: `falsy 값 제거 실패: ${error}` };
  }
}

// ===== 객체 변형 =====

/**
 * 객체의 키를 변환
 */
export function mapKeys<T>(
  obj: Record<string, T>,
  transform: (key: string) => string
): Result<Record<string, T>> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    if (typeof transform !== 'function') {
      return { success: false, error: '변환 함수가 유효하지 않습니다' };
    }
    
    const mapped: Record<string, T> = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = transform(key);
        mapped[newKey] = obj[key];
      }
    }
    
    return { success: true, data: mapped };
  } catch (error) {
    return { success: false, error: `키 변환 실패: ${error}` };
  }
}

/**
 * 객체의 값을 변환
 */
export function mapValues<T, U>(
  obj: Record<string, T>,
  transform: (value: T, key: string) => U
): Result<Record<string, U>> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    if (typeof transform !== 'function') {
      return { success: false, error: '변환 함수가 유효하지 않습니다' };
    }
    
    const mapped: Record<string, U> = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        mapped[key] = transform(obj[key], key);
      }
    }
    
    return { success: true, data: mapped };
  } catch (error) {
    return { success: false, error: `값 변환 실패: ${error}` };
  }
}

/**
 * 객체 키-값 반전
 */
export function invert(obj: Record<string, string | number>): Result<Record<string, string>> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    const inverted: Record<string, string> = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        inverted[String(value)] = key;
      }
    }
    
    return { success: true, data: inverted };
  } catch (error) {
    return { success: false, error: `키-값 반전 실패: ${error}` };
  }
}

// ===== 중첩 객체 처리 =====

/**
 * 점 표기법으로 중첩된 값 가져오기
 */
export function get<T>(obj: any, path: string, defaultValue?: T): Result<T> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    if (typeof path !== 'string') {
      return { success: false, error: '경로가 문자열이 아닙니다' };
    }
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return { success: true, data: defaultValue as T };
      }
      
      if (typeof current !== 'object') {
        return { success: true, data: defaultValue as T };
      }
      
      current = current[key];
    }
    
    return { success: true, data: current !== undefined ? current : defaultValue };
  } catch (error) {
    return { success: false, error: `중첩 값 접근 실패: ${error}` };
  }
}

/**
 * 점 표기법으로 중첩된 값 설정
 */
export function set<T extends object>(obj: T, path: string, value: any): Result<T> {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return { success: false, error: '입력값이 객체가 아닙니다' };
    }
    
    if (typeof path !== 'string') {
      return { success: false, error: '경로가 문자열이 아닙니다' };
    }
    
    const keys = path.split('.');
    const clonedObj = { ...obj } as any;
    let current = clonedObj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      
      current = current[key];
    }
    
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
    
    return { success: true, data: clonedObj };
  } catch (error) {
    return { success: false, error: `중첩 값 설정 실패: ${error}` };
  }
}

/**
 * 객체가 다른 객체의 하위집합인지 확인
 */
export function isSubset<T extends object>(subset: Partial<T>, superset: T): Result<boolean> {
  try {
    if (typeof subset !== 'object' || subset === null) {
      return { success: false, error: '부분집합이 객체가 아닙니다' };
    }
    
    if (typeof superset !== 'object' || superset === null) {
      return { success: false, error: '전체집합이 객체가 아닙니다' };
    }
    
    for (const key in subset) {
      if (subset.hasOwnProperty(key)) {
        if (!(key in superset) || subset[key] !== superset[key]) {
          return { success: true, data: false };
        }
      }
    }
    
    return { success: true, data: true };
  } catch (error) {
    return { success: false, error: `부분집합 검사 실패: ${error}` };
  }
}