import { nanoid } from 'nanoid';
import * as bcrypt from 'bcryptjs';
import { DatabaseAdapter } from '../adapters';
import { Logger } from '../core';
import { 
  UserAccount, 
  CreateUserAccountInput, 
  ServiceResponse, 
  UserAccountError, 
  UserAccountErrorCode,
  userAccountCreateSchema 
} from '../types';

export class UserAccountCreator {
  private readonly logger = new Logger('UserAccountCreator');
  private readonly saltRounds = 12;

  constructor(private readonly db: DatabaseAdapter) {}

  async create(input: CreateUserAccountInput): Promise<ServiceResponse<UserAccount>> {
    try {
      this.logger.info('Creating new user account', { email: input.email });

      // Validate input
      const validatedInput = userAccountCreateSchema.parse(input);

      // Check if email already exists
      const existingUser = await this.findByEmail(validatedInput.email);
      if (existingUser) {
        this.logger.warn('Attempt to create account with existing email', { email: validatedInput.email });
        throw new UserAccountError(
          UserAccountErrorCode.EMAIL_ALREADY_EXISTS,
          'An account with this email already exists'
        );
      }

      // Hash password
      const passwordHash = await this.hashPassword(validatedInput.password);

      // Create user account
      const userAccount: UserAccount = {
        id: nanoid(),
        email: validatedInput.email,
        emailVerified: validatedInput.emailVerified || false,
        passwordHash,
        passwordUpdatedAt: new Date(),
        isActive: validatedInput.isActive !== false,
        isLocked: false,
        loginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database
      await this.saveUserAccount(userAccount);

      this.logger.info('User account created successfully', { 
        id: userAccount.id, 
        email: userAccount.email 
      });

      return {
        success: true,
        data: userAccount
      };

    } catch (error) {
      this.logger.error('Failed to create user account', error);

      if (error instanceof UserAccountError) {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }

      return {
        success: false,
        error: 'Failed to create user account',
        code: UserAccountErrorCode.INTERNAL_ERROR
      };
    }
  }

  private async findByEmail(email: string): Promise<UserAccount | null> {
    const query = `
      SELECT * FROM user_accounts 
      WHERE email = ? AND deleted_at IS NULL
    `;
    
    return await this.db.queryOne<UserAccount>(query, [email]);
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      this.logger.error('Failed to hash password', error);
      throw new UserAccountError(
        UserAccountErrorCode.INTERNAL_ERROR,
        'Failed to process password'
      );
    }
  }

  private async saveUserAccount(userAccount: UserAccount): Promise<void> {
    const query = `
      INSERT INTO user_accounts (
        id, email, email_verified, password_hash, password_updated_at,
        is_active, is_locked, login_attempts, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      userAccount.id,
      userAccount.email,
      userAccount.emailVerified,
      userAccount.passwordHash,
      userAccount.passwordUpdatedAt,
      userAccount.isActive,
      userAccount.isLocked,
      userAccount.loginAttempts,
      userAccount.createdAt,
      userAccount.updatedAt
    ];

    try {
      await this.db.execute(query, params);
    } catch (error) {
      this.logger.error('Failed to save user account to database', error);
      throw new UserAccountError(
        UserAccountErrorCode.INTERNAL_ERROR,
        'Failed to save user account'
      );
    }
  }
}