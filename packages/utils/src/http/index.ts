/**
 * @company/utils - HTTP 요청 유틸리티
 */

import { Result as CoreResult } from '@company/core';

// Utils에서 사용할 Result 타입 (에러를 문자열로 처리)
export type Result<T> = CoreResult<T, string>;

// ===== HTTP 메서드 타입 =====
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

// ===== 요청 옵션 타입 =====
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

// ===== HTTP 응답 타입 =====
export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

// ===== HTTP 클라이언트 =====
export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(config: RequestConfig = {}) {
    this.baseURL = config.baseURL || '';
    this.defaultHeaders = config.defaultHeaders || {};
    this.timeout = config.timeout || 10000;
  }

  /**
   * GET 요청
   */
  async get<T = any>(url: string, options: RequestOptions = {}): Promise<Result<HttpResponse<T>>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST 요청
   */
  async post<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<Result<HttpResponse<T>>> {
    return this.request<T>(url, { ...options, method: 'POST', body: data });
  }

  /**
   * PUT 요청
   */
  async put<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<Result<HttpResponse<T>>> {
    return this.request<T>(url, { ...options, method: 'PUT', body: data });
  }

  /**
   * PATCH 요청
   */
  async patch<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<Result<HttpResponse<T>>> {
    return this.request<T>(url, { ...options, method: 'PATCH', body: data });
  }

  /**
   * DELETE 요청
   */
  async delete<T = any>(url: string, options: RequestOptions = {}): Promise<Result<HttpResponse<T>>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * 기본 요청 메서드
   */
  private async request<T = any>(url: string, options: RequestOptions = {}): Promise<Result<HttpResponse<T>>> {
    try {
      const fullUrl = this.buildUrl(url);
      const requestOptions = this.buildRequestOptions(options);
      
      // 재시도 로직
      const maxRetries = options.retries || 0;
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await this.performRequest<T>(fullUrl, requestOptions);
          return { success: true, data: response };
        } catch (error) {
          lastError = error as Error;
          
          // 마지막 시도가 아니면 재시도 지연
          if (attempt < maxRetries) {
            const delay = options.retryDelay || 1000;
            await this.delay(delay * Math.pow(2, attempt)); // 지수 백오프
          }
        }
      }
      
      return { success: false, error: `HTTP 요청 실패: ${lastError?.message}` };
    } catch (error) {
      return { success: false, error: `요청 처리 실패: ${error}` };
    }
  }

  /**
   * 실제 HTTP 요청 수행
   */
  protected async performRequest<T>(url: string, options: RequestInit): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const headers = this.extractHeaders(response.headers);
      let data: T;

      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        data = await response.json() as T;
      } else if (contentType.includes('text/')) {
        data = await response.text() as unknown as T;
      } else {
        data = await response.blob() as unknown as T;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * URL 구성
   */
  private buildUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    const base = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    const path = url.startsWith('/') ? url : `/${url}`;
    
    return `${base}${path}`;
  }

  /**
   * 요청 옵션 구성
   */
  private buildRequestOptions(options: RequestOptions): RequestInit {
    const headers = {
      ...this.defaultHeaders,
      ...options.headers
    };

    let body: string | FormData | undefined;
    
    if (options.body !== undefined) {
      if (options.body instanceof FormData) {
        body = options.body;
      } else if (typeof options.body === 'object') {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        body = JSON.stringify(options.body);
      } else {
        body = String(options.body);
      }
    }

    return {
      method: options.method || 'GET',
      headers,
      body
    };
  }

  /**
   * 응답 헤더 추출
   */
  private extractHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    
    headers.forEach((value, key) => {
      result[key.toLowerCase()] = value;
    });
    
    return result;
  }

  /**
   * 지연 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ===== URL 유틸리티 =====

/**
 * URL 빌더
 */
export class UrlBuilder {
  private baseUrl: string;
  private pathSegments: string[] = [];
  private queryParams: Record<string, string> = {};

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * 경로 세그먼트 추가
   */
  path(segment: string): UrlBuilder {
    if (segment) {
      this.pathSegments.push(encodeURIComponent(segment));
    }
    return this;
  }

  /**
   * 쿼리 파라미터 추가
   */
  query(key: string, value: string | number | boolean): UrlBuilder {
    this.queryParams[key] = String(value);
    return this;
  }

  /**
   * 여러 쿼리 파라미터 추가
   */
  queries(params: Record<string, string | number | boolean>): UrlBuilder {
    for (const [key, value] of Object.entries(params)) {
      this.query(key, value);
    }
    return this;
  }

  /**
   * URL 문자열 빌드
   */
  build(): string {
    let url = this.baseUrl;

    if (this.pathSegments.length > 0) {
      const pathString = this.pathSegments.join('/');
      url = url.endsWith('/') ? `${url}${pathString}` : `${url}/${pathString}`;
    }

    const queryString = new URLSearchParams(this.queryParams).toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    return url;
  }

