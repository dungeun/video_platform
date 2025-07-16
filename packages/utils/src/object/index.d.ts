/**
 * @repo/utils - 객체 처리 유틸리티
 */
import { Result as CoreResult } from '@repo/core';
export type Result<T> = CoreResult<T, string>;
/**
 * 빈 객체인지 확인
 */
export declare function isEmpty(obj: object): Result<boolean>;
/**
 * 객체가 특정 키를 가지고 있는지 확인
 */
export declare function hasKey(obj: object, key: string | number | symbol): Result<boolean>;
/**
 * 객체가 특정 키들을 모두 가지고 있는지 확인
 */
export declare function hasKeys(obj: object, keys: (string | number | symbol)[]): Result<boolean>;
/**
 * 깊은 복사
 */
export declare function deepClone<T>(obj: T): Result<T>;
/**
 * 얕은 복사
 */
export declare function shallowClone<T extends object>(obj: T): Result<T>;
/**
 * 객체 병합 (얕은 병합)
 */
export declare function merge<T extends object, U extends object>(target: T, source: U): Result<T & U>;
/**
 * 깊은 병합
 */
export declare function deepMerge<T extends object, U extends object>(target: T, source: U): Result<T & U>;
/**
 * 객체의 키-값 쌍을 배열로 변환
 */
export declare function toPairs<T>(obj: Record<string, T>): Result<[string, T][]>;
/**
 * 키-값 쌍 배열을 객체로 변환
 */
export declare function fromPairs<T>(pairs: [string, T][]): Result<Record<string, T>>;
/**
 * 객체의 키만 추출
 */
export declare function keys<T extends object>(obj: T): Result<(keyof T)[]>;
/**
 * 객체의 값만 추출
 */
export declare function values<T>(obj: Record<string, T>): Result<T[]>;
/**
 * 특정 키들만 선택
 */
export declare function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Result<Pick<T, K>>;
/**
 * 특정 키들 제외
 */
export declare function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Result<Omit<T, K>>;
/**
 * null과 undefined 값 제거
 */
export declare function compact<T extends Record<string, any>>(obj: T): Result<Partial<T>>;
/**
 * falsy 값 제거
 */
export declare function removeFalsy<T extends Record<string, any>>(obj: T): Result<Partial<T>>;
/**
 * 객체의 키를 변환
 */
export declare function mapKeys<T>(obj: Record<string, T>, transform: (key: string) => string): Result<Record<string, T>>;
/**
 * 객체의 값을 변환
 */
export declare function mapValues<T, U>(obj: Record<string, T>, transform: (value: T, key: string) => U): Result<Record<string, U>>;
/**
 * 객체 키-값 반전
 */
export declare function invert(obj: Record<string, string | number>): Result<Record<string, string>>;
/**
 * 점 표기법으로 중첩된 값 가져오기
 */
export declare function get<T>(obj: any, path: string, defaultValue?: T): Result<T>;
/**
 * 점 표기법으로 중첩된 값 설정
 */
export declare function set<T extends object>(obj: T, path: string, value: any): Result<T>;
/**
 * 객체가 다른 객체의 하위집합인지 확인
 */
export declare function isSubset<T extends object>(subset: Partial<T>, superset: T): Result<boolean>;
//# sourceMappingURL=index.d.ts.map