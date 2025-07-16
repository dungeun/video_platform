import { Result } from '@repo/core';

export interface AuthError {
  code: string;
  message: string;
  userMessage: string;
  retry: boolean;
  details?: any;
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

export type AuthErrorCode = 
  // 인증 관련
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_USER_NOT_FOUND'
  | 'AUTH_ACCOUNT_LOCKED'
  | 'AUTH_ACCOUNT_DISABLED'
  | 'AUTH_PASSWORD_EXPIRED'
  | 'AUTH_TOO_MANY_ATTEMPTS'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_REFRESH_TOKEN_INVALID'
  
  // 2FA 관련
  | '2FA_NOT_ENABLED'
  | '2FA_INVALID_CODE'
  | '2FA_SETUP_REQUIRED'
  | '2FA_BACKUP_CODE_USED'
  | '2FA_NO_BACKUP_CODES'
  | '2FA_SECRET_INVALID'
  
  // 권한 관련
  | 'PERMISSION_DENIED'
  | 'ROLE_NOT_FOUND'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'RESOURCE_ACCESS_DENIED'
  
  // 소셜 로그인 관련
  | 'SOCIAL_AUTH_FAILED'
  | 'SOCIAL_USER_CANCELLED'
  | 'SOCIAL_INVALID_STATE'
  | 'SOCIAL_EMAIL_NOT_VERIFIED'
  | 'SOCIAL_ACCOUNT_NOT_LINKED'
  
  // 네트워크/서버 관련
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'MAINTENANCE_MODE'
  
  // 클라이언트 관련
  | 'INVALID_INPUT'
  | 'VALIDATION_FAILED'
  | 'BROWSER_NOT_SUPPORTED'
  | 'STORAGE_NOT_AVAILABLE'
  
