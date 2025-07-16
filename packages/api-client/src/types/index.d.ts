/**
 * @company/api-client - 타입 정의
 * HTTP 클라이언트 관련 타입 시스템
 */
import { Result } from '@company/core';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
export interface HttpRequestConfig {
    url?: string;
    method?: HttpMethod;
    baseURL?: string;
    headers?: Record<string, string | string[] | number | boolean>;
    params?: any;
    data?: any;
    timeout?: number;
    timeoutErrorMessage?: string;
    auth?: {
        username: string;
        password: string;
    };
    responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
    responseEncoding?: string;
    onUploadProgress?: (progressEvent: ProgressEvent) => void;
    onDownloadProgress?: (progressEvent: ProgressEvent) => void;
    withCredentials?: boolean;
    validateStatus?: (status: number) => boolean;
    maxContentLength?: number;
    maxBodyLength?: number;
    maxRedirects?: number;
    retry?: RetryConfig;
    cache?: CacheConfig;
    cancelToken?: CancelToken;
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
export interface RetryConfig {
    maxAttempts?: number;
    delay?: number;
    backoffMultiplier?: number;
    maxDelay?: number;
    shouldRetry?: (error: HttpError, attempt: number) => boolean;
    onRetry?: (error: HttpError, attempt: number) => void;
}
export interface CacheConfig {
    enabled?: boolean;
    ttl?: number;
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
    use(onFulfilled?: (value: T) => T | Promise<T>, onRejected?: (error: any) => any, options?: InterceptorOptions): number;
    eject(id: number): void;
    clear(): void;
    forEach(fn: (interceptor: T) => void): void;
}
export interface InterceptorOptions {
    synchronous?: boolean;
    runWhen?: (config: HttpRequestConfig) => boolean;
}
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
export interface ApiClientConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
    requestInterceptors?: RequestInterceptor[];
    responseInterceptors?: ResponseInterceptor[];
    retry?: RetryConfig;
    cache?: CacheConfig;
    transformRequest?: Array<(data: any, headers?: any) => any>;
    transformResponse?: Array<(data: any) => any>;
    validateStatus?: (status: number) => boolean;
    withCredentials?: boolean;
    maxRedirects?: number;
    errorHandler?: (error: HttpError) => void;
}
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
export type HttpResult<T> = Result<T, HttpError>;
export type ApiClientMethod = <T = any>(url: string, config?: HttpRequestConfig) => Promise<HttpResponse<T>>;
export type ApiClientDataMethod = <T = any>(url: string, data?: any, config?: HttpRequestConfig) => Promise<HttpResponse<T>>;
export interface Middleware {
    name: string;
    priority?: number;
    request?: (config: HttpRequestConfig) => HttpRequestConfig | Promise<HttpRequestConfig>;
    response?: (response: HttpResponse) => HttpResponse | Promise<HttpResponse>;
    error?: (error: HttpError) => HttpError | Promise<HttpError>;
}
export interface ProxyConfig {
    host: string;
    port: number;
    auth?: {
        username: string;
        password: string;
    };
    protocol?: 'http' | 'https' | 'socks5';
}
export declare enum HttpStatusCode {
    Continue = 100,
    SwitchingProtocols = 101,
    Processing = 102,
    Ok = 200,
    Created = 201,
    Accepted = 202,
    NonAuthoritativeInformation = 203,
    NoContent = 204,
    ResetContent = 205,
    PartialContent = 206,
    MultiStatus = 207,
    MultipleChoices = 300,
    MovedPermanently = 301,
    Found = 302,
    SeeOther = 303,
    NotModified = 304,
    UseProxy = 305,
    TemporaryRedirect = 307,
    PermanentRedirect = 308,
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
//# sourceMappingURL=index.d.ts.map