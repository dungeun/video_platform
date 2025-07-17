/**
 * Notification Service
 * 알림 비즈니스 로직
 */

import { EventEmitter } from 'events';
import { NotificationModuleAdapter } from './notification.adapter';

export class NotificationService {
  constructor(
    private adapter: NotificationModuleAdapter,
    _eventBus: EventEmitter
  ) {}

  async sendNotification(data: {
    userId?: string;
    campaignId?: string;
    type: string;
    title: string;
    message: string;
    targetType?: 'user' | 'broadcast' | 'campaign';
    metadata?: any;
  }) {
    return this.adapter.sendNotification(data);
  }

  async getNotifications(userId: string, filters: {
    read?: boolean;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    return this.adapter.getNotifications(userId, filters);
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.adapter.markAsRead(userId, notificationId);
  }

  async markAllAsRead(userId: string) {
    return this.adapter.markAllAsRead(userId);
  }

  async deleteNotification(userId: string, notificationId: string) {
    return this.adapter.deleteNotification(userId, notificationId);
  }

  async getNotificationSettings(userId: string) {
    return this.adapter.getNotificationSettings(userId);
  }

  async updateNotificationSettings(userId: string, settings: any) {
    return this.adapter.updateNotificationSettings(userId, settings);
  }
}