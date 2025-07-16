/**
 * @repo/auth - Authentication Provider
 * React Context provider for pure authentication
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { AuthConfig } from '../types';
import { AuthService } from '../auth/AuthService';

interface AuthContextValue {
  authService: AuthService | null;
  config: AuthConfig;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  config: AuthConfig;
  authService?: AuthService;
}

export function AuthProvider({ children, config, authService: externalAuthService }: AuthProviderProps) {
  const [authService, setAuthService] = React.useState<AuthService | null>(externalAuthService || null);

  useEffect(() => {
    if (!externalAuthService) {
      const service = new AuthService(config);
      setAuthService(service);

      // 토큰 및 세션 자동 정리 설정은 서비스 내부에서 처리

      return () => {
        service.destroy();
      };
    }
  }, [config, externalAuthService]);

  const contextValue: AuthContextValue = {
    authService: externalAuthService || authService,
    config
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}

// AuthProvider를 사용하는 편의 함수들
export function useAuthService(): AuthService | null {
  const { authService } = useAuthContext();
  return authService;
}

export function useAuthConfig(): AuthConfig {
  const { config } = useAuthContext();
  return config;
}

// HOC for protecting components
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { authService } = useAuthContext();
    
    if (!authService?.isAuthenticated()) {
      return (
        <div className="auth-required">
          <p>로그인이 필요합니다.</p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// 기본 설정으로 AuthProvider 래핑하는 편의 컴포넌트
interface SimpleAuthProviderProps {
  children: ReactNode;
  apiUrl?: string;
  tokenStorageKey?: string;
  refreshTokenKey?: string;
}

export function SimpleAuthProvider({ 
  children, 
  apiUrl = '/api',
  tokenStorageKey = 'auth-token',
  refreshTokenKey = 'refresh-token'
}: SimpleAuthProviderProps) {
  const defaultConfig: AuthConfig = {
    apiUrl,
    tokenStorageKey,
    refreshTokenKey,
    sessionTimeout: 120, // 2시간
    rememberMeDuration: 30, // 30일
    autoRefreshToken: true,
    logoutOnWindowClose: false
  };

  return (
    <AuthProvider config={defaultConfig}>
      {children}
    </AuthProvider>
  );
}