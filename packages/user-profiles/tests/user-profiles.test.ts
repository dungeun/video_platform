import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { UserProfileService } from '../src/services/UserProfileService';
import { UserProfileValidator } from '../src/utils/validation';
import type { DatabaseManager } from '@repo/database';
import type { CreateUserProfileInput, UpdateUserProfileInput, UserProfile } from '../src/types';

// Mock dependencies
vi.mock('@repo/database');
vi.mock('@repo/core');

describe('UserProfileService', () => {
  let service: UserProfileService;
  let mockDb: DatabaseManager;

  beforeEach(() => {
    // Create mock database
    mockDb = {
      query: vi.fn(),
    } as any;

    // Create service instance
    service = new UserProfileService(mockDb);
  });

  describe('create', () => {
    it('should create a new user profile successfully', async () => {
      const input: CreateUserProfileInput = {
        id: 'user-123',
        name: 'John Doe',
        picture: 'https://example.com/avatar.jpg',
        bio: 'Software developer'
      };

      // Mock database responses
      (mockDb.query as Mock)
        .mockResolvedValueOnce({ success: true, data: [] }) // findById returns empty (profile doesn't exist)
        .mockResolvedValueOnce({ success: true }); // insert succeeds

      const result = await service.create(input);

      expect(result).toMatchObject({
        id: input.id,
        name: input.name,
        picture: input.picture,
        bio: input.bio
      });
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error if profile already exists', async () => {
      const input: CreateUserProfileInput = {
        id: 'user-123',
        name: 'John Doe'
      };

      const existingProfile: UserProfile = {
        id: 'user-123',
        name: 'Existing User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock findById to return existing profile
      (mockDb.query as Mock).mockResolvedValueOnce({ 
        success: true, 
        data: [{
          id: existingProfile.id,
          name: existingProfile.name,
          picture: null,
          bio: null,
          created_at: existingProfile.createdAt,
          updated_at: existingProfile.updatedAt
        }]
      });

      await expect(service.create(input)).rejects.toThrow('Profile already exists for user user-123');
    });

    it('should validate input and throw error for invalid data', async () => {
      const input: CreateUserProfileInput = {
        id: '',
        name: ''
      };

      await expect(service.create(input)).rejects.toThrow('Validation failed');
    });
  });

  describe('findById', () => {
    it('should return user profile when found', async () => {
      const profileRow = {
        id: 'user-123',
        name: 'John Doe',
        picture: 'https://example.com/avatar.jpg',
        bio: 'Software developer',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      (mockDb.query as Mock).mockResolvedValueOnce({ success: true, data: [profileRow] });

      const result = await service.findById('user-123');

      expect(result).toEqual({
        id: 'user-123',
        name: 'John Doe',
        picture: 'https://example.com/avatar.jpg',
        bio: 'Software developer',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z')
      });
    });

    it('should return null when profile not found', async () => {
      (mockDb.query as Mock).mockResolvedValueOnce({ success: true, data: [] });

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user profile successfully', async () => {
      const updateInput: UpdateUserProfileInput = {
        name: 'John Updated',
        bio: 'Updated bio'
      };

      const existingProfile = {
        id: 'user-123',
        name: 'John Doe',
        picture: null,
        bio: 'Old bio',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const updatedProfile = {
        ...existingProfile,
        name: 'John Updated',
        bio: 'Updated bio',
        updated_at: new Date().toISOString()
      };

      (mockDb.query as Mock)
        .mockResolvedValueOnce({ success: true, data: [existingProfile] }) // findById for existence check
        .mockResolvedValueOnce({ success: true }) // update operation
        .mockResolvedValueOnce({ success: true, data: [updatedProfile] }); // findById for final result

      const result = await service.update('user-123', updateInput);

      expect(result.name).toBe('John Updated');
      expect(result.bio).toBe('Updated bio');
    });

    it('should throw error if profile not found', async () => {
      (mockDb.query as Mock).mockResolvedValueOnce({ success: true, data: [] }); // findById returns empty

      await expect(service.update('non-existent', { name: 'New Name' }))
        .rejects.toThrow('Profile not found for user non-existent');
    });
  });

  describe('delete', () => {
    it('should delete user profile successfully', async () => {
      const existingProfile = {
        id: 'user-123',
        name: 'John Doe',
        picture: null,
        bio: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      (mockDb.query as Mock)
        .mockResolvedValueOnce({ success: true, data: [existingProfile] }) // findById for existence check
        .mockResolvedValueOnce({ success: true }); // delete operation

      await service.delete('user-123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM'),
        ['user-123']
      );
    });

    it('should throw error if profile not found', async () => {
      (mockDb.query as Mock).mockResolvedValueOnce({ success: true, data: [] }); // findById returns empty

      await expect(service.delete('non-existent'))
        .rejects.toThrow('Profile not found for user non-existent');
    });
  });

  describe('findMany', () => {
    it('should return paginated user profiles', async () => {
      const profileRows = [
        {
          id: 'user-1',
          name: 'User One',
          picture: null,
          bio: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'user-2',
          name: 'User Two',
          picture: null,
          bio: null,
          created_at: '2024-01-02T00:00:00.000Z',
          updated_at: '2024-01-02T00:00:00.000Z'
        }
      ];

      (mockDb.query as Mock).mockResolvedValueOnce({ success: true, data: profileRows });

      const result = await service.findMany({ limit: 2, offset: 0 });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('user-1');
      expect(result[1].id).toBe('user-2');
    });
  });
});

describe('UserProfileValidator', () => {
  let validator: UserProfileValidator;

  beforeEach(() => {
    validator = new UserProfileValidator();
  });

  describe('validateCreateInput', () => {
    it('should pass validation for valid input', () => {
      const input: CreateUserProfileInput = {
        id: 'user-123',
        name: 'John Doe',
        picture: 'https://example.com/avatar.jpg',
        bio: 'Software developer'
      };

      const errors = validator.validateCreateInput(input);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for missing required fields', () => {
      const input: CreateUserProfileInput = {
        id: '',
        name: ''
      };

      const errors = validator.validateCreateInput(input);
      expect(errors).toContain('ID is required and must be a non-empty string');
      expect(errors).toContain('Name is required and must be a string');
    });

    it('should fail validation for invalid picture URL', () => {
      const input: CreateUserProfileInput = {
        id: 'user-123',
        name: 'John Doe',
        picture: 'not-a-url'
      };

      const errors = validator.validateCreateInput(input);
      expect(errors).toContain('Picture must be a valid URL');
    });

    it('should fail validation for bio too long', () => {
      const input: CreateUserProfileInput = {
        id: 'user-123',
        name: 'John Doe',
        bio: 'a'.repeat(501) // Exceeds max length
      };

      const errors = validator.validateCreateInput(input);
      expect(errors).toContain('Bio must not exceed 500 characters');
    });
  });

  describe('validateUpdateInput', () => {
    it('should pass validation for valid update input', () => {
      const input: UpdateUserProfileInput = {
        name: 'John Updated',
        bio: 'Updated bio'
      };

      const errors = validator.validateUpdateInput(input);
      expect(errors).toHaveLength(0);
    });

    it('should allow empty update input', () => {
      const input: UpdateUserProfileInput = {};

      const errors = validator.validateUpdateInput(input);
      expect(errors).toHaveLength(0);
    });
  });
});