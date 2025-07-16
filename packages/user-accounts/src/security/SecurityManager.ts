import { nanoid } from 'nanoid';
import { DatabaseAdapter } from '../adapters';
import { Logger } from '../core';
import { 
  AccountSecuritySettings,
  SecurityEvent,
  SecurityEventType,
  ServiceResponse, 
  UserAccountErrorCode
} from '../types';

export class SecurityManager {
  private readonly logger = new Logger('SecurityManager');

  constructor(private readonly db: DatabaseAdapter) {}

  async getSecuritySettings(userId: string): Promise<ServiceResponse<AccountSecuritySettings>> {
    try {
      this.logger.debug('Getting security settings', { userId });

      const settings = await this.findSecuritySettings(userId);
      if (!settings) {
        // Create default security settings if they don't exist
        const defaultSettings = await this.createDefaultSecuritySettings(userId);
        return {
          success: true,
          data: defaultSettings
        };
      }

      return {
        success: true,
        data: settings
      };

    } catch (error) {
      this.logger.error('Failed to get security settings', error);
      return {
        success: false,
        error: 'Failed to retrieve security settings',
        code: UserAccountErrorCode.INTERNAL_ERROR
      };
    }
  }

  async updateSecuritySettings(
    userId: string, 
    updates: Partial<AccountSecuritySettings>
  ): Promise<ServiceResponse<AccountSecuritySettings>> {
    try {
      this.logger.info('Updating security settings', { userId, updates });

      // Check if user exists
      const userExists = await this.checkUserExists(userId);
      if (!userExists) {
        return {
          success: false,
          error: 'User account not found',
          code: UserAccountErrorCode.NOT_FOUND
        };
      }

      // Get current settings
      const currentSettings = await this.findSecuritySettings(userId);
      if (!currentSettings) {
        const defaultSettings = await this.createDefaultSecuritySettings(userId);
        const updatedSettings = { ...defaultSettings, ...updates };
        await this.saveSecuritySettings(updatedSettings);
        
        return {
          success: true,
          data: updatedSettings
        };
      }

      // Merge updates with current settings
      const updatedSettings: AccountSecuritySettings = {
        ...currentSettings,
        ...updates,
        updatedAt: new Date()
      };

      await this.saveSecuritySettings(updatedSettings);

      // Log security event
      await this.logSecurityEvent(userId, SecurityEventType.PASSWORD_CHANGED,
        'Security settings updated');

      this.logger.info('Security settings updated successfully', { userId });

      return {
        success: true,
        data: updatedSettings
      };

    } catch (error) {
      this.logger.error('Failed to update security settings', error);
      return {
        success: false,
        error: 'Failed to update security settings',
        code: UserAccountErrorCode.INTERNAL_ERROR
      };
    }
  }

  async logSecurityEvent(
    userId: string,
    eventType: SecurityEventType,
    description: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ServiceResponse<SecurityEvent>> {
    try {
      this.logger.debug('Logging security event', { userId, eventType, description });

      const event: SecurityEvent = {
        id: nanoid(),
        userId,
        eventType,
        description,
        ipAddress,
        userAgent,
        metadata,
        createdAt: new Date()
      };

      await this.saveSecurityEvent(event);

      this.logger.debug('Security event logged', { eventId: event.id, userId, eventType });

      return {
        success: true,
        data: event
      };

    } catch (error) {
      this.logger.error('Failed to log security event', error);
      return {
        success: false,
        error: 'Failed to log security event',
        code: UserAccountErrorCode.INTERNAL_ERROR
      };
    }
  }

  async getSecurityEvents(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      eventTypes?: SecurityEventType[];
      fromDate?: Date;
      toDate?: Date;
    } = {}
  ): Promise<ServiceResponse<{ events: SecurityEvent[]; total: number }>> {
    try {
      const {
        limit = 50,
        offset = 0,
        eventTypes,
        fromDate,
        toDate
      } = options;

      this.logger.debug('Getting security events', { userId, options });

      const conditions: string[] = ['user_id = ?'];
      const params: any[] = [userId];

      if (eventTypes && eventTypes.length > 0) {
        conditions.push(`event_type IN (${eventTypes.map(() => '?').join(', ')})`);
        params.push(...eventTypes);
      }

      if (fromDate) {
        conditions.push('created_at >= ?');
        params.push(fromDate);
      }

      if (toDate) {
        conditions.push('created_at <= ?');
        params.push(toDate);
      }

      const whereClause = conditions.join(' AND ');

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM security_events WHERE ${whereClause}`;
      const countResult = await this.db.queryOne<{ total: number }>(countQuery, params);
      const total = countResult?.total || 0;

      // Get events
      const eventsQuery = `
        SELECT * FROM security_events 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      const events = await this.db.queryMany<SecurityEvent>(eventsQuery, [...params, limit, offset]);

      return {
        success: true,
        data: { events, total }
      };

    } catch (error) {
      this.logger.error('Failed to get security events', error);
      return {
        success: false,
        error: 'Failed to retrieve security events',
        code: UserAccountErrorCode.INTERNAL_ERROR
      };
    }
  }

