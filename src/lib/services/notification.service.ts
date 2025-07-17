// NotificationType enum
enum NotificationType {
  CAMPAIGN_APPLICATION = 'CAMPAIGN_APPLICATION',
  CAMPAIGN_APPROVED = 'CAMPAIGN_APPROVED',
  CAMPAIGN_REJECTED = 'CAMPAIGN_REJECTED',
  CONTENT_SUBMITTED = 'CONTENT_SUBMITTED',
  CONTENT_APPROVED = 'CONTENT_APPROVED',
  CONTENT_REJECTED = 'CONTENT_REJECTED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  SETTLEMENT_REQUESTED = 'SETTLEMENT_REQUESTED',
  SETTLEMENT_COMPLETED = 'SETTLEMENT_COMPLETED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT'
}
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/db/redis';
import { ApiError } from '@/lib/utils/errors';

// 알림 생성 스키마
export const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  message: z.string(),
  metadata: z.record(z.any()).optional(),
  actionUrl: z.string().optional(),
});

// 알림 설정 스키마
export const updateNotificationSettingsSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  sms: z.boolean().optional(),
  campaignUpdates: z.boolean().optional(),
  applicationUpdates: z.boolean().optional(),
  paymentUpdates: z.boolean().optional(),
  marketing: z.boolean().optional(),
});

