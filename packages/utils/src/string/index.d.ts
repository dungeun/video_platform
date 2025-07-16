/**
 * @company/utils - 문자열 처리 유틸리티
 */
import { Result as CoreResult } from '@company/core';
export type Result<T> = CoreResult<T, string>;
/**
 * 카멜케이스로 변환
 */
export declare function toCamelCase(str: string): Result<string>;
/**
 * 파스칼케이스로 변환
 */
export declare function toPascalCase(str: string): Result<string>;
/**
 * 스네이크케이스로 변환
 */
export declare function toSnakeCase(str: string): Result<string>;
/**
 * 케밥케이스로 변환
 */
export declare function toKebabCase(str: string): Result<string>;
/**
 * 타이틀케이스로 변환
 */
export declare function toTitleCase(str: string): Result<string>;
/**
 * 빈 문자열인지 확인
 */
export declare function isEmpty(str: string): Result<boolean>;
/**
 * 공백만 포함된 문자열인지 확인
 */
export declare function isBlank(str: string): Result<boolean>;
/**
 * 숫자로만 이루어진 문자열인지 확인
 */
export declare function isNumeric(str: string): Result<boolean>;
/**
 * 알파벳으로만 이루어진 문자열인지 확인
 */
export declare function isAlpha(str: string): Result<boolean>;
/**
 * 알파벳과 숫자로만 이루어진 문자열인지 확인
 */
export declare function isAlphaNumeric(str: string): Result<boolean>;
/**
 * 유효한 이메일 형식인지 확인
 */
export declare function isEmail(str: string): Result<boolean>;
/**
 * 유효한 URL 형식인지 확인
 */
export declare function isUrl(str: string): Result<boolean>;
/**
 * 문자열 자르기 (말줄임표 추가)
 */
export declare function truncate(str: string, maxLength: number, suffix?: string): Result<string>;
/**
 * 문자열 패딩 (좌측)
 */
export declare function padLeft(str: string, length: number, padChar?: string): Result<string>;
/**
 * 문자열 패딩 (우측)
 */
export declare function padRight(str: string, length: number, padChar?: string): Result<string>;
/**
 * 문자열 뒤집기
 */
export declare function reverse(str: string): Result<string>;
/**
 * 특정 문자/문자열 개수 세기
 */
export declare function countOccurrences(str: string, searchStr: string): Result<number>;
/**
 * 문자열 포함 여부 확인 (대소문자 무시)
 */
export declare function containsIgnoreCase(str: string, searchStr: string): Result<boolean>;
/**
 * 문자열 시작 여부 확인 (대소문자 무시)
 */
export declare function startsWithIgnoreCase(str: string, searchStr: string): Result<boolean>;
/**
 * 문자열 끝 여부 확인 (대소문자 무시)
 */
export declare function endsWithIgnoreCase(str: string, searchStr: string): Result<boolean>;
/**
 * 모든 문자열 치환
 */
export declare function replaceAll(str: string, searchStr: string, replaceStr: string): Result<string>;
/**
 * HTML 엔티티 이스케이프
 */
export declare function escapeHtml(str: string): Result<string>;
/**
 * HTML 엔티티 언이스케이프
 */
export declare function unescapeHtml(str: string): Result<string>;
/**
 * 정규식 특수문자 이스케이프
 */
export declare function escapeRegex(str: string): Result<string>;
/**
 * 랜덤 문자열 생성
 */
export declare function generateRandomString(length?: number, charset?: string): Result<string>;
/**
 * 슬러그 생성 (URL-friendly 문자열)
 */
export declare function generateSlug(str: string): Result<string>;
//# sourceMappingURL=index.d.ts.map