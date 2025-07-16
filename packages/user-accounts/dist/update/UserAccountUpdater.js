import { Logger } from '../core';
import { UserAccountError, UserAccountErrorCode, userAccountUpdateSchema } from '../types';
export class UserAccountUpdater {
    db;
    logger = new Logger('UserAccountUpdater');
    constructor(db) {
        this.db = db;
    }
    async update(id, input) {
        try {
            this.logger.info('Updating user account', { id, input });
            // Validate input
            const validatedInput = userAccountUpdateSchema.parse(input);
            // Check if user exists
            const existingUser = await this.findById(id);
            if (!existingUser) {
                return {
                    success: false,
                    error: 'User account not found',
                    code: UserAccountErrorCode.NOT_FOUND
                };
            }
            // Check if email is being changed and if it already exists
            if (validatedInput.email && validatedInput.email !== existingUser.email) {
                const emailExists = await this.checkEmailExists(validatedInput.email, id);
                if (emailExists) {
                    throw new UserAccountError(UserAccountErrorCode.EMAIL_ALREADY_EXISTS, 'An account with this email already exists');
                }
            }
            // Build update query
            const updates = [];
            const params = [];
            if (validatedInput.email !== undefined) {
                updates.push('email = ?');
                params.push(validatedInput.email);
                // Reset email verification if email is changed
                if (validatedInput.email !== existingUser.email) {
                    updates.push('email_verified = ?');
                    params.push(false);
                }
            }
            if (validatedInput.isActive !== undefined) {
                updates.push('is_active = ?');
                params.push(validatedInput.isActive);
            }
            if (validatedInput.isLocked !== undefined) {
                updates.push('is_locked = ?');
                params.push(validatedInput.isLocked);
                if (validatedInput.isLocked) {
                    updates.push('locked_at = ?');
                    params.push(new Date());
                    if (validatedInput.lockReason) {
                        updates.push('lock_reason = ?');
                        params.push(validatedInput.lockReason);
                    }
                }
                else {
                    // Unlock account
                    updates.push('locked_at = NULL');
                    updates.push('lock_reason = NULL');
                    updates.push('lock_expires_at = NULL');
                    updates.push('login_attempts = ?');
                    params.push(0);
                }
            }
            if (updates.length === 0) {
                return {
                    success: true,
                    data: existingUser
                };
            }
            updates.push('updated_at = ?');
            params.push(new Date());
            params.push(id);
            const query = `
        UPDATE user_accounts 
        SET ${updates.join(', ')}
        WHERE id = ? AND deleted_at IS NULL
      `;
            await this.db.execute(query, params);
            // Fetch updated user
            const updatedUser = await this.findById(id);
            if (!updatedUser) {
                throw new UserAccountError(UserAccountErrorCode.INTERNAL_ERROR, 'Failed to retrieve updated user account');
            }
            this.logger.info('User account updated successfully', { id });
            return {
                success: true,
                data: updatedUser
            };
        }
        catch (error) {
            this.logger.error('Failed to update user account', error);
            if (error instanceof UserAccountError) {
                return {
                    success: false,
                    error: error.message,
                    code: error.code
                };
            }
            return {
                success: false,
                error: 'Failed to update user account',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async incrementLoginAttempts(id) {
        try {
            this.logger.debug('Incrementing login attempts', { id });
            const query = `
        UPDATE user_accounts 
        SET login_attempts = login_attempts + 1, updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `;
            await this.db.execute(query, [new Date(), id]);
            // Check if account should be locked
            const user = await this.findById(id);
            if (user && user.loginAttempts >= 5) { // Configurable threshold
                await this.lockAccount(id, 'Too many failed login attempts');
            }
            const updatedUser = await this.findById(id);
            if (!updatedUser) {
                throw new UserAccountError(UserAccountErrorCode.NOT_FOUND, 'User account not found');
            }
            return {
                success: true,
                data: updatedUser
            };
        }
        catch (error) {
            this.logger.error('Failed to increment login attempts', error);
            return {
                success: false,
                error: 'Failed to update login attempts',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async resetLoginAttempts(id) {
        try {
            this.logger.debug('Resetting login attempts', { id });
            const query = `
        UPDATE user_accounts 
        SET login_attempts = 0, last_login_at = ?, updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `;
            await this.db.execute(query, [new Date(), new Date(), id]);
            const updatedUser = await this.findById(id);
            if (!updatedUser) {
                throw new UserAccountError(UserAccountErrorCode.NOT_FOUND, 'User account not found');
            }
            return {
                success: true,
                data: updatedUser
            };
        }
        catch (error) {
            this.logger.error('Failed to reset login attempts', error);
            return {
                success: false,
                error: 'Failed to reset login attempts',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async lockAccount(id, reason, durationMinutes) {
        try {
            this.logger.info('Locking user account', { id, reason, durationMinutes });
            const lockExpiresAt = durationMinutes
                ? new Date(Date.now() + durationMinutes * 60 * 1000)
                : null;
            const query = `
        UPDATE user_accounts 
        SET is_locked = true, lock_reason = ?, locked_at = ?, lock_expires_at = ?, updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `;
            await this.db.execute(query, [
                reason || 'Account locked by system',
                new Date(),
                lockExpiresAt,
                new Date(),
                id
            ]);
            const updatedUser = await this.findById(id);
            if (!updatedUser) {
                throw new UserAccountError(UserAccountErrorCode.NOT_FOUND, 'User account not found');
            }
            return {
                success: true,
                data: updatedUser
            };
        }
        catch (error) {
            this.logger.error('Failed to lock user account', error);
            return {
                success: false,
                error: 'Failed to lock user account',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async unlockAccount(id) {
        try {
            this.logger.info('Unlocking user account', { id });
            const query = `
        UPDATE user_accounts 
        SET is_locked = false, lock_reason = NULL, locked_at = NULL, 
            lock_expires_at = NULL, login_attempts = 0, updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `;
            await this.db.execute(query, [new Date(), id]);
            const updatedUser = await this.findById(id);
            if (!updatedUser) {
                throw new UserAccountError(UserAccountErrorCode.NOT_FOUND, 'User account not found');
            }
            return {
                success: true,
                data: updatedUser
            };
        }
        catch (error) {
            this.logger.error('Failed to unlock user account', error);
            return {
                success: false,
                error: 'Failed to unlock user account',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async findById(id) {
        const query = `
      SELECT * FROM user_accounts 
      WHERE id = ? AND deleted_at IS NULL
    `;
        const result = await this.db.queryOne(query, [id]);
        return result || null;
    }
    async checkEmailExists(email, excludeId) {
        let query = `
      SELECT 1 FROM user_accounts 
      WHERE email = ? AND deleted_at IS NULL
    `;
        const params = [email];
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        query += ' LIMIT 1';
        const result = await this.db.queryOne(query, params);
        return !!result;
    }
}
//# sourceMappingURL=UserAccountUpdater.js.map