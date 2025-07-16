/**
 * @company/api-client - 로깅 인터셉터
 * HTTP 요청/응답 로깅
 */
import { RequestInterceptor, ResponseInterceptor } from '../types';
export interface LoggingInterceptorConfig {
    logRequest?: boolean;
    logResponse?: boolean;
    logError?: boolean;
    logHeaders?: boolean;
    logBody?: boolean;
    excludeUrls?: (string | RegExp)[];
    sensitiveHeaders?: string[];
    maxBodyLength?: number;
}
export declare class LoggingInterceptor {
    private logger;
    private config;
    private requestMap;
    constructor(config?: LoggingInterceptorConfig);
    /**
     * 요청 인터셉터 생성
     */
    createRequestInterceptor(): RequestInterceptor;
    /**
     * 응답 인터셉터 생성
     */
    createResponseInterceptor(): ResponseInterceptor;
    /**
     * 제외 URL 확인
     */
    private isExcludedUrl;
    /**
     * 민감한 헤더 필터링
     */
    private sanitizeHeaders;
    /**
     * 바디 내용 축약
     */
    private truncateBody;
    /**
     * 요청 ID 생성
     */
    private generateRequestId;
    /**
     * 성능 측정 시작
     */
    startMeasure(label: string): void;
    /**
     * 성능 측정 종료
     */
    endMeasure(label: string): number;
}
//# sourceMappingURL=LoggingInterceptor.d.ts.map