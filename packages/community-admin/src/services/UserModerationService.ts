import { StorageManager } from '@kcommerce/storage';
import { Logger } from '@kcommerce/utils';
import type { 
  CommunityUser,
  UserReport,
  Warning,
  Suspension,
  Ban,
  UserModerationRecord,
  ModerationActionData,
  ServiceResponse,
  PaginatedResponse,
  SearchFilters,
  ReportPriority,
  ReportReason,
  UserStatus
} from '../types';

export class UserModerationService {
  private storage: StorageManager;
  private logger: Logger;

  constructor() {
    this.storage = new StorageManager('user-moderation');
    this.logger = new Logger('UserModeration');
  }

  // User Moderation Actions
  async warnUser(
    userId: string,
    actionData: ModerationActionData,
    moderatorId: string
  ): Promise<ServiceResponse<Warning>> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const warning: Warning = {
        id: this.generateId(),
        reason: actionData.reason,
        description: actionData.description || '',
        issuedBy: moderatorId,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: actionData.duration ? new Date(Date.now() + actionData.duration * 24 * 60 * 60 * 1000) : undefined,
        isActive: true
      };

      // Update user moderation record
      const updatedUser = await this.addWarningToUser(user, warning);
      
      // Log action
      await this.logModerationAction({
        type: 'warning',
        userId,
        moderatorId,
        reason: actionData.reason,
        description: actionData.description,
        timestamp: new Date()
      });

      // Send notification
      if (actionData.notifyUser) {
        await this.notifyUser(userId, 'user_warned', {
          reason: actionData.reason,
          description: actionData.description,
          publicNote: actionData.publicNote
        });
      }

