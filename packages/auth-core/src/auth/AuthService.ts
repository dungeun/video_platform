/**
 * @repo/auth-core - 인증 서비스
 * Zero Error Architecture 기반 인증 핵심 로직
 */

import { ModuleBase, Result, EventBus } from '@repo/core';
import { 
  AuthConfig, 
  LoginCredentials, 
  SignupData, 
  UserProfile, 
  AuthTokens, 
  AuthSession,
  LoginResponse,
  SignupResponse,
  RefreshTokenResponse,
  PasswordChangeData,
  AuthResult,
  AuthErrorCode,
  SocialProvider,
  TwoFactorVerification,
  TwoFactorType
} from '../types';
import { TokenManager } from './TokenManager';
import { SessionManager } from './SessionManager';
import { PermissionManager } from './PermissionManager';
import { ApiClient } from '../utils/ApiClient';
import { 
  authErrorHandler, 
  createAuthError, 
  mapHttpError, 
  mapNetworkError,
  AuthErrorCode as ErrorCode
} from '../utils/AuthErrorHandler';

export class AuthService extends ModuleBase {
  private tokenManager: TokenManager;
  private sessionManager: SessionManager;
  private permissionManager: PermissionManager;
  private apiClient: ApiClient;
  private authConfig: AuthConfig;

  constructor(config: AuthConfig) {
    super({
      name: '@repo/auth-core',
      version: '1.0.0',
      description: 'Enterprise Authentication Service'
    });
    
    this.authConfig = config;
    this.tokenManager = new TokenManager(config);
    this.sessionManager = new SessionManager(config);
    this.permissionManager = new PermissionManager();
    this.apiClient = new ApiClient(config.apiUrl);
    
    this.setupAutoRefresh();
  }

  // ===== 라이프사이클 메소드 =====

  protected async onInitialize(): Promise<Result<void>> {
    try {
      // 저장된 세션 복원 시도
      const restoreResult = await this.sessionManager.restoreSession();
      if (restoreResult.success && restoreResult.data) {
        this.logger.info('세션 복원 성공');
        this.emit('auth:session-restored', restoreResult.data);
      }

      return { success: true };
    } catch (error) {
      const authError = this.errorHandler.handle(error, '인증 서비스 초기화 실패');
      return { success: false, error: authError };
    }
  }

  protected async onDestroy(): Promise<Result<void>> {
    try {
      this.tokenManager.clearTokens();
      this.sessionManager.clearSession();
      return { success: true };
    } catch (error) {
      const authError = this.errorHandler.handle(error, '인증 서비스 종료 실패');
      return { success: false, error: authError };
    }
  }

  public async healthCheck(): Promise<Result<boolean>> {
    try {
      const response = await this.apiClient.get('/health');
      return { success: true, data: response.success };
    } catch (error) {
      const authError = this.errorHandler.handle(error, '인증 서비스 연결 실패');
      return { success: false, error: authError };
    }
  }

  // ===== 인증 메소드 =====

