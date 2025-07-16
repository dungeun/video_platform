/**
 * @repo/auth-core - 인증/인가 타입 정의
 * Zero Error Architecture 기반
 */

import { Result } from '@repo/core';

// ===== 기본 사용자 타입 =====

export interface BaseUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends BaseUser {
  phone?: string;
  birthday?: Date;
  address?: Address;
  preferences?: UserPreferences;
  metadata?: Record<string, any>;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
}

// ===== 인증 관련 타입 =====

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  agreeToMarketing?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: string;
}

export interface AuthSession {
  user: UserProfile;
  tokens: AuthTokens;
  issuedAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

// ===== 인가(권한) 타입 =====

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: PermissionAction;
  conditions?: PermissionCondition[];
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  ADMIN = 'admin'
}

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte';
  value: any;
}

// ===== 소셜 로그인 타입 =====

export enum SocialProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  NAVER = 'naver',
  KAKAO = 'kakao',
  APPLE = 'apple'
}

export interface SocialLoginConfig {
  provider: SocialProvider;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scope?: string[];
}

export interface SocialUserInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: SocialProvider;
  raw: Record<string, any>;
}

// ===== 2FA/MFA 타입 =====

export enum TwoFactorType {
  SMS = 'sms',
  EMAIL = 'email',
  TOTP = 'totp',
  BACKUP_CODE = 'backup_code'
}

export interface TwoFactorSetup {
  type: TwoFactorType;
  secret?: string;
  qrCode?: string;
  backupCodes?: string[];
}

export interface TwoFactorVerification {
  type: TwoFactorType;
  code: string;
  trustDevice?: boolean;
}

// ===== 비밀번호 관리 타입 =====

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventUserInfo: boolean;
  historyCount: number; // 이전 패스워드 중복 방지 개수
}

export interface PasswordResetRequest {
  email: string;
  token: string;
  expiresAt: Date;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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
  user: UserProfile | null;
  session: AuthSession | null;
  error: string | null;
  isLoading: boolean;
  lastActivity: Date | null;
}

// ===== 이벤트 타입 =====

export interface AuthEvent {
  type: AuthEventType;
  user: UserProfile;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum AuthEventType {
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  SIGNUP = 'auth.signup',
  PASSWORD_CHANGE = 'auth.password.change',
  TWO_FACTOR_ENABLE = 'auth.2fa.enable',
  TWO_FACTOR_DISABLE = 'auth.2fa.disable',
  PROFILE_UPDATE = 'auth.profile.update',
  SESSION_EXPIRED = 'auth.session.expired'
}

// ===== 설정 타입 =====

export interface AuthConfig {
  apiUrl: string;
  tokenStorageKey: string;
  refreshTokenKey: string;
  sessionTimeout: number; // minutes
  rememberMeDuration: number; // days
  passwordPolicy: PasswordPolicy;
  socialProviders: SocialLoginConfig[];
  enableTwoFactor: boolean;
  enableSocialLogin: boolean;
  enableRememberMe: boolean;
  autoRefreshToken: boolean;
  logoutOnWindowClose: boolean;
}

// ===== API 응답 타입 =====

export interface LoginResponse {
  user: UserProfile;
  tokens: AuthTokens;
  twoFactorRequired?: boolean;
  twoFactorTypes?: TwoFactorType[];
}

export interface RefreshTokenResponse {
  tokens: AuthTokens;
}

export interface SignupResponse {
  user: UserProfile;
  tokens: AuthTokens;
  verificationRequired?: boolean;
}

// ===== 에러 타입 =====

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'AUTH_001',
  USER_NOT_FOUND = 'AUTH_002',
  EMAIL_ALREADY_EXISTS = 'AUTH_003',
  PASSWORD_TOO_WEAK = 'AUTH_004',
  TOKEN_EXPIRED = 'AUTH_005',
  TOKEN_INVALID = 'AUTH_006',
  PERMISSION_DENIED = 'AUTH_007',
  TWO_FACTOR_REQUIRED = 'AUTH_008',
  TWO_FACTOR_INVALID = 'AUTH_009',
  ACCOUNT_LOCKED = 'AUTH_010',
  ACCOUNT_DISABLED = 'AUTH_011',
  EMAIL_NOT_VERIFIED = 'AUTH_012',
  RATE_LIMIT_EXCEEDED = 'AUTH_013',
  SOCIAL_LOGIN_FAILED = 'AUTH_014'
}

// ===== 유틸리티 타입 =====

export type AuthResult<T> = Result<T, string>;

export type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: UserProfile | null }
  | { type: 'SET_SESSION'; payload: AuthSession | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STATUS'; payload: AuthStatus }
  | { type: 'UPDATE_LAST_ACTIVITY' }
  | { type: 'CLEAR_AUTH' };

// ===== Hook 타입 =====

export interface UseAuthReturn {
  // 상태
  user: UserProfile | null;
  session: AuthSession | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // 메소드
  login: (credentials: LoginCredentials) => Promise<AuthResult<LoginResponse>>;
  logout: () => Promise<AuthResult<void>>;
  signup: (data: SignupData) => Promise<AuthResult<SignupResponse>>;
  refreshToken: () => Promise<AuthResult<RefreshTokenResponse>>;
  updateProfile: (data: Partial<UserProfile>) => Promise<AuthResult<UserProfile>>;
  changePassword: (data: PasswordChangeData) => Promise<AuthResult<void>>;
  
  // 권한 체크
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  
  // 유틸리티
  clearError: () => void;
}

export interface UsePermissionReturn {
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  checkPermission: (resource: string, action: PermissionAction) => boolean;
}