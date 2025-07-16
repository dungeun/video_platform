/**
 * @repo/auth - Pure Authentication Service
 * Ultra-Fine-Grained Module - Login/Logout Only
 */
interface Result<T, E = string> {
    success: boolean;
    data?: T;
    error?: E;
}
declare class ModuleBase {
    protected logger: {
        info: (...args: any[]) => void;
        debug: (...args: any[]) => void;
        warn: (...args: any[]) => void;
        error: (...args: any[]) => void;
    };
    protected errorHandler: {
        handle: (error: any, message: string) => string;
    };
    constructor(config: any);
    protected safeExecute<T>(fn: () => Promise<T>, errorMessage: string): Promise<Result<T>>;
    emit(event: string, data?: any): void;
    destroy(): void;
}
import { AuthConfig, LoginCredentials, AuthSession, LoginResponse, RefreshTokenResponse, LogoutResponse, AuthResult, AuthUser } from '../types';
export declare class AuthService extends ModuleBase {
    private tokenManager;
    private sessionManager;
    private httpClient;
    private authConfig;
    constructor(config: AuthConfig);
    protected onInitialize(): Promise<Result<void>>;
    protected onDestroy(): Promise<Result<void>>;
    healthCheck(): Promise<Result<boolean>>;
    /**
     * 사용자 로그인
     */
    login(credentials: LoginCredentials): Promise<AuthResult<LoginResponse>>;
    /**
     * 로그아웃
     */
    logout(): Promise<AuthResult<LogoutResponse>>;
    /**
     * 토큰 갱신
     */
    refreshToken(): Promise<AuthResult<RefreshTokenResponse>>;
    /**
     * 현재 사용자 조회
     */
    getCurrentUser(): AuthUser | null;
    /**
     * 현재 세션 조회
     */
    getCurrentSession(): AuthSession | null;
    /**
     * 인증 상태 확인
     */
    isAuthenticated(): boolean;
    /**
     * 토큰 정보 조회
     */
    getTokenInfo(): import("../types").TokenInfo;
    /**
     * 세션 유효성 확인
     */
    checkSession(): boolean;
    private validateLoginCredentials;
    private isValidEmail;
    private setupAutoRefresh;
}
export {};
//# sourceMappingURL=AuthService.d.ts.map