/**
 * @company/auth - Authentication Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../src/auth/AuthService';
import { TokenManager } from '../src/auth/TokenManager';
import { SessionManager } from '../src/auth/SessionManager';
import { AuthConfig, LoginCredentials, AuthTokens, AuthUser } from '../src/types';

// Mock dependencies
vi.mock('@company/core', () => ({
  ModuleBase: class {
    constructor(config: any) {}
    async safeExecute(fn: Function, errorMessage: string) {
      try {
        return await fn();
      } catch (error) {
        return { success: false, error: errorMessage };
      }
    }
    get logger() {
      return {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      };
    }
    get errorHandler() {
      return {
        handle: vi.fn().mockReturnValue('Handled error')
      };
    }
    emit = vi.fn();
    destroy = vi.fn();
  },
  EventBus: {
    emitModuleEvent: vi.fn()
  }
}));

vi.mock('@company/api-client', () => ({
  HttpClient: class {
    constructor(config: any) {}
    async get(url: string) {
      return { success: true, data: { success: true } };
    }
    async post(url: string, data: any) {
      if (url === '/auth/login') {
        return {
          success: true,
          data: {
            user: mockUser,
            tokens: mockTokens,
            success: true
          }
        };
      }
      if (url === '/auth/logout') {
        return {
          success: true,
          data: { success: true }
        };
      }
      return { success: true, data: {} };
    }
  }
}));

const mockConfig: AuthConfig = {
  apiUrl: '/api',
  tokenStorageKey: 'test-token',
  refreshTokenKey: 'test-refresh',
  sessionTimeout: 120,
  rememberMeDuration: 30,
  autoRefreshToken: true,
  logoutOnWindowClose: false
};

const mockUser: AuthUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'https://example.com/avatar.jpg'
};

const mockTokens: AuthTokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: new Date(Date.now() + 3600000), // 1시간 후
  tokenType: 'Bearer'
};

const mockCredentials: LoginCredentials = {
  email: 'test@example.com',
  password: 'password123',
  rememberMe: true
};

describe('TokenManager', () => {
  let tokenManager: TokenManager;

  beforeEach(() => {
    tokenManager = new TokenManager(mockConfig);
  });

  it('should store and retrieve tokens', () => {
    tokenManager.setTokens(mockTokens);
    
    expect(tokenManager.getAccessToken()).toBe(mockTokens.accessToken);
    expect(tokenManager.getRefreshToken()).toBe(mockTokens.refreshToken);
  });

  it('should clear tokens', () => {
    tokenManager.setTokens(mockTokens);
    tokenManager.clearTokens();
    
    expect(tokenManager.getAccessToken()).toBeNull();
    expect(tokenManager.getRefreshToken()).toBeNull();
  });

  it('should validate token expiry', () => {
    const validTokens = {
      ...mockTokens,
      expiresAt: new Date(Date.now() + 3600000) // 1시간 후
    };
    
    const expiredTokens = {
      ...mockTokens,
      expiresAt: new Date(Date.now() - 3600000) // 1시간 전
    };

    tokenManager.setTokens(validTokens);
    expect(tokenManager.isValidToken()).toBe(true);

    tokenManager.setTokens(expiredTokens);
    expect(tokenManager.isValidToken()).toBe(false);
  });

  it('should get token info', () => {
    tokenManager.setTokens(mockTokens);
    const tokenInfo = tokenManager.getTokenInfo();
    
    expect(tokenInfo.isValid).toBe(true);
    expect(tokenInfo.expiresAt).toEqual(mockTokens.expiresAt);
    expect(tokenInfo.timeUntilExpiry).toBeGreaterThan(0);
  });
});

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager(mockConfig);
  });

  it('should create and manage session', () => {
    const result = sessionManager.createSession(mockUser, mockTokens);
    
    expect(result.success).toBe(true);
    expect(result.data?.user).toEqual(mockUser);
    expect(sessionManager.getCurrentUser()).toEqual(mockUser);
    expect(sessionManager.isAuthenticated()).toBe(true);
  });

  it('should update user info', () => {
    sessionManager.createSession(mockUser, mockTokens);
    
    const updatedUser = { ...mockUser, name: 'Updated Name' };
    sessionManager.updateUser(updatedUser);
    
    expect(sessionManager.getCurrentUser()?.name).toBe('Updated Name');
  });

  it('should update tokens', () => {
    sessionManager.createSession(mockUser, mockTokens);
    
    const newTokens = { ...mockTokens, accessToken: 'new-access-token' };
    sessionManager.updateTokens(newTokens);
    
    const session = sessionManager.getCurrentSession();
    expect(session?.tokens.accessToken).toBe('new-access-token');
  });

  it('should clear session', () => {
    sessionManager.createSession(mockUser, mockTokens);
    sessionManager.clearSession();
    
    expect(sessionManager.getCurrentUser()).toBeNull();
    expect(sessionManager.getCurrentSession()).toBeNull();
    expect(sessionManager.isAuthenticated()).toBe(false);
  });

  it('should validate session expiry', () => {
    const result = sessionManager.createSession(mockUser, mockTokens);
    expect(sessionManager.isSessionValid()).toBe(true);

    // 세션 만료시키기
    if (result.data) {
      result.data.expiresAt = new Date(Date.now() - 1000); // 1초 전
      sessionManager.setSession(result.data);
    }
    
    expect(sessionManager.isSessionValid()).toBe(false);
  });
});

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockConfig);
  });

  it('should login successfully', async () => {
    const result = await authService.login(mockCredentials);
    
    expect(result.success).toBe(true);
    expect(result.data?.user).toEqual(mockUser);
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('should logout successfully', async () => {
    // 먼저 로그인
    await authService.login(mockCredentials);
    expect(authService.isAuthenticated()).toBe(true);
    
    // 로그아웃
    const result = await authService.logout();
    
    expect(result.success).toBe(true);
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.getCurrentUser()).toBeNull();
  });

  it('should get current user and session', async () => {
    await authService.login(mockCredentials);
    
    const currentUser = authService.getCurrentUser();
    const currentSession = authService.getCurrentSession();
    
    expect(currentUser).toEqual(mockUser);
    expect(currentSession).toBeTruthy();
    expect(currentSession?.user).toEqual(mockUser);
  });

  it('should check session validity', async () => {
    await authService.login(mockCredentials);
    
    expect(authService.checkSession()).toBe(true);
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('should validate login credentials', async () => {
    const invalidCredentials = {
      email: 'invalid-email',
      password: ''
    };
    
    const result = await authService.login(invalidCredentials);
    expect(result.success).toBe(false);
  });

  it('should get token info', async () => {
    await authService.login(mockCredentials);
    
    const tokenInfo = authService.getTokenInfo();
    expect(tokenInfo.isValid).toBe(true);
    expect(tokenInfo.timeUntilExpiry).toBeGreaterThan(0);
  });
});