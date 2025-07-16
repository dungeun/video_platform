/**
 * @repo/auth-core - 인증 프로바이더
 * React Context를 통한 인증 상태 제공
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { AuthConfig } from '../types';
import { useAuth } from '../hooks/useAuth';
import { AuthService } from '../auth/AuthService';

interface AuthContextValue {
  authService: AuthService | null;
  config: AuthConfig;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  config: AuthConfig;
}

export function AuthProvider({ children, config }: AuthProviderProps) {
  const [authService, setAuthService] = React.useState<AuthService | null>(null);

  useEffect(() => {
    const service = new AuthService(config);
    setAuthService(service);

    return () => {
      service.destroy();
    };
  }, [config]);

  const contextValue: AuthContextValue = {
    authService,
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