  /**
   * URL 빌더 복제
   */
  clone(): UrlBuilder {
    const cloned = new UrlBuilder(this.baseUrl);
    cloned.pathSegments = [...this.pathSegments];
    cloned.queryParams = { ...this.queryParams };
    return cloned;
  }
}

// ===== HTTP 상태 코드 유틸리티 =====

/**
 * HTTP 상태 코드 확인 함수들
 */
export const HttpStatus = {
  /**
   * 정보성 응답 (1xx)
   */
  isInformational: (status: number): boolean => status >= 100 && status < 200,

  /**
   * 성공 응답 (2xx)
   */
  isSuccess: (status: number): boolean => status >= 200 && status < 300,

  /**
   * 리다이렉션 (3xx)
   */
  isRedirection: (status: number): boolean => status >= 300 && status < 400,

  /**
   * 클라이언트 오류 (4xx)
   */
  isClientError: (status: number): boolean => status >= 400 && status < 500,

  /**
   * 서버 오류 (5xx)
   */
  isServerError: (status: number): boolean => status >= 500 && status < 600,

  /**
   * 오류 응답 (4xx, 5xx)
   */
  isError: (status: number): boolean => status >= 400,

  /**
   * 상태 코드 이름 가져오기
   */
  getName: (status: number): string => {
    const statusNames: Record<number, string> = {
      100: 'Continue',
      101: 'Switching Protocols',
      200: 'OK',
      201: 'Created',
      202: 'Accepted',
      204: 'No Content',
      300: 'Multiple Choices',
      301: 'Moved Permanently',
      302: 'Found',
      304: 'Not Modified',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    };

    return statusNames[status] || 'Unknown Status';
  }
};

// ===== 요청 인터셉터 =====

export type RequestInterceptor = (config: RequestInit, url: string) => RequestInit | Promise<RequestInit>;
export type ResponseInterceptor<T = any> = (response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>;

/**
 * 인터셉터를 지원하는 고급 HTTP 클라이언트
 */
export class AdvancedHttpClient extends HttpClient {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  /**
   * 요청 인터셉터 추가
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * 응답 인터셉터 추가
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * 인터셉터가 적용된 요청 수행
   */
  protected async performRequest<T>(url: string, options: RequestInit): Promise<HttpResponse<T>> {
    // 요청 인터셉터 적용
    let finalOptions = options;
    for (const interceptor of this.requestInterceptors) {
      finalOptions = await interceptor(finalOptions, url);
    }

    let response = await super.performRequest<T>(url, finalOptions);

    // 응답 인터셉터 적용
    for (const interceptor of this.responseInterceptors) {
      response = await interceptor(response);
    }

    return response;
  }
}

// ===== 유틸리티 함수들 =====

/**
 * 쿠키 파싱
 */
export function parseCookies(cookieHeader: string): Result<Record<string, string>> {
  try {
    if (typeof cookieHeader !== 'string') {
      return { success: false, error: '쿠키 헤더가 문자열이 아닙니다' };
    }

    const cookies: Record<string, string> = {};
    
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.trim().split('=');
      if (name && rest.length > 0) {
        cookies[name.trim()] = rest.join('=').trim();
      }
    });

    return { success: true, data: cookies };
  } catch (error) {
    return { success: false, error: `쿠키 파싱 실패: ${error}` };
  }
}

/**
 * 기본 인증 헤더 생성
 */
export function createBasicAuthHeader(username: string, password: string): Result<string> {
  try {
    if (typeof username !== 'string' || typeof password !== 'string') {
      return { success: false, error: '사용자명과 비밀번호는 문자열이어야 합니다' };
    }

    const credentials = `${username}:${password}`;
    const encoded = btoa(credentials);
    
    return { success: true, data: `Basic ${encoded}` };
  } catch (error) {
    return { success: false, error: `기본 인증 헤더 생성 실패: ${error}` };
  }
}

/**
 * Bearer 토큰 헤더 생성
 */
export function createBearerAuthHeader(token: string): Result<string> {
  try {
    if (typeof token !== 'string' || token.trim().length === 0) {
      return { success: false, error: '유효한 토큰이 필요합니다' };
    }

    return { success: true, data: `Bearer ${token.trim()}` };
  } catch (error) {
    return { success: false, error: `Bearer 토큰 헤더 생성 실패: ${error}` };
  }
}

/**
 * Content-Type 감지
 */
export function detectContentType(data: any): string {
  if (data instanceof FormData) {
    return 'multipart/form-data';
  }
  
  if (data instanceof URLSearchParams) {
    return 'application/x-www-form-urlencoded';
  }
  
  if (typeof data === 'object') {
    return 'application/json';
  }
  
  if (typeof data === 'string') {
    try {
      JSON.parse(data);
      return 'application/json';
    } catch {
      return 'text/plain';
    }
  }
  
  return 'application/octet-stream';
}