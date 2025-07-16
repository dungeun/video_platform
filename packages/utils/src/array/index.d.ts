/**
 * @repo/utils - 배열 처리 유틸리티
 */
import { Result as CoreResult } from '@repo/core';
export type Result<T> = CoreResult<T, string>;
/**
 * 빈 배열인지 확인
 */
export declare function isEmpty<T>(arr: T[]): Result<boolean>;
/**
 * 배열에 중복 요소가 있는지 확인
 */
export declare function hasDuplicates<T>(arr: T[]): Result<boolean>;
/**
 * 배열에서 중복 제거
 */
export declare function removeDuplicates<T>(arr: T[]): Result<T[]>;
/**
 * 배열 섞기 (Fisher-Yates 알고리즘)
 */
export declare function shuffle<T>(arr: T[]): Result<T[]>;
/**
 * 배열 청크 분할
 */
export declare function chunk<T>(arr: T[], size: number): Result<T[][]>;
/**
 * 배열 평탄화
 */
export declare function flatten<T>(arr: (T | T[])[]): Result<T[]>;
/**
 * 깊은 배열 평탄화
 */
export declare function deepFlatten(arr: any[]): Result<any[]>;
/**
 * 배열 회전 (왼쪽으로)
 */
export declare function rotateLeft<T>(arr: T[], positions?: number): Result<T[]>;
/**
 * 배열 회전 (오른쪽으로)
 */
export declare function rotateRight<T>(arr: T[], positions?: number): Result<T[]>;
/**
 * 조건에 맞는 첫 번째 요소의 인덱스 찾기
 */
export declare function findIndex<T>(arr: T[], predicate: (item: T, index: number) => boolean): Result<number>;
/**
 * 조건에 맞는 마지막 요소의 인덱스 찾기
 */
export declare function findLastIndex<T>(arr: T[], predicate: (item: T, index: number) => boolean): Result<number>;
/**
 * 특정 값의 모든 인덱스 찾기
 */
export declare function findAllIndexes<T>(arr: T[], value: T): Result<number[]>;
/**
 * null과 undefined 제거
 */
export declare function compact<T>(arr: (T | null | undefined)[]): Result<T[]>;
/**
 * falsy 값 제거
 */
export declare function removeFalsy<T>(arr: T[]): Result<T[]>;
/**
 * 특정 값들 제거
 */
export declare function removeValues<T>(arr: T[], ...values: T[]): Result<T[]>;
/**
 * 두 배열의 교집합
 */
export declare function intersection<T>(arr1: T[], arr2: T[]): Result<T[]>;
/**
 * 두 배열의 합집합
 */
export declare function union<T>(arr1: T[], arr2: T[]): Result<T[]>;
/**
 * 첫 번째 배열에서 두 번째 배열 요소들 제외
 */
export declare function difference<T>(arr1: T[], arr2: T[]): Result<T[]>;
/**
 * 대칭 차집합 (두 배열에서 공통 요소 제외)
 */
export declare function symmetricDifference<T>(arr1: T[], arr2: T[]): Result<T[]>;
/**
 * 특정 키로 객체 배열 그룹화
 */
export declare function groupBy<T, K extends keyof T>(arr: T[], key: K): Result<Record<string, T[]>>;
/**
 * 조건에 따라 배열 분할
 */
export declare function partition<T>(arr: T[], predicate: (item: T) => boolean): Result<[T[], T[]]>;
/**
 * 숫자 배열의 합계
 */
export declare function sum(arr: number[]): Result<number>;
/**
 * 숫자 배열의 평균
 */
export declare function average(arr: number[]): Result<number>;
/**
 * 숫자 배열의 최댓값
 */
export declare function max(arr: number[]): Result<number>;
/**
 * 숫자 배열의 최솟값
 */
export declare function min(arr: number[]): Result<number>;
//# sourceMappingURL=index.d.ts.map