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
// ===== 핵심 클래스 =====
export { HttpClient } from './http/HttpClient';
// ===== 유틸리티 =====
export { RetryManager } from './utils/RetryManager';
export { CacheManager, MemoryCacheStorage } from './utils/CacheManager';
export { RequestBuilder } from './utils/RequestBuilder';
// ===== 인터셉터 =====
export { AuthInterceptor } from './interceptors/AuthInterceptor';
export { LoggingInterceptor } from './interceptors/LoggingInterceptor';
export { ErrorInterceptor } from './interceptors/ErrorInterceptor';
// ===== 열거형 =====
export { HttpStatusCode } from './types';
// ===== 팩토리 함수 =====
import { HttpClient } from './http/HttpClient';
import { AuthInterceptor } from './interceptors/AuthInterceptor';
import { LoggingInterceptor } from './interceptors/LoggingInterceptor';
import { ErrorInterceptor } from './interceptors/ErrorInterceptor';
/**
 * 기본 HTTP 클라이언트 생성
 */
export function createHttpClient(config) {
    return new HttpClient(config);
}
/**
 * 인터셉터가 설정된 HTTP 클라이언트 생성
 */
export function createHttpClientWithInterceptors(config, interceptors) {
    const client = new HttpClient(config);
    // 에러 인터셉터 (가장 먼저 실행)
    if (interceptors?.error) {
        const errorInterceptor = new ErrorInterceptor(interceptors.error);
        client.addResponseInterceptor(errorInterceptor.createResponseInterceptor());
    }
    // 로깅 인터셉터
    if (interceptors?.logging) {
        const loggingInterceptor = new LoggingInterceptor(interceptors.logging);
        client.addRequestInterceptor(loggingInterceptor.createRequestInterceptor());
        client.addResponseInterceptor(loggingInterceptor.createResponseInterceptor());
    }
    // 인증 인터셉터 (가장 나중에 실행)
    if (interceptors?.auth) {
        const authInterceptor = new AuthInterceptor(interceptors.auth);
        client.addRequestInterceptor(authInterceptor.createRequestInterceptor());
        client.addResponseInterceptor(authInterceptor.createResponseInterceptor());
    }
    return client;
}
// ===== 유틸리티 함수 =====
/**
 * Axios 에러인지 확인
 */
export function isHttpError(error) {
    return error?.isAxiosError === true;
}
/**
 * 네트워크 에러인지 확인
 */
export function isNetworkError(error) {
    return isHttpError(error) && !error.response;
}
/**
 * 타임아웃 에러인지 확인
 */
export function isTimeoutError(error) {
    return isHttpError(error) && error.code === 'ECONNABORTED';
}
/**
 * 취소된 요청인지 확인
 */
export function isCancelledError(error) {
    return isHttpError(error) && error.code === 'ERR_CANCELED';
}
/**
 * HTTP 상태 코드 그룹 확인
 */
export function isInformational(status) {
    return status >= 100 && status < 200;
}
export function isSuccess(status) {
    return status >= 200 && status < 300;
}
export function isRedirection(status) {
    return status >= 300 && status < 400;
}
export function isClientError(status) {
    return status >= 400 && status < 500;
}
export function isServerError(status) {
    return status >= 500 && status < 600;
}
// ===== 상수 =====
export const DEFAULT_TIMEOUT = 30000; // 30초
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_RETRY_DELAY = 1000; // 1초
// ===== 모듈 정보 =====
export const API_CLIENT_MODULE_INFO = {
    name: '@repo/api-client',
    version: '1.0.0',
    description: 'Enterprise HTTP Client Module with Interceptors',
    author: 'Enterprise AI Team',
    license: 'MIT'
};
//# sourceMappingURL=index.js.map