  // 일반
  | 'UNKNOWN_ERROR'
  | 'OPERATION_CANCELLED';

const errorDefinitions: Record<AuthErrorCode, Omit<AuthError, 'code'>> = {
  // 인증 관련
  AUTH_INVALID_CREDENTIALS: {
    message: 'Invalid email or password provided',
    userMessage: '이메일 또는 비밀번호가 올바르지 않습니다.',
    retry: true
  },
  AUTH_USER_NOT_FOUND: {
    message: 'User account does not exist',
    userMessage: '존재하지 않는 계정입니다.',
    retry: false
  },
  AUTH_ACCOUNT_LOCKED: {
    message: 'User account is temporarily locked',
    userMessage: '계정이 일시적으로 잠겼습니다. 잠시 후 다시 시도해주세요.',
    retry: true
  },
  AUTH_ACCOUNT_DISABLED: {
    message: 'User account has been disabled',
    userMessage: '비활성화된 계정입니다. 관리자에게 문의하세요.',
    retry: false
  },
  AUTH_PASSWORD_EXPIRED: {
    message: 'User password has expired',
    userMessage: '비밀번호가 만료되었습니다. 새 비밀번호를 설정해주세요.',
    retry: false
  },
  AUTH_TOO_MANY_ATTEMPTS: {
    message: 'Too many login attempts',
    userMessage: '로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
    retry: true
  },
  AUTH_SESSION_EXPIRED: {
    message: 'User session has expired',
    userMessage: '세션이 만료되었습니다. 다시 로그인해주세요.',
    retry: false
  },
  AUTH_TOKEN_INVALID: {
    message: 'Authentication token is invalid',
    userMessage: '인증 토큰이 유효하지 않습니다.',
    retry: false
  },
  AUTH_TOKEN_EXPIRED: {
    message: 'Authentication token has expired',
    userMessage: '인증 토큰이 만료되었습니다.',
    retry: false
  },
  AUTH_REFRESH_TOKEN_INVALID: {
    message: 'Refresh token is invalid or expired',
    userMessage: '세션 갱신에 실패했습니다. 다시 로그인해주세요.',
    retry: false
  },

  // 2FA 관련
  '2FA_NOT_ENABLED': {
    message: 'Two-factor authentication is not enabled',
    userMessage: '2차 인증이 설정되지 않았습니다.',
    retry: false
  },
  '2FA_INVALID_CODE': {
    message: 'Two-factor authentication code is invalid',
    userMessage: '2차 인증 코드가 올바르지 않습니다.',
    retry: true
  },
  '2FA_SETUP_REQUIRED': {
    message: 'Two-factor authentication setup is required',
    userMessage: '2차 인증 설정이 필요합니다.',
    retry: false
  },
  '2FA_BACKUP_CODE_USED': {
    message: 'Backup code has already been used',
    userMessage: '이미 사용된 백업 코드입니다.',
    retry: true
  },
  '2FA_NO_BACKUP_CODES': {
    message: 'No backup codes available',
    userMessage: '사용 가능한 백업 코드가 없습니다.',
    retry: false
  },
  '2FA_SECRET_INVALID': {
    message: 'Two-factor authentication secret is invalid',
    userMessage: '2차 인증 설정이 올바르지 않습니다.',
    retry: false
  },

  // 권한 관련
  PERMISSION_DENIED: {
    message: 'Permission denied for the requested operation',
    userMessage: '이 작업을 수행할 권한이 없습니다.',
    retry: false
  },
  ROLE_NOT_FOUND: {
    message: 'User role not found',
    userMessage: '사용자 역할을 찾을 수 없습니다.',
    retry: false
  },
  INSUFFICIENT_PERMISSIONS: {
    message: 'Insufficient permissions for the requested resource',
    userMessage: '리소스에 접근할 권한이 부족합니다.',
    retry: false
  },
  RESOURCE_ACCESS_DENIED: {
    message: 'Access denied to the requested resource',
    userMessage: '요청한 리소스에 접근할 수 없습니다.',
    retry: false
  },

  // 소셜 로그인 관련
  SOCIAL_AUTH_FAILED: {
    message: 'Social authentication failed',
    userMessage: '소셜 로그인에 실패했습니다.',
    retry: true
  },
  SOCIAL_USER_CANCELLED: {
    message: 'User cancelled social authentication',
    userMessage: '소셜 로그인을 취소했습니다.',
    retry: true
  },
  SOCIAL_INVALID_STATE: {
    message: 'Invalid state parameter in social authentication',
    userMessage: '소셜 로그인 중 오류가 발생했습니다.',
    retry: true
  },
  SOCIAL_EMAIL_NOT_VERIFIED: {
    message: 'Email not verified in social account',
    userMessage: '소셜 계정의 이메일이 인증되지 않았습니다.',
    retry: false
  },
  SOCIAL_ACCOUNT_NOT_LINKED: {
    message: 'Social account is not linked to any user',
    userMessage: '연결된 계정을 찾을 수 없습니다.',
    retry: false
  },

  // 네트워크/서버 관련
  NETWORK_ERROR: {
    message: 'Network connection error',
    userMessage: '네트워크 연결에 문제가 있습니다.',
    retry: true
  },
  SERVER_ERROR: {
    message: 'Internal server error',
    userMessage: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    retry: true
  },
  SERVICE_UNAVAILABLE: {
    message: 'Service temporarily unavailable',
    userMessage: '서비스를 일시적으로 사용할 수 없습니다.',
    retry: true
  },
  RATE_LIMITED: {
    message: 'Rate limit exceeded',
    userMessage: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    retry: true
  },
  MAINTENANCE_MODE: {
    message: 'Service is under maintenance',
    userMessage: '서비스 점검 중입니다.',
    retry: true
  },

  // 클라이언트 관련
  INVALID_INPUT: {
    message: 'Invalid input provided',
    userMessage: '입력 값이 올바르지 않습니다.',
    retry: true
  },
  VALIDATION_FAILED: {
    message: 'Input validation failed',
    userMessage: '입력 값 검증에 실패했습니다.',
    retry: true
  },
  BROWSER_NOT_SUPPORTED: {
    message: 'Browser not supported',
    userMessage: '지원하지 않는 브라우저입니다.',
    retry: false
  },
  STORAGE_NOT_AVAILABLE: {
    message: 'Local storage not available',
    userMessage: '브라우저 저장소를 사용할 수 없습니다.',
    retry: false
  },

  // 일반
  UNKNOWN_ERROR: {
    message: 'An unknown error occurred',
    userMessage: '알 수 없는 오류가 발생했습니다.',
    retry: true
  },
  OPERATION_CANCELLED: {
    message: 'Operation was cancelled',
    userMessage: '작업이 취소되었습니다.',
    retry: true
  }
};

export class AuthErrorHandler {
  private static instance: AuthErrorHandler;
  private errorListeners: Array<(error: AuthError, context: ErrorContext) => void> = [];

