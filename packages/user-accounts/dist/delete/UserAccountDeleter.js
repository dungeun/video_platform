import { Logger } from '../core';
import { UserAccountError, UserAccountErrorCode } from '../types';
export class UserAccountDeleter {
    db;
    logger = new Logger('UserAccountDeleter');
    constructor(db) {
        this.db = db;
    }
    async softDelete(id) {
        try {
            this.logger.info('Soft deleting user account', { id });
            // Check if user exists
            const existingUser = await this.findById(id);
            if (!existingUser) {
                return {
                    success: false,
                    error: 'User account not found',
                    code: UserAccountErrorCode.NOT_FOUND
                };
            }
            if (existingUser.deletedAt) {
                return {
                    success: false,
                    error: 'User account is already deleted',
                    code: UserAccountErrorCode.VALIDATION_ERROR
                };
            }
            // Soft delete by setting deleted_at timestamp
            const query = `
        UPDATE user_accounts 
        SET deleted_at = ?, updated_at = ?, is_active = false
        WHERE id = ? AND deleted_at IS NULL
      `;
            const deletedAt = new Date();
            await this.db.execute(query, [deletedAt, deletedAt, id]);
            this.logger.info('User account soft deleted successfully', { id });
            return {
                success: true,
                data: true
            };
        }
        catch (error) {
            this.logger.error('Failed to soft delete user account', error);
            return {
                success: false,
                error: 'Failed to delete user account',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async restore(id) {
        try {
            this.logger.info('Restoring user account', { id });
            // Check if user exists and is deleted
            const deletedUser = await this.findDeletedById(id);
            if (!deletedUser) {
                return {
                    success: false,
                    error: 'Deleted user account not found',
                    code: UserAccountErrorCode.NOT_FOUND
                };
            }
            // Check if email is still available (not taken by another account)
            const emailExists = await this.checkEmailExistsInActive(deletedUser.email);
            if (emailExists) {
                return {
                    success: false,
                    error: 'Cannot restore: email is already in use by another account',
                    code: UserAccountErrorCode.EMAIL_ALREADY_EXISTS
                };
            }
            // Restore account
            const query = `
        UPDATE user_accounts 
        SET deleted_at = NULL, updated_at = ?, is_active = true
        WHERE id = ? AND deleted_at IS NOT NULL
      `;
            await this.db.execute(query, [new Date(), id]);
            // Fetch restored user
            const restoredUser = await this.findById(id);
            if (!restoredUser) {
                throw new UserAccountError(UserAccountErrorCode.INTERNAL_ERROR, 'Failed to retrieve restored user account');
            }
            this.logger.info('User account restored successfully', { id });
            return {
                success: true,
                data: restoredUser
            };
        }
        catch (error) {
            this.logger.error('Failed to restore user account', error);
            if (error instanceof UserAccountError) {
                return {
                    success: false,
                    error: error.message,
                    code: error.code
                };
            }
            return {
                success: false,
                error: 'Failed to restore user account',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async hardDelete(id) {
        try {
            this.logger.warn('Hard deleting user account - this action is irreversible', { id });
            // Check if user exists (including soft deleted)
            const existingUser = await this.findByIdIncludingDeleted(id);
            if (!existingUser) {
                return {
                    success: false,
                    error: 'User account not found',
                    code: UserAccountErrorCode.NOT_FOUND
                };
            }
            // Begin transaction for cascading deletes
            await this.db.beginTransaction();
            try {
                // Delete related data first
                await this.deleteRelatedData(id);
                // Hard delete the user account
                const query = `DELETE FROM user_accounts WHERE id = ?`;
                await this.db.execute(query, [id]);
                await this.db.commitTransaction();
                this.logger.warn('User account hard deleted successfully', { id });
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
            this.logger.error('Failed to hard delete user account', error);
            return {
                success: false,
                error: 'Failed to permanently delete user account',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async bulkSoftDelete(ids) {
        try {
            this.logger.info('Bulk soft deleting user accounts', { count: ids.length });
            const deletedAt = new Date();
            const failed = [];
            let deleted = 0;
            for (const id of ids) {
                try {
                    const existingUser = await this.findById(id);
                    if (!existingUser) {
                        failed.push(id);
                        continue;
                    }
                    if (existingUser.deletedAt) {
                        failed.push(id);
                        continue;
                    }
                    const query = `
            UPDATE user_accounts 
            SET deleted_at = ?, updated_at = ?, is_active = false
            WHERE id = ? AND deleted_at IS NULL
          `;
                    await this.db.execute(query, [deletedAt, deletedAt, id]);
                    deleted++;
                }
                catch (error) {
                    this.logger.error('Failed to delete user account in bulk operation', { id, error });
                    failed.push(id);
                }
            }
            this.logger.info('Bulk soft delete completed', { deleted, failed: failed.length });
            return {
                success: true,
                data: { deleted, failed }
            };
        }
        catch (error) {
            this.logger.error('Failed bulk soft delete operation', error);
            return {
                success: false,
                error: 'Failed to bulk delete user accounts',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async purgeOldDeleted(olderThanDays = 30) {
        try {
            this.logger.info('Purging old deleted user accounts', { olderThanDays });
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            // Find accounts to be purged
            const accountsQuery = `
        SELECT id FROM user_accounts 
        WHERE deleted_at IS NOT NULL AND deleted_at < ?
      `;
            const accountsToPurge = await this.db.queryMany(accountsQuery, [cutoffDate]);
            let purgedCount = 0;
            for (const account of accountsToPurge) {
                try {
                    await this.hardDelete(account.id);
                    purgedCount++;
                }
                catch (error) {
                    this.logger.error('Failed to purge deleted account', { id: account.id, error });
                }
            }
            this.logger.info('Old deleted accounts purged', { purgedCount });
            return {
                success: true,
                data: purgedCount
            };
        }
        catch (error) {
            this.logger.error('Failed to purge old deleted accounts', error);
            return {
                success: false,
                error: 'Failed to purge old deleted accounts',
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
    async findDeletedById(id) {
        const query = `
      SELECT * FROM user_accounts 
      WHERE id = ? AND deleted_at IS NOT NULL
    `;
        const result = await this.db.queryOne(query, [id]);
        return result || null;
    }
    async findByIdIncludingDeleted(id) {
        const query = `SELECT * FROM user_accounts WHERE id = ?`;
        const result = await this.db.queryOne(query, [id]);
        return result || null;
    }
    async checkEmailExistsInActive(email) {
        const query = `
      SELECT 1 FROM user_accounts 
      WHERE email = ? AND deleted_at IS NULL
      LIMIT 1
    `;
        const result = await this.db.queryOne(query, [email]);
        return !!result;
    }
    async deleteRelatedData(userId) {
        // Delete related data in correct order to respect foreign key constraints
        const relatedTables = [
            'password_history',
            'password_reset_requests',
            'email_change_requests',
            'email_verifications',
            'security_events',
            'account_security_settings'
        ];
        for (const table of relatedTables) {
            try {
                const query = `DELETE FROM ${table} WHERE user_id = ?`;
                await this.db.execute(query, [userId]);
            }
            catch (error) {
                this.logger.warn(`Failed to delete related data from ${table}`, { userId, error });
                // Continue with other tables even if one fails
            }
        }
    }
}
//# sourceMappingURL=UserAccountDeleter.js.map