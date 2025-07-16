/**
 * @company/api-client - 인증 인터셉터
 * 자동 토큰 주입 및 갱신
 */
import { RequestInterceptor, ResponseInterceptor, HttpError } from '../types';
export interface AuthInterceptorConfig {
    getToken: () => string | Promise<string> | null;
    setToken?: (token: string) => void | Promise<void>;
    refreshToken?: () => Promise<string>;
    onAuthError?: (error: HttpError) => void;
    headerName?: string;
    headerPrefix?: string;
    excludeUrls?: (string | RegExp)[];
}
export declare class AuthInterceptor {
    private logger;
    private config;
    private isRefreshing;
    private refreshPromise;
    constructor(config: AuthInterceptorConfig);
    /**
     * 요청 인터셉터 생성
     */
    createRequestInterceptor(): RequestInterceptor;
    /**
     * 응답 인터셉터 생성
     */
    createResponseInterceptor(): ResponseInterceptor;
    /**
     * 401 에러 처리 (토큰 갱신)
     */
    private handleUnauthorized;
    /**
     * 토큰 갱신 (중복 요청 방지)
     */
    private refreshAuthToken;
    /**
     * 제외 URL 확인
     */
    private isExcludedUrl;
    /**
     * 수동 토큰 갱신
     */
    forceRefresh(): Promise<void>;
    /**
     * 인증 헤더 제거
     */
    removeAuthHeader(config: any): void;
}
//# sourceMappingURL=AuthInterceptor.d.ts.map