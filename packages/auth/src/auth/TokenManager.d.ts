/**
 * @company/auth - Token Manager
 * Pure token management for authentication
 */
import { AuthConfig, AuthTokens, TokenInfo, TokenStorage } from '../types';
export declare class TokenManager implements TokenStorage {
    private config;
    private currentTokens;
    constructor(config: AuthConfig);
    /**
     * 액세스 토큰 조회
     */
    getAccessToken(): string | null;
    /**
     * 리프레시 토큰 조회
     */
    getRefreshToken(): string | null;
    /**
     * 토큰 저장
     */
    setTokens(tokens: AuthTokens): void;
    /**
     * 토큰 삭제
     */
    clearTokens(): void;
    /**
     * 토큰 정보 조회
     */
    getTokenInfo(): TokenInfo;
    /**
     * 토큰 유효성 확인
     */
    isValidToken(): boolean;
    /**
     * 토큰 만료 시간 조회
     */
    getTokenExpiry(): Date | null;
    /**
     * 토큰이 곧 만료되는지 확인
     */
    isTokenExpiringSoon(minutesThreshold?: number): boolean;
    /**
     * JWT 토큰 페이로드 디코딩 (클라이언트 사이드)
     */
    decodeTokenPayload(token?: string): any | null;
    /**
     * 저장소에서 토큰 로드
     */
    private loadTokensFromStorage;
    /**
     * 토큰 자동 정리 설정
     */
    setupTokenCleanup(): void;
}
//# sourceMappingURL=TokenManager.d.ts.map