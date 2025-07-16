/**
 * @company/auth - Session Manager
 * Pure session management for authentication
 */
interface Result<T, E = string> {
    success: boolean;
    data?: T;
    error?: E;
}
import { AuthConfig, AuthUser, AuthSession, AuthTokens, SessionStorage } from '../types';
export declare class SessionManager implements SessionStorage {
    private config;
    private currentSession;
    private sessionKey;
    constructor(config: AuthConfig);
    /**
     * 현재 사용자 조회
     */
    getCurrentUser(): AuthUser | null;
    /**
     * 현재 세션 조회
     */
    getCurrentSession(): AuthSession | null;
    /**
     * 세션 생성
     */
    createSession(user: AuthUser, tokens: AuthTokens): Result<AuthSession>;
    /**
     * 세션 설정
     */
    setSession(session: AuthSession): void;
    /**
     * 세션 삭제
     */
    clearSession(): void;
    /**
     * 인증 상태 확인
     */
    isAuthenticated(): boolean;
    /**
     * 마지막 활동 시간 업데이트
     */
    updateLastActivity(): void;
    /**
     * 토큰 업데이트 (토큰 갱신 시 사용)
     */
    updateTokens(tokens: AuthTokens): void;
    /**
     * 사용자 정보 업데이트
     */
    updateUser(user: AuthUser): void;
    /**
     * 세션 유효성 확인
     */
    isSessionValid(): boolean;
    /**
     * 세션 만료까지 남은 시간 (초)
     */
    getTimeUntilExpiry(): number;
    /**
     * 세션 연장
     */
    extendSession(): boolean;
    /**
     * 세션 정보 요약
     */
    getSessionSummary(): {
        userId: string;
        userEmail: string;
        userName: string;
        issuedAt: Date;
        expiresAt: Date;
        timeUntilExpiry: number;
        isValid: boolean;
    } | null;
    /**
     * 저장소에서 세션 로드
     */
    private loadSessionFromStorage;
    /**
     * 세션을 저장소에 저장
     */
    private saveSessionToStorage;
    /**
     * 마지막 활동 시간 조회
     */
    private getLastActivity;
    /**
     * 클라이언트 IP 주소 추정 (제한적)
     */
    private getClientIP;
    /**
     * User Agent 조회
     */
    private getUserAgent;
    /**
     * 세션 자동 정리 설정
     */
    setupSessionCleanup(): void;
}
export {};
//# sourceMappingURL=SessionManager.d.ts.map