  static getInstance(): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler();
    }
    return AuthErrorHandler.instance;
  }

  createError(code: AuthErrorCode, details?: any, context?: Partial<ErrorContext>): AuthError {
    const definition = errorDefinitions[code];
    if (!definition) {
      return this.createError('UNKNOWN_ERROR', { originalCode: code });
    }

    const error: AuthError = {
      code,
      ...definition,
      details
    };

    // 에러 리포팅
    if (context) {
      this.reportError(error, {
        operation: context.operation || 'unknown',
        timestamp: Date.now(),
        ...context
      });
    }

    return error;
  }

  mapHttpError(status: number, response?: any): AuthError {
    switch (status) {
      case 400:
        return this.createError('INVALID_INPUT', response);
      case 401:
        return this.createError('AUTH_TOKEN_INVALID', response);
      case 403:
        return this.createError('PERMISSION_DENIED', response);
      case 404:
        return this.createError('AUTH_USER_NOT_FOUND', response);
      case 423:
        return this.createError('AUTH_ACCOUNT_LOCKED', response);
      case 429:
        return this.createError('RATE_LIMITED', response);
      case 500:
        return this.createError('SERVER_ERROR', response);
      case 503:
        return this.createError('SERVICE_UNAVAILABLE', response);
      default:
        return this.createError('UNKNOWN_ERROR', { status, response });
    }
  }

  mapNetworkError(error: any): AuthError {
    if (error.name === 'AbortError') {
      return this.createError('OPERATION_CANCELLED', error);
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.createError('NETWORK_ERROR', error);
    }

    return this.createError('UNKNOWN_ERROR', error);
  }

  shouldRetry(error: AuthError, attemptCount: number, maxAttempts: number = 3): boolean {
    if (attemptCount >= maxAttempts) return false;
    if (!error.retry) return false;

    // 특정 에러에 대한 특별한 재시도 로직
    switch (error.code) {
      case 'RATE_LIMITED':
        return attemptCount < 2; // 레이트 리밋은 최대 2번만 재시도
      case 'NETWORK_ERROR':
        return true; // 네트워크 오류는 항상 재시도
      case 'AUTH_TOO_MANY_ATTEMPTS':
        return false; // 너무 많은 시도는 재시도 하지 않음
      default:
        return error.retry;
    }
  }

  getRetryDelay(error: AuthError, attemptCount: number): number {
    const baseDelay = 1000; // 1초
    
    switch (error.code) {
      case 'RATE_LIMITED':
        return baseDelay * Math.pow(2, attemptCount) * 2; // 2초, 4초, 8초...
      case 'NETWORK_ERROR':
        return baseDelay * attemptCount; // 1초, 2초, 3초...
      case 'SERVER_ERROR':
        return baseDelay * Math.pow(2, attemptCount); // 1초, 2초, 4초...
      default:
        return baseDelay;
    }
  }

  addErrorListener(listener: (error: AuthError, context: ErrorContext) => void): void {
    this.errorListeners.push(listener);
  }

  removeErrorListener(listener: (error: AuthError, context: ErrorContext) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  private reportError(error: AuthError, context: ErrorContext): void {
    // 에러 리스너들에게 알림
    this.errorListeners.forEach(listener => {
      try {
        listener(error, context);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });

    // 개발 환경에서는 콘솔에 출력
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Auth Error: ${error.code}`);
      console.error('Message:', error.message);
      console.error('User Message:', error.userMessage);
      console.error('Context:', context);
      if (error.details) {
        console.error('Details:', error.details);
      }
      console.groupEnd();
    }

    // 프로덕션에서는 에러 리포팅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(error, context);
    }
  }

  private async sendToErrorService(error: AuthError, context: ErrorContext): Promise<void> {
    try {
      // 실제 에러 리포팅 서비스 연동
      // Sentry, LogRocket, Datadog 등
      
      const errorData = {
        code: error.code,
        message: error.message,
        context,
        timestamp: context.timestamp,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // });
    } catch (e) {
      console.error('Failed to report error:', e);
    }
  }
}

// 싱글톤 인스턴스 export
export const authErrorHandler = AuthErrorHandler.getInstance();

// 편의 함수들
export function createAuthError(code: AuthErrorCode, details?: any, context?: Partial<ErrorContext>): AuthError {
  return authErrorHandler.createError(code, details, context);
}

export function mapHttpError(status: number, response?: any): AuthError {
  return authErrorHandler.mapHttpError(status, response);
}

export function mapNetworkError(error: any): AuthError {
  return authErrorHandler.mapNetworkError(error);
}

export function shouldRetryError(error: AuthError, attemptCount: number, maxAttempts?: number): boolean {
  return authErrorHandler.shouldRetry(error, attemptCount, maxAttempts);
}

export function getRetryDelay(error: AuthError, attemptCount: number): number {
  return authErrorHandler.getRetryDelay(error, attemptCount);
}

// Result 타입과 통합
export function createAuthResult<T>(data: T): Result<T>;
export function createAuthResult<T>(error: AuthErrorCode, details?: any, context?: Partial<ErrorContext>): Result<T>;
export function createAuthResult<T>(
  dataOrError: T | AuthErrorCode, 
  details?: any, 
  context?: Partial<ErrorContext>
): Result<T> {
  if (typeof dataOrError === 'string') {
    const error = createAuthError(dataOrError as AuthErrorCode, details, context);
    return Result.failure(error.code, error.userMessage);
  }
  return Result.success(dataOrError as T);
}