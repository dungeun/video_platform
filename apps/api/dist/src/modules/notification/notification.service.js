"use strict";
/**
 * Notification Service
 * 알림 비즈니스 로직
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
class NotificationService {
    adapter;
    constructor(adapter, eventBus) {
        this.adapter = adapter;
    }
    async sendNotification(data) {
        return this.adapter.sendNotification(data);
    }
    async getNotifications(userId, filters) {
        return this.adapter.getNotifications(userId, filters);
    }
    async markAsRead(userId, notificationId) {
        return this.adapter.markAsRead(userId, notificationId);
    }
    async markAllAsRead(userId) {
        return this.adapter.markAllAsRead(userId);
    }
    async deleteNotification(userId, notificationId) {
        return this.adapter.deleteNotification(userId, notificationId);
    }
    async getNotificationSettings(userId) {
        return this.adapter.getNotificationSettings(userId);
    }
    async updateNotificationSettings(userId, settings) {
        return this.adapter.updateNotificationSettings(userId, settings);
    }
}
exports.NotificationService = NotificationService;
