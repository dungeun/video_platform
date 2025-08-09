import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  type: 'BUSINESS' | 'INFLUENCER' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  userType: 'BUSINESS' | 'INFLUENCER';
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const router = useRouter();

  // 토큰 관리
  const getAccessToken = useCallback(() => {
    return localStorage.getItem('accessToken');
  }, []);

  const setAccessToken = useCallback((token: string) => {
    localStorage.setItem('accessToken', token);
    // 쿠키에도 토큰 저장 (미들웨어 호환성을 위해)
    document.cookie = `accessToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=lax`;
    document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=lax`;
  }, []);

  const clearTokens = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    // 쿠키도 제거
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }, []);

  // 현재 사용자 정보 가져오기
  const getCurrentUser = useCallback(async () => {
    const token = getAccessToken();
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // 먼저 localStorage에서 사용자 정보를 읽어옴
      const userData = JSON.parse(storedUser);
      setAuthState({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // /api/auth/me 엔드포인트가 있다면 백그라운드에서 검증
      // 없어도 localStorage 데이터로 작동
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then(response => {
        if (!response.ok) {
          // 토큰이 만료되었거나 유효하지 않은 경우에만 로그아웃
          if (response.status === 401) {
            clearTokens();
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      }).catch(() => {
        // /api/auth/me 엔드포인트가 없어도 localStorage 데이터로 계속 작동
        console.log('Auth verification endpoint not available, using cached data');
      });
      
    } catch (error) {
      console.error('Auth error:', error);
      // localStorage 파싱 실패 시
      clearTokens();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, [getAccessToken, clearTokens]);

  // 로그인
  const login = useCallback(async (data: LoginData) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        // Handle both 'token' and 'accessToken' fields for compatibility
        const token = result.accessToken || result.token;
        if (token) {
          setAccessToken(token);
          // Also save to auth-token for compatibility
          localStorage.setItem('auth-token', token);
        }
        // Save user to localStorage
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user));
        }
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }, [setAccessToken]);

  // 회원가입
  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        // Handle nested tokens structure from register endpoint
        const token = result.tokens?.accessToken || result.accessToken || result.token;
        if (token) {
          setAccessToken(token);
          // Also save to auth-token for compatibility
          localStorage.setItem('auth-token', token);
        }
        // Save user to localStorage
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user));
        }
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }, [setAccessToken]);

  // 로그아웃
  const logout = useCallback(async () => {
    const token = getAccessToken();
    
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    clearTokens();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    router.push('/');
  }, [getAccessToken, clearTokens, router]);

  // 초기화
  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    register,
    logout,
    getCurrentUser,
  };
}