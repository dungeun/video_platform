/**
 * @repo/auth-core - useAuth 훅
 * 인증 상태 관리 및 인증 관련 작업을 위한 React 훅
 */

import { useCallback, useEffect, useState } from 'react';
import { 
  UseAuthReturn, 
  AuthStatus, 
  UserProfile, 
  AuthSession, 
  LoginCredentials,
  SignupData,
  LoginResponse,
  SignupResponse,
  RefreshTokenResponse,
  PasswordChangeData,
  AuthResult
} from '../types';
import { useAuthStore } from '../providers/AuthStore';
import { AuthService } from '../auth/AuthService';

/**
 * 인증 상태 및 기능을 제공하는 훅
 */
export function useAuth(): UseAuthReturn {
  const {
    user,
    session,
    status,
    error,
    isLoading,
    setUser,
    setSession,
    setStatus,
    setError,
    setLoading,
    clearAuth
  } = useAuthStore();

  const [authService, setAuthService] = useState<AuthService | null>(null);

  // AuthService 초기화
  useEffect(() => {
    // 실제 환경에서는 config를 props나 context에서 받아와야 함
    const defaultConfig = {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
      tokenStorageKey: 'auth-token',
      refreshTokenKey: 'refresh-token',
      sessionTimeout: 120, // 2시간
      rememberMeDuration: 30, // 30일
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true,
        preventUserInfo: true,
        historyCount: 5
      },
      socialProviders: [],
      enableTwoFactor: false,
      enableSocialLogin: false,
      enableRememberMe: true,
      autoRefreshToken: true,
      logoutOnWindowClose: false
    };

    const service = new AuthService(defaultConfig);
    setAuthService(service);

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
        } else {
          setStatus(AuthStatus.UNAUTHENTICATED);
        }
      } catch (error) {
        setError('인증 상태 확인 중 오류가 발생했습니다');
        setStatus(AuthStatus.ERROR);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 정리
    return () => {
      service.destroy();
    };
  }, [setUser, setSession, setStatus, setError, setLoading]);

  // ===== 인증 메소드 =====

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResult<LoginResponse>> => {
    if (!authService) {
      return { success: false, error: '인증 서비스가 초기화되지 않았습니다' };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await authService.login(credentials);

      if (result.success && result.data) {
        // 2FA가 필요한 경우
        if (result.data.twoFactorRequired) {
          setStatus(AuthStatus.UNAUTHENTICATED);
          return result;
        }

        // 정상 로그인
        setUser(result.data.user);
        const currentSession = authService.getCurrentSession();
        if (currentSession) {
          setSession(currentSession);
        }
        setStatus(AuthStatus.AUTHENTICATED);
      } else {
        setError(result.error || '로그인에 실패했습니다');
        setStatus(AuthStatus.UNAUTHENTICATED);
      }

      return result;

    } catch (error) {
      const errorMessage = '로그인 처리 중 오류가 발생했습니다';
      setError(errorMessage);
      setStatus(AuthStatus.ERROR);
      return { success: false, error: errorMessage };

    } finally {
      setLoading(false);
    }
  }, [authService, setLoading, setError, setUser, setSession, setStatus]);

  const logout = useCallback(async (): Promise<AuthResult<void>> => {
    if (!authService) {
      return { success: false, error: '인증 서비스가 초기화되지 않았습니다' };
    }

    setLoading(true);

    try {
      const result = await authService.logout();

      // 로그아웃은 성공/실패와 관계없이 로컬 상태 정리
      clearAuth();
      setStatus(AuthStatus.UNAUTHENTICATED);

      return result;

    } catch (error) {
      // 에러가 발생해도 로컬 상태는 정리
      clearAuth();
      setStatus(AuthStatus.UNAUTHENTICATED);
      return { success: false, error: '로그아웃 처리 중 오류가 발생했습니다' };

    } finally {
      setLoading(false);
    }
  }, [authService, setLoading, clearAuth, setStatus]);

  const signup = useCallback(async (data: SignupData): Promise<AuthResult<SignupResponse>> => {
    if (!authService) {
      return { success: false, error: '인증 서비스가 초기화되지 않았습니다' };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await authService.signup(data);

      if (result.success && result.data) {
        // 이메일 인증이 필요한 경우
        if (result.data.verificationRequired) {
          setStatus(AuthStatus.UNAUTHENTICATED);
          return result;
        }

        // 자동 로그인 성공
        setUser(result.data.user);
        const currentSession = authService.getCurrentSession();
        if (currentSession) {
          setSession(currentSession);
        }
        setStatus(AuthStatus.AUTHENTICATED);
      } else {
        setError(result.error || '회원가입에 실패했습니다');
        setStatus(AuthStatus.UNAUTHENTICATED);
      }

      return result;

    } catch (error) {
      const errorMessage = '회원가입 처리 중 오류가 발생했습니다';
      setError(errorMessage);
      setStatus(AuthStatus.ERROR);
      return { success: false, error: errorMessage };

    } finally {
      setLoading(false);
    }
  }, [authService, setLoading, setError, setUser, setSession, setStatus]);

  const refreshToken = useCallback(async (): Promise<AuthResult<RefreshTokenResponse>> => {
    if (!authService) {
      return { success: false, error: '인증 서비스가 초기화되지 않았습니다' };
    }

    try {
      const result = await authService.refreshToken();

      if (!result.success) {
        // 토큰 갱신 실패 시 로그아웃 처리
        clearAuth();
        setStatus(AuthStatus.UNAUTHENTICATED);
      }

      return result;

    } catch (error) {
      clearAuth();
      setStatus(AuthStatus.UNAUTHENTICATED);
      return { success: false, error: '토큰 갱신 중 오류가 발생했습니다' };
    }
  }, [authService, clearAuth, setStatus]);

  const updateProfile = useCallback(async (data: Partial<UserProfile>): Promise<AuthResult<UserProfile>> => {
    if (!authService) {
      return { success: false, error: '인증 서비스가 초기화되지 않았습니다' };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await authService.updateProfile(data);

      if (result.success && result.data) {
        setUser(result.data);
      } else {
        setError(result.error || '프로필 업데이트에 실패했습니다');
      }

      return result;

    } catch (error) {
      const errorMessage = '프로필 업데이트 중 오류가 발생했습니다';
      setError(errorMessage);
      return { success: false, error: errorMessage };

    } finally {
      setLoading(false);
    }
  }, [authService, setLoading, setError, setUser]);

  const changePassword = useCallback(async (data: PasswordChangeData): Promise<AuthResult<void>> => {
    if (!authService) {
      return { success: false, error: '인증 서비스가 초기화되지 않았습니다' };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await authService.changePassword(data);

      if (!result.success) {
        setError(result.error || '비밀번호 변경에 실패했습니다');
      }

      return result;

    } catch (error) {
      const errorMessage = '비밀번호 변경 중 오류가 발생했습니다';
      setError(errorMessage);
      return { success: false, error: errorMessage };

    } finally {
      setLoading(false);
    }
  }, [authService, setLoading, setError]);

  // ===== 권한 확인 메소드 =====

  const hasPermission = useCallback((permission: string): boolean => {
    return authService?.hasPermission(permission) || false;
  }, [authService]);

  const hasRole = useCallback((role: string): boolean => {
    return authService?.hasRole(role) || false;
  }, [authService]);

  // ===== 유틸리티 메소드 =====

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

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
    if (!authService || !isAuthenticated) {
      return;
    }

    const interval = setInterval(async () => {
      const tokenInfo = authService.getTokenInfo();
      
      if (tokenInfo?.isValid && tokenInfo.timeUntilExpiry < 300) { // 5분 남음
        await refreshToken();
      }
    }, 60000); // 1분마다 체크

    return () => clearInterval(interval);
  }, [authService, isAuthenticated, refreshToken]);

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
    signup,
    refreshToken,
    updateProfile,
    changePassword,

    // 권한 체크
    hasPermission,
    hasRole,

    // 유틸리티
    clearError
  };
}