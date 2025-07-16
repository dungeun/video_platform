import { Logger } from '../core';
import { UserAccountCreator } from '../create';
import { UserAccountReader } from '../read';
import { UserAccountUpdater } from '../update';
import { UserAccountDeleter } from '../delete';
import { EmailManager } from '../email';
import { PasswordManager } from '../password';
import { AccountValidator } from '../validation';
import { SecurityManager } from '../security';
export class UserAccountService {
    db;
    logger = new Logger('UserAccountService');
    creator;
    reader;
    updater;
    deleter;
    emailManager;
    passwordManager;
    validator;
    securityManager;
    constructor(db) {
        this.db = db;
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
    async createAccount(input) {
        this.logger.info('Creating user account', { email: input.email });
        return await this.creator.create(input);
    }
    async getAccount(id) {
        this.logger.debug('Getting user account', { id });
        return await this.reader.findById(id);
    }
    async getAccountByEmail(email) {
        this.logger.debug('Getting user account by email', { email });
        return await this.reader.findByEmail(email);
    }
    async getAccounts(options = {}) {
        this.logger.debug('Getting user accounts', options);
        return await this.reader.findMany(options);
    }
    async updateAccount(id, input) {
        this.logger.info('Updating user account', { id });
        return await this.updater.update(id, input);
    }
    async deleteAccount(id) {
        this.logger.info('Deleting user account', { id });
        return await this.deleter.softDelete(id);
    }
    async restoreAccount(id) {
        this.logger.info('Restoring user account', { id });
        return await this.deleter.restore(id);
    }
    async permanentlyDeleteAccount(id) {
        this.logger.warn('Permanently deleting user account', { id });
        return await this.deleter.hardDelete(id);
    }
    // Email Management
    async requestEmailChange(userId, input) {
        this.logger.info('Requesting email change', { userId });
        return await this.emailManager.requestEmailChange(userId, input);
    }
    async confirmEmailChange(token) {
        this.logger.info('Confirming email change');
        return await this.emailManager.confirmEmailChange(token);
    }
    async sendEmailVerification(userId) {
        this.logger.info('Sending email verification', { userId });
        return await this.emailManager.sendEmailVerification(userId);
    }
    async verifyEmail(token) {
        this.logger.info('Verifying email');
        return await this.emailManager.verifyEmail(token);
    }
    // Password Management
    async changePassword(userId, input) {
        this.logger.info('Changing password', { userId });
        return await this.passwordManager.changePassword(userId, input);
    }
    async requestPasswordReset(input) {
        this.logger.info('Requesting password reset', { email: input.email });
        return await this.passwordManager.requestPasswordReset(input);
    }
    async resetPassword(input) {
        this.logger.info('Resetting password');
        return await this.passwordManager.resetPassword(input);
    }
    async validatePasswordStrength(password) {
        return await this.passwordManager.validatePasswordStrength(password);
    }
    // Account Validation
    async validateEmailUniqueness(email, excludeUserId) {
        return await this.validator.validateEmailUniqueness(email, excludeUserId);
    }
    async validateAccountStatus(userId) {
        return await this.validator.validateAccountStatus(userId);
    }
    async validateAccountForLogin(identifier) {
        return await this.validator.validateAccountForLogin(identifier);
    }
    // Security Management
    async getSecuritySettings(userId) {
        return await this.securityManager.getSecuritySettings(userId);
    }
    async updateSecuritySettings(userId, updates) {
        return await this.securityManager.updateSecuritySettings(userId, updates);
    }
    async logSecurityEvent(userId, eventType, description, metadata, ipAddress, userAgent) {
        return await this.securityManager.logSecurityEvent(userId, eventType, description, metadata, ipAddress, userAgent);
    }
    async getSecurityEvents(userId, options = {}) {
        return await this.securityManager.getSecurityEvents(userId, options);
    }
    async checkSuspiciousActivity(userId) {
        return await this.securityManager.checkSuspiciousActivity(userId);
    }
    async enforceSecurityPolicy(userId) {
        return await this.securityManager.enforceSecurityPolicy(userId);
    }
    // Account Locking/Unlocking
    async lockAccount(id, reason, durationMinutes) {
        this.logger.info('Locking user account', { id, reason, durationMinutes });
        return await this.updater.lockAccount(id, reason, durationMinutes);
    }
    async unlockAccount(id) {
        this.logger.info('Unlocking user account', { id });
        return await this.updater.unlockAccount(id);
    }
    // Login Attempt Management
    async incrementLoginAttempts(id) {
        this.logger.debug('Incrementing login attempts', { id });
        return await this.updater.incrementLoginAttempts(id);
    }
    async resetLoginAttempts(id) {
        this.logger.debug('Resetting login attempts', { id });
        return await this.updater.resetLoginAttempts(id);
    }
    // Bulk Operations
    async bulkDeleteAccounts(ids) {
        this.logger.info('Bulk deleting accounts', { count: ids.length });
        return await this.deleter.bulkSoftDelete(ids);
    }
    async validateBulkEmails(emails) {
        return await this.validator.validateBulkEmails(emails);
    }
    // Maintenance Operations
    async purgeOldDeletedAccounts(olderThanDays = 30) {
        this.logger.info('Purging old deleted accounts', { olderThanDays });
        return await this.deleter.purgeOldDeleted(olderThanDays);
    }
    // Statistics
    async getAccountStats() {
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
            const unverifiedResult = await this.db.queryOne(unverifiedQuery);
            const unverified = unverifiedResult?.count || 0;
            return {
                success: true,
                data: {
                    total: total.success ? total.data.total : 0,
                    active,
                    locked,
                    unverified,
                    recentlyCreated: recentlyCreated.success ? recentlyCreated.data.length : 0
                }
            };
        }
        catch (error) {
            this.logger.error('Failed to get account statistics', error);
            return {
                success: false,
                error: 'Failed to get account statistics'
            };
        }
    }
    // Health Check
    async healthCheck() {
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
        }
        catch (error) {
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
//# sourceMappingURL=UserAccountService.js.map