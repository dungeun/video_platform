import { Job } from 'bull';
import {
  NotificationRequest,
  NotificationType,
  NotificationDelivery,
  DeliveryStatus,
  NotificationPreferences,
  NotificationRequestSchema
} from '../types';
import { EmailService } from './EmailService';
import { SMSService } from './SMSService';
import { TemplateEngine } from './TemplateEngine';
import { QueueService } from './QueueService';
import { DeliveryTrackingService } from './DeliveryTrackingService';

export interface NotificationServiceConfig {
  email: {
    provider: any;
    defaultFrom: string;
  };
  sms: {
    provider: any;
    defaultSender: string;
  };
  queue: {
    redis: {
      host: string;
      port: number;
      password?: string;
    };
  };
  templates?: {
    defaultLanguage?: string;
  };
}

export class NotificationService {
  private emailService: EmailService;
  private smsService: SMSService;
  private templateEngine: TemplateEngine;
  private queueService: QueueService;
  private deliveryTracking: DeliveryTrackingService;
  private userPreferences: Map<string, NotificationPreferences>;

  constructor(config: NotificationServiceConfig) {
    this.emailService = new EmailService(config.email);
    this.smsService = new SMSService(config.sms);
    this.templateEngine = new TemplateEngine(config.templates);
    this.queueService = new QueueService(config.queue);
    this.deliveryTracking = new DeliveryTrackingService();
    this.userPreferences = new Map();

    this.setupQueueProcessors();
  }

  private setupQueueProcessors(): void {
    // Email processor
    this.queueService.registerProcessor(
      NotificationType.EMAIL,
      async (job: Job<NotificationRequest>) => {
        return this.processEmailNotification(job.data);
      }
    );

    // SMS processor
    this.queueService.registerProcessor(
      NotificationType.SMS,
      async (job: Job<NotificationRequest>) => {
        return this.processSMSNotification(job.data);
      }
    );

    // Setup event handlers
    Object.values(NotificationType).forEach(type => {
      this.queueService.onJobComplete(type, async (job, result) => {
        if (result.deliveryId) {
          await this.deliveryTracking.updateDeliveryStatus(
            result.deliveryId,
            DeliveryStatus.DELIVERED,
            { providerResponse: result }
          );
        }
      });

      this.queueService.onJobFailed(type, async (job, error) => {
        if (job.data.metadata?.deliveryId) {
          await this.deliveryTracking.updateDeliveryStatus(
            job.data.metadata.deliveryId,
            DeliveryStatus.FAILED,
            { error: error.message }
          );
        }
      });
    });
  }

