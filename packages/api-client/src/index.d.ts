/**
 * @repo/api-client - Enterprise HTTP Client Module
 *
 * 엔터프라이즈급 HTTP 통신 모듈
 * - Zero Error Architecture 기반
 * - 자동 재시도 및 캐싱
 * - 인터셉터 체인
 * - TypeScript 완벽 지원
 *
 * @version 1.0.0
 * @author Enterprise AI Team
 */
export { HttpClient } from './http/HttpClient';
export { RetryManager } from './utils/RetryManager';
export { CacheManager, MemoryCacheStorage } from './utils/CacheManager';
export { RequestBuilder } from './utils/RequestBuilder';
export { AuthInterceptor } from './interceptors/AuthInterceptor';
export { LoggingInterceptor } from './interceptors/LoggingInterceptor';
export { ErrorInterceptor } from './interceptors/ErrorInterceptor';
export type { HttpMethod, HttpRequestConfig, HttpResponse, HttpError, HttpResult, ApiClientConfig, RetryConfig, CacheConfig, CacheStorage, CacheEntry, RequestInterceptor, ResponseInterceptor, InterceptorManager, InterceptorOptions, Middleware, CancelToken, CancelTokenSource, Cancel, ApiResponse, ApiError, ApiMetadata, PaginationMeta, PaginationParams, PaginatedResponse, UploadConfig, UploadResponse, ApiClientMethod, ApiClientDataMethod, ProxyConfig } from './types';
export { HttpStatusCode } from './types';
export type { AuthInterceptorConfig } from './interceptors/AuthInterceptor';
export type { LoggingInterceptorConfig } from './interceptors/LoggingInterceptor';
export type { ErrorInterceptorConfig } from './interceptors/ErrorInterceptor';
import { HttpClient } from './http/HttpClient';
import { ApiClientConfig, HttpError } from './types';
import { AuthInterceptorConfig } from './interceptors/AuthInterceptor';
import { LoggingInterceptorConfig } from './interceptors/LoggingInterceptor';
import { ErrorInterceptorConfig } from './interceptors/ErrorInterceptor';
/**
 * 기본 HTTP 클라이언트 생성
 */
export declare function createHttpClient(config: ApiClientConfig): HttpClient;
/**
 * 인터셉터가 설정된 HTTP 클라이언트 생성
 */
export declare function createHttpClientWithInterceptors(config: ApiClientConfig, interceptors?: {
    auth?: AuthInterceptorConfig;
    logging?: LoggingInterceptorConfig;
    error?: ErrorInterceptorConfig;
}): HttpClient;
/**
 * Axios 에러인지 확인
 */
export declare function isHttpError(error: any): error is HttpError;
/**
 * 네트워크 에러인지 확인
 */
export declare function isNetworkError(error: any): boolean;
/**
 * 타임아웃 에러인지 확인
 */
export declare function isTimeoutError(error: any): boolean;
/**
 * 취소된 요청인지 확인
 */
export declare function isCancelledError(error: any): boolean;
/**
 * HTTP 상태 코드 그룹 확인
 */
export declare function isInformational(status: number): boolean;
export declare function isSuccess(status: number): boolean;
export declare function isRedirection(status: number): boolean;
export declare function isClientError(status: number): boolean;
export declare function isServerError(status: number): boolean;
export declare const DEFAULT_TIMEOUT = 30000;
export declare const DEFAULT_MAX_RETRIES = 3;
export declare const DEFAULT_RETRY_DELAY = 1000;
export declare const API_CLIENT_MODULE_INFO: {
    readonly name: "@repo/api-client";
    readonly version: "1.0.0";
    readonly description: "Enterprise HTTP Client Module with Interceptors";
    readonly author: "Enterprise AI Team";
    readonly license: "MIT";
};
//# sourceMappingURL=index.d.ts.map