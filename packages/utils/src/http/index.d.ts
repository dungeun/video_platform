/**
 * @company/utils - HTTP 요청 유틸리티
 */
import { Result as CoreResult } from '@company/core';
export type Result<T> = CoreResult<T, string>;
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export interface RequestOptions {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}
export interface RequestConfig extends RequestOptions {
    baseURL?: string;
    defaultHeaders?: Record<string, string>;
}
export interface HttpResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
}
export declare class HttpClient {
    private baseURL;
    private defaultHeaders;
    private timeout;
    constructor(config?: RequestConfig);
    /**
     * GET 요청
     */
    get<T = any>(url: string, options?: RequestOptions): Promise<Result<HttpResponse<T>>>;
    /**
     * POST 요청
     */
    post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<Result<HttpResponse<T>>>;
    /**
     * PUT 요청
     */
    put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<Result<HttpResponse<T>>>;
    /**
     * PATCH 요청
     */
    patch<T = any>(url: string, data?: any, options?: RequestOptions): Promise<Result<HttpResponse<T>>>;
    /**
     * DELETE 요청
     */
    delete<T = any>(url: string, options?: RequestOptions): Promise<Result<HttpResponse<T>>>;
    /**
     * 기본 요청 메서드
     */
    private request;
    /**
     * 실제 HTTP 요청 수행
     */
    protected performRequest<T>(url: string, options: RequestInit): Promise<HttpResponse<T>>;
    /**
     * URL 구성
     */
    private buildUrl;
    /**
     * 요청 옵션 구성
     */
    private buildRequestOptions;
    /**
     * 응답 헤더 추출
     */
    private extractHeaders;
    /**
     * 지연 유틸리티
     */
    private delay;
}
/**
 * URL 빌더
 */
export declare class UrlBuilder {
    private baseUrl;
    private pathSegments;
    private queryParams;
    constructor(baseUrl?: string);
    /**
     * 경로 세그먼트 추가
     */
    path(segment: string): UrlBuilder;
    /**
     * 쿼리 파라미터 추가
     */
    query(key: string, value: string | number | boolean): UrlBuilder;
    /**
     * 여러 쿼리 파라미터 추가
     */
    queries(params: Record<string, string | number | boolean>): UrlBuilder;
    /**
     * URL 문자열 빌드
     */
    build(): string;
    /**
     * URL 빌더 복제
     */
    clone(): UrlBuilder;
}
/**
 * HTTP 상태 코드 확인 함수들
 */
export declare const HttpStatus: {
    /**
     * 정보성 응답 (1xx)
     */
    isInformational: (status: number) => boolean;
    /**
     * 성공 응답 (2xx)
     */
    isSuccess: (status: number) => boolean;
    /**
     * 리다이렉션 (3xx)
     */
    isRedirection: (status: number) => boolean;
    /**
     * 클라이언트 오류 (4xx)
     */
    isClientError: (status: number) => boolean;
    /**
     * 서버 오류 (5xx)
     */
    isServerError: (status: number) => boolean;
    /**
     * 오류 응답 (4xx, 5xx)
     */
    isError: (status: number) => boolean;
    /**
     * 상태 코드 이름 가져오기
     */
    getName: (status: number) => string;
};
export type RequestInterceptor = (config: RequestInit, url: string) => RequestInit | Promise<RequestInit>;
export type ResponseInterceptor<T = any> = (response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>;
/**
 * 인터셉터를 지원하는 고급 HTTP 클라이언트
 */
export declare class AdvancedHttpClient extends HttpClient {
    private requestInterceptors;
    private responseInterceptors;
    /**
     * 요청 인터셉터 추가
     */
    addRequestInterceptor(interceptor: RequestInterceptor): void;
    /**
     * 응답 인터셉터 추가
     */
    addResponseInterceptor(interceptor: ResponseInterceptor): void;
    /**
     * 인터셉터가 적용된 요청 수행
     */
    protected performRequest<T>(url: string, options: RequestInit): Promise<HttpResponse<T>>;
}
/**
 * 쿠키 파싱
 */
export declare function parseCookies(cookieHeader: string): Result<Record<string, string>>;
/**
 * 기본 인증 헤더 생성
 */
export declare function createBasicAuthHeader(username: string, password: string): Result<string>;
/**
 * Bearer 토큰 헤더 생성
 */
export declare function createBearerAuthHeader(token: string): Result<string>;
/**
 * Content-Type 감지
 */
export declare function detectContentType(data: any): string;
//# sourceMappingURL=index.d.ts.map