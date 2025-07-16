/**
 * @company/api-client - HTTP 클라이언트
 * Zero Error Architecture 기반 HTTP 통신 모듈
 */
import axios from 'axios';
import { ModuleBase } from '@company/core';
import { RetryManager } from '../utils/RetryManager';
import { CacheManager } from '../utils/CacheManager';
import { RequestBuilder } from '../utils/RequestBuilder';
export class HttpClient extends ModuleBase {
    constructor(config) {
        super({
            name: '@company/api-client',
            version: '1.0.0',
            description: 'Enterprise HTTP Client'
        });
        this.activeRequests = new Map();
        this.clientConfig = config;
        this.axiosInstance = this.createAxiosInstance();
        this.retryManager = new RetryManager(config.retry);
        this.cacheManager = new CacheManager(config.cache);
        this.requestBuilder = new RequestBuilder();
        this.setupInterceptors();
    }
    // ===== 라이프사이클 메소드 =====
    async onInitialize() {
        try {
            // 캐시 매니저 초기화
            await this.cacheManager.initialize();
            this.logger.info('HTTP 클라이언트 초기화 완료');
            return { success: true };
        }
        catch (error) {
            const httpError = this.errorHandler.handle(error, 'HTTP 클라이언트 초기화 실패');
            return { success: false, error: httpError };
        }
    }
    async onDestroy() {
        try {
            // 모든 활성 요청 취소
            this.cancelAllRequests();
            // 캐시 정리
            await this.cacheManager.clear();
            return { success: true };
        }
        catch (error) {
            const httpError = this.errorHandler.handle(error, 'HTTP 클라이언트 종료 실패');
            return { success: false, error: httpError };
        }
    }
    async healthCheck() {
        try {
            const response = await this.get('/health', { timeout: 5000 });
            return { success: true, data: response.status === 200 };
        }
        catch (error) {
            return { success: true, data: false };
        }
    }
    // ===== HTTP 메소드 =====
    /**
     * GET 요청
     */
    async get(url, config) {
        return this.request({ ...config, method: 'GET', url });
    }
    /**
     * POST 요청
     */
    async post(url, data, config) {
        return this.request({ ...config, method: 'POST', url, data });
    }
    /**
     * PUT 요청
     */
    async put(url, data, config) {
        return this.request({ ...config, method: 'PUT', url, data });
    }
    /**
     * DELETE 요청
     */
    async delete(url, config) {
        return this.request({ ...config, method: 'DELETE', url });
    }
    /**
     * PATCH 요청
     */
    async patch(url, data, config) {
        return this.request({ ...config, method: 'PATCH', url, data });
    }
    /**
     * HEAD 요청
     */
    async head(url, config) {
        return this.request({ ...config, method: 'HEAD', url });
    }
    /**
     * OPTIONS 요청
     */
    async options(url, config) {
        return this.request({ ...config, method: 'OPTIONS', url });
    }
    // ===== 핵심 요청 메소드 =====
    /**
     * HTTP 요청 실행
     */
    async request(config) {
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
                    return cached;
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
            const response = await this.retryManager.executeWithRetry(() => this.axiosInstance.request(axiosConfig), config.retry);
            // 응답 변환
            const httpResponse = {
                data: response.data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                config: axiosConfig,
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
        }
        catch (error) {
            const duration = Date.now() - startTime;
            // 활성 요청에서 제거
            this.activeRequests.delete(requestId);
            // 에러 변환
            const httpError = this.convertError(error, config);
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
    cancelRequest(requestId, message) {
        const source = this.activeRequests.get(requestId);
        if (source) {
            source.cancel(message || '요청이 취소되었습니다');
            this.activeRequests.delete(requestId);
        }
    }
    /**
     * 모든 요청 취소
     */
    cancelAllRequests(message) {
        this.activeRequests.forEach((source, id) => {
            source.cancel(message || '모든 요청이 취소되었습니다');
        });
        this.activeRequests.clear();
    }
    // ===== 인터셉터 관리 =====
    /**
     * 요청 인터셉터 추가
     */
    addRequestInterceptor(interceptor) {
        return this.axiosInstance.interceptors.request.use(interceptor.onFulfilled, interceptor.onRejected);
    }
    /**
     * 응답 인터셉터 추가
     */
    addResponseInterceptor(interceptor) {
        return this.axiosInstance.interceptors.response.use(interceptor.onFulfilled, interceptor.onRejected);
    }
    /**
     * 요청 인터셉터 제거
     */
    removeRequestInterceptor(id) {
        this.axiosInstance.interceptors.request.eject(id);
    }
    /**
     * 응답 인터셉터 제거
     */
    removeResponseInterceptor(id) {
        this.axiosInstance.interceptors.response.eject(id);
    }
    // ===== 유틸리티 메소드 =====
    /**
     * 기본 URL 변경
     */
    setBaseURL(baseURL) {
        this.clientConfig.baseURL = baseURL;
        this.axiosInstance.defaults.baseURL = baseURL;
    }
    /**
     * 기본 헤더 설정
     */
    setDefaultHeader(name, value) {
        this.axiosInstance.defaults.headers.common[name] = value;
    }
    /**
     * 기본 헤더 제거
     */
    removeDefaultHeader(name) {
        delete this.axiosInstance.defaults.headers.common[name];
    }
    /**
     * 타임아웃 설정
     */
    setTimeout(timeout) {
        this.clientConfig.timeout = timeout;
        this.axiosInstance.defaults.timeout = timeout;
    }
    // ===== 내부 메소드 =====
    /**
     * Axios 인스턴스 생성
     */
    createAxiosInstance() {
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
    setupInterceptors() {
        // 기본 요청 인터셉터
        this.axiosInstance.interceptors.request.use((config) => {
            // 요청 ID 추가
            if (!config.headers['X-Request-ID']) {
                config.headers['X-Request-ID'] = this.generateRequestId();
            }
            return config;
        }, (error) => Promise.reject(error));
        // 기본 응답 인터셉터
        this.axiosInstance.interceptors.response.use((response) => response, (error) => Promise.reject(error));
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
    convertError(axiosError, config) {
        const error = new Error(axiosError.message);
        error.name = 'HttpError';
        error.config = config;
        error.code = axiosError.code || undefined;
        error.request = axiosError.request;
        error.response = axiosError.response ? {
            data: axiosError.response.data,
            status: axiosError.response.status,
            statusText: axiosError.response.statusText,
            headers: axiosError.response.headers,
            config: (axiosError.config || {}),
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
        return error;
    }
    /**
     * 요청 ID 생성
     */
    generateRequestId() {
        return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=HttpClient.js.map