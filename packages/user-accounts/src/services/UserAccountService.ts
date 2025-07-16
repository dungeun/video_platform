import { DatabaseAdapter } from '../adapters';
import { Logger } from '../core';
import { UserAccountCreator } from '../create';
import { UserAccountReader } from '../read';
import { UserAccountUpdater } from '../update';
import { UserAccountDeleter } from '../delete';
import { EmailManager } from '../email';
import { PasswordManager } from '../password';
import { AccountValidator } from '../validation';
import { SecurityManager } from '../security';
import { 
  UserAccount,
  CreateUserAccountInput,
  UpdateUserAccountInput,
  EmailChangeInput,
  PasswordChangeInput,
  PasswordResetInput,
  PasswordResetConfirmInput,
  ServiceResponse,
  PaginatedResponse,
  UseUserAccountsOptions,
  AccountSecuritySettings,
  SecurityEvent,
  SecurityEventType
} from '../types';

export class UserAccountService {
  private readonly logger = new Logger('UserAccountService');
  
  private readonly creator: UserAccountCreator;
  private readonly reader: UserAccountReader;
  private readonly updater: UserAccountUpdater;
  private readonly deleter: UserAccountDeleter;
  private readonly emailManager: EmailManager;
  private readonly passwordManager: PasswordManager;
  private readonly validator: AccountValidator;
  private readonly securityManager: SecurityManager;

  constructor(private readonly db: DatabaseAdapter) {
    this.creator = new UserAccountCreator(db);
    this.reader = new UserAccountReader(db);
    this.updater = new UserAccountUpdater(db);
    this.deleter = new UserAccountDeleter(db);
    this.emailManager = new EmailManager(db);
    this.passwordManager = new PasswordManager(db);
    this.validator = new AccountValidator(db);
    this.securityManager = new SecurityManager(db);
  }

  // CRUD Operations
  async createAccount(input: CreateUserAccountInput): Promise<ServiceResponse<UserAccount>> {
    this.logger.info('Creating user account', { email: input.email });
    return await this.creator.create(input);
  }

  async getAccount(id: string): Promise<ServiceResponse<UserAccount>> {
    this.logger.debug('Getting user account', { id });
    return await this.reader.findById(id);
  }

  async getAccountByEmail(email: string): Promise<ServiceResponse<UserAccount>> {
    this.logger.debug('Getting user account by email', { email });
    return await this.reader.findByEmail(email);
  }

  async getAccounts(options: UseUserAccountsOptions = {}): Promise<ServiceResponse<PaginatedResponse<UserAccount>>> {
    this.logger.debug('Getting user accounts', options);
    return await this.reader.findMany(options);
  }

  async updateAccount(id: string, input: UpdateUserAccountInput): Promise<ServiceResponse<UserAccount>> {
    this.logger.info('Updating user account', { id });
    return await this.updater.update(id, input);
  }

  async deleteAccount(id: string): Promise<ServiceResponse<boolean>> {
    this.logger.info('Deleting user account', { id });
    return await this.deleter.softDelete(id);
  }

  async restoreAccount(id: string): Promise<ServiceResponse<UserAccount>> {
    this.logger.info('Restoring user account', { id });
    return await this.deleter.restore(id);
  }

  async permanentlyDeleteAccount(id: string): Promise<ServiceResponse<boolean>> {
    this.logger.warn('Permanently deleting user account', { id });
    return await this.deleter.hardDelete(id);
  }

  // Email Management
  async requestEmailChange(userId: string, input: EmailChangeInput): Promise<ServiceResponse<any>> {
    this.logger.info('Requesting email change', { userId });
    return await this.emailManager.requestEmailChange(userId, input);
  }

  async confirmEmailChange(token: string): Promise<ServiceResponse<boolean>> {
    this.logger.info('Confirming email change');
    return await this.emailManager.confirmEmailChange(token);
  }

  async sendEmailVerification(userId: string): Promise<ServiceResponse<any>> {
    this.logger.info('Sending email verification', { userId });
    return await this.emailManager.sendEmailVerification(userId);
  }

  async verifyEmail(token: string): Promise<ServiceResponse<boolean>> {
    this.logger.info('Verifying email');
    return await this.emailManager.verifyEmail(token);
  }

  // Password Management
  async changePassword(userId: string, input: PasswordChangeInput): Promise<ServiceResponse<boolean>> {
    this.logger.info('Changing password', { userId });
    return await this.passwordManager.changePassword(userId, input);
  }

  async requestPasswordReset(input: PasswordResetInput): Promise<ServiceResponse<any>> {
    this.logger.info('Requesting password reset', { email: input.email });
    return await this.passwordManager.requestPasswordReset(input);
  }

  async resetPassword(input: PasswordResetConfirmInput): Promise<ServiceResponse<boolean>> {
    this.logger.info('Resetting password');
    return await this.passwordManager.resetPassword(input);
  }

  async validatePasswordStrength(password: string): Promise<ServiceResponse<any>> {
    return await this.passwordManager.validatePasswordStrength(password);
  }

