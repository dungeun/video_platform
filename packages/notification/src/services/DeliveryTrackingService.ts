import {
  NotificationDelivery,
  DeliveryStatus,
  NotificationType
} from '../types';

export interface DeliveryTrackingServiceConfig {
  retentionDays?: number;
  enableWebhooks?: boolean;
}

export class DeliveryTrackingService {
  private deliveries: Map<string, NotificationDelivery>;
  private config: DeliveryTrackingServiceConfig;
  private webhookHandlers: Map<string, (delivery: NotificationDelivery) => Promise<void>>;

  constructor(config: DeliveryTrackingServiceConfig = {}) {
    this.config = {
      retentionDays: 30,
      enableWebhooks: true,
      ...config
    };
    this.deliveries = new Map();
    this.webhookHandlers = new Map();
  }

  async createDelivery(
    notificationId: string,
    type: NotificationType,
    recipient: string,
    provider: string
  ): Promise<NotificationDelivery> {
    const delivery: NotificationDelivery = {
      id: this.generateDeliveryId(),
      notificationId,
      type,
      recipient,
      status: DeliveryStatus.PENDING,
      provider,
      attempts: 0,
      metadata: {}
    };

    this.deliveries.set(delivery.id, delivery);
    await this.triggerWebhook('created', delivery);
    
    return delivery;
  }

  async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    details?: {
      providerResponse?: any;
      error?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<NotificationDelivery | null> {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery) return null;

    delivery.status = status;
    
    if (details) {
      if (details.providerResponse) {
        delivery.providerResponse = details.providerResponse;
      }
      if (details.error) {
        delivery.error = details.error;
      }
      if (details.metadata) {
        delivery.metadata = { ...delivery.metadata, ...details.metadata };
      }
    }

    // Update timestamps based on status
    switch (status) {
      case DeliveryStatus.SENT:
        delivery.sentAt = new Date();
        break;
      case DeliveryStatus.DELIVERED:
        delivery.deliveredAt = new Date();
        break;
      case DeliveryStatus.FAILED:
      case DeliveryStatus.BOUNCED:
        delivery.failedAt = new Date();
        break;
    }

    this.deliveries.set(deliveryId, delivery);
    await this.triggerWebhook('updated', delivery);
    
    return delivery;
  }

  async incrementAttempts(deliveryId: string): Promise<void> {
    const delivery = this.deliveries.get(deliveryId);
    if (delivery) {
      delivery.attempts += 1;
      this.deliveries.set(deliveryId, delivery);
    }
  }

  getDelivery(deliveryId: string): NotificationDelivery | null {
    return this.deliveries.get(deliveryId) || null;
  }

  getDeliveriesByNotification(notificationId: string): NotificationDelivery[] {
    return Array.from(this.deliveries.values()).filter(
      delivery => delivery.notificationId === notificationId
    );
  }

  getDeliveriesByRecipient(
    recipient: string,
    type?: NotificationType
  ): NotificationDelivery[] {
    return Array.from(this.deliveries.values()).filter(
      delivery => 
        delivery.recipient === recipient &&
        (!type || delivery.type === type)
    );
  }

  getDeliveriesByStatus(
    status: DeliveryStatus,
    type?: NotificationType
  ): NotificationDelivery[] {
    return Array.from(this.deliveries.values()).filter(
      delivery => 
        delivery.status === status &&
        (!type || delivery.type === type)
    );
  }

  async getDeliveryStats(
    startDate: Date,
    endDate: Date,
    type?: NotificationType
  ): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    bounced: number;
    deliveryRate: number;
    byProvider: Record<string, {
      total: number;
      delivered: number;
      failed: number;
    }>;
  }> {
    const deliveries = Array.from(this.deliveries.values()).filter(delivery => {
      const createdAt = delivery.sentAt || new Date();
      return (
        createdAt >= startDate &&
        createdAt <= endDate &&
        (!type || delivery.type === type)
      );
    });

    const stats = {
      total: deliveries.length,
      sent: 0,
      delivered: 0,
      failed: 0,
      bounced: 0,
      deliveryRate: 0,
      byProvider: {} as Record<string, any>
    };

    deliveries.forEach(delivery => {
      switch (delivery.status) {
        case DeliveryStatus.SENT:
          stats.sent++;
          break;
        case DeliveryStatus.DELIVERED:
          stats.delivered++;
          break;
        case DeliveryStatus.FAILED:
          stats.failed++;
          break;
        case DeliveryStatus.BOUNCED:
          stats.bounced++;
          break;
      }

      // Provider stats
      if (!stats.byProvider[delivery.provider]) {
        stats.byProvider[delivery.provider] = {
          total: 0,
          delivered: 0,
          failed: 0
        };
      }
      
      stats.byProvider[delivery.provider].total++;
      
      if (delivery.status === DeliveryStatus.DELIVERED) {
        stats.byProvider[delivery.provider].delivered++;
      } else if (
        delivery.status === DeliveryStatus.FAILED ||
        delivery.status === DeliveryStatus.BOUNCED
      ) {
        stats.byProvider[delivery.provider].failed++;
      }
    });

    stats.deliveryRate = stats.total > 0 
      ? (stats.delivered / stats.total) * 100 
      : 0;

    return stats;
  }

  registerWebhook(
    event: string,
    handler: (delivery: NotificationDelivery) => Promise<void>
  ): void {
    if (this.config.enableWebhooks) {
      this.webhookHandlers.set(event, handler);
    }
  }

  private async triggerWebhook(
    event: string,
    delivery: NotificationDelivery
  ): Promise<void> {
    if (!this.config.enableWebhooks) return;

    const handler = this.webhookHandlers.get(event);
    if (handler) {
      try {
        await handler(delivery);
      } catch (error) {
        console.error(`Webhook error for ${event}:`, error);
      }
    }
  }

  async cleanupOldDeliveries(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (this.config.retentionDays || 30));

    let deletedCount = 0;
    
    for (const [id, delivery] of this.deliveries) {
      const deliveryDate = delivery.deliveredAt || delivery.failedAt || delivery.sentAt;
      if (deliveryDate && deliveryDate < cutoffDate) {
        this.deliveries.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  exportDeliveries(
    filter?: {
      startDate?: Date;
      endDate?: Date;
      type?: NotificationType;
      status?: DeliveryStatus;
    }
  ): NotificationDelivery[] {
    let deliveries = Array.from(this.deliveries.values());

    if (filter) {
      if (filter.startDate || filter.endDate) {
        deliveries = deliveries.filter(delivery => {
          const date = delivery.sentAt || new Date();
          return (
            (!filter.startDate || date >= filter.startDate) &&
            (!filter.endDate || date <= filter.endDate)
          );
        });
      }

      if (filter.type) {
        deliveries = deliveries.filter(d => d.type === filter.type);
      }

      if (filter.status) {
        deliveries = deliveries.filter(d => d.status === filter.status);
      }
    }

    return deliveries;
  }

  private generateDeliveryId(): string {
    return `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}