import { DatabaseAdapter } from '../adapters';
import { Logger } from '../core';
import { 
  UserAccount, 
  ServiceResponse, 
  PaginatedResponse,
  UserAccountErrorCode,
  UseUserAccountsOptions 
} from '../types';

export class UserAccountReader {
  private readonly logger = new Logger('UserAccountReader');

  constructor(private readonly db: DatabaseAdapter) {}

  async findById(id: string): Promise<ServiceResponse<UserAccount>> {
    try {
      this.logger.debug('Finding user account by ID', { id });

      const query = `
        SELECT * FROM user_accounts 
        WHERE id = ? AND deleted_at IS NULL
      `;

      const userAccount = await this.db.queryOne<UserAccount>(query, [id]);

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

    } catch (error) {
      this.logger.error('Failed to find user account by ID', error);
      return {
        success: false,
        error: 'Failed to retrieve user account',
        code: UserAccountErrorCode.INTERNAL_ERROR
      };
    }
  }

  async findByEmail(email: string): Promise<ServiceResponse<UserAccount>> {
    try {
      this.logger.debug('Finding user account by email', { email });

      const query = `
        SELECT * FROM user_accounts 
        WHERE email = ? AND deleted_at IS NULL
      `;

      const userAccount = await this.db.queryOne<UserAccount>(query, [email]);

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

    } catch (error) {
      this.logger.error('Failed to find user account by email', error);
      return {
        success: false,
        error: 'Failed to retrieve user account',
        code: UserAccountErrorCode.INTERNAL_ERROR
      };
    }
  }

  async findMany(options: UseUserAccountsOptions = {}): Promise<ServiceResponse<PaginatedResponse<UserAccount>>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        isActive,
        isLocked
      } = options;

      this.logger.debug('Finding user accounts with options', options);

      const offset = (page - 1) * limit;
      const conditions: string[] = ['deleted_at IS NULL'];
      const params: any[] = [];

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
      const countResult = await this.db.queryOne<{ total: number }>(countQuery, params);
      const total = countResult?.total || 0;

      // Get paginated results
      const dataQuery = `
        SELECT * FROM user_accounts 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      const dataParams = [...params, limit, offset];
      const accounts = await this.db.queryMany<UserAccount>(dataQuery, dataParams);

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

    } catch (error) {
      this.logger.error('Failed to find user accounts', error);
      return {
        success: false,
        error: 'Failed to retrieve user accounts',
        code: UserAccountErrorCode.INTERNAL_ERROR
      };
    }
  }

  async exists(email: string): Promise<boolean> {
    try {
      const query = `
        SELECT 1 FROM user_accounts 
        WHERE email = ? AND deleted_at IS NULL
        LIMIT 1
      `;

      const result = await this.db.queryOne(query, [email]);
      return !!result;

    } catch (error) {
      this.logger.error('Failed to check if user account exists', error);
      return false;
    }
  }

  async countActive(): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count FROM user_accounts 
        WHERE is_active = true AND deleted_at IS NULL
      `;

      const result = await this.db.queryOne<{ count: number }>(query);
      return result?.count || 0;

    } catch (error) {
      this.logger.error('Failed to count active user accounts', error);
      return 0;
    }
  }

  async countLocked(): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count FROM user_accounts 
        WHERE is_locked = true AND deleted_at IS NULL
      `;

      const result = await this.db.queryOne<{ count: number }>(query);
      return result?.count || 0;

    } catch (error) {
      this.logger.error('Failed to count locked user accounts', error);
      return 0;
    }
  }

  async findRecentlyCreated(days: number = 7): Promise<ServiceResponse<UserAccount[]>> {
    try {
      this.logger.debug('Finding recently created user accounts', { days });

      const query = `
        SELECT * FROM user_accounts 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) 
        AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;

      const accounts = await this.db.queryMany<UserAccount>(query, [days]);

      return {
        success: true,
        data: accounts
      };

    } catch (error) {
      this.logger.error('Failed to find recently created user accounts', error);
      return {
        success: false,
        error: 'Failed to retrieve recently created accounts',
        code: UserAccountErrorCode.INTERNAL_ERROR
      };
    }
  }
}