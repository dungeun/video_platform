/**
 * @company/auth - Pure Authentication Module
 *
 * 초세분화 모듈 - 순수 로그인/로그아웃 기능만 제공
 * Ultra-Fine-Grained Module - Login/Logout Functionality Only
 *
 * @version 1.0.0
 * @author Enterprise AI Team
 */
export { AuthService } from './auth/AuthService';
export { TokenManager } from './auth/TokenManager';
export { SessionManager } from './auth/SessionManager';
export { useAuth, useAuthUser, useAuthStatus, useIsAuthenticated, useAuthSession, useAuthError, useAuthLoading } from './hooks/useAuth';
export { AuthProvider, SimpleAuthProvider, useAuthContext, useAuthService, useAuthConfig, withAuth } from './providers/AuthProvider';
export { LoginForm, LogoutButton, AuthStatus as AuthStatusComponent } from './components';
export { useAuthStore, subscribeToAuthChanges, subscribeToUser, subscribeToStatus, subscribeToSession, authActions, getAuthState, isCurrentlyAuthenticated, getCurrentUser, getCurrentSession, getAuthStatus, getAuthError, resetAuthStore } from './providers/AuthStore';
export type { AuthUser, LoginCredentials, AuthTokens, AuthSession, AuthState, AuthEvent, AuthConfig, LoginResponse, RefreshTokenResponse, LogoutResponse, UseAuthReturn, AuthResult, TokenInfo, TokenStorage, SessionStorage } from './types';
export { AuthStatus, AuthEventType, AuthErrorCode } from './types';
export declare const AUTH_MODULE_INFO: {
    readonly name: "@company/auth";
    readonly version: "1.0.0";
    readonly description: "Pure Authentication Module - Login/Logout Only";
    readonly author: "Enterprise AI Team";
    readonly license: "MIT";
    readonly dependencies: readonly ["@company/core", "@company/types", "@company/utils", "@company/api-client"];
    readonly features: readonly ["login", "logout", "session-management", "token-management"];
};
export interface DefaultAuthConfig {
    sessionTimeout: number;
    rememberMeDuration: number;
    autoRefreshToken: boolean;
    logoutOnWindowClose: boolean;
}
export declare const DEFAULT_AUTH_CONFIG: DefaultAuthConfig;
export interface MinimalAuthConfig {
    apiUrl: string;
    tokenStorageKey: string;
    refreshTokenKey: string;
}
export type FullAuthConfig = DefaultAuthConfig & MinimalAuthConfig;
/**
 * 기본 인증 설정 생성
 */
export declare function createAuthConfig(overrides?: Partial<FullAuthConfig>): FullAuthConfig;
/**
 * 간단한 인증 서비스 팩토리
 */
export declare function createAuthService(config?: Partial<FullAuthConfig>): any;
/**
 * 이메일 형식 검증
 */
export declare function validateEmail(email: string): boolean;
/**
 * 토큰 페이로드 디코딩 (클라이언트 사이드)
 */
export declare function decodeJwtPayload(token: string): any | null;
/**
 * 토큰 만료 시간 확인
 */
export declare function isTokenExpired(token: string): boolean;
/**
 * 로그인 자격 증명 검증
 */
export declare function validateLoginCredentials(credentials: any): {
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=index.d.ts.map