/**
 * @repo/types - Enterprise AI Module System Types
 *
 * 모든 엔터프라이즈 모듈에서 사용하는 공통 타입 정의
 *
 * @version 1.0.0
 * @author Enterprise AI Team
 */
export * from './common';
export * from './auth';
export * from './business';
export * from './ui';
export * from './schemas';
/**
 * 값이 null 또는 undefined가 아닌지 확인
 */
export declare function isNotNull<T>(value: T | null | undefined): value is T;
/**
 * 값이 문자열인지 확인
 */
export declare function isString(value: any): value is string;
/**
 * 값이 숫자인지 확인
 */
export declare function isNumber(value: any): value is number;
/**
 * 값이 불린인지 확인
 */
export declare function isBoolean(value: any): value is boolean;
/**
 * 값이 객체인지 확인 (null 제외)
 */
export declare function isObject(value: any): value is Record<string, any>;
/**
 * 값이 배열인지 확인
 */
export declare function isArray<T>(value: any): value is T[];
/**
 * 값이 함수인지 확인
 */
export declare function isFunction(value: any): value is Function;
/**
 * 값이 Date 객체인지 확인
 */
export declare function isDate(value: any): value is Date;
/**
 * 값이 유효한 이메일 형식인지 확인
 */
export declare function isEmail(value: any): value is string;
/**
 * 값이 유효한 URL 형식인지 확인
 */
export declare function isUrl(value: any): value is string;
/**
 * 값이 유효한 UUID 형식인지 확인
 */
export declare function isUuid(value: any): value is string;
/**
 * 값이 빈 문자열이 아닌지 확인
 */
export declare function isNotEmptyString(value: any): value is string;
/**
 * 값이 양수인지 확인
 */
export declare function isPositiveNumber(value: any): value is number;
/**
 * 값이 0 이상의 수인지 확인
 */
export declare function isNonNegativeNumber(value: any): value is number;
/**
 * 값이 정수인지 확인
 */
export declare function isInteger(value: any): value is number;
/**
 * 객체가 특정 키를 가지고 있는지 확인
 */
export declare function hasProperty<T extends object, K extends string>(obj: T, key: K): obj is T & Record<K, any>;
/**
 * 값이 특정 타입의 배열인지 확인
 */
export declare function isArrayOf<T>(value: any, typeGuard: (item: any) => item is T): value is T[];
/**
 * 값을 안전하게 문자열로 변환
 */
export declare function toString(value: any): string;
/**
 * 값을 안전하게 숫자로 변환
 */
export declare function toNumber(value: any): number | null;
/**
 * 값을 안전하게 불린으로 변환
 */
export declare function toBoolean(value: any): boolean;
/**
 * 값을 안전하게 Date로 변환
 */
export declare function toDate(value: any): Date | null;
/**
 * 깊은 복사 (JSON 기반)
 */
export declare function deepClone<T>(obj: T): T;
/**
 * 객체에서 null/undefined 값 제거
 */
export declare function removeNullish<T extends Record<string, any>>(obj: T): Partial<T>;
/**
 * 객체에서 빈 값 제거 (null, undefined, 빈 문자열, 빈 배열, 빈 객체)
 */
export declare function removeEmpty<T extends Record<string, any>>(obj: T): Partial<T>;
export declare const TYPES_MODULE_INFO: {
    readonly name: "@repo/types";
    readonly version: "1.0.0";
    readonly description: "Enterprise AI Module System - Common Types";
    readonly author: "Enterprise AI Team";
    readonly license: "MIT";
};
//# sourceMappingURL=index.d.ts.map