  async send(request: NotificationRequest): Promise<{
    notificationId: string;
    deliveryId?: string;
    queued: boolean;
    error?: string;
  }> {
    try {
      // Validate request
      const validation = NotificationRequestSchema.safeParse(request);
      if (!validation.success) {
        return {
          notificationId: '',
          queued: false,
          error: validation.error.message
        };
      }

      // Check user preferences
      if (request.recipient.userId) {
        const canSend = await this.checkUserPreferences(
          request.recipient.userId,
          request.type,
          request.metadata?.category
        );
        
        if (!canSend) {
          return {
            notificationId: request.id || '',
            queued: false,
            error: 'User has disabled this notification type'
          };
        }
      }

      // Generate notification ID
      const notificationId = request.id || this.generateNotificationId();
      request.id = notificationId;

      // Create delivery tracking
      const recipient = this.getRecipientIdentifier(request);
      const delivery = await this.deliveryTracking.createDelivery(
        notificationId,
        request.type,
        recipient,
        this.getProviderName(request.type)
      );

      // Add delivery ID to metadata
      request.metadata = {
        ...request.metadata,
        deliveryId: delivery.id
      };

      // Queue or send immediately based on priority
      if (request.priority === 'urgent' && !request.scheduledAt) {
        // Send immediately for urgent notifications
        return await this.sendImmediate(request, delivery);
      } else {
        // Queue for processing
        const jobId = await this.queueService.addNotification(request);
        await this.deliveryTracking.updateDeliveryStatus(
          delivery.id,
          DeliveryStatus.QUEUED
        );

        return {
          notificationId,
          deliveryId: delivery.id,
          queued: true
        };
      }
    } catch (error) {
      return {
        notificationId: request.id || '',
        queued: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendImmediate(
    request: NotificationRequest,
    delivery: NotificationDelivery
  ): Promise<{
    notificationId: string;
    deliveryId: string;
    queued: boolean;
    error?: string;
  }> {
    try {
      let result;
      
      switch (request.type) {
        case NotificationType.EMAIL:
          result = await this.processEmailNotification(request);
          break;
        case NotificationType.SMS:
          result = await this.processSMSNotification(request);
          break;
        default:
          throw new Error(`Unsupported notification type: ${request.type}`);
      }

      if (result.success) {
        await this.deliveryTracking.updateDeliveryStatus(
          delivery.id,
          DeliveryStatus.DELIVERED,
          { providerResponse: result }
        );
      } else {
        await this.deliveryTracking.updateDeliveryStatus(
          delivery.id,
          DeliveryStatus.FAILED,
          { error: result.error }
        );
      }

      return {
        notificationId: request.id!,
        deliveryId: delivery.id,
        queued: false,
        error: result.error
      };
    } catch (error) {
      await this.deliveryTracking.updateDeliveryStatus(
        delivery.id,
        DeliveryStatus.FAILED,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );

      return {
        notificationId: request.id!,
        deliveryId: delivery.id,
        queued: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async processEmailNotification(
    request: NotificationRequest
  ): Promise<any> {
    let content = request.content;

    // Render template if provided
    if (request.templateId) {
      const rendered = this.templateEngine.render(
        request.templateId,
        request.variables || {},
        request.recipient.locale
      );
      content = {
        subject: rendered.subject,
        body: rendered.content,
        html: rendered.content
      };
    }

    if (!content) {
      throw new Error('No content or template provided');
    }

    const result = await this.emailService.send(
      request.recipient,
      content,
      request.metadata
    );

    return {
      success: result.status === DeliveryStatus.SENT,
      messageId: result.messageId,
      error: result.error,
      deliveryId: request.metadata?.deliveryId
    };
  }

  private async processSMSNotification(
    request: NotificationRequest
  ): Promise<any> {
    let message = request.content?.body;

    // Render template if provided
    if (request.templateId) {
      const rendered = this.templateEngine.render(
        request.templateId,
        request.variables || {},
        request.recipient.locale
      );
      message = rendered.content;
    }

    if (!message) {
      throw new Error('No message content or template provided');
    }

    const result = await this.smsService.send(
      request.recipient,
      message,
      request.metadata
    );

    return {
      success: result.status === DeliveryStatus.SENT,
      messageId: result.messageId,
      error: result.error,
      remainingCredits: result.remainingCredits,
      deliveryId: request.metadata?.deliveryId
    };
  }

  async sendBulk(
    requests: NotificationRequest[]
  ): Promise<Map<string, {
    notificationId: string;
    deliveryId?: string;
    queued: boolean;
    error?: string;
  }>> {
    const results = new Map();
    
    // Process each request
    for (const request of requests) {
      const result = await this.send(request);
      results.set(request.id || this.generateNotificationId(), result);
    }
    
    return results;
  }

  async updateUserPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<void> {
    this.userPreferences.set(userId, preferences);
  }

  getUserPreferences(userId: string): NotificationPreferences | undefined {
    return this.userPreferences.get(userId);
  }

  private async checkUserPreferences(
    userId: string,
    type: NotificationType,
    category?: string
  ): Promise<boolean> {
    const preferences = this.userPreferences.get(userId);
    if (!preferences) return true; // Default to allow if no preferences

    // Check if channel is enabled
    const channelKey = type.toLowerCase() as keyof typeof preferences.channels;
    const channelPrefs = preferences.channels[channelKey];
    
    if (!channelPrefs?.enabled) return false;

    // Check category preferences
    if (category && channelPrefs.categories) {
      return channelPrefs.categories[category] !== false;
    }

    // Check quiet hours
    if (preferences.quiet.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = preferences.quiet.start.split(':').map(Number);
      const [endHour, endMin] = preferences.quiet.end.split(':').map(Number);
      const quietStart = startHour * 60 + startMin;
      const quietEnd = endHour * 60 + endMin;

      if (quietStart <= quietEnd) {
        if (currentTime >= quietStart && currentTime <= quietEnd) {
          return false;
        }
      } else {
        // Quiet hours span midnight
        if (currentTime >= quietStart || currentTime <= quietEnd) {
          return false;
        }
      }
    }

    return true;
  }

  private getRecipientIdentifier(request: NotificationRequest): string {
    switch (request.type) {
      case NotificationType.EMAIL:
        return request.recipient.email || 'unknown';
      case NotificationType.SMS:
        return request.recipient.phone || 'unknown';
      default:
        return request.recipient.userId || 'unknown';
    }
  }

  private getProviderName(type: NotificationType): string {
    switch (type) {
      case NotificationType.EMAIL:
        return this.emailService['config'].provider.type;
      case NotificationType.SMS:
        return this.smsService['config'].provider.type;
      default:
        return 'unknown';
    }
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Template management
  registerTemplate(template: any): void {
    this.templateEngine.registerTemplate(template);
  }

  // Queue management
  async getQueueStatus(type: NotificationType) {
    return this.queueService.getQueueStatus(type);
  }

  // Delivery tracking
  getDelivery(deliveryId: string) {
    return this.deliveryTracking.getDelivery(deliveryId);
  }

  async getDeliveryStats(startDate: Date, endDate: Date, type?: NotificationType) {
    return this.deliveryTracking.getDeliveryStats(startDate, endDate, type);
  }
}