/**
 * @company/auth-core - Enterprise Authentication Core Module
 * 
 * 엔터프라이즈급 인증/인가 시스템
 * Zero Error Architecture 기반으로 설계됨
 * 
 * @version 1.0.0
 * @author Enterprise AI Team
 */

// ===== 핵심 서비스 =====
export { AuthService } from './auth/AuthService';
export { TokenManager } from './auth/TokenManager';
export { SessionManager } from './auth/SessionManager';

// ===== React 훅 =====
export { useAuth } from './hooks/useAuth';
export { useTwoFactor } from './hooks/useTwoFactor';

// ===== React 컴포넌트 =====
export { AuthProvider } from './providers/AuthProvider';
export { ProtectedRoute, withProtectedRoute } from './components/ProtectedRoute';
export { LoginForm } from './components/LoginForm';
export { TwoFactorSetup } from './components/TwoFactorSetup';
export { TwoFactorVerify } from './components/TwoFactorVerify';
export { SocialLoginButton, SocialLoginGroup, useSocialLogin } from './components/SocialLoginButton';

// ===== 상태 관리 =====
export { useAuthStore } from './providers/AuthStore';

// ===== 소셜 로그인 제공자 =====
export { GoogleProvider, KakaoProvider, NaverProvider } from './providers/social';
export type { GoogleConfig, KakaoConfig, NaverConfig } from './providers/social';

// ===== 유틸리티 =====
export { ApiClient } from './utils/ApiClient';
export { totpManager, TotpManager } from './utils/TotpManager';
export { 
  authErrorHandler, 
  createAuthError, 
  mapHttpError, 
  mapNetworkError,
  AuthErrorHandler
} from './utils/AuthErrorHandler';

// ===== 타입 정의 =====
export type {
  // 기본 타입
  BaseUser,
  UserProfile,
  Address,
  UserPreferences,
  NotificationSettings,
  
  // 인증 타입
  LoginCredentials,
  SignupData,
  AuthTokens,
  AuthSession,
  
  
  // 소셜 로그인
  SocialLoginConfig,
  SocialUserInfo,
  
  // 2FA
  TwoFactorSetup,
  TwoFactorVerification,
  
  // 비밀번호
  PasswordPolicy,
  PasswordResetRequest,
  PasswordChangeData,
  
  // 상태 타입
  AuthState,
  AuthEvent,
  
  // 설정 타입
  AuthConfig,
  
  // API 응답 타입
  LoginResponse,
  RefreshTokenResponse,
  SignupResponse,
  
  // 훅 타입
  UseAuthReturn,
  
  // 유틸리티 타입
  AuthResult
} from './types';

// ===== 열거형 =====
export {
  SocialProvider,
  TwoFactorType,
  AuthStatus,
  AuthEventType,
  AuthErrorCode
} from './types';

// ===== 모듈 정보 =====
export const AUTH_MODULE_INFO = {
  name: '@company/auth-core',
  version: '1.0.0',
  description: 'Enterprise Authentication Core Module - Zero Error Architecture',
  author: 'Enterprise AI Team',
  license: 'MIT'
} as const;

// ===== 기본 설정 =====
export interface DefaultAuthConfig {
  sessionTimeout: number;
  rememberMeDuration: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventCommonPasswords: boolean;
    preventUserInfo: boolean;
    historyCount: number;
  };
  enableTwoFactor: boolean;
  enableSocialLogin: boolean;
  enableRememberMe: boolean;
  autoRefreshToken: boolean;
  logoutOnWindowClose: boolean;
}

export const DEFAULT_AUTH_CONFIG: DefaultAuthConfig = {
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
  enableTwoFactor: false,
  enableSocialLogin: false,
  enableRememberMe: true,
  autoRefreshToken: true,
  logoutOnWindowClose: false
};

export interface MinimalAuthConfig {
  apiUrl: string;
  tokenStorageKey: string;
  refreshTokenKey: string;
  socialProviders: any[];
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
    socialProviders: [],
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
 * 비밀번호 강도 검증
 */
export function validatePasswordStrength(
  password: string, 
  policy: DefaultAuthConfig['passwordPolicy']
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`비밀번호는 최소 ${policy.minLength}자 이상이어야 합니다`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('대문자를 포함해야 합니다');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('소문자를 포함해야 합니다');
  }

  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('숫자를 포함해야 합니다');
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('특수문자를 포함해야 합니다');
  }

  if (policy.preventCommonPasswords) {
    const commonPasswords = [
      'password', '123456', 'qwerty', 'admin', 'password123',
      '12345678', 'letmein', 'welcome', 'monkey'
    ];
    
    if (commonPasswords.some(common => 
      password.toLowerCase().includes(common.toLowerCase())
    )) {
      errors.push('일반적인 비밀번호는 사용할 수 없습니다');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
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

// ===== 시작 로그 =====
if (typeof window !== 'undefined') {
  console.log(`🔐 ${AUTH_MODULE_INFO.name} v${AUTH_MODULE_INFO.version} initialized`);
}