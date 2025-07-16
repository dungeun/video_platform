/**
 * @company/utils - 비동기 처리 유틸리티
 */
import { Result as CoreResult } from '@company/core';
export type Result<T> = CoreResult<T, string>;
/**
 * 지정된 시간만큼 지연
 */
export declare function delay(ms: number): Promise<Result<void>>;
/**
 * 다음 이벤트 루프까지 지연
 */
export declare function nextTick(): Promise<Result<void>>;
/**
 * 재시도 옵션
 */
export interface RetryOptions {
    maxAttempts: number;
    delay: number;
    backoff?: 'linear' | 'exponential';
    maxDelay?: number;
}
/**
 * 함수 실행을 재시도
 */
export declare function retry<T>(fn: () => Promise<Result<T>>, options: RetryOptions): Promise<Result<T>>;
/**
 * Promise에 타임아웃 추가
 */
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage?: string): Promise<Result<T>>;
/**
 * 배열을 청크 단위로 순차 처리
 */
export declare function processInChunks<T, R>(items: T[], processor: (item: T) => Promise<Result<R>>, chunkSize?: number): Promise<Result<R[]>>;
/**
 * 배열을 병렬로 처리 (동시 실행 수 제한)
 */
export declare function processInParallel<T, R>(items: T[], processor: (item: T) => Promise<Result<R>>, concurrency?: number): Promise<Result<R[]>>;
/**
 * 디바운스 함수 생성
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void;
/**
 * 스로틀 함수 생성
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Promise 결과를 Result로 래핑
 */
export declare function wrapPromise<T>(promise: Promise<T>, errorCode?: string): Promise<Result<T>>;
/**
 * 모든 Promise가 완료될 때까지 대기 (일부 실패해도 계속)
 */
export declare function allSettled<T>(promises: Promise<T>[]): Promise<Result<Array<{
    status: 'fulfilled' | 'rejected';
    value?: T;
    reason?: any;
}>>>;
/**
 * 첫 번째로 완료되는 Promise 결과 반환
 */
export declare function race<T>(promises: Promise<T>[]): Promise<Result<T>>;
/**
 * 순차 실행 큐
 */
export declare class SequentialQueue {
    private queue;
    private processing;
    /**
     * 큐에 작업 추가
     */
    enqueue<T>(task: () => Promise<T>): Promise<Result<T>>;
    /**
     * 큐 처리
     */
    private processQueue;
    /**
     * 큐 크기 반환
     */
    size(): number;
    /**
     * 큐 비우기
     */
    clear(): void;
}
/**
 * 메모이제이션 캐시
 */
export declare function memoize<T extends (...args: any[]) => any>(func: T, keyGenerator?: (...args: Parameters<T>) => string): T;
/**
 * TTL(Time To Live) 캐시
 */
export declare class TTLCache<K, V> {
    private cache;
    private ttl;
    constructor(ttlMs?: number);
    /**
     * 값 설정
     */
    set(key: K, value: V): void;
    /**
     * 값 가져오기
     */
    get(key: K): V | undefined;
    /**
     * 값 존재 여부 확인
     */
    has(key: K): boolean;
    /**
     * 값 삭제
     */
    delete(key: K): boolean;
    /**
     * 캐시 비우기
     */
    clear(): void;
    /**
     * 만료된 항목 정리
     */
    cleanup(): void;
    /**
     * 캐시 크기
     */
    size(): number;
}
//# sourceMappingURL=index.d.ts.map