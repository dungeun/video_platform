/**
 * @company/auth - Pure Authentication Types
 * Ultra-Fine-Grained Module - Login/Logout Only
 */

// import { Result } from '@company/core';

// Temporary type definition for building
interface Result<T, E = string> {
  success: boolean;
  data?: T;
  error?: E;
}

// ===== 기본 사용자 타입 (최소한만) =====

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

// ===== 인증 관련 타입 =====

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: string;
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
  issuedAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

// ===== 인증 상태 타입 =====

export enum AuthStatus {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  ERROR = 'error'
}

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  session: AuthSession | null;
  error: string | null;
  isLoading: boolean;
  lastActivity: Date | null;
}

// ===== 이벤트 타입 =====

export enum AuthEventType {
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  SESSION_EXPIRED = 'auth.session.expired',
  TOKEN_REFRESHED = 'auth.token.refreshed'
}

export interface AuthEvent {
  type: AuthEventType;
  user?: AuthUser;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ===== 설정 타입 =====

export interface AuthConfig {
  apiUrl: string;
  tokenStorageKey: string;
  refreshTokenKey: string;
  sessionTimeout: number; // minutes
  rememberMeDuration: number; // days
  autoRefreshToken: boolean;
  logoutOnWindowClose: boolean;
}

// ===== API 응답 타입 =====

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
  success: boolean;
  message?: string;
}

export interface RefreshTokenResponse {
  tokens: AuthTokens;
  success: boolean;
  message?: string;
}

export interface LogoutResponse {
  success: boolean;
  message?: string;
}

// ===== 에러 타입 =====

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'AUTH_001',
  TOKEN_EXPIRED = 'AUTH_005',
  TOKEN_INVALID = 'AUTH_006',
  SESSION_EXPIRED = 'AUTH_007',
  NETWORK_ERROR = 'AUTH_008',
  UNKNOWN_ERROR = 'AUTH_999'
}

// ===== 유틸리티 타입 =====

export type AuthResult<T> = Result<T, string>;

export type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: AuthUser | null }
  | { type: 'SET_SESSION'; payload: AuthSession | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STATUS'; payload: AuthStatus }
  | { type: 'UPDATE_LAST_ACTIVITY' }
  | { type: 'CLEAR_AUTH' };

// ===== Hook 타입 =====

export interface UseAuthReturn {
  // 상태
  user: AuthUser | null;
  session: AuthSession | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // 메소드
  login: (credentials: LoginCredentials) => Promise<AuthResult<LoginResponse>>;
  logout: () => Promise<AuthResult<LogoutResponse>>;
  refreshToken: () => Promise<AuthResult<RefreshTokenResponse>>;
  
  // 유틸리티
  clearError: () => void;
  checkSession: () => boolean;
}

// ===== 토큰 관리 타입 =====

export interface TokenInfo {
  isValid: boolean;
  timeUntilExpiry: number; // seconds
  expiresAt: Date | null;
}

export interface TokenStorage {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(tokens: AuthTokens): void;
  clearTokens(): void;
  getTokenInfo(): TokenInfo;
}

// ===== 세션 관리 타입 =====

export interface SessionStorage {
  getCurrentUser(): AuthUser | null;
  getCurrentSession(): AuthSession | null;
  setSession(session: AuthSession): void;
  clearSession(): void;
  isAuthenticated(): boolean;
  updateLastActivity(): void;
}