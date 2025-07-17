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
  }, []);

  const clearTokens = useCallback(() => {
    localStorage.removeItem('accessToken');
  }, []);

  // 현재 사용자 정보 가져오기
  const getCurrentUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // 토큰이 유효하지 않음
        clearTokens();
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
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
        setAccessToken(result.accessToken);
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
        setAccessToken(result.accessToken);
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