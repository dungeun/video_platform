/**
 * @repo/auth-core 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  createAuthService, 
  createAuthConfig, 
  validatePasswordStrength,
  validateEmail,
  decodeJwtPayload,
  isTokenExpired
} from '../src';

describe('@repo/auth-core', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAuthConfig', () => {
    it('should create default config', () => {
      const config = createAuthConfig({
        apiUrl: 'http://localhost:3000/api'
      });

      expect(config.apiUrl).toBe('http://localhost:3000/api');
      expect(config.sessionTimeout).toBe(120);
      expect(config.passwordPolicy.minLength).toBe(8);
    });

    it('should override default values', () => {
      const config = createAuthConfig({
        apiUrl: 'http://localhost:3000/api',
        sessionTimeout: 60,
        passwordPolicy: {
          minLength: 12,
          requireUppercase: false,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          preventCommonPasswords: false,
          preventUserInfo: false,
          historyCount: 3
        }
      });

      expect(config.sessionTimeout).toBe(60);
      expect(config.passwordPolicy.minLength).toBe(12);
      expect(config.passwordPolicy.requireUppercase).toBe(false);
    });
  });

  describe('createAuthService', () => {
    it('should create AuthService instance', () => {
      const service = createAuthService({
        apiUrl: 'http://localhost:3000/api'
      });

      expect(service).toBeDefined();
      expect(service.getConfig().apiUrl).toBe('http://localhost:3000/api');
    });
  });

  describe('validatePasswordStrength', () => {
    const policy = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true,
      preventUserInfo: true,
      historyCount: 5
    };

    it('should validate strong password', () => {
      const result = validatePasswordStrength('StrongP@ssw0rd!', policy);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const result = validatePasswordStrength('Str0ng!', policy);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('비밀번호는 최소 8자 이상이어야 합니다');
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('strongp@ssw0rd!', policy);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('대문자를 포함해야 합니다');
    });

    it('should reject password without lowercase', () => {
      const result = validatePasswordStrength('STRONGP@SSW0RD!', policy);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('소문자를 포함해야 합니다');
    });

    it('should reject password without numbers', () => {
      const result = validatePasswordStrength('StrongP@ssword!', policy);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('숫자를 포함해야 합니다');
    });

    it('should reject password without special chars', () => {
      const result = validatePasswordStrength('StrongPassw0rd', policy);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('특수문자를 포함해야 합니다');
    });

    it('should reject common passwords', () => {
      const result = validatePasswordStrength('Password123!', policy);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('일반적인 비밀번호는 사용할 수 없습니다');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.kr')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('decodeJwtPayload', () => {
    it('should decode valid JWT', () => {
      // Valid JWT token (header.payload.signature)
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      const payload = decodeJwtPayload(token);
      
      expect(payload).toBeDefined();
      expect(payload.sub).toBe('1234567890');
      expect(payload.name).toBe('John Doe');
      expect(payload.iat).toBe(1516239022);
    });

    it('should return null for invalid JWT', () => {
      expect(decodeJwtPayload('invalid-token')).toBeNull();
      expect(decodeJwtPayload('header.payload')).toBeNull();
      expect(decodeJwtPayload('')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should detect expired token', () => {
      // Create token with past expiry
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = { exp: pastTime };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should detect valid token', () => {
      // Create token with future expiry
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = { exp: futureTime };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should handle token without exp claim', () => {
      const payload = { sub: '123' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should handle invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });
  });
});