  /**
   * 사용자 로그인
   */
  public async login(credentials: LoginCredentials): Promise<AuthResult<LoginResponse>> {
    return this.safeExecute(async () => {
      this.logger.info('로그인 시도', { email: credentials.email });

      // 1. 입력 검증
      const validation = this.validateLoginCredentials(credentials);
      if (!validation.success) {
        return validation;
      }

      // 2. API 호출
      const response = await this.apiClient.post<LoginResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe
      });

      if (!response.success || !response.data) {
        const error = createAuthError('AUTH_INVALID_CREDENTIALS', response, {
          operation: 'login',
          userId: credentials.email
        });
        return { success: false, error: error.userMessage };
      }

      const loginData = response.data;

      // 3. 2FA 필요한 경우
      if (loginData.twoFactorRequired) {
        this.logger.info('2FA 인증 필요');
        return { success: true, data: loginData };
      }

      // 4. 토큰 저장
      this.tokenManager.setTokens(loginData.tokens);

      // 5. 세션 생성
      const session = await this.sessionManager.createSession(loginData.user, loginData.tokens);
      if (!session.success) {
        const error = createAuthError('AUTH_SESSION_EXPIRED', session.error, {
          operation: 'create_session',
          userId: loginData.user.id
        });
        return { success: false, error: error.userMessage };
      }

      // 6. 권한 로드
      await this.permissionManager.loadUserPermissions(loginData.user.id);

      // 7. 이벤트 발행
      EventBus.emitModuleEvent('@repo/auth-core', 'auth:login', {
        user: loginData.user,
        session: session.data
      });

      this.logger.info('로그인 성공', { userId: loginData.user.id });
      
      return { success: true, data: loginData };

    }, '로그인 처리 중 오류').then(result => {
      if (!result.success && result.error && typeof result.error !== 'string') {
        return { success: false, error: result.error.message || '로그인 실패' } as AuthResult<LoginResponse>;
      }
      return result as unknown as AuthResult<LoginResponse>;
    });
  }

  /**
   * 사용자 회원가입
   */
  public async signup(data: SignupData): Promise<AuthResult<SignupResponse>> {
    return this.safeExecute(async () => {
      this.logger.info('회원가입 시도', { email: data.email });

      // 1. 입력 검증
      const validation = this.validateSignupData(data);
      if (!validation.success) {
        return validation;
      }

      // 2. 비밀번호 정책 검증
      const passwordCheck = this.validatePassword(data.password);
      if (!passwordCheck.success) {
        return passwordCheck;
      }

      // 3. API 호출
      const response = await this.apiClient.post<SignupResponse>('/auth/signup', data);

      if (!response.success || !response.data) {
        return { success: false, error: '회원가입 실패' };
      }

      const signupData = response.data;

      // 4. 이메일 인증 필요한 경우
      if (signupData.verificationRequired) {
        this.logger.info('이메일 인증 필요');
        return { success: true, data: signupData };
      }

      // 5. 자동 로그인 처리
      this.tokenManager.setTokens(signupData.tokens);
      const session = await this.sessionManager.createSession(signupData.user, signupData.tokens);
      
      if (session.success) {
        await this.permissionManager.loadUserPermissions(signupData.user.id);
        
        EventBus.emitModuleEvent('@repo/auth-core', 'auth:signup', {
          user: signupData.user,
          session: session.data
        });
      }

      this.logger.info('회원가입 성공', { userId: signupData.user.id });
      
      return { success: true, data: signupData };

    }, '회원가입 처리 중 오류').then(result => {
      if (!result.success && result.error && typeof result.error !== 'string') {
        return { success: false, error: result.error.message || '회원가입 실패' } as AuthResult<SignupResponse>;
      }
      return result as unknown as AuthResult<SignupResponse>;
    });
  }

  /**
   * 로그아웃
   */
  public async logout(): Promise<AuthResult<void>> {
    return this.safeExecute(async () => {
      const currentUser = this.sessionManager.getCurrentUser();
      
      this.logger.info('로그아웃 시도', { 
        userId: currentUser?.id || 'unknown' 
      });

      // 1. 서버에 로그아웃 요청
      try {
        await this.apiClient.post('/auth/logout', {
          refreshToken: this.tokenManager.getRefreshToken()
        });
      } catch (error) {
        // 서버 에러는 무시하고 로컬 정리 진행
        this.logger.warn('서버 로그아웃 실패, 로컬 정리 진행', error as any);
      }

      // 2. 로컬 데이터 정리
      this.tokenManager.clearTokens();
      this.sessionManager.clearSession();
      this.permissionManager.clearPermissions();

      // 3. 이벤트 발행
      EventBus.emitModuleEvent('@repo/auth-core', 'auth:logout', {
        user: currentUser
      });

      this.logger.info('로그아웃 완료');
      
      return { success: true };

    }, '로그아웃 처리 중 오류').then(result => {
      if (!result.success && result.error && typeof result.error !== 'string') {
        return { success: false, error: result.error.message || '로그아웃 실패' } as AuthResult<void>;
      }
      return result as unknown as AuthResult<void>;
    });
  }

  /**
   * 토큰 갱신
   */
  public async refreshToken(): Promise<AuthResult<RefreshTokenResponse>> {
    return this.safeExecute(async () => {
      const refreshToken = this.tokenManager.getRefreshToken();
      
      if (!refreshToken) {
        return { success: false, error: '리프레시 토큰이 없습니다' };
      }

      this.logger.debug('토큰 갱신 시도');

      const response = await this.apiClient.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken
      });

      if (!response.success || !response.data) {
        // 리프레시 토큰이 유효하지 않으면 로그아웃 처리
        await this.logout();
        return { success: false, error: '토큰 갱신 실패' };
      }

      // 새 토큰 저장
      this.tokenManager.setTokens(response.data.tokens);
      
      this.logger.debug('토큰 갱신 완료');
      
      return { success: true, data: response.data };

    }, '토큰 갱신 중 오류').then(result => {
      if (!result.success && result.error && typeof result.error !== 'string') {
        return { success: false, error: result.error.message || '토큰 갱신 실패' } as AuthResult<RefreshTokenResponse>;
      }
      return result as unknown as AuthResult<RefreshTokenResponse>;
    });
  }

  /**
   * 프로필 업데이트
   */
  public async updateProfile(data: Partial<UserProfile>): Promise<AuthResult<UserProfile>> {
    return this.safeExecute(async () => {
      const currentUser = this.sessionManager.getCurrentUser();
      
      if (!currentUser) {
        return { success: false, error: '로그인이 필요합니다' };
      }

      this.logger.info('프로필 업데이트 시도', { userId: currentUser.id });

      const response = await this.apiClient.put<UserProfile>('/auth/profile', data);

      if (!response.success || !response.data) {
        return { success: false, error: '프로필 업데이트 실패' };
      }

      // 세션 업데이트
      this.sessionManager.updateUser(response.data);

      // 이벤트 발행
      EventBus.emitModuleEvent('@repo/auth-core', 'auth:profile-updated', {
        user: response.data
      });

      this.logger.info('프로필 업데이트 완료', { userId: response.data.id });
      
      return { success: true, data: response.data };

    }, '프로필 업데이트 중 오류').then(result => {
      if (!result.success && result.error && typeof result.error !== 'string') {
        return { success: false, error: result.error.message || '프로필 업데이트 실패' } as AuthResult<UserProfile>;
      }
      return result as unknown as AuthResult<UserProfile>;
    });
  }

  /**
   * 비밀번호 변경
   */
  public async changePassword(data: PasswordChangeData): Promise<AuthResult<void>> {
    return this.safeExecute(async () => {
      const currentUser = this.sessionManager.getCurrentUser();
      
      if (!currentUser) {
        return { success: false, error: '로그인이 필요합니다' };
      }

      // 1. 새 비밀번호 검증
      const passwordCheck = this.validatePassword(data.newPassword);
      if (!passwordCheck.success) {
        return passwordCheck;
      }

      // 2. 비밀번호 확인 검증
      if (data.newPassword !== data.confirmPassword) {
        return { success: false, error: '새 비밀번호가 일치하지 않습니다' };
      }

      this.logger.info('비밀번호 변경 시도', { userId: currentUser.id });

      // 3. API 호출
      const response = await this.apiClient.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      if (!response.success) {
        return { success: false, error: '비밀번호 변경 실패' };
      }

      // 4. 이벤트 발행
      EventBus.emitModuleEvent('@repo/auth-core', 'auth:password-changed', {
        user: currentUser
      });

      this.logger.info('비밀번호 변경 완료', { userId: currentUser.id });
      
      return { success: true };

    }, '비밀번호 변경 중 오류').then(result => {
      if (!result.success && result.error && typeof result.error !== 'string') {
        return { success: false, error: result.error.message || '비밀번호 변경 실패' } as AuthResult<void>;
      }
      return result as unknown as AuthResult<void>;
    });
  }

  // ===== 소셜 로그인 =====

  /**
   * 소셜 로그인 URL 생성
   */
  public generateSocialLoginUrl(provider: SocialProvider): AuthResult<string> {
    try {
      const config = this.authConfig.socialProviders.find(p => p.provider === provider);
      
      if (!config) {
        return { success: false, error: `지원되지 않는 소셜 로그인: ${provider}` };
      }

      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: config.scope?.join(' ') || ''
      });

      const baseUrls: Record<string, string> = {
        [SocialProvider.GOOGLE]: 'https://accounts.google.com/oauth/authorize',
        [SocialProvider.FACEBOOK]: 'https://www.facebook.com/v18.0/dialog/oauth',
        [SocialProvider.NAVER]: 'https://nid.naver.com/oauth2.0/authorize',
        [SocialProvider.KAKAO]: 'https://kauth.kakao.com/oauth/authorize',
        [SocialProvider.APPLE]: 'https://appleid.apple.com/auth/authorize'
      };

      const url = `${baseUrls[provider]}?${params.toString()}`;
      
      return { success: true, data: url };

    } catch (error) {
      return { success: false, error: '소셜 로그인 URL 생성 실패' };
    }
  }

  /**
   * 소셜 로그인 콜백 처리
   */
  public async handleSocialCallback(
    provider: SocialProvider, 
    code: string
  ): Promise<AuthResult<LoginResponse>> {
    return this.safeExecute(async () => {
      this.logger.info('소셜 로그인 콜백 처리', { provider });

      const response = await this.apiClient.post<LoginResponse>('/auth/social/callback', {
        provider,
        code
      });

      if (!response.success || !response.data) {
        return { success: false, error: '소셜 로그인 실패' };
      }

      const loginData = response.data;

      // 토큰 저장 및 세션 생성
      this.tokenManager.setTokens(loginData.tokens);
      const session = await this.sessionManager.createSession(loginData.user, loginData.tokens);
      
      if (session.success) {
        await this.permissionManager.loadUserPermissions(loginData.user.id);
        
        EventBus.emitModuleEvent('@repo/auth-core', 'auth:social-login', {
          provider,
          user: loginData.user,
          session: session.data
        });
      }

      this.logger.info('소셜 로그인 성공', { 
        provider, 
        userId: loginData.user.id 
      });
      
      return { success: true, data: loginData };

    }, '소셜 로그인 콜백 처리 중 오류').then(result => {
      if (!result.success && result.error && typeof result.error !== 'string') {
        return { success: false, error: result.error.message || '소셜 로그인 실패' } as AuthResult<LoginResponse>;
      }
      return result as unknown as AuthResult<LoginResponse>;
    });
  }

  // ===== 2FA 지원 =====

  /**
   * 2FA 인증 완료
   */
  public async verifyTwoFactor(verification: TwoFactorVerification): Promise<AuthResult<LoginResponse>> {
    return this.safeExecute(async () => {
      this.logger.info('2FA 인증 시도', { type: verification.type });

      const response = await this.apiClient.post<LoginResponse>('/auth/2fa/verify', verification);

      if (!response.success || !response.data) {
        return { success: false, error: '2FA 인증 실패' };
      }

      const loginData = response.data;

      // 토큰 저장 및 세션 생성
      this.tokenManager.setTokens(loginData.tokens);
      const session = await this.sessionManager.createSession(loginData.user, loginData.tokens);
      
      if (session.success) {
        await this.permissionManager.loadUserPermissions(loginData.user.id);
        
        EventBus.emitModuleEvent('@repo/auth-core', 'auth:2fa-verified', {
          user: loginData.user,
          type: verification.type
        });
      }

      this.logger.info('2FA 인증 성공', { userId: loginData.user.id });
      
      return { success: true, data: loginData };

    }, '2FA 인증 중 오류').then(result => {
      if (!result.success && result.error && typeof result.error !== 'string') {
        return { success: false, error: result.error.message || '2FA 인증 실패' } as AuthResult<LoginResponse>;
      }
      return result as unknown as AuthResult<LoginResponse>;
    });
  }

  // ===== 상태 조회 =====

  /**
   * 현재 사용자 조회
   */
  public getCurrentUser(): UserProfile | null {
    return this.sessionManager.getCurrentUser();
  }

  /**
   * 현재 세션 조회
   */
  public getCurrentSession(): AuthSession | null {
    return this.sessionManager.getCurrentSession();
  }

  /**
   * 인증 상태 확인
   */
  public isAuthenticated(): boolean {
    return this.sessionManager.isAuthenticated();
  }

  /**
   * 권한 확인
   */
  public hasPermission(permission: string): boolean {
    return this.permissionManager.hasPermission(permission);
  }

  public hasRole(role: string): boolean {
    return this.permissionManager.hasRole(role);
  }

  /**
   * 토큰 정보 조회
   */
  public getTokenInfo() {
    return this.tokenManager.getTokenInfo();
  }

  // ===== 내부 메소드 =====

  private validateLoginCredentials(credentials: LoginCredentials): AuthResult<void> {
    if (!credentials.email || !credentials.password) {
      const error = createAuthError('INVALID_INPUT', { field: 'credentials' }, {
        operation: 'validate_login'
      });
      return { success: false, error: error.userMessage };
    }

    if (!this.isValidEmail(credentials.email)) {
      const error = createAuthError('VALIDATION_FAILED', { field: 'email' }, {
        operation: 'validate_email'
      });
      return { success: false, error: error.userMessage };
    }

    return { success: true };
  }

  private validateSignupData(data: SignupData): AuthResult<void> {
    if (!data.email || !data.password || !data.name) {
      return { success: false, error: '필수 정보를 모두 입력해주세요' };
    }

    if (!this.isValidEmail(data.email)) {
      return { success: false, error: '올바른 이메일 형식이 아닙니다' };
    }

    if (!data.agreeToTerms || !data.agreeToPrivacy) {
      return { success: false, error: '필수 약관에 동의해주세요' };
    }

    return { success: true };
  }

  private validatePassword(password: string): AuthResult<void> {
    const policy = this.authConfig.passwordPolicy;
    
    if (password.length < policy.minLength) {
      return { 
        success: false, 
        error: `비밀번호는 최소 ${policy.minLength}자 이상이어야 합니다` 
      };
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      return { success: false, error: '비밀번호에 대문자를 포함해주세요' };
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      return { success: false, error: '비밀번호에 소문자를 포함해주세요' };
    }

    if (policy.requireNumbers && !/[0-9]/.test(password)) {
      return { success: false, error: '비밀번호에 숫자를 포함해주세요' };
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*]/.test(password)) {
      return { success: false, error: '비밀번호에 특수문자를 포함해주세요' };
    }

    return { success: true };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private setupAutoRefresh(): void {
    if (!this.authConfig.autoRefreshToken) {
      return;
    }

    // 토큰 만료 5분 전에 자동 갱신
    setInterval(async () => {
      const expiresAt = this.tokenManager.getTokenExpiry();
      if (!expiresAt) return;

      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (expiresAt <= fiveMinutesFromNow) {
        await this.refreshToken();
      }
    }, 60 * 1000); // 1분마다 체크
  }
}