import { Logger } from '@repo/core';
import { DatabaseManager } from '@repo/database';
import type { 
  UserProfile, 
  CreateUserProfileInput, 
  UpdateUserProfileInput, 
  UserProfileQueryOptions,
  UserProfileServiceConfig,
  UserProfileEvents
} from '../types';
import { UserProfileValidator, sanitizeName, sanitizeBio } from '../utils';

export class UserProfileService {
  private db: DatabaseManager;
  private validator: UserProfileValidator;
  private config: Required<UserProfileServiceConfig>;
  private logger: Logger;

  constructor(
    db: DatabaseManager,
    config: UserProfileServiceConfig = {}
  ) {
    this.db = db;
    this.validator = new UserProfileValidator();
    this.logger = new Logger('UserProfileService');
    this.config = {
      tableName: 'user_profiles',
      maxBioLength: 500,
      allowedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      ...config
    };
  }

  /**
   * Create a new user profile
   */
  async create(input: CreateUserProfileInput): Promise<UserProfile> {
    this.logger.info('Creating user profile', { userId: input.id });

    // Validate input
    const validationErrors = this.validator.validateCreateInput(input);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Check if profile already exists
    const existing = await this.findById(input.id);
    if (existing) {
      throw new Error(`Profile already exists for user ${input.id}`);
    }

    // Sanitize input
    const sanitizedInput = {
      ...input,
      name: sanitizeName(input.name),
      bio: input.bio ? sanitizeBio(input.bio) : undefined
    };

    const now = new Date();
    const profile: UserProfile = {
      id: sanitizedInput.id,
      name: sanitizedInput.name,
      picture: sanitizedInput.picture,
      bio: sanitizedInput.bio,
      createdAt: now,
      updatedAt: now
    };

    try {
      // Insert into database
      const result = await this.db.query(
        `INSERT INTO ${this.config.tableName} (id, name, picture, bio, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [profile.id, profile.name, profile.picture || null, profile.bio || null, profile.createdAt, profile.updatedAt]
      );

      if (!result.success) {
        throw new Error(result.error || 'Database insert failed');
      }

      this.logger.info('User profile created successfully', { userId: profile.id });

      return profile;
    } catch (error) {
      this.logger.error('Failed to create user profile', { userId: input.id, error });
      throw new Error(`Failed to create user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find user profile by ID
   */
  async findById(id: string): Promise<UserProfile | null> {
    try {
      const result = await this.db.query(
        `SELECT * FROM ${this.config.tableName} WHERE id = ?`,
        [id]
      );

      if (!result.success) {
        throw new Error(result.error || 'Database query failed');
      }

      if (!result.data || result.data.length === 0) {
        return null;
      }

      return this.mapRowToProfile(result.data[0]);
    } catch (error) {
      this.logger.error('Failed to find user profile', { userId: id, error });
      throw new Error(`Failed to find user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user profile
   */
  async update(id: string, input: UpdateUserProfileInput): Promise<UserProfile> {
    this.logger.info('Updating user profile', { userId: id });

    // Validate input
    const validationErrors = this.validator.validateUpdateInput(input);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Check if profile exists
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Profile not found for user ${id}`);
    }

    // Sanitize input
    const sanitizedInput: UpdateUserProfileInput = {};
    if (input.name !== undefined) {
      sanitizedInput.name = sanitizeName(input.name);
    }
    if (input.bio !== undefined) {
      sanitizedInput.bio = sanitizeBio(input.bio);
    }
    if (input.picture !== undefined) {
      sanitizedInput.picture = input.picture;
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(sanitizedInput).forEach(([key, value]) => {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    });

    updateFields.push('updated_at = ?');
    updateValues.push(new Date());
    updateValues.push(id);

    try {
      const result = await this.db.query(
        `UPDATE ${this.config.tableName} SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      if (!result.success) {
        throw new Error(result.error || 'Database update failed');
      }

      const updatedProfile = await this.findById(id);
      if (!updatedProfile) {
        throw new Error('Failed to retrieve updated profile');
      }

      this.logger.info('User profile updated successfully', { userId: id });

      return updatedProfile;
    } catch (error) {
      this.logger.error('Failed to update user profile', { userId: id, error });
      throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete user profile
   */
  async delete(id: string): Promise<void> {
    this.logger.info('Deleting user profile', { userId: id });

    // Check if profile exists
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Profile not found for user ${id}`);
    }

    try {
      const result = await this.db.query(
        `DELETE FROM ${this.config.tableName} WHERE id = ?`,
        [id]
      );

      if (!result.success) {
        throw new Error(result.error || 'Database delete failed');
      }

      this.logger.info('User profile deleted successfully', { userId: id });
    } catch (error) {
      this.logger.error('Failed to delete user profile', { userId: id, error });
      throw new Error(`Failed to delete user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find multiple user profiles with options
   */
  async findMany(options: UserProfileQueryOptions = {}): Promise<UserProfile[]> {
    const {
      limit = 10,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {}
    } = options;

    let query = `SELECT * FROM ${this.config.tableName}`;
    const queryParams: any[] = [];
    const whereConditions: string[] = [];

    // Apply filters
    if (filters.name) {
      whereConditions.push('name LIKE ?');
      queryParams.push(`%${filters.name}%`);
    }

    if (filters.hasProfilePicture !== undefined) {
      if (filters.hasProfilePicture) {
        whereConditions.push('picture IS NOT NULL AND picture != ?');
        queryParams.push('');
      } else {
        whereConditions.push('(picture IS NULL OR picture = ?)');
        queryParams.push('');
      }
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add sorting
    query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    try {
      const result = await this.db.query(query, queryParams);
      
      if (!result.success) {
        throw new Error(result.error || 'Database query failed');
      }

      return (result.data || []).map(row => this.mapRowToProfile(row));
    } catch (error) {
      this.logger.error('Failed to find user profiles', { error });
      throw new Error(`Failed to find user profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count total user profiles
   */
  async count(filters: UserProfileQueryOptions['filters'] = {}): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.config.tableName}`;
    const queryParams: any[] = [];
    const whereConditions: string[] = [];

    // Apply filters
    if (filters.name) {
      whereConditions.push('name LIKE ?');
      queryParams.push(`%${filters.name}%`);
    }

    if (filters.hasProfilePicture !== undefined) {
      if (filters.hasProfilePicture) {
        whereConditions.push('picture IS NOT NULL AND picture != ?');
        queryParams.push('');
      } else {
        whereConditions.push('(picture IS NULL OR picture = ?)');
        queryParams.push('');
      }
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    try {
      const result = await this.db.query(query, queryParams);
      
      if (!result.success) {
        throw new Error(result.error || 'Database query failed');
      }

      return result.data?.[0]?.count || 0;
    } catch (error) {
      this.logger.error('Failed to count user profiles', { error });
      throw new Error(`Failed to count user profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map database row to UserProfile object
   */
  private mapRowToProfile(row: any): UserProfile {
    return {
      id: row.id,
      name: row.name,
      picture: row.picture || undefined,
      bio: row.bio || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}