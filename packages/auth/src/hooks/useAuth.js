/**
 * @repo/auth - useAuth Hook
 * Pure authentication hook for login/logout functionality
 */
import { useCallback, useEffect, useState } from 'react';
import { AuthStatus } from '../types';
import { useAuthStore } from '../providers/AuthStore';
import { AuthService } from '../auth/AuthService';
/**
 * 순수 인증 기능을 제공하는 훅 (로그인/로그아웃만)
 */
export function useAuth(authService) {
    const { user, session, status, error, isLoading, setUser, setSession, setStatus, setError, setLoading, clearAuth } = useAuthStore();
    const [internalAuthService, setInternalAuthService] = useState(authService || null);
    // AuthService 초기화 (외부에서 제공되지 않은 경우)
    useEffect(() => {
        if (!authService && !internalAuthService) {
            // 기본 설정으로 AuthService 생성
            const defaultConfig = {
                apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
                tokenStorageKey: 'auth-token',
                refreshTokenKey: 'refresh-token',
                sessionTimeout: 120, // 2시간
                rememberMeDuration: 30, // 30일
                autoRefreshToken: true,
                logoutOnWindowClose: false
            };
            const service = new AuthService(defaultConfig);
            setInternalAuthService(service);
            // 초기 세션 복원 시도
            const initializeAuth = async () => {
                setLoading(true);
                setStatus(AuthStatus.LOADING);
                try {
                    const currentUser = service.getCurrentUser();
                    const currentSession = service.getCurrentSession();
                    if (currentUser && currentSession && service.isAuthenticated()) {
                        setUser(currentUser);
                        setSession(currentSession);
                        setStatus(AuthStatus.AUTHENTICATED);
                    }
                    else {
                        setStatus(AuthStatus.UNAUTHENTICATED);
                    }
                }
                catch (error) {
                    setError('인증 상태 확인 중 오류가 발생했습니다');
                    setStatus(AuthStatus.ERROR);
                }
                finally {
                    setLoading(false);
                }
            };
            initializeAuth();
            // 정리
            return () => {
                service.destroy();
            };
        }
    }, [authService, internalAuthService, setUser, setSession, setStatus, setError, setLoading]);
    const currentAuthService = authService || internalAuthService;
    // ===== 인증 메소드 =====
    const login = useCallback(async (credentials) => {
        if (!currentAuthService) {
            return { success: false, error: '인증 서비스가 초기화되지 않았습니다' };
        }
        setLoading(true);
        setError(null);
        setStatus(AuthStatus.LOADING);
        try {
            const result = await currentAuthService.login(credentials);
            if (result.success && result.data) {
                setUser(result.data.user);
                const currentSession = currentAuthService.getCurrentSession();
                if (currentSession) {
                    setSession(currentSession);
                }
                setStatus(AuthStatus.AUTHENTICATED);
            }
            else {
                setError(result.error || '로그인에 실패했습니다');
                setStatus(AuthStatus.UNAUTHENTICATED);
            }
            return result;
        }
        catch (error) {
            const errorMessage = '로그인 처리 중 오류가 발생했습니다';
            setError(errorMessage);
            setStatus(AuthStatus.ERROR);
            return { success: false, error: errorMessage };
        }
        finally {
            setLoading(false);
        }
    }, [currentAuthService, setLoading, setError, setUser, setSession, setStatus]);
    const logout = useCallback(async () => {
        if (!currentAuthService) {
            return { success: false, error: '인증 서비스가 초기화되지 않았습니다' };
        }
        setLoading(true);
        try {
            const result = await currentAuthService.logout();
            // 로그아웃은 성공/실패와 관계없이 로컬 상태 정리
            clearAuth();
            setStatus(AuthStatus.UNAUTHENTICATED);
            return result;
        }
        catch (error) {
            // 에러가 발생해도 로컬 상태는 정리
            clearAuth();
            setStatus(AuthStatus.UNAUTHENTICATED);
            return { success: false, error: '로그아웃 처리 중 오류가 발생했습니다' };
        }
        finally {
            setLoading(false);
        }
    }, [currentAuthService, setLoading, clearAuth, setStatus]);
    const refreshToken = useCallback(async () => {
        if (!currentAuthService) {
            return { success: false, error: '인증 서비스가 초기화되지 않았습니다' };
        }
        try {
            const result = await currentAuthService.refreshToken();
            if (!result.success) {
                // 토큰 갱신 실패 시 로그아웃 처리
                clearAuth();
                setStatus(AuthStatus.UNAUTHENTICATED);
            }
            else {
                // 세션 정보 업데이트
                const currentSession = currentAuthService.getCurrentSession();
                if (currentSession) {
                    setSession(currentSession);
                }
            }
            return result;
        }
        catch (error) {
            clearAuth();
            setStatus(AuthStatus.UNAUTHENTICATED);
            return { success: false, error: '토큰 갱신 중 오류가 발생했습니다' };
        }
    }, [currentAuthService, clearAuth, setStatus, setSession]);
    // ===== 유틸리티 메소드 =====
    const clearError = useCallback(() => {
        setError(null);
    }, [setError]);
    const checkSession = useCallback(() => {
        if (!currentAuthService) {
            return false;
        }
        const isValid = currentAuthService.checkSession();
        if (!isValid && status === AuthStatus.AUTHENTICATED) {
            // 세션이 유효하지 않으면 상태 정리
            clearAuth();
            setStatus(AuthStatus.UNAUTHENTICATED);
        }
        return isValid;
    }, [currentAuthService, status, clearAuth, setStatus]);
    const isAuthenticated = status === AuthStatus.AUTHENTICATED && !!user;
    // ===== 이벤트 리스너 설정 =====
    useEffect(() => {
        // 세션 만료 이벤트 리스너
        const handleSessionExpired = () => {
            clearAuth();
            setStatus(AuthStatus.UNAUTHENTICATED);
            setError('세션이 만료되었습니다. 다시 로그인해주세요.');
        };
        window.addEventListener('auth:session-expired', handleSessionExpired);
        return () => {
            window.removeEventListener('auth:session-expired', handleSessionExpired);
        };
    }, [clearAuth, setStatus, setError]);
    // ===== 자동 토큰 갱신 =====
    useEffect(() => {
        if (!currentAuthService || !isAuthenticated) {
            return;
        }
        const interval = setInterval(async () => {
            const tokenInfo = currentAuthService.getTokenInfo();
            if (tokenInfo?.isValid && tokenInfo.timeUntilExpiry < 300) { // 5분 남음
                await refreshToken();
            }
        }, 60000); // 1분마다 체크
        return () => clearInterval(interval);
    }, [currentAuthService, isAuthenticated, refreshToken]);
    // ===== 주기적 세션 체크 =====
    useEffect(() => {
        if (!currentAuthService) {
            return;
        }
        const interval = setInterval(() => {
            checkSession();
        }, 30000); // 30초마다 체크
        return () => clearInterval(interval);
    }, [currentAuthService, checkSession]);
    return {
        // 상태
        user,
        session,
        status,
        isLoading,
        isAuthenticated,
        error,
        // 메소드
        login,
        logout,
        refreshToken,
        // 유틸리티
        clearError,
        checkSession
    };
}
// 편의 훅들
export function useAuthUser() {
    return useAuthStore((state) => state.user);
}
export function useAuthStatus() {
    return useAuthStore((state) => state.status);
}
export function useIsAuthenticated() {
    const status = useAuthStatus();
    const user = useAuthUser();
    return status === AuthStatus.AUTHENTICATED && !!user;
}
export function useAuthSession() {
    return useAuthStore((state) => state.session);
}
export function useAuthError() {
    return useAuthStore((state) => state.error);
}
export function useAuthLoading() {
    return useAuthStore((state) => state.isLoading);
}
//# sourceMappingURL=useAuth.js.map