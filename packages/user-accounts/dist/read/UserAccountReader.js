import { Logger } from '../core';
import { UserAccountErrorCode } from '../types';
export class UserAccountReader {
    db;
    logger = new Logger('UserAccountReader');
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        try {
            this.logger.debug('Finding user account by ID', { id });
            const query = `
        SELECT * FROM user_accounts 
        WHERE id = ? AND deleted_at IS NULL
      `;
            const userAccount = await this.db.queryOne(query, [id]);
            if (!userAccount) {
                return {
                    success: false,
                    error: 'User account not found',
                    code: UserAccountErrorCode.NOT_FOUND
                };
            }
            return {
                success: true,
                data: userAccount
            };
        }
        catch (error) {
            this.logger.error('Failed to find user account by ID', error);
            return {
                success: false,
                error: 'Failed to retrieve user account',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async findByEmail(email) {
        try {
            this.logger.debug('Finding user account by email', { email });
            const query = `
        SELECT * FROM user_accounts 
        WHERE email = ? AND deleted_at IS NULL
      `;
            const userAccount = await this.db.queryOne(query, [email]);
            if (!userAccount) {
                return {
                    success: false,
                    error: 'User account not found',
                    code: UserAccountErrorCode.NOT_FOUND
                };
            }
            return {
                success: true,
                data: userAccount
            };
        }
        catch (error) {
            this.logger.error('Failed to find user account by email', error);
            return {
                success: false,
                error: 'Failed to retrieve user account',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async findMany(options = {}) {
        try {
            const { page = 1, limit = 20, search, isActive, isLocked } = options;
            this.logger.debug('Finding user accounts with options', options);
            const offset = (page - 1) * limit;
            const conditions = ['deleted_at IS NULL'];
            const params = [];
            // Build where conditions
            if (search) {
                conditions.push('email LIKE ?');
                params.push(`%${search}%`);
            }
            if (isActive !== undefined) {
                conditions.push('is_active = ?');
                params.push(isActive);
            }
            if (isLocked !== undefined) {
                conditions.push('is_locked = ?');
                params.push(isLocked);
            }
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            // Get total count
            const countQuery = `
        SELECT COUNT(*) as total FROM user_accounts 
        ${whereClause}
      `;
            const countResult = await this.db.queryOne(countQuery, params);
            const total = countResult?.total || 0;
            // Get paginated results
            const dataQuery = `
        SELECT * FROM user_accounts 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
            const dataParams = [...params, limit, offset];
            const accounts = await this.db.queryMany(dataQuery, dataParams);
            const hasNext = offset + accounts.length < total;
            const hasPrev = page > 1;
            return {
                success: true,
                data: {
                    items: accounts,
                    total,
                    page,
                    limit,
                    hasNext,
                    hasPrev
                }
            };
        }
        catch (error) {
            this.logger.error('Failed to find user accounts', error);
            return {
                success: false,
                error: 'Failed to retrieve user accounts',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
    async exists(email) {
        try {
            const query = `
        SELECT 1 FROM user_accounts 
        WHERE email = ? AND deleted_at IS NULL
        LIMIT 1
      `;
            const result = await this.db.queryOne(query, [email]);
            return !!result;
        }
        catch (error) {
            this.logger.error('Failed to check if user account exists', error);
            return false;
        }
    }
    async countActive() {
        try {
            const query = `
        SELECT COUNT(*) as count FROM user_accounts 
        WHERE is_active = true AND deleted_at IS NULL
      `;
            const result = await this.db.queryOne(query);
            return result?.count || 0;
        }
        catch (error) {
            this.logger.error('Failed to count active user accounts', error);
            return 0;
        }
    }
    async countLocked() {
        try {
            const query = `
        SELECT COUNT(*) as count FROM user_accounts 
        WHERE is_locked = true AND deleted_at IS NULL
      `;
            const result = await this.db.queryOne(query);
            return result?.count || 0;
        }
        catch (error) {
            this.logger.error('Failed to count locked user accounts', error);
            return 0;
        }
    }
    async findRecentlyCreated(days = 7) {
        try {
            this.logger.debug('Finding recently created user accounts', { days });
            const query = `
        SELECT * FROM user_accounts 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) 
        AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;
            const accounts = await this.db.queryMany(query, [days]);
            return {
                success: true,
                data: accounts
            };
        }
        catch (error) {
            this.logger.error('Failed to find recently created user accounts', error);
            return {
                success: false,
                error: 'Failed to retrieve recently created accounts',
                code: UserAccountErrorCode.INTERNAL_ERROR
            };
        }
    }
}
//# sourceMappingURL=UserAccountReader.js.map