      this.logger.info(`User ${userId} warned by moderator ${moderatorId}`);
      return { success: true, data: warning };
    } catch (error) {
      this.logger.error('Failed to warn user:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async suspendUser(
    userId: string,
    actionData: ModerationActionData,
    moderatorId: string
  ): Promise<ServiceResponse<Suspension>> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const duration = actionData.duration || 7; // Default 7 days
      const suspension: Suspension = {
        id: this.generateId(),
        reason: actionData.reason,
        description: actionData.description || '',
        issuedBy: moderatorId,
        createdAt: new Date(),
        updatedAt: new Date(),
        startsAt: new Date(),
        endsAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
        isActive: true
      };

      // Update user status and moderation record
      const updatedUser = await this.addSuspensionToUser(user, suspension);
      
      // Log action
      await this.logModerationAction({
        type: 'suspension',
        userId,
        moderatorId,
        reason: actionData.reason,
        description: actionData.description,
        duration,
        timestamp: new Date()
      });

      // Send notification
      if (actionData.notifyUser) {
        await this.notifyUser(userId, 'user_suspended', {
          reason: actionData.reason,
          description: actionData.description,
          duration,
          endsAt: suspension.endsAt,
          publicNote: actionData.publicNote
        });
      }

      this.logger.info(`User ${userId} suspended for ${duration} days by moderator ${moderatorId}`);
      return { success: true, data: suspension };
    } catch (error) {
      this.logger.error('Failed to suspend user:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async banUser(
    userId: string,
    actionData: ModerationActionData,
    moderatorId: string,
    isPermanent: boolean = false
  ): Promise<ServiceResponse<Ban>> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const ban: Ban = {
        id: this.generateId(),
        reason: actionData.reason,
        description: actionData.description || '',
        issuedBy: moderatorId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPermanent,
        expiresAt: isPermanent ? undefined : new Date(Date.now() + (actionData.duration || 30) * 24 * 60 * 60 * 1000),
        isActive: true
      };

      // Update user status and moderation record
      const updatedUser = await this.addBanToUser(user, ban);
      
      // Log action
      await this.logModerationAction({
        type: 'ban',
        userId,
        moderatorId,
        reason: actionData.reason,
        description: actionData.description,
        isPermanent,
        duration: actionData.duration,
        timestamp: new Date()
      });

      // Send notification
      if (actionData.notifyUser) {
        await this.notifyUser(userId, 'user_banned', {
          reason: actionData.reason,
          description: actionData.description,
          isPermanent,
          expiresAt: ban.expiresAt,
          publicNote: actionData.publicNote
        });
      }

      this.logger.info(`User ${userId} ${isPermanent ? 'permanently' : 'temporarily'} banned by moderator ${moderatorId}`);
      return { success: true, data: ban };
    } catch (error) {
      this.logger.error('Failed to ban user:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async unbanUser(userId: string, moderatorId: string, reason: string): Promise<ServiceResponse> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Deactivate active bans
      const updatedModerationRecord = { ...user.moderation };
      updatedModerationRecord.bans = updatedModerationRecord.bans.map(ban => 
        ban.isActive ? { ...ban, isActive: false, updatedAt: new Date() } : ban
      );
      updatedModerationRecord.isBanned = false;

      const updatedUser: CommunityUser = {
        ...user,
        status: 'active',
        moderation: updatedModerationRecord,
        updatedAt: new Date()
      };

      await this.saveUser(updatedUser);
      
      // Log action
      await this.logModerationAction({
        type: 'unban',
        userId,
        moderatorId,
        reason,
        timestamp: new Date()
      });

      // Send notification
      await this.notifyUser(userId, 'user_unbanned', {
        reason,
        moderator: moderatorId
      });

      this.logger.info(`User ${userId} unbanned by moderator ${moderatorId}`);
      return { success: true, message: 'User unbanned successfully' };
    } catch (error) {
      this.logger.error('Failed to unban user:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // User Reports
  async createUserReport(report: Omit<UserReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<UserReport>> {
    try {
      const newReport: UserReport = {
        ...report,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'open',
        priority: this.calculateReportPriority(report)
      };

      const reports = await this.storage.get('user_reports') || {};
      reports[newReport.id] = newReport;
      await this.storage.set('user_reports', reports);
      
      // Auto-assign if configured
      await this.autoAssignReport(newReport.id);
      
      this.logger.info(`User report created: ${newReport.id}`);
      return { success: true, data: newReport };
    } catch (error) {
      this.logger.error('Failed to create user report:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getUserReports(filters: SearchFilters = {}): Promise<PaginatedResponse<UserReport>> {
    try {
      const reports = await this.storage.get('user_reports') || {};
      let reportsList = Object.values(reports) as UserReport[];

      // Apply filters
      if (filters.status?.length) {
        reportsList = reportsList.filter(report => filters.status!.includes(report.status));
      }

      if (filters.query) {
        const query = filters.query.toLowerCase();
        reportsList = reportsList.filter(report => 
          report.reason.toLowerCase().includes(query) ||
          report.description.toLowerCase().includes(query) ||
          report.reportedUser.username.toLowerCase().includes(query)
        );
      }

      if (filters.dateRange) {
        reportsList = reportsList.filter(report => 
          report.createdAt >= filters.dateRange!.start &&
          report.createdAt <= filters.dateRange!.end
        );
      }

      // Sort
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      reportsList.sort((a, b) => {
        let aValue = a[sortBy as keyof UserReport] as any;
        let bValue = b[sortBy as keyof UserReport] as any;
        
        if (aValue instanceof Date) aValue = aValue.getTime();
        if (bValue instanceof Date) bValue = bValue.getTime();
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedReports = reportsList.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedReports,
        meta: {
          total: reportsList.length,
          page,
          limit,
          totalPages: Math.ceil(reportsList.length / limit),
          hasMore: endIndex < reportsList.length
        }
      };
    } catch (error) {
      this.logger.error('Failed to get user reports:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async resolveUserReport(
    reportId: string,
    resolution: string,
    resolvedBy: string
  ): Promise<ServiceResponse<UserReport>> {
    try {
      const reports = await this.storage.get('user_reports') || {};
      const report = reports[reportId];
      
      if (!report) {
        return { success: false, error: 'Report not found' };
      }

      const updatedReport: UserReport = {
        ...report,
        status: 'resolved',
        resolution,
        resolvedBy,
        resolvedAt: new Date(),
        updatedAt: new Date()
      };

      reports[reportId] = updatedReport;
      await this.storage.set('user_reports', reports);
      
      this.logger.info(`User report ${reportId} resolved`);
      return { success: true, data: updatedReport };
    } catch (error) {
      this.logger.error('Failed to resolve user report:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // User Management
  async getUsers(filters: SearchFilters = {}): Promise<PaginatedResponse<CommunityUser>> {
    try {
      const users = await this.storage.get('users') || {};
      let usersList = Object.values(users) as CommunityUser[];

      // Apply filters
      if (filters.status?.length) {
        usersList = usersList.filter(user => filters.status!.includes(user.status));
      }

      if (filters.query) {
        const query = filters.query.toLowerCase();
        usersList = usersList.filter(user => 
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.displayName.toLowerCase().includes(query)
        );
      }

      if (filters.dateRange) {
        usersList = usersList.filter(user => 
          user.createdAt >= filters.dateRange!.start &&
          user.createdAt <= filters.dateRange!.end
        );
      }

      // Sort
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      usersList.sort((a, b) => {
        let aValue = a[sortBy as keyof CommunityUser] as any;
        let bValue = b[sortBy as keyof CommunityUser] as any;
        
        if (aValue instanceof Date) aValue = aValue.getTime();
        if (bValue instanceof Date) bValue = bValue.getTime();
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = usersList.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedUsers,
        meta: {
          total: usersList.length,
          page,
          limit,
          totalPages: Math.ceil(usersList.length / limit),
          hasMore: endIndex < usersList.length
        }
      };
    } catch (error) {
      this.logger.error('Failed to get users:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getUserModerationHistory(userId: string): Promise<ServiceResponse<any[]>> {
    try {
      const logs = await this.storage.get('moderation_logs') || [];
      const userLogs = logs.filter((log: any) => log.userId === userId);
      
      return { success: true, data: userLogs };
    } catch (error) {
      this.logger.error('Failed to get user moderation history:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateUserTrustScore(userId: string, change: number, reason: string): Promise<ServiceResponse> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const newTrustScore = Math.max(0, Math.min(100, user.moderation.trustScore + change));
      const updatedUser: CommunityUser = {
        ...user,
        moderation: {
          ...user.moderation,
          trustScore: newTrustScore
        },
        updatedAt: new Date()
      };

      await this.saveUser(updatedUser);
      
      // Log trust score change
      await this.logModerationAction({
        type: 'trust_score_change',
        userId,
        change,
        reason,
        newScore: newTrustScore,
        timestamp: new Date()
      });

      this.logger.info(`User ${userId} trust score updated: ${change} (${reason})`);
      return { success: true, message: 'Trust score updated successfully' };
    } catch (error) {
      this.logger.error('Failed to update user trust score:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Bulk Operations
  async bulkModerateUsers(
    userIds: string[],
    action: 'warn' | 'suspend' | 'ban',
    actionData: ModerationActionData,
    moderatorId: string
  ): Promise<ServiceResponse<{ succeeded: string[]; failed: string[] }>> {
    const results = { succeeded: [], failed: [] };

    for (const userId of userIds) {
      try {
        let result;
        switch (action) {
          case 'warn':
            result = await this.warnUser(userId, actionData, moderatorId);
            break;
          case 'suspend':
            result = await this.suspendUser(userId, actionData, moderatorId);
            break;
          case 'ban':
            result = await this.banUser(userId, actionData, moderatorId);
            break;
        }

        if (result.success) {
          results.succeeded.push(userId);
        } else {
          results.failed.push(userId);
        }
      } catch (error) {
        results.failed.push(userId);
        this.logger.error(`Failed to moderate user ${userId}:`, error);
      }
    }

    this.logger.info(`Bulk user moderation completed: ${results.succeeded.length} succeeded, ${results.failed.length} failed`);
    return { success: true, data: results };
  }

  // Analytics
  async getUserModerationMetrics(timeRange: { start: Date; end: Date }): Promise<ServiceResponse<any>> {
    try {
      const logs = await this.getModerationLogs(timeRange);
      const userLogs = logs.filter((log: any) => ['warning', 'suspension', 'ban', 'unban'].includes(log.type));
      
      const metrics = {
        totalActions: userLogs.length,
        actionsByType: this.groupBy(userLogs, 'type'),
        actionsByModerator: this.groupBy(userLogs, 'moderatorId'),
        averageResponseTime: await this.calculateAverageResponseTime(timeRange),
        repeatOffenders: await this.identifyRepeatOffenders(timeRange),
        trustScoreDistribution: await this.getTrustScoreDistribution()
      };

      return { success: true, data: metrics };
    } catch (error) {
      this.logger.error('Failed to get user moderation metrics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Helper Methods
  private async getUser(userId: string): Promise<CommunityUser | null> {
    const users = await this.storage.get('users') || {};
    return users[userId] || null;
  }

  private async saveUser(user: CommunityUser): Promise<void> {
    const users = await this.storage.get('users') || {};
    users[user.id] = user;
    await this.storage.set('users', users);
  }

  private async addWarningToUser(user: CommunityUser, warning: Warning): Promise<CommunityUser> {
    const updatedModerationRecord = { ...user.moderation };
    updatedModerationRecord.warnings.push(warning);
    updatedModerationRecord.totalWarnings += 1;

    const updatedUser: CommunityUser = {
      ...user,
      moderation: updatedModerationRecord,
      updatedAt: new Date()
    };

    await this.saveUser(updatedUser);
    return updatedUser;
  }

  private async addSuspensionToUser(user: CommunityUser, suspension: Suspension): Promise<CommunityUser> {
    const updatedModerationRecord = { ...user.moderation };
    updatedModerationRecord.suspensions.push(suspension);
    updatedModerationRecord.totalSuspensions += 1;

    const updatedUser: CommunityUser = {
      ...user,
      status: 'suspended',
      moderation: updatedModerationRecord,
      updatedAt: new Date()
    };

    await this.saveUser(updatedUser);
    return updatedUser;
  }

  private async addBanToUser(user: CommunityUser, ban: Ban): Promise<CommunityUser> {
    const updatedModerationRecord = { ...user.moderation };
    updatedModerationRecord.bans.push(ban);
    updatedModerationRecord.isBanned = true;

    const updatedUser: CommunityUser = {
      ...user,
      status: 'banned',
      moderation: updatedModerationRecord,
      updatedAt: new Date()
    };

    await this.saveUser(updatedUser);
    return updatedUser;
  }

  private async logModerationAction(action: any): Promise<void> {
    const logs = await this.storage.get('moderation_logs') || [];
    logs.push(action);
    await this.storage.set('moderation_logs', logs);
  }

  private async notifyUser(userId: string, type: string, data: any): Promise<void> {
    // Implementation would integrate with notification service
    this.logger.info(`Notification sent to user ${userId}: ${type}`);
  }

  private calculateReportPriority(report: any): ReportPriority {
    // Calculate priority based on report type, reporter reputation, etc.
    const priorityMap: Record<ReportReason, ReportPriority> = {
      harassment: 'high',
      hate_speech: 'urgent',
      spam: 'low',
      inappropriate_content: 'medium',
      copyright: 'medium',
      fraud: 'high',
      other: 'low'
    };
    return priorityMap[report.reason] || 'medium';
  }

  private async autoAssignReport(reportId: string): Promise<void> {
    // Auto-assignment logic would go here
  }

  private async getModerationLogs(timeRange: any): Promise<any[]> {
    const logs = await this.storage.get('moderation_logs') || [];
    return logs.filter((log: any) => 
      new Date(log.timestamp) >= timeRange.start && 
      new Date(log.timestamp) <= timeRange.end
    );
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = item[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private async calculateAverageResponseTime(timeRange: any): Promise<number> {
    // Calculate average response time for user moderation actions
    return 0;
  }

  private async identifyRepeatOffenders(timeRange: any): Promise<any[]> {
    // Identify users with multiple violations
    return [];
  }

  private async getTrustScoreDistribution(): Promise<any> {
    // Get trust score distribution across all users
    return {};
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}