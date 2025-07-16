/**
 * @company/utils - 검증 유틸리티
 */
import { Result as CoreResult } from '@company/core';
export type Result<T> = CoreResult<T, string>;
/**
 * 문자열 검증
 */
export declare function isString(value: any): Result<boolean>;
/**
 * 숫자 검증
 */
export declare function isNumber(value: any): Result<boolean>;
/**
 * 불린 검증
 */
export declare function isBoolean(value: any): Result<boolean>;
/**
 * 객체 검증
 */
export declare function isObject(value: any): Result<boolean>;
/**
 * 배열 검증
 */
export declare function isArray(value: any): Result<boolean>;
/**
 * 함수 검증
 */
export declare function isFunction(value: any): Result<boolean>;
/**
 * null/undefined 검증
 */
export declare function isNull(value: any): Result<boolean>;
/**
 * 빈 문자열 검증
 */
export declare function isEmptyString(value: any): Result<boolean>;
/**
 * 공백 문자열 검증
 */
export declare function isBlankString(value: any): Result<boolean>;
/**
 * 이메일 형식 검증
 */
export declare function isEmail(value: any): Result<boolean>;
/**
 * URL 형식 검증
 */
export declare function isUrl(value: any): Result<boolean>;
/**
 * UUID 형식 검증
 */
export declare function isUuid(value: any): Result<boolean>;
/**
 * 전화번호 형식 검증 (한국)
 */
export declare function isKoreanPhoneNumber(value: any): Result<boolean>;
/**
 * 주민등록번호 형식 검증
 */
export declare function isKoreanSSN(value: any): Result<boolean>;
/**
 * 정수 검증
 */
export declare function isInteger(value: any): Result<boolean>;
/**
 * 양수 검증
 */
export declare function isPositive(value: any): Result<boolean>;
/**
 * 음수 검증
 */
export declare function isNegative(value: any): Result<boolean>;
/**
 * 0 이상 검증
 */
export declare function isNonNegative(value: any): Result<boolean>;
/**
 * 범위 내 숫자 검증
 */
export declare function isInRange(value: any, min: number, max: number): Result<boolean>;
/**
 * 유효한 날짜 검증
 */
export declare function isValidDate(value: any): Result<boolean>;
/**
 * 미래 날짜 검증
 */
export declare function isFutureDate(value: any): Result<boolean>;
/**
 * 과거 날짜 검증
 */
export declare function isPastDate(value: any): Result<boolean>;
/**
 * 날짜 범위 검증
 */
export declare function isDateInRange(value: any, startDate: Date, endDate: Date): Result<boolean>;
/**
 * 빈 배열 검증
 */
export declare function isEmptyArray(value: any): Result<boolean>;
/**
 * 배열 길이 검증
 */
export declare function isArrayLength(value: any, length: number): Result<boolean>;
/**
 * 배열 최소 길이 검증
 */
export declare function isArrayMinLength(value: any, minLength: number): Result<boolean>;
/**
 * 배열 최대 길이 검증
 */
export declare function isArrayMaxLength(value: any, maxLength: number): Result<boolean>;
/**
 * 문자열 최소 길이 검증
 */
export declare function isMinLength(value: any, minLength: number): Result<boolean>;
/**
 * 문자열 최대 길이 검증
 */
export declare function isMaxLength(value: any, maxLength: number): Result<boolean>;
/**
 * 문자열 정확한 길이 검증
 */
export declare function isExactLength(value: any, length: number): Result<boolean>;
/**
 * 정규식 패턴 매치 검증
 */
export declare function isPattern(value: any, pattern: RegExp): Result<boolean>;
/**
 * 알파벳만 포함 검증
 */
export declare function isAlpha(value: any): Result<boolean>;
/**
 * 숫자만 포함 검증
 */
export declare function isNumeric(value: any): Result<boolean>;
/**
 * 알파벳과 숫자만 포함 검증
 */
export declare function isAlphaNumeric(value: any): Result<boolean>;
/**
 * 여러 검증 함수를 모두 통과하는지 확인
 */
export declare function validateAll(value: any, validators: Array<(value: any) => Result<boolean>>): Result<boolean>;
/**
 * 여러 검증 함수 중 하나라도 통과하는지 확인
 */
export declare function validateAny(value: any, validators: Array<(value: any) => Result<boolean>>): Result<boolean>;
//# sourceMappingURL=index.d.ts.map