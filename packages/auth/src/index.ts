/**
 * @company/auth - Pure Authentication Module
 * 
 * 초세분화 모듈 - 순수 로그인/로그아웃 기능만 제공
 * Ultra-Fine-Grained Module - Login/Logout Functionality Only
 * 
 * @version 1.0.0
 * @author Enterprise AI Team
 */

// ===== 핵심 서비스 =====
export { AuthService } from './auth/AuthService';
export { TokenManager } from './auth/TokenManager';
export { SessionManager } from './auth/SessionManager';

// ===== React 훅 =====
export { 
  useAuth,
  useAuthUser,
  useAuthStatus,
  useIsAuthenticated,
  useAuthSession,
  useAuthError,
  useAuthLoading
} from './hooks/useAuth';

// ===== React 컴포넌트 =====
export { AuthProvider, SimpleAuthProvider, useAuthContext, useAuthService, useAuthConfig, withAuth } from './providers/AuthProvider';
export { LoginForm, LogoutButton, AuthStatus as AuthStatusComponent } from './components';

// ===== 상태 관리 =====
export { 
  useAuthStore,
  subscribeToAuthChanges,
  subscribeToUser,
  subscribeToStatus,
  subscribeToSession,
  authActions,
  getAuthState,
  isCurrentlyAuthenticated,
  getCurrentUser,
  getCurrentSession,
  getAuthStatus,
  getAuthError,
  resetAuthStore
} from './providers/AuthStore';

// ===== 타입 정의 =====
export type {
  // 기본 타입
  AuthUser,
  
  // 인증 타입
  LoginCredentials,
  AuthTokens,
  AuthSession,
  
  // 상태 타입
  AuthState,
  AuthEvent,
  
  // 설정 타입
  AuthConfig,
  
  // API 응답 타입
  LoginResponse,
  RefreshTokenResponse,
  LogoutResponse,
  
  // 훅 타입
  UseAuthReturn,
  
  // 유틸리티 타입
  AuthResult,
  TokenInfo,
  TokenStorage,
  SessionStorage
} from './types';

// ===== 열거형 =====
export {
  AuthStatus,
  AuthEventType,
  AuthErrorCode
} from './types';

// ===== 모듈 정보 =====
export const AUTH_MODULE_INFO = {
  name: '@company/auth',
  version: '1.0.0',
  description: 'Pure Authentication Module - Login/Logout Only',
  author: 'Enterprise AI Team',
  license: 'MIT',
  dependencies: ['@company/core', '@company/types', '@company/utils', '@company/api-client'],
  features: ['login', 'logout', 'session-management', 'token-management']
} as const;

// ===== 기본 설정 =====
export interface DefaultAuthConfig {
  sessionTimeout: number;
  rememberMeDuration: number;
  autoRefreshToken: boolean;
  logoutOnWindowClose: boolean;
}

export const DEFAULT_AUTH_CONFIG: DefaultAuthConfig = {
  sessionTimeout: 120, // 2시간
  rememberMeDuration: 30, // 30일
  autoRefreshToken: true,
  logoutOnWindowClose: false
};

export interface MinimalAuthConfig {
  apiUrl: string;
  tokenStorageKey: string;
  refreshTokenKey: string;
}

export type FullAuthConfig = DefaultAuthConfig & MinimalAuthConfig;

// ===== 유틸리티 함수 =====

/**
 * 기본 인증 설정 생성
 */
export function createAuthConfig(overrides: Partial<FullAuthConfig> = {}): FullAuthConfig {
  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    tokenStorageKey: 'auth-token',
    refreshTokenKey: 'refresh-token',
    ...DEFAULT_AUTH_CONFIG,
    ...overrides
  };
}

/**
 * 간단한 인증 서비스 팩토리
 */
export function createAuthService(config: Partial<FullAuthConfig> = {}) {
  const fullConfig = createAuthConfig(config);
  const { AuthService: AuthServiceClass } = require('./auth/AuthService');
  return new AuthServiceClass(fullConfig);
}

/**
 * 이메일 형식 검증
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 토큰 페이로드 디코딩 (클라이언트 사이드)
 */
export function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

/**
 * 토큰 만료 시간 확인
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  
  if (!payload || !payload.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * 로그인 자격 증명 검증
 */
export function validateLoginCredentials(credentials: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!credentials.email) {
    errors.push('이메일을 입력해주세요');
  } else if (!validateEmail(credentials.email)) {
    errors.push('올바른 이메일 형식이 아닙니다');
  }

  if (!credentials.password) {
    errors.push('비밀번호를 입력해주세요');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ===== 시작 로그 =====
if (typeof window !== 'undefined') {
  console.log(`🔐 ${AUTH_MODULE_INFO.name} v${AUTH_MODULE_INFO.version} initialized`);
}