// 대량 알림 스키마
export const sendBulkNotificationSchema = z.object({
  userIds: z.array(z.string()).optional(),
  userType: z.enum(['BUSINESS', 'INFLUENCER']).optional(),
  title: z.string(),
  message: z.string(),
  type: z.nativeEnum(NotificationType),
  actionUrl: z.string().optional(),
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationSettingsDto = z.infer<typeof updateNotificationSettingsSchema>;
export type SendBulkNotificationDto = z.infer<typeof sendBulkNotificationSchema>;

class NotificationService {
  // 알림 생성
  async createNotification(data: CreateNotificationDto) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: JSON.stringify(data.metadata || {}),
        actionUrl: data.actionUrl,
      }
    });

    // Redis에 실시간 알림 발행
    if (redis) {
      await redis.publish(`notifications:${data.userId}`, JSON.stringify(notification));
    }

    // 이메일/푸시 알림 전송 (설정에 따라)
    await this.sendExternalNotifications(data.userId, notification);

    return notification;
  }

  // 외부 알림 전송 (이메일, 푸시 등)
  private async sendExternalNotifications(userId: string, notification: any) {
    const settings = await prisma.notificationSettings.findUnique({
      where: { userId }
    });

    if (!settings) return;

    // 이메일 알림
    if (settings.email && this.shouldSendEmailForType(notification.type, settings)) {
      // TODO: 이메일 발송 서비스 연동
      console.log('Sending email notification:', notification);
    }

    // 푸시 알림
    if (settings.push) {
      // TODO: FCM 또는 다른 푸시 서비스 연동
      console.log('Sending push notification:', notification);
    }

    // SMS 알림 (중요 알림만)
    if (settings.sms && this.isImportantNotification(notification.type)) {
      // TODO: SMS 발송 서비스 연동
      console.log('Sending SMS notification:', notification);
    }
  }

  // 이메일 발송 여부 확인
  private shouldSendEmailForType(type: NotificationType, settings: any): boolean {
    switch (type) {
      case NotificationType.CAMPAIGN_UPDATE:
        return settings.campaignUpdates;
      case NotificationType.APPLICATION_STATUS:
        return settings.applicationUpdates;
      case NotificationType.PAYMENT_RECEIVED:
      case NotificationType.PAYMENT_SENT:
        return settings.paymentUpdates;
      case NotificationType.SYSTEM:
        return true; // 시스템 알림은 항상 발송
      default:
        return false;
    }
  }

  // 중요 알림 여부 확인
  private isImportantNotification(type: NotificationType): boolean {
    return [
      NotificationType.PAYMENT_RECEIVED,
      NotificationType.PAYMENT_SENT,
      NotificationType.APPLICATION_STATUS,
    ].includes(type);
  }

  // 알림 목록 조회
  async getNotifications(userId: string, filters: {
    unreadOnly?: boolean;
    type?: NotificationType;
    page?: number;
    limit?: number;
  }) {
    const { unreadOnly, type, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    
    if (unreadOnly) where.readAt = null;
    if (type) where.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ 
        where: { userId, readAt: null } 
      })
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 알림 읽음 처리
  async markAsRead(userId: string, notificationIds: string[]) {
    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    return { updated: result.count };
  }

  // 모든 알림 읽음 처리
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    return { updated: result.count };
  }

  // 알림 삭제
  async deleteNotifications(userId: string, notificationIds: string[]) {
    const result = await prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId
      }
    });

    return { deleted: result.count };
  }

  // 알림 설정 조회
  async getNotificationSettings(userId: string) {
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId }
    });

    // 설정이 없으면 기본값으로 생성
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          userId,
          email: true,
          push: true,
          sms: false,
          campaignUpdates: true,
          applicationUpdates: true,
          paymentUpdates: true,
          marketing: false,
        }
      });
    }

    return settings;
  }

  // 알림 설정 업데이트
  async updateNotificationSettings(userId: string, data: UpdateNotificationSettingsDto) {
    const settings = await prisma.notificationSettings.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data
      }
    });

    return settings;
  }

  // 대량 알림 발송 (관리자)
  async sendBulkNotification(data: SendBulkNotificationDto) {
    let userIds = data.userIds;

    // userIds가 없으면 userType으로 조회
    if (!userIds && data.userType) {
      const users = await prisma.user.findMany({
        where: { type: data.userType },
        select: { id: true }
      });
      userIds = users.map(u => u.id);
    }

    if (!userIds || userIds.length === 0) {
      throw new ApiError('알림을 받을 사용자가 없습니다.', 400);
    }

    // 알림 일괄 생성
    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
      }))
    });

    // Redis로 실시간 알림 발행
    if (redis) {
      for (const userId of userIds) {
        await redis.publish(`notifications:${userId}`, JSON.stringify({
          type: data.type,
          title: data.title,
          message: data.message,
          actionUrl: data.actionUrl,
        }));
      }
    }

    return { sent: notifications.count };
  }

  // 자동 알림 트리거 함수들
  async notifyCampaignApplication(applicationId: string) {
    const application = await prisma.campaignApplication.findUnique({
      where: { id: applicationId },
      include: {
        campaign: {
          include: { business: true }
        },
        influencer: true
      }
    });

    if (!application) return;

    // 비즈니스에게 알림
    await this.createNotification({
      userId: application.campaign.businessId,
      type: NotificationType.APPLICATION_STATUS,
      title: '새로운 캠페인 지원',
      message: `${application.influencer.name}님이 "${application.campaign.title}" 캠페인에 지원했습니다.`,
      actionUrl: `/business/campaigns/${application.campaignId}/applications`,
      metadata: {
        applicationId,
        campaignId: application.campaignId,
        influencerId: application.influencerId
      }
    });
  }

  async notifyApplicationStatusChange(applicationId: string, status: string) {
    const application = await prisma.campaignApplication.findUnique({
      where: { id: applicationId },
      include: {
        campaign: true,
        influencer: true
      }
    });

    if (!application) return;

    const statusMessage = status === 'APPROVED' 
      ? '승인되었습니다' 
      : '거절되었습니다';

    // 인플루언서에게 알림
    await this.createNotification({
      userId: application.influencerId,
      type: NotificationType.APPLICATION_STATUS,
      title: '캠페인 지원 결과',
      message: `"${application.campaign.title}" 캠페인 지원이 ${statusMessage}.`,
      actionUrl: `/influencer/applications/${applicationId}`,
      metadata: {
        applicationId,
        campaignId: application.campaignId,
        status
      }
    });
  }

  async notifyPaymentCompleted(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        campaign: true
      }
    });

    if (!payment) return;

    await this.createNotification({
      userId: payment.userId,
      type: NotificationType.PAYMENT_SENT,
      title: '결제 완료',
      message: `${payment.amount.toLocaleString()}원 결제가 완료되었습니다.`,
      actionUrl: `/payments/${paymentId}`,
      metadata: {
        paymentId,
        amount: payment.amount,
        campaignId: payment.campaignId
      }
    });
  }

  async notifySettlementProcessed(settlementId: string) {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        influencer: true
      }
    });

    if (!settlement) return;

    const type = settlement.status === 'COMPLETED'
      ? NotificationType.PAYMENT_RECEIVED
      : NotificationType.SYSTEM;

    const message = settlement.status === 'COMPLETED'
      ? `${settlement.totalAmount.toLocaleString()}원이 정산되었습니다.`
      : '정산 요청이 거절되었습니다.';

    await this.createNotification({
      userId: settlement.influencerId,
      type,
      title: '정산 처리 완료',
      message,
      actionUrl: `/influencer/settlements/${settlementId}`,
      metadata: {
        settlementId,
        amount: settlement.totalAmount,
        status: settlement.status
      }
    });
  }
}

export const notificationService = new NotificationService();