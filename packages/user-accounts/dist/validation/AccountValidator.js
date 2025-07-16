import { Logger } from '../core';
import { UserAccountErrorCode, emailSchema, passwordSchema } from '../types';
export class AccountValidator {
    db;
    logger = new Logger('AccountValidator');
    constructor(db) {
        this.db = db;
    }
    async validateEmailUniqueness(email, excludeUserId) {
        try {
            this.logger.debug('Validating email uniqueness', { email, excludeUserId });
            // First validate email format
            const emailValidation = emailSchema.safeParse(email);
            if (!emailValidation.success) {
                return {
                    success: false,
                    error: 'Invalid email format',
                    code: UserAccountErrorCode.VALIDATION_ERROR
                };
            }
            let query = `
        SELECT 1 FROM user_accounts 
        WHERE email = ? AND deleted_at IS NULL
      `;
            const params = [email];
            if (excludeUserId) {
                query += ' AND id != ?';
                params.push(excludeUserId);
            }
            query += ' LIMIT 1';
            const exists = await this.db.queryOne(query, params);
            if (exists) {
                return {
                    success: false,
                    error: 'Email is already in use',
                    code: UserAccountErrorCode.EMAIL_ALREADY_EXISTS
                };
            }
            return {
                success: true,
                data: true
            };
        }
        catch (error) {
            this.logger.error('Failed to validate email uniqueness', error);
            return {
                success: false,
                error: 'Failed to validate email',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async validatePasswordStrength(password) {
        try {
            this.logger.debug('Validating password strength');
            const validation = passwordSchema.safeParse(password);
            if (validation.success) {
                return {
                    success: true,
                    data: {
                        isValid: true,
                        errors: []
                    }
                };
            }
            const errors = validation.error.errors.map((err) => err.message);
            return {
                success: true,
                data: {
                    isValid: false,
                    errors
                }
            };
        }
        catch (error) {
            this.logger.error('Failed to validate password strength', error);
            return {
                success: false,
                error: 'Failed to validate password',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async validateAccountStatus(userId) {
        try {
            this.logger.debug('Validating account status', { userId });
            const account = await this.findUserById(userId);
            if (!account) {
                return {
                    success: false,
                    error: 'User account not found',
                    code: UserAccountErrorCode.NOT_FOUND
                };
            }
            const issues = [];
            let isValid = true;
            // Check if account is active
            if (!account.isActive) {
                issues.push('Account is inactive');
                isValid = false;
            }
            // Check if account is locked
            if (account.isLocked) {
                issues.push('Account is locked');
                isValid = false;
                // Check if lock has expired
                if (account.lockExpiresAt && new Date() > account.lockExpiresAt) {
                    issues.push('Account lock has expired and can be automatically unlocked');
                }
            }
            // Check if email is verified (if required)
            if (!account.emailVerified) {
                issues.push('Email is not verified');
                // Note: This doesn't make the account invalid by default
            }
            // Check for excessive login attempts
            if (account.loginAttempts >= 5) {
                issues.push('Too many failed login attempts');
                if (!account.isLocked) {
                    issues.push('Account should be locked due to failed attempts');
                    isValid = false;
                }
            }
            // Check if account is deleted
            if (account.deletedAt) {
                issues.push('Account is soft deleted');
                isValid = false;
            }
            return {
                success: true,
                data: {
                    isValid,
                    issues,
                    account
                }
            };
        }
        catch (error) {
            this.logger.error('Failed to validate account status', error);
            return {
                success: false,
                error: 'Failed to validate account status',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async validateEmailFormat(email) {
        try {
            const validation = emailSchema.safeParse(email);
            if (validation.success) {
                return {
                    success: true,
                    data: true
                };
            }
            return {
                success: false,
                error: validation.error.errors[0]?.message || 'Invalid email format',
                code: UserAccountErrorCode.VALIDATION_ERROR
            };
        }
        catch (error) {
            this.logger.error('Failed to validate email format', error);
            return {
                success: false,
                error: 'Failed to validate email format',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async validateUserExists(userId) {
        try {
            this.logger.debug('Validating user exists', { userId });
            const user = await this.findUserById(userId);
            if (!user) {
                return {
                    success: false,
                    error: 'User account not found',
                    code: UserAccountErrorCode.NOT_FOUND
                };
            }
            return {
                success: true,
                data: user
            };
        }
        catch (error) {
            this.logger.error('Failed to validate user exists', error);
            return {
                success: false,
                error: 'Failed to validate user existence',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async validateBulkEmails(emails) {
        try {
            this.logger.debug('Validating bulk emails', { count: emails.length });
            const valid = [];
            const invalid = [];
            const seen = new Set();
            const duplicates = [];
            const existing = [];
            for (const email of emails) {
                // Check for duplicates in the input
                if (seen.has(email.toLowerCase())) {
                    duplicates.push(email);
                    continue;
                }
                seen.add(email.toLowerCase());
                // Validate email format
                const formatValidation = emailSchema.safeParse(email);
                if (!formatValidation.success) {
                    invalid.push({
                        email,
                        error: formatValidation.error.errors[0]?.message || 'Invalid format'
                    });
                    continue;
                }
                // Check if email already exists
                const existsQuery = `
          SELECT 1 FROM user_accounts 
          WHERE email = ? AND deleted_at IS NULL 
          LIMIT 1
        `;
                const exists = await this.db.queryOne(existsQuery, [email]);
                if (exists) {
                    existing.push(email);
                    continue;
                }
                valid.push(email);
            }
            return {
                success: true,
                data: {
                    valid,
                    invalid,
                    duplicates,
                    existing
                }
            };
        }
        catch (error) {
            this.logger.error('Failed to validate bulk emails', error);
            return {
                success: false,
                error: 'Failed to validate emails',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async validateAccountForLogin(identifier) {
        try {
            this.logger.debug('Validating account for login', { identifier });
            // Find user by email
            const account = await this.findUserByEmail(identifier);
            if (!account) {
                return {
                    success: true,
                    data: {
                        canLogin: false,
                        account: null,
                        reason: 'Account not found'
                    }
                };
            }
            // Check if account is active
            if (!account.isActive) {
                return {
                    success: true,
                    data: {
                        canLogin: false,
                        account,
                        reason: 'Account is inactive'
                    }
                };
            }
            // Check if account is locked
            if (account.isLocked) {
                // Check if lock has expired
                if (account.lockExpiresAt && new Date() > account.lockExpiresAt) {
                    // Auto-unlock expired locks
                    await this.autoUnlockExpiredAccount(account.id);
                    const updatedAccount = await this.findUserById(account.id);
                    return {
                        success: true,
                        data: {
                            canLogin: true,
                            account: updatedAccount
                        }
                    };
                }
                return {
                    success: true,
                    data: {
                        canLogin: false,
                        account,
                        reason: account.lockReason || 'Account is locked'
                    }
                };
            }
            // Check if account is deleted
            if (account.deletedAt) {
                return {
                    success: true,
                    data: {
                        canLogin: false,
                        account,
                        reason: 'Account is deleted'
                    }
                };
            }
            return {
                success: true,
                data: {
                    canLogin: true,
                    account
                }
            };
        }
        catch (error) {
            this.logger.error('Failed to validate account for login', error);
            return {
                success: false,
                error: 'Failed to validate account for login',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async findUserById(id) {
        const query = `SELECT * FROM user_accounts WHERE id = ? AND deleted_at IS NULL`;
        return await this.db.queryOne(query, [id]);
    }
    async findUserByEmail(email) {
        const query = `SELECT * FROM user_accounts WHERE email = ? AND deleted_at IS NULL`;
        return await this.db.queryOne(query, [email]);
    }
    async autoUnlockExpiredAccount(userId) {
        const query = `
      UPDATE user_accounts 
      SET is_locked = false, lock_reason = NULL, locked_at = NULL, 
          lock_expires_at = NULL, login_attempts = 0, updated_at = ?
      WHERE id = ?
    `;
        await this.db.execute(query, [new Date(), userId]);
        this.logger.info('Auto-unlocked expired account', { userId });
    }
}
//# sourceMappingURL=AccountValidator.js.map