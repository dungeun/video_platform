/**
 * @repo/auth - Pure Authentication Types
 * Ultra-Fine-Grained Module - Login/Logout Only
 */
interface Result<T, E = string> {
    success: boolean;
    data?: T;
    error?: E;
}
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    avatar?: string;
}
export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    tokenType: string;
}
export interface AuthSession {
    user: AuthUser;
    tokens: AuthTokens;
    issuedAt: Date;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
}
export declare enum AuthStatus {
    LOADING = "loading",
    AUTHENTICATED = "authenticated",
    UNAUTHENTICATED = "unauthenticated",
    ERROR = "error"
}
export interface AuthState {
    status: AuthStatus;
    user: AuthUser | null;
    session: AuthSession | null;
    error: string | null;
    isLoading: boolean;
    lastActivity: Date | null;
}
export declare enum AuthEventType {
    LOGIN = "auth.login",
    LOGOUT = "auth.logout",
    SESSION_EXPIRED = "auth.session.expired",
    TOKEN_REFRESHED = "auth.token.refreshed"
}
export interface AuthEvent {
    type: AuthEventType;
    user?: AuthUser;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface AuthConfig {
    apiUrl: string;
    tokenStorageKey: string;
    refreshTokenKey: string;
    sessionTimeout: number;
    rememberMeDuration: number;
    autoRefreshToken: boolean;
    logoutOnWindowClose: boolean;
}
export interface LoginResponse {
    user: AuthUser;
    tokens: AuthTokens;
    success: boolean;
    message?: string;
}
export interface RefreshTokenResponse {
    tokens: AuthTokens;
    success: boolean;
    message?: string;
}
export interface LogoutResponse {
    success: boolean;
    message?: string;
}
export declare enum AuthErrorCode {
    INVALID_CREDENTIALS = "AUTH_001",
    TOKEN_EXPIRED = "AUTH_005",
    TOKEN_INVALID = "AUTH_006",
    SESSION_EXPIRED = "AUTH_007",
    NETWORK_ERROR = "AUTH_008",
    UNKNOWN_ERROR = "AUTH_999"
}
export type AuthResult<T> = Result<T, string>;
export type AuthAction = {
    type: 'SET_LOADING';
    payload: boolean;
} | {
    type: 'SET_USER';
    payload: AuthUser | null;
} | {
    type: 'SET_SESSION';
    payload: AuthSession | null;
} | {
    type: 'SET_ERROR';
    payload: string | null;
} | {
    type: 'SET_STATUS';
    payload: AuthStatus;
} | {
    type: 'UPDATE_LAST_ACTIVITY';
} | {
    type: 'CLEAR_AUTH';
};
export interface UseAuthReturn {
    user: AuthUser | null;
    session: AuthSession | null;
    status: AuthStatus;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    login: (credentials: LoginCredentials) => Promise<AuthResult<LoginResponse>>;
    logout: () => Promise<AuthResult<LogoutResponse>>;
    refreshToken: () => Promise<AuthResult<RefreshTokenResponse>>;
    clearError: () => void;
    checkSession: () => boolean;
}
export interface TokenInfo {
    isValid: boolean;
    timeUntilExpiry: number;
    expiresAt: Date | null;
}
export interface TokenStorage {
    getAccessToken(): string | null;
    getRefreshToken(): string | null;
    setTokens(tokens: AuthTokens): void;
    clearTokens(): void;
    getTokenInfo(): TokenInfo;
}
export interface SessionStorage {
    getCurrentUser(): AuthUser | null;
    getCurrentSession(): AuthSession | null;
    setSession(session: AuthSession): void;
    clearSession(): void;
    isAuthenticated(): boolean;
    updateLastActivity(): void;
}
export {};
//# sourceMappingURL=index.d.ts.map