/**
 * @repo/auth - useAuth Hook
 * Pure authentication hook for login/logout functionality
 */
import { UseAuthReturn, AuthStatus, AuthUser, AuthSession } from '../types';
import { AuthService } from '../auth/AuthService';
/**
 * 순수 인증 기능을 제공하는 훅 (로그인/로그아웃만)
 */
export declare function useAuth(authService?: AuthService): UseAuthReturn;
export declare function useAuthUser(): AuthUser | null;
export declare function useAuthStatus(): AuthStatus;
export declare function useIsAuthenticated(): boolean;
export declare function useAuthSession(): AuthSession | null;
export declare function useAuthError(): string | null;
export declare function useAuthLoading(): boolean;
//# sourceMappingURL=useAuth.d.ts.map