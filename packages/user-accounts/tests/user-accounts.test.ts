import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserAccountService } from '../src/services/UserAccountService';
import { CreateUserAccountInput, UserAccountErrorCode } from '../src/types';

// Mock database manager
const mockDb = {
  queryOne: vi.fn(),
  queryMany: vi.fn(),
  execute: vi.fn(),
  beginTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  rollbackTransaction: vi.fn()
};

describe('UserAccountService', () => {
  let service: UserAccountService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserAccountService(mockDb as any);
  });

  describe('createAccount', () => {
    it('should create a new user account successfully', async () => {
      const input: CreateUserAccountInput = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        emailVerified: false,
        isActive: true
      };

      // Mock database responses
      mockDb.queryOne.mockResolvedValueOnce(null); // Email doesn't exist
      mockDb.execute.mockResolvedValueOnce(undefined); // Insert successful

      const result = await service.createAccount(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.email).toBe(input.email);
      expect(result.data?.passwordHash).toBeUndefined(); // Password hash should be removed from response
    });

    it('should fail when email already exists', async () => {
      const input: CreateUserAccountInput = {
        email: 'existing@example.com',
        password: 'StrongPass123!',
        emailVerified: false,
        isActive: true
      };

      // Mock database responses
      mockDb.queryOne.mockResolvedValueOnce({ id: '123', email: input.email }); // Email exists

      const result = await service.createAccount(input);

      expect(result.success).toBe(false);
      expect(result.code).toBe(UserAccountErrorCode.EMAIL_ALREADY_EXISTS);
    });

    it('should validate password strength', async () => {
      const input: CreateUserAccountInput = {
        email: 'test@example.com',
        password: 'weak',
        emailVerified: false,
        isActive: true
      };

      const result = await service.createAccount(input);

      expect(result.success).toBe(false);
      expect(result.code).toBe(UserAccountErrorCode.VALIDATION_ERROR);
    });
  });

  describe('getAccount', () => {
    it('should retrieve user account by id', async () => {
      const accountId = 'test-id';
      const mockAccount = {
        id: accountId,
        email: 'test@example.com',
        isActive: true,
        isLocked: false,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDb.queryOne.mockResolvedValueOnce(mockAccount);

      const result = await service.getAccount(accountId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAccount);
    });

    it('should return not found for non-existent account', async () => {
      const accountId = 'non-existent';

      mockDb.queryOne.mockResolvedValueOnce(null);

      const result = await service.getAccount(accountId);

      expect(result.success).toBe(false);
      expect(result.code).toBe(UserAccountErrorCode.NOT_FOUND);
    });
  });

  describe('validateEmailUniqueness', () => {
    it('should return true for unique email', async () => {
      const email = 'unique@example.com';

      mockDb.queryOne.mockResolvedValueOnce(null); // Email doesn't exist

      const result = await service.validateEmailUniqueness(email);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false for existing email', async () => {
      const email = 'existing@example.com';

      mockDb.queryOne.mockResolvedValueOnce({ id: '123' }); // Email exists

      const result = await service.validateEmailUniqueness(email);

      expect(result.success).toBe(false);
      expect(result.code).toBe(UserAccountErrorCode.EMAIL_ALREADY_EXISTS);
    });

    it('should validate email format', async () => {
      const invalidEmail = 'invalid-email';

      const result = await service.validateEmailUniqueness(invalidEmail);

      expect(result.success).toBe(false);
      expect(result.code).toBe(UserAccountErrorCode.VALIDATION_ERROR);
    });
  });

  describe('lockAccount', () => {
    it('should lock account with reason', async () => {
      const accountId = 'test-id';
      const reason = 'Suspicious activity';
      const mockAccount = {
        id: accountId,
        email: 'test@example.com',
        isActive: true,
        isLocked: false
      };

      mockDb.queryOne
        .mockResolvedValueOnce(mockAccount) // findById check
        .mockResolvedValueOnce({ ...mockAccount, isLocked: true, lockReason: reason }); // Updated account
      mockDb.execute.mockResolvedValueOnce(undefined);

      const result = await service.lockAccount(accountId, reason);

      expect(result.success).toBe(true);
      expect(result.data?.isLocked).toBe(true);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = 'test-id';
      const input = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!'
      };

      const mockUser = {
        id: userId,
        passwordHash: 'hashed-old-password',
        isLocked: false
      };

      mockDb.queryOne.mockResolvedValueOnce(mockUser);
      mockDb.execute.mockResolvedValue(undefined);
      mockDb.beginTransaction.mockResolvedValue(undefined);
      mockDb.commitTransaction.mockResolvedValue(undefined);

      // Mock bcrypt verification
      const bcrypt = await import('bcryptjs');
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-new-password');

      const result = await service.changePassword(userId, input);

      expect(result.success).toBe(true);
    });

    it('should fail with incorrect current password', async () => {
      const userId = 'test-id';
      const input = {
        currentPassword: 'WrongPass123!',
        newPassword: 'NewPass123!'
      };

      const mockUser = {
        id: userId,
        passwordHash: 'hashed-old-password',
        isLocked: false
      };

      mockDb.queryOne.mockResolvedValueOnce(mockUser);

      // Mock bcrypt verification to fail
      const bcrypt = await import('bcryptjs');
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const result = await service.changePassword(userId, input);

      expect(result.success).toBe(false);
      expect(result.code).toBe(UserAccountErrorCode.INVALID_CREDENTIALS);
    });
  });
});

describe('Account Validation', () => {
  let service: UserAccountService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserAccountService(mockDb as any);
  });

  describe('email validation', () => {
    it('should accept valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      for (const email of validEmails) {
        mockDb.queryOne.mockResolvedValueOnce(null);
        const result = await service.validateEmailUniqueness(email);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com'
      ];

      for (const email of invalidEmails) {
        const result = await service.validateEmailUniqueness(email);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('password validation', () => {
    it('should validate strong passwords', async () => {
      const strongPassword = 'StrongPass123!@#';

      const result = await service.validatePasswordStrength(strongPassword);

      expect(result.success).toBe(true);
      expect(result.data?.score).toBeGreaterThan(3);
    });

    it('should reject weak passwords', async () => {
      const weakPasswords = [
        'weak',
        '12345678',
        'password',
        'PASSWORD',
        'Pass123'
      ];

      for (const password of weakPasswords) {
        const result = await service.validatePasswordStrength(password);
        expect(result.success).toBe(true);
        expect(result.data?.score).toBeLessThan(4);
      }
    });
  });
});