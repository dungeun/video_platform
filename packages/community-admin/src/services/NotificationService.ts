import { StorageManager } from '@kcommerce/storage';
import { Logger } from '@kcommerce/utils';
import type { 
  CommunityNotification,
  NotificationTemplate,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  TemplateVariable,
  ServiceResponse,
  PaginatedResponse,
  SearchFilters
} from '../types';

export class NotificationService {
  private storage: StorageManager;
  private logger: Logger;
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.storage = new StorageManager('community-notifications');
    this.logger = new Logger('CommunityNotification');
    this.initializeDefaultTemplates();
  }

  // Notification Management
  async createNotification(
    notification: Omit<CommunityNotification, 'id' | 'createdAt' | 'updatedAt' | 'isRead' | 'readAt'>
  ): Promise<ServiceResponse<CommunityNotification>> {
    try {
      const newNotification: CommunityNotification = {
        ...notification,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isRead: false
      };

      // Store notification
      const notifications = await this.storage.get('notifications') || {};
      notifications[newNotification.id] = newNotification;
      await this.storage.set('notifications', notifications);

      // Send notification through channels
      await this.sendThroughChannels(newNotification);

      this.logger.info(`Notification created: ${newNotification.id}`);
      return { success: true, data: newNotification };
    } catch (error) {
      this.logger.error('Failed to create notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendNotificationFromTemplate(
    templateId: string,
    userId: string,
    variables: Record<string, any>,
    channels: NotificationChannel[] = ['in_app'],
    priority: NotificationPriority = 'normal'
  ): Promise<ServiceResponse<CommunityNotification>> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Process template variables
      const processedTitle = this.processTemplate(template.subject, variables);
      const processedMessage = this.processTemplate(template.bodyTemplate, variables);

      const notification: Omit<CommunityNotification, 'id' | 'createdAt' | 'updatedAt' | 'isRead' | 'readAt'> = {
        type: template.type,
        title: processedTitle,
        message: processedMessage,
        data: variables,
        userId,
        priority,
        channels
      };

      return await this.createNotification(notification);
    } catch (error) {
      this.logger.error('Failed to send notification from template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getUserNotifications(
    userId: string,
    filters: SearchFilters = {}
  ): Promise<PaginatedResponse<CommunityNotification>> {
    try {
      const notifications = await this.storage.get('notifications') || {};
      let userNotifications = Object.values(notifications)
        .filter((notification: any) => notification.userId === userId) as CommunityNotification[];

      // Apply filters
      if (filters.status?.length) {
        const isReadFilter = filters.status.includes('read');
        userNotifications = userNotifications.filter(notification => 
          notification.isRead === isReadFilter
        );
      }

      if (filters.query) {
        const query = filters.query.toLowerCase();
        userNotifications = userNotifications.filter(notification => 
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query)
        );
      }

      if (filters.dateRange) {
        userNotifications = userNotifications.filter(notification => 
          notification.createdAt >= filters.dateRange!.start &&
          notification.createdAt <= filters.dateRange!.end
        );
      }

      // Sort by creation date (newest first)
      userNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNotifications = userNotifications.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedNotifications,
        meta: {
          total: userNotifications.length,
          page,
          limit,
          totalPages: Math.ceil(userNotifications.length / limit),
          hasMore: endIndex < userNotifications.length
        }
      };
    } catch (error) {
      this.logger.error('Failed to get user notifications:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<ServiceResponse> {
    try {
      const notifications = await this.storage.get('notifications') || {};
      const notification = notifications[notificationId];

      if (!notification) {
        return { success: false, error: 'Notification not found' };
      }

      notification.isRead = true;
      notification.readAt = new Date();
      notification.updatedAt = new Date();

      notifications[notificationId] = notification;
      await this.storage.set('notifications', notifications);

      this.logger.info(`Notification ${notificationId} marked as read`);
      return { success: true, message: 'Notification marked as read' };
    } catch (error) {
      this.logger.error('Failed to mark notification as read:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<ServiceResponse> {
    try {
      const notifications = await this.storage.get('notifications') || {};
      let updatedCount = 0;

      Object.values(notifications).forEach((notification: any) => {
        if (notification.userId === userId && !notification.isRead) {
          notification.isRead = true;
          notification.readAt = new Date();
          notification.updatedAt = new Date();
          updatedCount++;
        }
      });

      await this.storage.set('notifications', notifications);

      this.logger.info(`${updatedCount} notifications marked as read for user ${userId}`);
      return { success: true, message: `${updatedCount} notifications marked as read` };
    } catch (error) {
      this.logger.error('Failed to mark all notifications as read:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteNotification(notificationId: string): Promise<ServiceResponse> {
    try {
      const notifications = await this.storage.get('notifications') || {};
      
      if (!notifications[notificationId]) {
        return { success: false, error: 'Notification not found' };
      }

      delete notifications[notificationId];
      await this.storage.set('notifications', notifications);

      this.logger.info(`Notification ${notificationId} deleted`);
      return { success: true, message: 'Notification deleted' };
    } catch (error) {
      this.logger.error('Failed to delete notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getUnreadCount(userId: string): Promise<ServiceResponse<number>> {
    try {
      const notifications = await this.storage.get('notifications') || {};
      const unreadCount = Object.values(notifications)
        .filter((notification: any) => 
          notification.userId === userId && !notification.isRead
        ).length;

      return { success: true, data: unreadCount };
    } catch (error) {
      this.logger.error('Failed to get unread count:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Template Management
  async createTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<ServiceResponse<NotificationTemplate>> {
    try {
      const newTemplate: NotificationTemplate = {
        ...template,
        id: this.generateId()
      };

      this.templates.set(newTemplate.id, newTemplate);
      
      // Persist templates
      const templates = await this.storage.get('templates') || {};
      templates[newTemplate.id] = newTemplate;
      await this.storage.set('templates', templates);

      this.logger.info(`Notification template created: ${newTemplate.name}`);
      return { success: true, data: newTemplate };
    } catch (error) {
      this.logger.error('Failed to create notification template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateTemplate(
    templateId: string, 
    updates: Partial<NotificationTemplate>
  ): Promise<ServiceResponse<NotificationTemplate>> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      const updatedTemplate = { ...template, ...updates };
      this.templates.set(templateId, updatedTemplate);

      // Persist templates
      const templates = await this.storage.get('templates') || {};
      templates[templateId] = updatedTemplate;
      await this.storage.set('templates', templates);

      this.logger.info(`Notification template updated: ${templateId}`);
      return { success: true, data: updatedTemplate };
    } catch (error) {
      this.logger.error('Failed to update notification template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getTemplates(): Promise<ServiceResponse<NotificationTemplate[]>> {
    try {
      return { success: true, data: Array.from(this.templates.values()) };
    } catch (error) {
      this.logger.error('Failed to get notification templates:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteTemplate(templateId: string): Promise<ServiceResponse> {
    try {
      if (!this.templates.has(templateId)) {
        return { success: false, error: 'Template not found' };
      }

      this.templates.delete(templateId);

      // Remove from storage
      const templates = await this.storage.get('templates') || {};
      delete templates[templateId];
      await this.storage.set('templates', templates);

      this.logger.info(`Notification template deleted: ${templateId}`);
      return { success: true, message: 'Template deleted' };
    } catch (error) {
      this.logger.error('Failed to delete notification template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Bulk Operations
  async sendBulkNotifications(
    notifications: Omit<CommunityNotification, 'id' | 'createdAt' | 'updatedAt' | 'isRead' | 'readAt'>[]
  ): Promise<ServiceResponse<{ succeeded: number; failed: number }>> {
    let succeeded = 0;
    let failed = 0;

    for (const notification of notifications) {
      try {
        const result = await this.createNotification(notification);
        if (result.success) {
          succeeded++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        this.logger.error('Failed to send bulk notification:', error);
      }
    }

    this.logger.info(`Bulk notifications sent: ${succeeded} succeeded, ${failed} failed`);
    return { success: true, data: { succeeded, failed } };
  }

  async sendNotificationToAllUsers(
    notification: Omit<CommunityNotification, 'id' | 'createdAt' | 'updatedAt' | 'isRead' | 'readAt' | 'userId'>,
    filters?: { roles?: string[]; statuses?: string[] }
  ): Promise<ServiceResponse<{ sent: number }>> {
    try {
      // Get all users
      const users = await this.storage.get('users') || {};
      let targetUsers = Object.values(users) as any[];

      // Apply filters
      if (filters?.roles?.length) {
        targetUsers = targetUsers.filter(user => 
          filters.roles!.includes(user.role.name)
        );
      }

      if (filters?.statuses?.length) {
        targetUsers = targetUsers.filter(user => 
          filters.statuses!.includes(user.status)
        );
      }

      // Create notifications for all target users
      const notifications = targetUsers.map(user => ({
        ...notification,
        userId: user.id
      }));

      const result = await this.sendBulkNotifications(notifications);
      
      this.logger.info(`Broadcast notification sent to ${result.data?.succeeded} users`);
      return { success: true, data: { sent: result.data?.succeeded || 0 } };
    } catch (error) {
      this.logger.error('Failed to send notification to all users:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Channel-specific Methods
  private async sendThroughChannels(notification: CommunityNotification): Promise<void> {
    for (const channel of notification.channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(notification);
            break;
          case 'push':
            await this.sendPushNotification(notification);
            break;
          case 'sms':
            await this.sendSMSNotification(notification);
            break;
          case 'in_app':
            // In-app notifications are already stored
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to send notification through ${channel}:`, error);
      }
    }
  }

  private async sendEmailNotification(notification: CommunityNotification): Promise<void> {
    // Email sending implementation would go here
    this.logger.info(`Email notification sent to user ${notification.userId}`);
  }

  private async sendPushNotification(notification: CommunityNotification): Promise<void> {
    // Push notification implementation would go here
    this.logger.info(`Push notification sent to user ${notification.userId}`);
  }

  private async sendSMSNotification(notification: CommunityNotification): Promise<void> {
    // SMS notification implementation would go here
    this.logger.info(`SMS notification sent to user ${notification.userId}`);
  }

  // Analytics
  async getNotificationMetrics(timeRange: { start: Date; end: Date }): Promise<ServiceResponse<any>> {
    try {
      const notifications = await this.storage.get('notifications') || {};
      const notificationsList = Object.values(notifications) as CommunityNotification[];

      const filteredNotifications = notificationsList.filter(notification => 
        notification.createdAt >= timeRange.start && 
        notification.createdAt <= timeRange.end
      );

      const metrics = {
        total: filteredNotifications.length,
        sent: filteredNotifications.length,
        read: filteredNotifications.filter(n => n.isRead).length,
        unread: filteredNotifications.filter(n => !n.isRead).length,
        byType: this.groupBy(filteredNotifications, 'type'),
        byPriority: this.groupBy(filteredNotifications, 'priority'),
        byChannel: this.calculateChannelMetrics(filteredNotifications),
        readRate: this.calculateReadRate(filteredNotifications)
      };

      return { success: true, data: metrics };
    } catch (error) {
      this.logger.error('Failed to get notification metrics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Helper Methods
  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return processed;
  }

  private async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates: Omit<NotificationTemplate, 'id'>[] = [
      {
        name: 'Post Moderated',
        type: 'moderation',
        subject: 'Your post has been {{action}}',
        bodyTemplate: 'Your post "{{postTitle}}" has been {{action}} by our moderation team. Reason: {{reason}}',
        isActive: true,
        variables: [
          { name: 'postTitle', description: 'Title of the post', type: 'string', required: true },
          { name: 'action', description: 'Moderation action taken', type: 'string', required: true },
          { name: 'reason', description: 'Reason for moderation', type: 'string', required: true }
        ]
      },
      {
        name: 'Comment Moderated',
        type: 'moderation',
        subject: 'Your comment has been {{action}}',
        bodyTemplate: 'Your comment has been {{action}} by our moderation team. Reason: {{reason}}',
        isActive: true,
        variables: [
          { name: 'action', description: 'Moderation action taken', type: 'string', required: true },
          { name: 'reason', description: 'Reason for moderation', type: 'string', required: true }
        ]
      },
      {
        name: 'User Warned',
        type: 'moderation',
        subject: 'Community Warning',
        bodyTemplate: 'You have received a warning from our moderation team. Reason: {{reason}}. {{description}}',
        isActive: true,
        variables: [
          { name: 'reason', description: 'Warning reason', type: 'string', required: true },
          { name: 'description', description: 'Warning description', type: 'string', required: false }
        ]
      },
      {
        name: 'User Suspended',
        type: 'moderation',
        subject: 'Account Suspended',
        bodyTemplate: 'Your account has been suspended for {{duration}} days. Reason: {{reason}}. Your suspension will end on {{endsAt}}.',
        isActive: true,
        variables: [
          { name: 'duration', description: 'Suspension duration in days', type: 'number', required: true },
          { name: 'reason', description: 'Suspension reason', type: 'string', required: true },
          { name: 'endsAt', description: 'Suspension end date', type: 'date', required: true }
        ]
      },
      {
        name: 'User Banned',
        type: 'moderation',
        subject: 'Account Banned',
        bodyTemplate: 'Your account has been {{isPermanent ? "permanently" : "temporarily"}} banned. Reason: {{reason}}.',
        isActive: true,
        variables: [
          { name: 'isPermanent', description: 'Whether the ban is permanent', type: 'boolean', required: true },
          { name: 'reason', description: 'Ban reason', type: 'string', required: true },
          { name: 'expiresAt', description: 'Ban expiration date', type: 'date', required: false }
        ]
      },
      {
        name: 'New Reply',
        type: 'content',
        subject: 'New reply to your post',
        bodyTemplate: '{{authorName}} replied to your post "{{postTitle}}": {{replyContent}}',
        isActive: true,
        variables: [
          { name: 'authorName', description: 'Name of the reply author', type: 'string', required: true },
          { name: 'postTitle', description: 'Title of the post', type: 'string', required: true },
          { name: 'replyContent', description: 'Content of the reply', type: 'string', required: true }
        ]
      },
      {
        name: 'Community Announcement',
        type: 'community',
        subject: '{{title}}',
        bodyTemplate: '{{message}}',
        isActive: true,
        variables: [
          { name: 'title', description: 'Announcement title', type: 'string', required: true },
          { name: 'message', description: 'Announcement message', type: 'string', required: true }
        ]
      }
    ];

    for (const template of defaultTemplates) {
      await this.createTemplate(template);
    }
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = item[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateChannelMetrics(notifications: CommunityNotification[]): Record<string, number> {
    const channelCounts: Record<string, number> = {};
    
    notifications.forEach(notification => {
      notification.channels.forEach(channel => {
        channelCounts[channel] = (channelCounts[channel] || 0) + 1;
      });
    });

    return channelCounts;
  }

  private calculateReadRate(notifications: CommunityNotification[]): number {
    if (notifications.length === 0) return 0;
    const readCount = notifications.filter(n => n.isRead).length;
    return (readCount / notifications.length) * 100;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}