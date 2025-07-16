import { Logger } from '@repo/core';
import { IWishlistNotificationRepository } from '../repositories/interfaces';
import { WishlistNotification, NotificationType } from '../entities';
import { NotificationListResponse } from '../types';

export class WishlistNotificationService {
  private readonly logger = new Logger('WishlistNotificationService');

  constructor(
    private readonly notificationRepo: IWishlistNotificationRepository
  ) {}

  async getNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<NotificationListResponse> {
    try {
      const notifications = await this.notificationRepo.findByUserId(userId, unreadOnly);
      const unreadCount = await this.notificationRepo.countUnread(userId);

      return {
        notifications,
        unreadCount,
        total: notifications.length
      };
    } catch (error) {
      this.logger.error('Failed to get notifications', error);
      throw error;
    }
  }

  async getNotificationsByType(
    userId: string,
    type: NotificationType
  ): Promise<WishlistNotification[]> {
    try {
      return await this.notificationRepo.findByType(userId, type);
    } catch (error) {
      this.logger.error('Failed to get notifications by type', error);
      throw error;
    }
  }

  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<void> {
    try {
      const notification = await this.notificationRepo.findById(notificationId);
      if (!notification || notification.userId !== userId) {
        throw new Error('Notification not found');
      }

      await this.notificationRepo.markAsRead(notificationId);
      this.logger.info('Notification marked as read', { notificationId });
    } catch (error) {
      this.logger.error('Failed to mark notification as read', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.notificationRepo.markAllAsRead(userId);
      this.logger.info('All notifications marked as read', { userId });
    } catch (error) {
      this.logger.error('Failed to mark all notifications as read', error);
      throw error;
    }
  }

  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    try {
      const notification = await this.notificationRepo.findById(notificationId);
      if (!notification || notification.userId !== userId) {
        throw new Error('Notification not found');
      }

      await this.notificationRepo.delete(notificationId);
      this.logger.info('Notification deleted', { notificationId });
    } catch (error) {
      this.logger.error('Failed to delete notification', error);
      throw error;
    }
  }

  async createNotification(
    data: Omit<WishlistNotification, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WishlistNotification> {
    try {
      const notification = await this.notificationRepo.create(data);
      this.logger.info('Notification created', { 
        type: data.type, 
        userId: data.userId 
      });
      return notification;
    } catch (error) {
      this.logger.error('Failed to create notification', error);
      throw error;
    }
  }

  async cleanupExpiredNotifications(): Promise<void> {
    try {
      await this.notificationRepo.deleteExpired();
      this.logger.info('Expired notifications cleaned up');
    } catch (error) {
      this.logger.error('Failed to cleanup expired notifications', error);
    }
  }

  async sendBatchNotifications(
    notifications: Array<Omit<WishlistNotification, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      const promises = notifications.map(notification => 
        this.notificationRepo.create(notification)
      );
      
      await Promise.all(promises);
      this.logger.info('Batch notifications sent', { count: notifications.length });
    } catch (error) {
      this.logger.error('Failed to send batch notifications', error);
      throw error;
    }
  }
}