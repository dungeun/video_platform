/**
 * @repo/api-client - HTTP 클라이언트
 * Zero Error Architecture 기반 HTTP 통신 모듈
 */
import { ModuleBase, Result } from '@repo/core';
import { HttpRequestConfig, HttpResponse, ApiClientConfig, RequestInterceptor, ResponseInterceptor } from '../types';
export declare class HttpClient extends ModuleBase {
    private axiosInstance;
    private clientConfig;
    private retryManager;
    private cacheManager;
    private requestBuilder;
    private activeRequests;
    constructor(config: ApiClientConfig);
    protected onInitialize(): Promise<Result<void>>;
    protected onDestroy(): Promise<Result<void>>;
    healthCheck(): Promise<Result<boolean>>;
    /**
     * GET 요청
     */
    get<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    /**
     * POST 요청
     */
    post<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    /**
     * PUT 요청
     */
    put<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    /**
     * DELETE 요청
     */
    delete<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    /**
     * PATCH 요청
     */
    patch<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    /**
     * HEAD 요청
     */
    head<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    /**
     * OPTIONS 요청
     */
    options<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    /**
     * HTTP 요청 실행
     */
    request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
    /**
     * 특정 요청 취소
     */
    cancelRequest(requestId: string, message?: string): void;
    /**
     * 모든 요청 취소
     */
    cancelAllRequests(message?: string): void;
    /**
     * 요청 인터셉터 추가
     */
    addRequestInterceptor(interceptor: RequestInterceptor): number;
    /**
     * 응답 인터셉터 추가
     */
    addResponseInterceptor(interceptor: ResponseInterceptor): number;
    /**
     * 요청 인터셉터 제거
     */
    removeRequestInterceptor(id: number): void;
    /**
     * 응답 인터셉터 제거
     */
    removeResponseInterceptor(id: number): void;
    /**
     * 기본 URL 변경
     */
    setBaseURL(baseURL: string): void;
    /**
     * 기본 헤더 설정
     */
    setDefaultHeader(name: string, value: string): void;
    /**
     * 기본 헤더 제거
     */
    removeDefaultHeader(name: string): void;
    /**
     * 타임아웃 설정
     */
    setTimeout(timeout: number): void;
    /**
     * Axios 인스턴스 생성
     */
    private createAxiosInstance;
    /**
     * 인터셉터 설정
     */
    private setupInterceptors;
    /**
     * 에러 변환
     */
    private convertError;
    /**
     * 요청 ID 생성
     */
    private generateRequestId;
}
//# sourceMappingURL=HttpClient.d.ts.map