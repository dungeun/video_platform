/**
 * @repo/api-client - 재시도 관리자
 * HTTP 요청 재시도 로직 관리
 */
import { RetryConfig } from '../types';
export declare class RetryManager {
    private logger;
    private defaultConfig;
    constructor(config?: RetryConfig);
    /**
     * 재시도 로직과 함께 함수 실행
     */
    executeWithRetry<T>(fn: () => Promise<T>, config?: RetryConfig): Promise<T>;
    /**
     * 기본 재시도 조건
     */
    private defaultShouldRetry;
    /**
     * 대기
     */
    private sleep;
    /**
     * 재시도 지연 시간 계산 (지터 포함)
     */
    calculateDelay(baseDelay: number, attempt: number, maxDelay: number, includeJitter?: boolean): number;
    /**
     * Retry-After 헤더 파싱
     */
    parseRetryAfter(retryAfter: string | null): number | null;
    /**
     * 서킷 브레이커 패턴 구현
     */
    createCircuitBreaker(threshold?: number, resetTimeout?: number): {
        recordSuccess: () => void;
        recordFailure: () => void;
        canExecute: () => boolean;
        getState: () => {
            isOpen: boolean;
            failures: number;
            lastFailureTime: number;
        };
    };
}
//# sourceMappingURL=RetryManager.d.ts.map