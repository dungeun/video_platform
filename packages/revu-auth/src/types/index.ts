import { z } from 'zod';

// 사용자 타입
export type UserType = 'business' | 'influencer';
export type UserRole = 'user' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'pending' | 'suspended' | 'deleted';

// 기본 프로필 스키마
export const BasicProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  avatar: z.string().url().optional(),
  bio: z.string().optional(),
});

// 사용자 등록 스키마
export const UserRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  ),
  type: z.enum(['business', 'influencer']),
  profile: BasicProfileSchema,
});

// 로그인 스키마
export const LoginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// 비밀번호 변경 스키마
export const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  ),
});

// 인터페이스 정의
export interface UserRegistration extends z.infer<typeof UserRegistrationSchema> {}
export interface LoginCredentials extends z.infer<typeof LoginCredentialsSchema> {}
export interface PasswordChange extends z.infer<typeof PasswordChangeSchema> {}
export interface BasicProfile extends z.infer<typeof BasicProfileSchema> {}

// JWT 토큰 페이로드
export interface TokenPayload {
  userId: string;
  email: string;
  type: UserType;
  role: UserRole;
  iat: number;
  exp: number;
}

// 토큰 쌍
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// 인증 결과
export interface AuthResult {
  user: {
    id: string;
    email: string;
    type: UserType;
    role: UserRole;
    status: UserStatus;
    profile: BasicProfile;
  };
  tokens: TokenPair;
  isFirstLogin: boolean;
}

// 2FA 설정
export interface TwoFactorSetup {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

// 로그인 히스토리
export interface LoginHistory {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  loginAt: Date;
  success: boolean;
  location?: {
    country: string;
    city: string;
  };
}

// 권한
export interface Permission {
  resource: string;
  action: string;
  granted: boolean;
}

// OAuth 공급자
export type OAuthProvider = 'google' | 'facebook' | 'instagram' | 'youtube' | 'tiktok';

// 소셜 로그인 데이터
export interface SocialLoginData {
  provider: OAuthProvider;
  token: string;
  type: UserType;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Result 패턴 (에러 처리)
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// 인증 에러 타입
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// 인증 설정
export interface AuthConfig {
  jwt: {
    secret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
  };
  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
    };
    facebook: {
      appId: string;
      appSecret: string;
    };
  };
  twoFactor: {
    issuer: string;
    window: number;
  };
  security: {
    bcryptRounds: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
}