  // Account Validation
  async validateEmailUniqueness(email: string, excludeUserId?: string): Promise<ServiceResponse<boolean>> {
    return await this.validator.validateEmailUniqueness(email, excludeUserId);
  }

  async validateAccountStatus(userId: string): Promise<ServiceResponse<any>> {
    return await this.validator.validateAccountStatus(userId);
  }

  async validateAccountForLogin(identifier: string): Promise<ServiceResponse<any>> {
    return await this.validator.validateAccountForLogin(identifier);
  }

  // Security Management
  async getSecuritySettings(userId: string): Promise<ServiceResponse<AccountSecuritySettings>> {
    return await this.securityManager.getSecuritySettings(userId);
  }

  async updateSecuritySettings(
    userId: string, 
    updates: Partial<AccountSecuritySettings>
  ): Promise<ServiceResponse<AccountSecuritySettings>> {
    return await this.securityManager.updateSecuritySettings(userId, updates);
  }

  async logSecurityEvent(
    userId: string,
    eventType: SecurityEventType,
    description: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ServiceResponse<SecurityEvent>> {
    return await this.securityManager.logSecurityEvent(
      userId, eventType, description, metadata, ipAddress, userAgent
    );
  }

  async getSecurityEvents(userId: string, options: any = {}): Promise<ServiceResponse<any>> {
    return await this.securityManager.getSecurityEvents(userId, options);
  }

  async checkSuspiciousActivity(userId: string): Promise<ServiceResponse<any>> {
    return await this.securityManager.checkSuspiciousActivity(userId);
  }

  async enforceSecurityPolicy(userId: string): Promise<ServiceResponse<any>> {
    return await this.securityManager.enforceSecurityPolicy(userId);
  }

  // Account Locking/Unlocking
  async lockAccount(id: string, reason?: string, durationMinutes?: number): Promise<ServiceResponse<UserAccount>> {
    this.logger.info('Locking user account', { id, reason, durationMinutes });
    return await this.updater.lockAccount(id, reason, durationMinutes);
  }

  async unlockAccount(id: string): Promise<ServiceResponse<UserAccount>> {
    this.logger.info('Unlocking user account', { id });
    return await this.updater.unlockAccount(id);
  }

  // Login Attempt Management
  async incrementLoginAttempts(id: string): Promise<ServiceResponse<UserAccount>> {
    this.logger.debug('Incrementing login attempts', { id });
    return await this.updater.incrementLoginAttempts(id);
  }

  async resetLoginAttempts(id: string): Promise<ServiceResponse<UserAccount>> {
    this.logger.debug('Resetting login attempts', { id });
    return await this.updater.resetLoginAttempts(id);
  }

  // Bulk Operations
  async bulkDeleteAccounts(ids: string[]): Promise<ServiceResponse<any>> {
    this.logger.info('Bulk deleting accounts', { count: ids.length });
    return await this.deleter.bulkSoftDelete(ids);
  }

  async validateBulkEmails(emails: string[]): Promise<ServiceResponse<any>> {
    return await this.validator.validateBulkEmails(emails);
  }

  // Maintenance Operations
  async purgeOldDeletedAccounts(olderThanDays: number = 30): Promise<ServiceResponse<number>> {
    this.logger.info('Purging old deleted accounts', { olderThanDays });
    return await this.deleter.purgeOldDeleted(olderThanDays);
  }

  // Statistics
  async getAccountStats(): Promise<ServiceResponse<{
    total: number;
    active: number;
    locked: number;
    unverified: number;
    recentlyCreated: number;
  }>> {
    try {
      this.logger.debug('Getting account statistics');

      const [total, active, locked, recentlyCreated] = await Promise.all([
        this.reader.findMany({ limit: 1 }),
        this.reader.countActive(),
        this.reader.countLocked(),
        this.reader.findRecentlyCreated(7)
      ]);

      // Get unverified count
      const unverifiedQuery = `
        SELECT COUNT(*) as count FROM user_accounts 
        WHERE email_verified = false AND deleted_at IS NULL
      `;
      const unverifiedResult = await this.db.queryOne<{ count: number }>(unverifiedQuery);
      const unverified = unverifiedResult?.count || 0;

      return {
        success: true,
        data: {
          total: total.success ? total.data!.total : 0,
          active,
          locked,
          unverified,
          recentlyCreated: recentlyCreated.success ? recentlyCreated.data!.length : 0
        }
      };

    } catch (error) {
      this.logger.error('Failed to get account statistics', error);
      return {
        success: false,
        error: 'Failed to get account statistics'
      };
    }
  }

  // Health Check
  async healthCheck(): Promise<ServiceResponse<{ status: string; timestamp: Date }>> {
    try {
      // Simple query to check database connectivity
      await this.db.queryOne('SELECT 1');
      
      return {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date()
        }
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        success: false,
        error: 'Service is unhealthy',
        data: {
          status: 'unhealthy',
          timestamp: new Date()
        }
      };
    }
  }
}