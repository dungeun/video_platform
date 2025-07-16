/**
 * @repo/auth-core - API 클라이언트
 * 인증 관련 HTTP 요청 처리
 */

import { Logger, Result } from '@repo/core';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId: string;
    timestamp: number;
    duration: number;
  };
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  withCredentials?: boolean;
}

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private logger: Logger;
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig> = [];
  private responseInterceptors: Array<(response: any) => any> = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, ''); // trailing slash 제거
    this.logger = new Logger('ApiClient');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Version': '1.0.0'
    };
  }

  // ===== 인터셉터 관리 =====

  /**
   * 요청 인터셉터 추가
   */
  public addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * 응답 인터셉터 추가
   */
  public addResponseInterceptor(interceptor: (response: any) => any): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * 기본 헤더 설정
   */
  public setDefaultHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  /**
   * 인증 헤더 설정
   */
  public setAuthHeader(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * 인증 헤더 제거
   */
  public clearAuthHeader(): void {
    delete this.defaultHeaders['Authorization'];
  }

  // ===== HTTP 메소드 =====

  /**
   * GET 요청
   */
  public async get<T = any>(
    endpoint: string, 
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  /**
   * POST 요청
   */
  public async post<T = any>(
    endpoint: string, 
    data?: any, 
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, config);
  }

  /**
   * PUT 요청
   */
  public async put<T = any>(
    endpoint: string, 
    data?: any, 
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  /**
   * PATCH 요청
   */
  public async patch<T = any>(
    endpoint: string, 
    data?: any, 
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, config);
  }

  /**
   * DELETE 요청
   */
  public async delete<T = any>(
    endpoint: string, 
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  // ===== 핵심 요청 메소드 =====

  /**
   * 기본 HTTP 요청 처리
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // URL 구성
      const url = `${this.baseURL}${endpoint}`;

      // 설정 병합 및 인터셉터 적용
      let requestConfig: RequestConfig = {
        timeout: 10000,
        retries: 3,
        withCredentials: true,
        ...config
      };

      // 요청 인터셉터 적용
      requestConfig = this.requestInterceptors.reduce<RequestConfig>(
        (conf, interceptor) => interceptor(conf),
        requestConfig as RequestConfig
      );

      // 헤더 병합
      const headers = {
        ...this.defaultHeaders,
        ...requestConfig.headers,
        'X-Request-ID': requestId
      };

      this.logger.debug('API 요청 시작', {
        method,
        url,
        requestId,
        hasData: !!data
      });

      // 요청 실행 (재시도 포함)
      const response = await this.executeRequestWithRetry(
        method,
        url,
        data,
        headers,
        requestConfig
      );

      const duration = Date.now() - startTime;

      // 응답 처리
      const apiResponse = this.processResponse<T>(response, requestId, duration);

      // 응답 인터셉터 적용
      const finalResponse = this.responseInterceptors.reduce(
        (resp, interceptor) => interceptor(resp),
        apiResponse
      );

      this.logger.debug('API 요청 완료', {
        method,
        url,
        requestId,
        duration,
        status: response.status
      });

      return finalResponse;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('API 요청 실패', {
        method,
        endpoint,
        requestId,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return this.createErrorResponse<T>(error, requestId, duration);
    }
  }

  /**
   * 재시도 로직이 포함된 요청 실행
   */
  private async executeRequestWithRetry(
    method: string,
    url: string,
    data: any,
    headers: Record<string, string>,
    config: RequestConfig
  ): Promise<Response> {
    let lastError: Error | null = null;
    const maxRetries = config.retries || 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout || 10000);

        const requestInit: RequestInit = {
          method,
          headers,
          signal: controller.signal,
          credentials: config.withCredentials ? 'include' : 'same-origin'
        };

        if (data && method !== 'GET') {
          requestInit.body = JSON.stringify(data);
        }

        const response = await fetch(url, requestInit);
        clearTimeout(timeoutId);

        // 재시도가 필요한 상태 코드 확인
        if (this.shouldRetry(response.status) && attempt < maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000); // 지수 백오프
          continue;
        }

        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries && this.isRetryableError(lastError)) {
          this.logger.warn(`API 요청 재시도 ${attempt + 1}/${maxRetries}`, {
            url,
            error: lastError.message
          });
          
          await this.delay(Math.pow(2, attempt) * 1000);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * 응답 처리
   */
  private async processResponse<T>(
    response: Response,
    requestId: string,
    duration: number
  ): Promise<ApiResponse<T>> {
    try {
      // 응답 본문 파싱
      const contentType = response.headers.get('Content-Type') || '';
      let responseData: any;

      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      // 성공 응답
      if (response.ok) {
        return {
          success: true,
          data: responseData,
          meta: {
            requestId,
            timestamp: Date.now(),
            duration
          }
        };
      }

      // 에러 응답
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: responseData?.message || response.statusText || 'Request failed',
          details: responseData
        },
        meta: {
          requestId,
          timestamp: Date.now(),
          duration
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: '응답 데이터 파싱 실패',
          details: error instanceof Error ? error.message : 'Unknown parsing error'
        },
        meta: {
          requestId,
          timestamp: Date.now(),
          duration
        }
      };
    }
  }

  /**
   * 에러 응답 생성
   */
  private createErrorResponse<T>(
    error: any,
    requestId: string,
    duration: number
  ): ApiResponse<T> {
    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = '알 수 없는 오류가 발생했습니다';

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorCode = 'TIMEOUT_ERROR';
        errorMessage = '요청 시간이 초과되었습니다';
      } else if (error.message.includes('network')) {
        errorCode = 'NETWORK_ERROR';
        errorMessage = '네트워크 연결에 실패했습니다';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        details: error
      },
      meta: {
        requestId,
        timestamp: Date.now(),
        duration
      }
    };
  }

  // ===== 유틸리티 메소드 =====

  /**
   * 재시도 필요 여부 판단 (상태 코드 기반)
   */
  private shouldRetry(status: number): boolean {
    // 5xx 서버 에러, 429 Too Many Requests, 408 Request Timeout
    return status >= 500 || status === 429 || status === 408;
  }

  /**
   * 재시도 가능한 에러인지 판단
   */
  private isRetryableError(error: Error): boolean {
    // 네트워크 에러, 타임아웃 등은 재시도 가능
    return (
      error.name === 'AbortError' ||
      error.message.includes('network') ||
      error.message.includes('fetch')
    );
  }

  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 요청 ID 생성
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * URL 파라미터 직렬화
   */
  public serializeParams(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    return searchParams.toString();
  }

  /**
   * 클라이언트 상태 정보
   */
  public getClientInfo(): {
    baseURL: string;
    hasAuthHeader: boolean;
    interceptorCount: {
      request: number;
      response: number;
    };
  } {
    return {
      baseURL: this.baseURL,
      hasAuthHeader: !!this.defaultHeaders['Authorization'],
      interceptorCount: {
        request: this.requestInterceptors.length,
        response: this.responseInterceptors.length
      }
    };
  }
}