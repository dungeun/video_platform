/**
 * @company/api-client - 인증 인터셉터
 * 자동 토큰 주입 및 갱신
 */
import { Logger } from '@company/core';
export class AuthInterceptor {
    constructor(config) {
        this.isRefreshing = false;
        this.refreshPromise = null;
        this.logger = new Logger('AuthInterceptor');
        this.config = {
            headerName: 'Authorization',
            headerPrefix: 'Bearer',
            excludeUrls: [],
            ...config
        };
    }
    /**
     * 요청 인터셉터 생성
     */
    createRequestInterceptor() {
        return {
            onFulfilled: async (config) => {
                // 제외 URL 확인
                if (this.isExcludedUrl(config.url || '')) {
                    return config;
                }
                // 토큰 가져오기
                const token = await this.config.getToken();
                if (token) {
                    config.headers = config.headers || {};
                    config.headers[this.config.headerName] =
                        `${this.config.headerPrefix} ${token}`.trim();
                    this.logger.debug('인증 헤더 추가', {
                        url: config.url,
                        headerName: this.config.headerName
                    });
                }
                return config;
            },
            onRejected: (error) => {
                this.logger.error('요청 인터셉터 에러', error);
                return Promise.reject(error);
            }
        };
    }
    /**
     * 응답 인터셉터 생성
     */
    createResponseInterceptor() {
        return {
            onFulfilled: (response) => response,
            onRejected: async (error) => {
                // 401 Unauthorized 처리
                if (error.response?.status === 401 && this.config.refreshToken) {
                    return this.handleUnauthorized(error);
                }
                // 403 Forbidden 처리
                if (error.response?.status === 403) {
                    this.logger.warn('접근 권한 없음', {
                        url: error.config?.url
                    });
                    if (this.config.onAuthError) {
                        this.config.onAuthError(error);
                    }
                }
                return Promise.reject(error);
            }
        };
    }
    /**
     * 401 에러 처리 (토큰 갱신)
     */
    async handleUnauthorized(error) {
        const originalRequest = error.config;
        if (!originalRequest) {
            return Promise.reject(error);
        }
        // 이미 재시도한 요청인 경우
        if (originalRequest._retry) {
            this.logger.warn('토큰 갱신 후에도 인증 실패');
            if (this.config.onAuthError) {
                this.config.onAuthError(error);
            }
            return Promise.reject(error);
        }
        // 재시도 플래그 설정
        originalRequest._retry = true;
        try {
            // 토큰 갱신
            const newToken = await this.refreshAuthToken();
            // 새 토큰 저장
            if (this.config.setToken) {
                await this.config.setToken(newToken);
            }
            // 원래 요청에 새 토큰 적용
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers[this.config.headerName] =
                `${this.config.headerPrefix} ${newToken}`.trim();
            this.logger.info('토큰 갱신 후 요청 재시도', {
                url: originalRequest.url
            });
            // axios 인스턴스를 통해 재시도
            // 실제 구현에서는 axios 인스턴스 참조가 필요
            return Promise.reject(error);
        }
        catch (refreshError) {
            this.logger.error('토큰 갱신 실패', refreshError);
            if (this.config.onAuthError) {
                this.config.onAuthError(error);
            }
            return Promise.reject(error);
        }
    }
    /**
     * 토큰 갱신 (중복 요청 방지)
     */
    async refreshAuthToken() {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshPromise = this.config.refreshToken()
                .finally(() => {
                this.isRefreshing = false;
                this.refreshPromise = null;
            });
        }
        return this.refreshPromise;
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
     * 수동 토큰 갱신
     */
    async forceRefresh() {
        if (!this.config.refreshToken) {
            throw new Error('refreshToken 함수가 설정되지 않았습니다');
        }
        const newToken = await this.config.refreshToken();
        if (this.config.setToken) {
            await this.config.setToken(newToken);
        }
        this.logger.info('수동 토큰 갱신 완료');
    }
    /**
     * 인증 헤더 제거
     */
    removeAuthHeader(config) {
        if (config.headers && config.headers[this.config.headerName]) {
            delete config.headers[this.config.headerName];
            this.logger.debug('인증 헤더 제거', { url: config.url });
        }
    }
}
//# sourceMappingURL=AuthInterceptor.js.map