  async checkSuspiciousActivity(userId: string): Promise<ServiceResponse<{
    isSuspicious: boolean;
    reasons: string[];
    riskScore: number;
  }>> {
    try {
      this.logger.debug('Checking suspicious activity', { userId });

      const reasons: string[] = [];
      let riskScore = 0;

      // Check recent failed login attempts
      const recentFailedLogins = await this.countRecentEvents(
        userId,
        SecurityEventType.LOGIN_FAILED,
        new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      );

      if (recentFailedLogins >= 10) {
        reasons.push('Excessive failed login attempts in the last 24 hours');
        riskScore += 30;
      } else if (recentFailedLogins >= 5) {
        reasons.push('Multiple failed login attempts in the last 24 hours');
        riskScore += 15;
      }

      // Check for password reset requests
      const recentPasswordResets = await this.countRecentEvents(
        userId,
        SecurityEventType.PASSWORD_RESET_REQUESTED,
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      if (recentPasswordResets >= 3) {
        reasons.push('Multiple password reset requests in the last 24 hours');
        riskScore += 20;
      }

      // Check for rapid succession logins from different IPs
      const recentLogins = await this.getRecentLoginEvents(userId, 24);
      const uniqueIPs = new Set(recentLogins.map(event => event.ipAddress).filter(Boolean));
      
      if (uniqueIPs.size >= 5) {
        reasons.push('Logins from multiple IP addresses');
        riskScore += 25;
      }

      // Check account age vs activity
      const user = await this.findUserById(userId);
      if (user) {
        const accountAge = Date.now() - user.createdAt.getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        if (accountAge < oneDayMs && recentLogins.length > 10) {
          reasons.push('High activity on newly created account');
          riskScore += 20;
        }
      }

      const isSuspicious = riskScore >= 50;

      return {
        success: true,
        data: {
          isSuspicious,
          reasons,
          riskScore
        }
      };

    } catch (error) {
      this.logger.error('Failed to check suspicious activity', error);
      return {
        success: false,
        error: 'Failed to check suspicious activity',
        code: UserAccountErrorCode.INTERNAL_ERROR
      };
    }
  }

  async enforceSecurityPolicy(userId: string): Promise<ServiceResponse<{
    actions: string[];
    locked: boolean;
  }>> {
    try {
      this.logger.info('Enforcing security policy', { userId });

      const actions: string[] = [];
      let locked = false;

      // Check if user exists
      const user = await this.findUserById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User account not found',
          code: UserAccountErrorCode.NOT_FOUND
        };
      }

      // Get security settings
      const securitySettings = await this.findSecuritySettings(userId);
      if (!securitySettings) {
        await this.createDefaultSecuritySettings(userId);
        actions.push('Created default security settings');
      }

      // Check for suspicious activity
      const suspiciousCheck = await this.checkSuspiciousActivity(userId);
      if (suspiciousCheck.success && suspiciousCheck.data?.isSuspicious) {
        // Lock account if risk score is very high
        if (suspiciousCheck.data.riskScore >= 80) {
          await this.lockAccountForSuspiciousActivity(userId);
          locked = true;
          actions.push('Account locked due to suspicious activity');
        } else {
          actions.push('Suspicious activity detected but not locked');
        }
      }

      // Check failed login attempts
      if (user.loginAttempts >= (securitySettings?.maxLoginAttempts || 5)) {
        if (!user.isLocked) {
          const lockDuration = securitySettings?.lockoutDuration || 30; // minutes
          await this.lockAccountForFailedAttempts(userId, lockDuration);
          locked = true;
          actions.push(`Account locked for ${lockDuration} minutes due to failed login attempts`);
        }
      }

      // Check password expiry
      if (securitySettings?.passwordExpiryDays) {
        const passwordAge = Date.now() - user.passwordUpdatedAt.getTime();
        const expiryMs = securitySettings.passwordExpiryDays * 24 * 60 * 60 * 1000;
        
        if (passwordAge > expiryMs) {
          actions.push('Password has expired and needs to be changed');
        }
      }

      return {
        success: true,
        data: {
          actions,
          locked
        }
      };

    } catch (error) {
      this.logger.error('Failed to enforce security policy', error);
      return {
        success: false,
        error: 'Failed to enforce security policy',
        code: UserAccountErrorCode.INTERNAL_ERROR
      };
    }
  }

  private async findSecuritySettings(userId: string): Promise<AccountSecuritySettings | null> {
    const query = `SELECT * FROM account_security_settings WHERE user_id = ?`;
    return await this.db.queryOne<AccountSecuritySettings>(query, [userId]);
  }

  private async createDefaultSecuritySettings(userId: string): Promise<AccountSecuritySettings> {
    const settings: AccountSecuritySettings = {
      id: nanoid(),
      userId,
      requireEmailVerification: true,
      passwordExpiryDays: 90,
      maxLoginAttempts: 5,
      lockoutDuration: 30, // minutes
      requireStrongPassword: true,
      preventPasswordReuse: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveSecuritySettings(settings);
    return settings;
  }

  private async saveSecuritySettings(settings: AccountSecuritySettings): Promise<void> {
    const query = `
      INSERT INTO account_security_settings 
      (id, user_id, require_email_verification, password_expiry_days, max_login_attempts, 
       lockout_duration, require_strong_password, prevent_password_reuse, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      require_email_verification = VALUES(require_email_verification),
      password_expiry_days = VALUES(password_expiry_days),
      max_login_attempts = VALUES(max_login_attempts),
      lockout_duration = VALUES(lockout_duration),
      require_strong_password = VALUES(require_strong_password),
      prevent_password_reuse = VALUES(prevent_password_reuse),
      updated_at = VALUES(updated_at)
    `;

    await this.db.execute(query, [
      settings.id,
      settings.userId,
      settings.requireEmailVerification,
      settings.passwordExpiryDays,
      settings.maxLoginAttempts,
      settings.lockoutDuration,
      settings.requireStrongPassword,
      settings.preventPasswordReuse,
      settings.createdAt,
      settings.updatedAt
    ]);
  }

  private async saveSecurityEvent(event: SecurityEvent): Promise<void> {
    const query = `
      INSERT INTO security_events 
      (id, user_id, event_type, description, ip_address, user_agent, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(query, [
      event.id,
      event.userId,
      event.eventType,
      event.description,
      event.ipAddress,
      event.userAgent,
      event.metadata ? JSON.stringify(event.metadata) : null,
      event.createdAt
    ]);
  }

  private async countRecentEvents(
    userId: string,
    eventType: SecurityEventType,
    since: Date
  ): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM security_events 
      WHERE user_id = ? AND event_type = ? AND created_at >= ?
    `;
    
    const result = await this.db.queryOne<{ count: number }>(query, [userId, eventType, since]);
    return result?.count || 0;
  }

  private async getRecentLoginEvents(userId: string, hours: number): Promise<SecurityEvent[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const query = `
      SELECT * FROM security_events 
      WHERE user_id = ? AND event_type = ? AND created_at >= ?
      ORDER BY created_at DESC
    `;
    
    return await this.db.queryMany<SecurityEvent>(query, [userId, SecurityEventType.LOGIN_SUCCESS, since]);
  }

  private async findUserById(userId: string): Promise<any | null> {
    const query = `SELECT * FROM user_accounts WHERE id = ? AND deleted_at IS NULL`;
    return await this.db.queryOne(query, [userId]);
  }

  private async checkUserExists(userId: string): Promise<boolean> {
    const query = `SELECT 1 FROM user_accounts WHERE id = ? AND deleted_at IS NULL LIMIT 1`;
    const result = await this.db.queryOne(query, [userId]);
    return !!result;
  }

  private async lockAccountForSuspiciousActivity(userId: string): Promise<void> {
    const query = `
      UPDATE user_accounts 
      SET is_locked = true, lock_reason = ?, locked_at = ?, updated_at = ?
      WHERE id = ?
    `;
    
    await this.db.execute(query, [
      'Account locked due to suspicious activity',
      new Date(),
      new Date(),
      userId
    ]);

    await this.logSecurityEvent(userId, SecurityEventType.ACCOUNT_LOCKED,
      'Account locked due to suspicious activity');
  }

  private async lockAccountForFailedAttempts(userId: string, durationMinutes: number): Promise<void> {
    const lockExpiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    
    const query = `
      UPDATE user_accounts 
      SET is_locked = true, lock_reason = ?, locked_at = ?, lock_expires_at = ?, updated_at = ?
      WHERE id = ?
    `;
    
    await this.db.execute(query, [
      'Account locked due to too many failed login attempts',
      new Date(),
      lockExpiresAt,
      new Date(),
      userId
    ]);

    await this.logSecurityEvent(userId, SecurityEventType.ACCOUNT_LOCKED,
      `Account locked for ${durationMinutes} minutes due to failed login attempts`);
  }
}