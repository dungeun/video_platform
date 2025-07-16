/**
 * @company/api-client - 로깅 인터셉터
 * HTTP 요청/응답 로깅
 */
import { Logger } from '@company/core';
export class LoggingInterceptor {
    constructor(config) {
        this.requestMap = new Map();
        this.logger = new Logger('HttpLogger');
        this.config = {
            logRequest: true,
            logResponse: true,
            logError: true,
            logHeaders: false,
            logBody: false,
            excludeUrls: [],
            sensitiveHeaders: ['authorization', 'cookie', 'x-api-key'],
            maxBodyLength: 1000,
            ...config
        };
    }
    /**
     * 요청 인터셉터 생성
     */
    createRequestInterceptor() {
        return {
            onFulfilled: (config) => {
                if (!this.config.logRequest || this.isExcludedUrl(config.url || '')) {
                    return config;
                }
                const requestId = config.headers?.['X-Request-ID'] || this.generateRequestId();
                config.headers = config.headers || {};
                config.headers['X-Request-ID'] = requestId;
                // 요청 시작 시간 기록
                this.requestMap.set(requestId, Date.now());
                const logData = {
                    requestId,
                    method: config.method?.toUpperCase(),
                    url: config.url,
                    baseURL: config.baseURL
                };
                if (this.config.logHeaders) {
                    logData.headers = this.sanitizeHeaders(config.headers);
                }
                if (this.config.logBody && config.data) {
                    logData.body = this.truncateBody(config.data);
                }
                if (config.params) {
                    logData.params = config.params;
                }
                this.logger.info('→ HTTP 요청', logData);
                return config;
            },
            onRejected: (error) => {
                if (this.config.logError) {
                    this.logger.error('요청 생성 실패', error);
                }
                return Promise.reject(error);
            }
        };
    }
    /**
     * 응답 인터셉터 생성
     */
    createResponseInterceptor() {
        return {
            onFulfilled: (response) => {
                if (!this.config.logResponse || this.isExcludedUrl(response.config.url || '')) {
                    return response;
                }
                const requestId = response.config.headers?.['X-Request-ID'];
                const startTime = this.requestMap.get(requestId);
                const duration = startTime ? Date.now() - startTime : 0;
                // 요청 시간 정리
                if (requestId) {
                    this.requestMap.delete(requestId);
                }
                const logData = {
                    requestId,
                    status: response.status,
                    statusText: response.statusText,
                    duration: `${duration}ms`,
                    url: response.config.url
                };
                if (this.config.logHeaders) {
                    logData.headers = this.sanitizeHeaders(response.headers);
                }
                if (this.config.logBody && response.data) {
                    logData.body = this.truncateBody(response.data);
                }
                this.logger.info('← HTTP 응답', logData);
                return response;
            },
            onRejected: (error) => {
                if (!this.config.logError || this.isExcludedUrl(error.config?.url || '')) {
                    return Promise.reject(error);
                }
                const requestId = error.config?.headers?.['X-Request-ID'];
                const startTime = this.requestMap.get(requestId);
                const duration = startTime ? Date.now() - startTime : 0;
                // 요청 시간 정리
                if (requestId) {
                    this.requestMap.delete(requestId);
                }
                const logData = {
                    requestId,
                    duration: `${duration}ms`,
                    url: error.config?.url,
                    message: error.message,
                    code: error.code
                };
                if (error.response) {
                    logData.status = error.response.status;
                    logData.statusText = error.response.statusText;
                    if (this.config.logBody && error.response.data) {
                        logData.body = this.truncateBody(error.response.data);
                    }
                }
                this.logger.error('✗ HTTP 에러', logData);
                return Promise.reject(error);
            }
        };
    }
    /**
     * 제외 URL 확인
     */
    isExcludedUrl(url) {
        return this.config.excludeUrls.some(pattern => {
            if (typeof pattern === 'string') {
                return url.includes(pattern);
            }
            return pattern.test(url);
        });
    }
    /**
     * 민감한 헤더 필터링
     */
    sanitizeHeaders(headers) {
        const sanitized = {};
        Object.entries(headers).forEach(([key, value]) => {
            const lowerKey = key.toLowerCase();
            if (this.config.sensitiveHeaders.includes(lowerKey)) {
                sanitized[key] = '[REDACTED]';
            }
            else {
                sanitized[key] = value;
            }
        });
        return sanitized;
    }
    /**
     * 바디 내용 축약
     */
    truncateBody(body) {
        if (!body) {
            return body;
        }
        const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        if (bodyStr.length <= this.config.maxBodyLength) {
            return body;
        }
        return `${bodyStr.substring(0, this.config.maxBodyLength)}... [truncated]`;
    }
    /**
     * 요청 ID 생성
     */
    generateRequestId() {
        return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 성능 측정 시작
     */
    startMeasure(label) {
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark(`${label}-start`);
        }
    }
    /**
     * 성능 측정 종료
     */
    endMeasure(label) {
        if (typeof performance !== 'undefined' && performance.measure) {
            performance.mark(`${label}-end`);
            performance.measure(label, `${label}-start`, `${label}-end`);
            const measures = performance.getEntriesByName(label);
            if (measures.length > 0) {
                const duration = measures[measures.length - 1].duration;
                // 측정 정리
                performance.clearMarks(`${label}-start`);
                performance.clearMarks(`${label}-end`);
                performance.clearMeasures(label);
                return duration;
            }
        }
        return 0;
    }
}
//# sourceMappingURL=LoggingInterceptor.js.map