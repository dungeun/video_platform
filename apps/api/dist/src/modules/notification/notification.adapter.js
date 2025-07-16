"use strict";
/**
 * Notification Module Adapter
 * 알림 시스템 어댑터
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModuleAdapter = void 0;
class NotificationModuleAdapter {
    db;
    redis;
    eventBus;
    io;
    constructor(deps) {
        this.db = deps.db.getClient();
        this.redis = deps.redis;
        this.eventBus = deps.eventBus;
        this.io = deps.io;
    }
    /**
     * 알림 생성 및 전송
     */
    async sendNotification(data) {
        try {
            // 타겟 사용자 결정
            let userIds = [];
            if (data.targetType === 'user' && data.userId) {
                userIds = [data.userId];
            }
            else if (data.targetType === 'broadcast') {
                // 모든 활성 사용자에게 전송
                const users = await this.db.user.findMany({
                    where: { status: 'ACTIVE' },
                    select: { id: true }
                });
                userIds = users.map((u) => u.id);
            }
            else if (data.targetType === 'campaign' && data.campaignId) {
                // 캠페인 관련자에게 전송
                const campaign = await this.db.campaign.findUnique({
                    where: { id: data.campaignId },
                    include: {
                        business: true,
                        applications: {
                            where: { status: 'APPROVED' },
                            select: { influencerId: true }
                        }
                    }
                });
                if (campaign) {
                    userIds = [
                        campaign.businessId,
                        ...campaign.applications.map((a) => a.influencerId)
                    ];
                }
            }
            else if (data.userId) {
                userIds = [data.userId];
            }
            // 알림 생성
            const notifications = await Promise.all(userIds.map(userId => this.db.notification.create({
                data: {
                    userId,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    data: data.metadata || {}
                }
            })));
            // 실시간 알림 전송
            for (const notification of notifications) {
                await this.sendRealtimeNotification(notification.userId, notification);
            }
            // 푸시 알림 전송 (구현 예정)
            if (data.type === 'campaign.new' || data.type === 'application.approved') {
                await this.sendPushNotification(userIds, data.title, data.message);
            }
            // 이메일 알림 전송 (중요한 알림만)
            if (this.shouldSendEmail(data.type)) {
                await this.sendEmailNotification(userIds, data);
            }
            return {
                success: true,
                data: {
                    sent: notifications.length,
                    userIds
                }
            };
        }
        catch (error) {
            console.error('Send notification error:', error);
            return {
                success: false,
                error: 'Failed to send notification'
            };
        }
    }
    /**
     * 실시간 알림 전송
     */
    async sendRealtimeNotification(userId, notification) {
        try {
            // Socket.IO로 실시간 전송
            this.io.to(`user:${userId}`).emit('notification:new', {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                createdAt: notification.createdAt
            });
            // 읽지 않은 알림 개수 업데이트
            const unreadCount = await this.db.notification.count({
                where: {
                    userId,
                    read: false
                }
            });
            this.io.to(`user:${userId}`).emit('notification:unread', {
                count: unreadCount
            });
            // Redis에 캐시
            await this.redis.set(`notification:unread:${userId}`, String(unreadCount), 3600 // 1시간
            );
        }
        catch (error) {
            console.error('Send realtime notification error:', error);
        }
    }
    /**
     * 푸시 알림 전송 (구현 예정)
     */
    async sendPushNotification(userIds, _title, _message) {
        // TODO: FCM 또는 웹 푸시 구현
        console.log('Push notification would be sent to:', userIds);
    }
    /**
     * 이메일 알림 전송
     */
    async sendEmailNotification(userIds, data) {
        try {
            // 사용자 이메일 조회
            const users = await this.db.user.findMany({
                where: {
                    id: { in: userIds },
                    emailVerified: true // 이메일 인증된 사용자만
                },
                select: {
                    id: true,
                    email: true,
                    name: true
                }
            });
            // 이메일 전송 이벤트 발행
            for (const user of users) {
                this.eventBus.emit('email.send', {
                    to: user.email,
                    subject: data.title,
                    template: 'notification',
                    data: {
                        name: user.name,
                        title: data.title,
                        message: data.message,
                        type: data.type,
                        metadata: data.metadata
                    }
                });
            }
        }
        catch (error) {
            console.error('Send email notification error:', error);
        }
    }
    /**
     * 이메일 전송 여부 결정
     */
    shouldSendEmail(type) {
        const emailTypes = [
            'application.approved',
            'application.rejected',
            'content.approved',
            'payment.completed',
            'campaign.ended'
        ];
        return emailTypes.includes(type);
    }
    /**
     * 알림 목록 조회
     */
    async getNotifications(userId, filters) {
        try {
            const page = filters.page || 1;
            const limit = filters.limit || 20;
            const skip = (page - 1) * limit;
            const where = { userId };
            if (filters.read !== undefined) {
                where.read = filters.read;
            }
            if (filters.type) {
                where.type = filters.type;
            }
            const [total, notifications] = await Promise.all([
                this.db.notification.count({ where }),
                this.db.notification.findMany({
                    where,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    skip,
                    take: limit
                })
            ]);
            return {
                success: true,
                data: {
                    items: notifications,
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit)
                    }
                }
            };
        }
        catch (error) {
            console.error('Get notifications error:', error);
            return {
                success: false,
                error: 'Failed to get notifications'
            };
        }
    }
    /**
     * 알림 읽음 처리
     */
    async markAsRead(userId, notificationId) {
        try {
            const notification = await this.db.notification.updateMany({
                where: {
                    id: notificationId,
                    userId
                },
                data: {
                    read: true,
                    readAt: new Date()
                }
            });
            if (notification.count === 0) {
                return {
                    success: false,
                    error: 'Notification not found'
                };
            }
            // 읽지 않은 알림 개수 업데이트
            await this.updateUnreadCount(userId);
            return {
                success: true,
                data: { read: true }
            };
        }
        catch (error) {
            console.error('Mark as read error:', error);
            return {
                success: false,
                error: 'Failed to mark as read'
            };
        }
    }
    /**
     * 모든 알림 읽음 처리
     */
    async markAllAsRead(userId) {
        try {
            await this.db.notification.updateMany({
                where: {
                    userId,
                    read: false
                },
                data: {
                    read: true,
                    readAt: new Date()
                }
            });
            // 읽지 않은 알림 개수 업데이트
            await this.updateUnreadCount(userId);
            return {
                success: true,
                data: { message: 'All notifications marked as read' }
            };
        }
        catch (error) {
            console.error('Mark all as read error:', error);
            return {
                success: false,
                error: 'Failed to mark all as read'
            };
        }
    }
    /**
     * 읽지 않은 알림 개수 업데이트
     */
    async updateUnreadCount(userId) {
        const unreadCount = await this.db.notification.count({
            where: {
                userId,
                read: false
            }
        });
        // Redis 캐시 업데이트
        await this.redis.setWithExpiry(`notification:unread:${userId}`, String(unreadCount), 3600);
        // 실시간 업데이트
        this.io.to(`user:${userId}`).emit('notification:unread', {
            count: unreadCount
        });
    }
    /**
     * 알림 삭제
     */
    async deleteNotification(userId, notificationId) {
        try {
            const deleted = await this.db.notification.deleteMany({
                where: {
                    id: notificationId,
                    userId
                }
            });
            if (deleted.count === 0) {
                return {
                    success: false,
                    error: 'Notification not found'
                };
            }
            return {
                success: true,
                data: { deleted: true }
            };
        }
        catch (error) {
            console.error('Delete notification error:', error);
            return {
                success: false,
                error: 'Failed to delete notification'
            };
        }
    }
    /**
     * 알림 설정 조회
     */
    async getNotificationSettings(userId) {
        try {
            // TODO: 사용자별 알림 설정 구현
            const settings = {
                email: {
                    campaign: true,
                    application: true,
                    payment: true,
                    marketing: false
                },
                push: {
                    campaign: true,
                    application: true,
                    payment: true,
                    marketing: true
                },
                inApp: {
                    campaign: true,
                    application: true,
                    payment: true,
                    marketing: true
                }
            };
            return {
                success: true,
                data: settings
            };
        }
        catch (error) {
            console.error('Get notification settings error:', error);
            return {
                success: false,
                error: 'Failed to get notification settings'
            };
        }
    }
    /**
     * 알림 설정 업데이트
     */
    async updateNotificationSettings(userId, settings) {
        try {
            // TODO: 사용자별 알림 설정 저장
            console.log('Update notification settings:', userId, settings);
            return {
                success: true,
                data: settings
            };
        }
        catch (error) {
            console.error('Update notification settings error:', error);
            return {
                success: false,
                error: 'Failed to update notification settings'
            };
        }
    }
}
exports.NotificationModuleAdapter = NotificationModuleAdapter;
