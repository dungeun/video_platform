import { nanoid } from 'nanoid';
import * as bcrypt from 'bcryptjs';
import { Logger } from '../core';
import { UserAccountError, UserAccountErrorCode, SecurityEventType, passwordChangeSchema, passwordResetSchema, passwordResetConfirmSchema } from '../types';
export class PasswordManager {
    db;
    logger = new Logger('PasswordManager');
    saltRounds = 12;
    resetTokenExpiryHours = 2;
    maxPasswordHistory = 5;
    constructor(db) {
        this.db = db;
    }
    async changePassword(userId, input) {
        try {
            this.logger.info('Changing password', { userId });
            // Validate input
            const validatedInput = passwordChangeSchema.parse(input);
            // Check if user exists
            const user = await this.findUserById(userId);
            if (!user) {
                return {
                    success: false,
                    error: 'User account not found',
                    code: UserAccountErrorCode.NOT_FOUND
                };
            }
            if (user.isLocked) {
                return {
                    success: false,
                    error: 'Account is locked',
                    code: UserAccountErrorCode.ACCOUNT_LOCKED
                };
            }
            // Verify current password
            const isCurrentPasswordValid = await this.verifyPassword(validatedInput.currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                await this.logSecurityEvent(userId, SecurityEventType.PASSWORD_CHANGED, 'Failed password change attempt - incorrect current password');
                return {
                    success: false,
                    error: 'Current password is incorrect',
                    code: UserAccountErrorCode.INVALID_CREDENTIALS
                };
            }
            // Check if new password is different from current
            const isSamePassword = await this.verifyPassword(validatedInput.newPassword, user.passwordHash);
            if (isSamePassword) {
                return {
                    success: false,
                    error: 'New password must be different from current password',
                    code: UserAccountErrorCode.VALIDATION_ERROR
                };
            }
            // Check password history to prevent reuse
            const isPasswordReused = await this.isPasswordReused(userId, validatedInput.newPassword);
            if (isPasswordReused) {
                return {
                    success: false,
                    error: `New password cannot be one of your last ${this.maxPasswordHistory} passwords`,
                    code: UserAccountErrorCode.PASSWORD_REUSED
                };
            }
            // Hash new password
            const newPasswordHash = await this.hashPassword(validatedInput.newPassword);
            // Begin transaction
            await this.db.beginTransaction();
            try {
                // Save current password to history
                await this.savePasswordToHistory(userId, user.passwordHash);
                // Update user password
                await this.updateUserPassword(userId, newPasswordHash);
                // Clean up old password history
                await this.cleanupPasswordHistory(userId);
                // Log security event
                await this.logSecurityEvent(userId, SecurityEventType.PASSWORD_CHANGED, 'Password changed successfully');
                await this.db.commitTransaction();
                this.logger.info('Password changed successfully', { userId });
                return {
                    success: true,
                    data: true
                };
            }
            catch (error) {
                await this.db.rollbackTransaction();
                throw error;
            }
        }
        catch (error) {
            this.logger.error('Failed to change password', error);
            if (error instanceof UserAccountError) {
                return {
                    success: false,
                    error: error.message,
                    code: error.code
                };
            }
            return {
                success: false,
                error: 'Failed to change password',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async requestPasswordReset(input) {
        try {
            this.logger.info('Requesting password reset', { email: input.email });
            // Validate input
            const validatedInput = passwordResetSchema.parse(input);
            // Check if user exists
            const user = await this.findUserByEmail(validatedInput.email);
            if (!user) {
                // Don't reveal if email exists or not for security
                this.logger.warn('Password reset requested for non-existent email', { email: validatedInput.email });
                // Return success anyway to prevent email enumeration
                return {
                    success: true,
                    data: {
                        id: 'dummy',
                        userId: 'dummy',
                        token: 'dummy',
                        used: false,
                        expiresAt: new Date(),
                        createdAt: new Date()
                    }
                };
            }
            if (user.isLocked) {
                return {
                    success: false,
                    error: 'Account is locked',
                    code: UserAccountErrorCode.ACCOUNT_LOCKED
                };
            }
            if (!user.isActive) {
                return {
                    success: false,
                    error: 'Account is inactive',
                    code: UserAccountErrorCode.ACCOUNT_INACTIVE
                };
            }
            // Cancel any existing reset requests
            await this.cancelPendingResetRequests(user.id);
            // Create new reset request
            const resetRequest = {
                id: nanoid(),
                userId: user.id,
                token: this.generateResetToken(),
                used: false,
                expiresAt: new Date(Date.now() + this.resetTokenExpiryHours * 60 * 60 * 1000),
                createdAt: new Date()
            };
            await this.savePasswordResetRequest(resetRequest);
            // Log security event
            await this.logSecurityEvent(user.id, SecurityEventType.PASSWORD_RESET_REQUESTED, `Password reset requested for email: ${validatedInput.email}`);
            this.logger.info('Password reset request created', {
                requestId: resetRequest.id,
                userId: user.id
            });
            return {
                success: true,
                data: resetRequest
            };
        }
        catch (error) {
            this.logger.error('Failed to request password reset', error);
            if (error instanceof UserAccountError) {
                return {
                    success: false,
                    error: error.message,
                    code: error.code
                };
            }
            return {
                success: false,
                error: 'Failed to request password reset',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async resetPassword(input) {
        try {
            this.logger.info('Resetting password', { token: input.token.substring(0, 8) + '...' });
            // Validate input
            const validatedInput = passwordResetConfirmSchema.parse(input);
            // Find reset request
            const resetRequest = await this.findPasswordResetRequest(validatedInput.token);
            if (!resetRequest) {
                return {
                    success: false,
                    error: 'Invalid or expired reset token',
                    code: UserAccountErrorCode.INVALID_RESET_TOKEN
                };
            }
            // Check if token is expired
            if (new Date() > resetRequest.expiresAt) {
                await this.deletePasswordResetRequest(resetRequest.id);
                return {
                    success: false,
                    error: 'Reset token has expired',
                    code: UserAccountErrorCode.RESET_TOKEN_EXPIRED
                };
            }
            // Check if token is already used
            if (resetRequest.used) {
                return {
                    success: false,
                    error: 'Reset token has already been used',
                    code: UserAccountErrorCode.INVALID_RESET_TOKEN
                };
            }
            // Get user
            const user = await this.findUserById(resetRequest.userId);
            if (!user) {
                await this.deletePasswordResetRequest(resetRequest.id);
                return {
                    success: false,
                    error: 'User account not found',
                    code: UserAccountErrorCode.NOT_FOUND
                };
            }
            // Check if new password is different from current
            const isSamePassword = await this.verifyPassword(validatedInput.newPassword, user.passwordHash);
            if (isSamePassword) {
                return {
                    success: false,
                    error: 'New password must be different from current password',
                    code: UserAccountErrorCode.VALIDATION_ERROR
                };
            }
            // Check password history to prevent reuse
            const isPasswordReused = await this.isPasswordReused(resetRequest.userId, validatedInput.newPassword);
            if (isPasswordReused) {
                return {
                    success: false,
                    error: `New password cannot be one of your last ${this.maxPasswordHistory} passwords`,
                    code: UserAccountErrorCode.PASSWORD_REUSED
                };
            }
            // Hash new password
            const newPasswordHash = await this.hashPassword(validatedInput.newPassword);
            // Begin transaction
            await this.db.beginTransaction();
            try {
                // Save current password to history
                await this.savePasswordToHistory(resetRequest.userId, user.passwordHash);
                // Update user password
                await this.updateUserPassword(resetRequest.userId, newPasswordHash);
                // Mark reset request as used
                await this.markResetRequestUsed(resetRequest.id);
                // Reset login attempts and unlock account if locked
                await this.resetLoginAttemptsAndUnlock(resetRequest.userId);
                // Clean up old password history
                await this.cleanupPasswordHistory(resetRequest.userId);
                // Log security event
                await this.logSecurityEvent(resetRequest.userId, SecurityEventType.PASSWORD_RESET_COMPLETED, 'Password reset completed successfully');
                await this.db.commitTransaction();
                this.logger.info('Password reset completed successfully', { userId: resetRequest.userId });
                return {
                    success: true,
                    data: true
                };
            }
            catch (error) {
                await this.db.rollbackTransaction();
                throw error;
            }
        }
        catch (error) {
            this.logger.error('Failed to reset password', error);
            if (error instanceof UserAccountError) {
                return {
                    success: false,
                    error: error.message,
                    code: error.code
                };
            }
            return {
                success: false,
                error: 'Failed to reset password',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async validatePasswordStrength(password) {
        try {
            const feedback = [];
            let score = 0;
            // Length check
            if (password.length >= 8) {
                score += 1;
            }
            else {
                feedback.push('Password must be at least 8 characters long');
            }
            if (password.length >= 12) {
                score += 1;
            }
            // Character type checks
            if (/[a-z]/.test(password)) {
                score += 1;
            }
            else {
                feedback.push('Password must contain lowercase letters');
            }
            if (/[A-Z]/.test(password)) {
                score += 1;
            }
            else {
                feedback.push('Password must contain uppercase letters');
            }
            if (/[0-9]/.test(password)) {
                score += 1;
            }
            else {
                feedback.push('Password must contain numbers');
            }
            if (/[^A-Za-z0-9]/.test(password)) {
                score += 1;
            }
            else {
                feedback.push('Password must contain special characters');
            }
            // Common patterns check
            if (!/(.)\1{2,}/.test(password)) {
                score += 1;
            }
            else {
                feedback.push('Avoid repeating characters');
            }
            // Sequential characters check
            if (!/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789|890)/i.test(password)) {
                score += 1;
            }
            else {
                feedback.push('Avoid sequential characters');
            }
            return {
                success: true,
                data: {
                    score: Math.min(score, 5),
                    feedback
                }
            };
        }
        catch (error) {
            this.logger.error('Failed to validate password strength', error);
            return {
                success: false,
                error: 'Failed to validate password strength',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async hashPassword(password) {
        try {
            return await bcrypt.hash(password, this.saltRounds);
        }
        catch (error) {
            this.logger.error('Failed to hash password', error);
            throw new UserAccountError(UserAccountErrorCode.INTERNAL_ERROR, 'Failed to process password');
        }
    }
    async verifyPassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        }
        catch (error) {
            this.logger.error('Failed to verify password', error);
            return false;
        }
    }
    generateResetToken() {
        return nanoid(32);
    }
    async findUserById(id) {
        const query = `SELECT * FROM user_accounts WHERE id = ? AND deleted_at IS NULL`;
        return await this.db.queryOne(query, [id]);
    }
    async findUserByEmail(email) {
        const query = `SELECT * FROM user_accounts WHERE email = ? AND deleted_at IS NULL`;
        return await this.db.queryOne(query, [email]);
    }
    async isPasswordReused(userId, newPassword) {
        const query = `
      SELECT password_hash FROM password_history 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
        const history = await this.db.queryMany(query, [userId, this.maxPasswordHistory]);
        for (const entry of history) {
            const isMatch = await this.verifyPassword(newPassword, entry.password_hash);
            if (isMatch) {
                return true;
            }
        }
        return false;
    }
    async savePasswordToHistory(userId, passwordHash) {
        const query = `
      INSERT INTO password_history (id, user_id, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `;
        await this.db.execute(query, [nanoid(), userId, passwordHash, new Date()]);
    }
    async updateUserPassword(userId, passwordHash) {
        const query = `
      UPDATE user_accounts 
      SET password_hash = ?, password_updated_at = ?, updated_at = ?
      WHERE id = ?
    `;
        const now = new Date();
        await this.db.execute(query, [passwordHash, now, now, userId]);
    }
    async cleanupPasswordHistory(userId) {
        const query = `
      DELETE FROM password_history 
      WHERE user_id = ? AND id NOT IN (
        SELECT id FROM (
          SELECT id FROM password_history 
          WHERE user_id = ? 
          ORDER BY created_at DESC 
          LIMIT ?
        ) AS recent
      )
    `;
        await this.db.execute(query, [userId, userId, this.maxPasswordHistory]);
    }
    async savePasswordResetRequest(request) {
        const query = `
      INSERT INTO password_reset_requests 
      (id, user_id, token, used, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
        await this.db.execute(query, [
            request.id,
            request.userId,
            request.token,
            request.used,
            request.expiresAt,
            request.createdAt
        ]);
    }
    async findPasswordResetRequest(token) {
        const query = `SELECT * FROM password_reset_requests WHERE token = ?`;
        return await this.db.queryOne(query, [token]);
    }
    async deletePasswordResetRequest(id) {
        const query = `DELETE FROM password_reset_requests WHERE id = ?`;
        await this.db.execute(query, [id]);
    }
    async cancelPendingResetRequests(userId) {
        const query = `DELETE FROM password_reset_requests WHERE user_id = ? AND used = false`;
        await this.db.execute(query, [userId]);
    }
    async markResetRequestUsed(id) {
        const query = `
      UPDATE password_reset_requests 
      SET used = true, used_at = ?
      WHERE id = ?
    `;
        await this.db.execute(query, [new Date(), id]);
    }
    async resetLoginAttemptsAndUnlock(userId) {
        const query = `
      UPDATE user_accounts 
      SET login_attempts = 0, is_locked = false, locked_at = NULL, 
          lock_reason = NULL, lock_expires_at = NULL, updated_at = ?
      WHERE id = ?
    `;
        await this.db.execute(query, [new Date(), userId]);
    }
    async logSecurityEvent(userId, eventType, description) {
        const event = {
            id: nanoid(),
            userId,
            eventType,
            description,
            createdAt: new Date()
        };
        const query = `
      INSERT INTO security_events 
      (id, user_id, event_type, description, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;
        await this.db.execute(query, [
            event.id,
            event.userId,
            event.eventType,
            event.description,
            event.createdAt
        ]);
    }
}
//# sourceMappingURL=PasswordManager.js.map