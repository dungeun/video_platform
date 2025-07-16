/**
 * @repo/api-client - 에러 인터셉터
 * HTTP 에러 처리 및 변환
 */
import { ResponseInterceptor, HttpError, ApiError } from '../types';
export interface ErrorInterceptorConfig {
    transformError?: (error: HttpError) => ApiError | null;
    onNetworkError?: (error: HttpError) => void;
    onServerError?: (error: HttpError) => void;
    onClientError?: (error: HttpError) => void;
    onTimeoutError?: (error: HttpError) => void;
    isRetryable?: (error: HttpError) => boolean;
    errorMessages?: Record<number, string>;
    logDetails?: boolean;
}
export declare class ErrorInterceptor {
    private logger;
    private config;
    private defaultErrorMessages;
    constructor(config?: ErrorInterceptorConfig);
    /**
     * 응답 에러 인터셉터 생성
     */
    createResponseInterceptor(): ResponseInterceptor;
    /**
     * 네트워크 에러 처리
     */
    private handleNetworkError;
    /**
     * 서버 에러 처리 (5xx)
     */
    private handleServerError;
    /**
     * 클라이언트 에러 처리 (4xx)
     */
    private handleClientError;
    /**
     * 에러 변환
     */
    private transformError;
    /**
     * 에러 개선
     */
    private enhanceError;
    /**
     * 에러 메시지 추출
     */
    private extractErrorMessage;
    /**
     * 네트워크 에러 메시지 생성
     */
    private getNetworkErrorMessage;
    /**
     * 에러 통계 수집
     */
    private errorStats;
    collectErrorStats(error: HttpError): void;
    getErrorStats(): Record<string, number>;
    clearErrorStats(): void;
}
//# sourceMappingURL=ErrorInterceptor.d.ts.map