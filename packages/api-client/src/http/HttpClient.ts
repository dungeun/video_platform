/**
 * @repo/api-client - HTTP 클라이언트
 * Zero Error Architecture 기반 HTTP 통신 모듈
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ModuleBase, Result, Logger } from '@repo/core';
import { 
  HttpRequestConfig, 
  HttpResponse, 
  HttpError,
  ApiClientConfig,
  RequestInterceptor,
  ResponseInterceptor,
  RetryConfig,
  CancelTokenSource,
  HttpMethod
} from '../types';
import { RetryManager } from '../utils/RetryManager';
import { CacheManager } from '../utils/CacheManager';
import { RequestBuilder } from '../utils/RequestBuilder';

export class HttpClient extends ModuleBase {
  private axiosInstance: AxiosInstance;
  private clientConfig: ApiClientConfig;
  private retryManager: RetryManager;
  private cacheManager: CacheManager;
  private requestBuilder: RequestBuilder;
  private activeRequests: Map<string, any> = new Map();

  constructor(config: ApiClientConfig) {
    super({
      name: '@repo/api-client',
      version: '1.0.0',
      description: 'Enterprise HTTP Client'
    });

    this.clientConfig = config;
    this.axiosInstance = this.createAxiosInstance();
    this.retryManager = new RetryManager(config.retry);
    this.cacheManager = new CacheManager(config.cache);
    this.requestBuilder = new RequestBuilder();
    
    this.setupInterceptors();
  }

  // ===== 라이프사이클 메소드 =====

  protected async onInitialize(): Promise<Result<void>> {
    try {
      // 캐시 매니저 초기화
      await this.cacheManager.initialize();
      
      this.logger.info('HTTP 클라이언트 초기화 완료');
      return { success: true };
    } catch (error) {
      const httpError = this.errorHandler.handle(error, 'HTTP 클라이언트 초기화 실패');
      return { success: false, error: httpError };
    }
  }

  protected async onDestroy(): Promise<Result<void>> {
    try {
      // 모든 활성 요청 취소
      this.cancelAllRequests();
      
      // 캐시 정리
      await this.cacheManager.clear();
      
      return { success: true };
    } catch (error) {
      const httpError = this.errorHandler.handle(error, 'HTTP 클라이언트 종료 실패');
      return { success: false, error: httpError };
    }
  }

  public async healthCheck(): Promise<Result<boolean>> {
    try {
      const response = await this.get('/health', { timeout: 5000 });
      return { success: true, data: response.status === 200 };
    } catch (error) {
      return { success: true, data: false };
    }
  }

  // ===== HTTP 메소드 =====

  /**
   * GET 요청
   */
  public async get<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  /**
   * POST 요청
   */
  public async post<T = any>(
    url: string, 
    data?: any, 
    config?: HttpRequestConfig
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * PUT 요청
   */
  public async put<T = any>(
    url: string, 
    data?: any, 
    config?: HttpRequestConfig
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  /**
   * DELETE 요청
   */
  public async delete<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  /**
   * PATCH 요청
   */
  public async patch<T = any>(
    url: string, 
    data?: any, 
    config?: HttpRequestConfig
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  /**
   * HEAD 요청
   */
  public async head<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: 'HEAD', url });
  }

  /**
   * OPTIONS 요청
   */
  public async options<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: 'OPTIONS', url });
  }

  // ===== 핵심 요청 메소드 =====

  /**
   * HTTP 요청 실행
   */
  public async request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // 요청 빌더로 설정 구성
      const axiosConfig = this.requestBuilder.build(config, this.clientConfig);

      // 캐시 확인
      if (config.method === 'GET' && this.clientConfig.cache?.enabled) {
        const cached = await this.cacheManager.get(config);
        if (cached) {
          this.logger.debug('캐시에서 응답 반환', { url: config.url });
          return cached as HttpResponse<T>;
        }
      }

      // 취소 토큰 생성
      const cancelTokenSource = axios.CancelToken.source();
      axiosConfig.cancelToken = cancelTokenSource.token;
      this.activeRequests.set(requestId, cancelTokenSource);

      // 요청 로깅
      this.logger.debug('HTTP 요청 시작', {
        method: config.method,
        url: config.url,
        requestId
      });

      // 재시도 로직 포함 요청 실행
      const response = await this.retryManager.executeWithRetry(
        () => this.axiosInstance.request<T>(axiosConfig),
        config.retry
      );

      // 응답 변환
      const httpResponse: HttpResponse<T> = {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        config: axiosConfig as unknown as HttpRequestConfig,
        request: response.request
      };

      // 캐시 저장
      if (config.method === 'GET' && this.clientConfig.cache?.enabled) {
        await this.cacheManager.set(config, httpResponse);
      }

      // 요청 완료 로깅
      const duration = Date.now() - startTime;
      this.logger.debug('HTTP 요청 완료', {
        method: config.method,
        url: config.url,
        status: response.status,
        duration,
        requestId
      });

      // 활성 요청에서 제거
      this.activeRequests.delete(requestId);

      return httpResponse;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // 활성 요청에서 제거
      this.activeRequests.delete(requestId);

      // 에러 변환
      const httpError = this.convertError(error as AxiosError, config);
      
      // 에러 로깅
      this.logger.error('HTTP 요청 실패', {
        method: config.method,
        url: config.url,
        error: httpError.message,
        duration,
        requestId
      });

      // 에러 핸들러 호출
      if (this.clientConfig.errorHandler) {
        this.clientConfig.errorHandler(httpError);
      }

      throw httpError;
    }
  }

  // ===== 요청 취소 =====

  /**
   * 특정 요청 취소
   */
  public cancelRequest(requestId: string, message?: string): void {
    const source = this.activeRequests.get(requestId);
    if (source) {
      source.cancel(message || '요청이 취소되었습니다');
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * 모든 요청 취소
   */
  public cancelAllRequests(message?: string): void {
    this.activeRequests.forEach((source, id) => {
      source.cancel(message || '모든 요청이 취소되었습니다');
    });
    this.activeRequests.clear();
  }

  // ===== 인터셉터 관리 =====

  /**
   * 요청 인터셉터 추가
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): number {
    return this.axiosInstance.interceptors.request.use(
      interceptor.onFulfilled as any,
      interceptor.onRejected
    );
  }

  /**
   * 응답 인터셉터 추가
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor): number {
    return this.axiosInstance.interceptors.response.use(
      interceptor.onFulfilled as any,
      interceptor.onRejected
    );
  }

  /**
   * 요청 인터셉터 제거
   */
  public removeRequestInterceptor(id: number): void {
    this.axiosInstance.interceptors.request.eject(id);
  }

  /**
   * 응답 인터셉터 제거
   */
  public removeResponseInterceptor(id: number): void {
    this.axiosInstance.interceptors.response.eject(id);
  }

  // ===== 유틸리티 메소드 =====

  /**
   * 기본 URL 변경
   */
  public setBaseURL(baseURL: string): void {
    this.clientConfig.baseURL = baseURL;
    this.axiosInstance.defaults.baseURL = baseURL;
  }

  /**
   * 기본 헤더 설정
   */
  public setDefaultHeader(name: string, value: string): void {
    this.axiosInstance.defaults.headers.common[name] = value;
  }

  /**
   * 기본 헤더 제거
   */
  public removeDefaultHeader(name: string): void {
    delete this.axiosInstance.defaults.headers.common[name];
  }

  /**
   * 타임아웃 설정
   */
  public setTimeout(timeout: number): void {
    this.clientConfig.timeout = timeout;
    this.axiosInstance.defaults.timeout = timeout;
  }

  // ===== 내부 메소드 =====

  /**
   * Axios 인스턴스 생성
   */
  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.clientConfig.baseURL,
      timeout: this.clientConfig.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.clientConfig.headers
      },
      withCredentials: this.clientConfig.withCredentials || false,
      maxRedirects: this.clientConfig.maxRedirects || 5,
      validateStatus: this.clientConfig.validateStatus || ((status) => status >= 200 && status < 300)
    });
  }

  /**
   * 인터셉터 설정
   */
  private setupInterceptors(): void {
    // 기본 요청 인터셉터
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // 요청 ID 추가
        if (!config.headers['X-Request-ID']) {
          config.headers['X-Request-ID'] = this.generateRequestId();
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 기본 응답 인터셉터
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(error)
    );

    // 사용자 정의 인터셉터 추가
    if (this.clientConfig.requestInterceptors) {
      this.clientConfig.requestInterceptors.forEach(interceptor => {
        this.addRequestInterceptor(interceptor);
      });
    }

    if (this.clientConfig.responseInterceptors) {
      this.clientConfig.responseInterceptors.forEach(interceptor => {
        this.addResponseInterceptor(interceptor);
      });
    }
  }

  /**
   * 에러 변환
   */
  private convertError(axiosError: AxiosError, config: HttpRequestConfig): HttpError {
    const error = new Error(axiosError.message) as any;
    
    error.name = 'HttpError';
    error.config = config;
    error.code = axiosError.code || undefined;
    error.request = axiosError.request;
    error.response = axiosError.response ? {
      data: axiosError.response.data,
      status: axiosError.response.status,
      statusText: axiosError.response.statusText,
      headers: axiosError.response.headers as Record<string, string>,
      config: (axiosError.config || {}) as HttpRequestConfig,
      request: axiosError.request
    } : undefined;
    
    error.isAxiosError = true;
    error.toJSON = () => ({
      message: error.message,
      name: error.name,
      code: error.code,
      config: error.config,
      response: error.response
    });

    return error as HttpError;
  }

  /**
   * 요청 ID 생성
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}