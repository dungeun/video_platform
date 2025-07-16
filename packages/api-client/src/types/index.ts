/**
 * @company/api-client - 타입 정의
 * HTTP 클라이언트 관련 타입 시스템
 */

import { Result } from '@company/core';

// ===== 기본 타입 =====

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface HttpRequestConfig {
  // 기본 설정
  url?: string;
  method?: HttpMethod;
  baseURL?: string;
  headers?: Record<string, string | string[] | number | boolean>;
  params?: any;
  data?: any;
  
  // 타임아웃 설정
  timeout?: number;
  timeoutErrorMessage?: string;
  
  // 인증
  auth?: {
    username: string;
    password: string;
  };
  
  // 응답 설정
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
  responseEncoding?: string;
  
  // 진행 상황
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
  onDownloadProgress?: (progressEvent: ProgressEvent) => void;
  
  // 기타 설정
  withCredentials?: boolean;
  validateStatus?: (status: number) => boolean;
  maxContentLength?: number;
  maxBodyLength?: number;
  maxRedirects?: number;
  
  // 재시도 설정
  retry?: RetryConfig;
  
  // 캐시 설정
  cache?: CacheConfig;
  
  // 취소 토큰
  cancelToken?: CancelToken;
  
  // 메타데이터
  metadata?: Record<string, any>;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: HttpRequestConfig;
  request?: any;
}

export interface HttpError extends Error {
  config?: HttpRequestConfig;
  code?: string;
  request?: any;
  response?: HttpResponse;
  isAxiosError?: boolean;
  toJSON?: () => object;
}

// ===== 재시도 설정 =====

export interface RetryConfig {
  maxAttempts?: number;
  delay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  shouldRetry?: (error: HttpError, attempt: number) => boolean;
  onRetry?: (error: HttpError, attempt: number) => void;
}

// ===== 캐시 설정 =====

export interface CacheConfig {
  enabled?: boolean;
  ttl?: number; // Time to live in milliseconds
  key?: string | ((config: HttpRequestConfig) => string);
  shouldCache?: (response: HttpResponse) => boolean;
  storage?: CacheStorage;
}

export interface CacheStorage {
  get(key: string): Promise<CacheEntry | null>;
  set(key: string, value: CacheEntry): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// ===== 인터셉터 타입 =====

export interface RequestInterceptor {
  onFulfilled?: (config: HttpRequestConfig) => HttpRequestConfig | Promise<HttpRequestConfig>;
  onRejected?: (error: any) => any;
  synchronous?: boolean;
  runWhen?: (config: HttpRequestConfig) => boolean;
}

export interface ResponseInterceptor {
  onFulfilled?: (response: HttpResponse) => HttpResponse | Promise<HttpResponse>;
  onRejected?: (error: any) => any;
}

export interface InterceptorManager<T> {
  use(
    onFulfilled?: (value: T) => T | Promise<T>,
    onRejected?: (error: any) => any,
    options?: InterceptorOptions
  ): number;
  eject(id: number): void;
  clear(): void;
  forEach(fn: (interceptor: T) => void): void;
}

export interface InterceptorOptions {
  synchronous?: boolean;
  runWhen?: (config: HttpRequestConfig) => boolean;
}

// ===== 취소 관련 =====

export interface CancelToken {
  promise: Promise<Cancel>;
  reason?: Cancel;
  throwIfRequested(): void;
}

export interface CancelTokenSource {
  token: CancelToken;
  cancel: (message?: string) => void;
}

export interface Cancel {
  message?: string;
  __CANCEL__: boolean;
}

// ===== API 클라이언트 설정 =====

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  
  // 인터셉터
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];
  
  // 재시도
  retry?: RetryConfig;
  
  // 캐시
  cache?: CacheConfig;
  
  // 변환
  transformRequest?: Array<(data: any, headers?: any) => any>;
  transformResponse?: Array<(data: any) => any>;
  
  // 유효성 검사
  validateStatus?: (status: number) => boolean;
  
  // 기타
  withCredentials?: boolean;
  maxRedirects?: number;
  
  // 에러 처리
  errorHandler?: (error: HttpError) => void;
}

// ===== API 응답 타입 =====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp?: number;
  path?: string;
  method?: string;
}

export interface ApiMetadata {
  requestId: string;
  timestamp: number;
  duration: number;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ===== 페이지네이션 =====

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ===== 파일 업로드 =====

export interface UploadConfig {
  file: File | Blob;
  fileName?: string;
  fieldName?: string;
  metadata?: Record<string, any>;
  onProgress?: (percent: number) => void;
}

export interface UploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

// ===== 유틸리티 타입 =====

export type HttpResult<T> = Result<T, HttpError>;

export type ApiClientMethod = <T = any>(
  url: string,
  config?: HttpRequestConfig
) => Promise<HttpResponse<T>>;

export type ApiClientDataMethod = <T = any>(
  url: string,
  data?: any,
  config?: HttpRequestConfig
) => Promise<HttpResponse<T>>;

// ===== 미들웨어 타입 =====

export interface Middleware {
  name: string;
  priority?: number;
  request?: (config: HttpRequestConfig) => HttpRequestConfig | Promise<HttpRequestConfig>;
  response?: (response: HttpResponse) => HttpResponse | Promise<HttpResponse>;
  error?: (error: HttpError) => HttpError | Promise<HttpError>;
}

// ===== 프록시 설정 =====

export interface ProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
  protocol?: 'http' | 'https' | 'socks5';
}

// ===== 상태 코드 =====

export enum HttpStatusCode {
  // 1xx Informational
  Continue = 100,
  SwitchingProtocols = 101,
  Processing = 102,
  
  // 2xx Success
  Ok = 200,
  Created = 201,
  Accepted = 202,
  NonAuthoritativeInformation = 203,
  NoContent = 204,
  ResetContent = 205,
  PartialContent = 206,
  MultiStatus = 207,
  
  // 3xx Redirection
  MultipleChoices = 300,
  MovedPermanently = 301,
  Found = 302,
  SeeOther = 303,
  NotModified = 304,
  UseProxy = 305,
  TemporaryRedirect = 307,
  PermanentRedirect = 308,
  
  // 4xx Client Error
  BadRequest = 400,
  Unauthorized = 401,
  PaymentRequired = 402,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  NotAcceptable = 406,
  ProxyAuthenticationRequired = 407,
  RequestTimeout = 408,
  Conflict = 409,
  Gone = 410,
  LengthRequired = 411,
  PreconditionFailed = 412,
  PayloadTooLarge = 413,
  UriTooLong = 414,
  UnsupportedMediaType = 415,
  RangeNotSatisfiable = 416,
  ExpectationFailed = 417,
  ImATeapot = 418,
  UnprocessableEntity = 422,
  Locked = 423,
  FailedDependency = 424,
  TooEarly = 425,
  UpgradeRequired = 426,
  PreconditionRequired = 428,
  TooManyRequests = 429,
  RequestHeaderFieldsTooLarge = 431,
  
  // 5xx Server Error
  InternalServerError = 500,
  NotImplemented = 501,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504,
  HttpVersionNotSupported = 505,
  VariantAlsoNegotiates = 506,
  InsufficientStorage = 507,
  LoopDetected = 508,
  NotExtended = 510,
  NetworkAuthenticationRequired = 511
}