/**
 * Delivery status manager
 */

import { Logger, EventEmitter } from '@repo/core';
import { StorageManager } from '@repo/storage';
import {
  DeliveryStatus,
  TrackingInfo,
  CarrierCode,
  WebhookEvent,
  WebhookEventType
} from '../../types';

export interface StatusManagerConfig {
  storage?: {
    enabled: boolean;
    provider?: 'localStorage' | 'indexedDB';
  };
  notifications?: {
    enabled: boolean;
    events: DeliveryStatus[];
  };
}

export interface StatusChange {
  trackingNumber: string;
  carrier: CarrierCode;
  previousStatus: DeliveryStatus;
  currentStatus: DeliveryStatus;
  timestamp: Date;
  details?: any;
}

export class StatusManager extends EventEmitter {
  private logger: Logger;
  private storage: StorageManager;
  private statusMap: Map<string, DeliveryStatus>;

  constructor(private config: StatusManagerConfig) {
    super();
    this.logger = new Logger('StatusManager');
    this.statusMap = new Map();
    
    if (config.storage?.enabled) {
      this.storage = new StorageManager({
        namespace: 'shipping-status',
        provider: config.storage.provider || 'localStorage'
      });
      this.loadStoredStatuses();
    }
  }

  /**
   * Load stored statuses
   */
  private async loadStoredStatuses(): Promise<void> {
    try {
      const stored = await this.storage.get<Record<string, DeliveryStatus>>('statuses');
      if (stored) {
        Object.entries(stored).forEach(([key, status]) => {
          this.statusMap.set(key, status);
        });
        this.logger.info('Loaded stored statuses', { count: this.statusMap.size });
      }
    } catch (error) {
      this.logger.error('Failed to load stored statuses', error);
    }
  }

  /**
   * Update delivery status
   */
  async updateStatus(trackingInfo: TrackingInfo): Promise<StatusChange | null> {
    const key = this.getKey(trackingInfo.carrier, trackingInfo.trackingNumber);
    const previousStatus = this.statusMap.get(key);
    const currentStatus = trackingInfo.status;

    // Check if status changed
    if (previousStatus === currentStatus) {
      return null;
    }

    // Update status
    this.statusMap.set(key, currentStatus);

    // Store if enabled
    if (this.config.storage?.enabled) {
      await this.saveStatuses();
    }

    // Create status change object
    const statusChange: StatusChange = {
      trackingNumber: trackingInfo.trackingNumber,
      carrier: trackingInfo.carrier,
      previousStatus: previousStatus || 'PENDING',
      currentStatus,
      timestamp: new Date(),
      details: {
        currentLocation: trackingInfo.currentLocation,
        estimatedDelivery: trackingInfo.estimatedDelivery,
        actualDelivery: trackingInfo.actualDelivery
      }
    };

    // Emit status change event
    this.emit('status:changed', statusChange);

    // Check if notification should be sent
    if (this.shouldNotify(currentStatus)) {
      this.emit('notification:required', {
        type: 'STATUS_CHANGED',
        statusChange
      });
    }

    // Handle special statuses
    await this.handleSpecialStatus(trackingInfo, statusChange);

    return statusChange;
  }

  /**
   * Handle special delivery statuses
   */
  private async handleSpecialStatus(
    trackingInfo: TrackingInfo,
    statusChange: StatusChange
  ): Promise<void> {
    switch (statusChange.currentStatus) {
      case 'DELIVERED':
        await this.handleDeliveryCompleted(trackingInfo);
        break;
      case 'FAILED':
        await this.handleDeliveryFailed(trackingInfo);
        break;
      case 'RETURNED':
        await this.handleDeliveryReturned(trackingInfo);
        break;
      case 'EXCEPTION':
        await this.handleDeliveryException(trackingInfo);
        break;
    }
  }

  /**
   * Handle delivery completed
   */
  private async handleDeliveryCompleted(trackingInfo: TrackingInfo): Promise<void> {
    this.logger.info('Delivery completed', {
      carrier: trackingInfo.carrier,
      trackingNumber: trackingInfo.trackingNumber
    });

    this.emit('delivery:completed', {
      trackingInfo,
      completedAt: trackingInfo.actualDelivery || new Date()
    });

    // Create webhook event
    const webhookEvent: WebhookEvent = {
      id: this.generateEventId(),
      type: 'DELIVERY_COMPLETED',
      carrier: trackingInfo.carrier,
      trackingNumber: trackingInfo.trackingNumber,
      timestamp: new Date(),
      data: trackingInfo,
      signature: this.generateSignature(trackingInfo)
    };

    this.emit('webhook:event', webhookEvent);
  }

  /**
   * Handle delivery failed
   */
  private async handleDeliveryFailed(trackingInfo: TrackingInfo): Promise<void> {
    this.logger.warn('Delivery failed', {
      carrier: trackingInfo.carrier,
      trackingNumber: trackingInfo.trackingNumber
    });

    this.emit('delivery:failed', {
      trackingInfo,
      failedAt: new Date()
    });

    // Create webhook event
    const webhookEvent: WebhookEvent = {
      id: this.generateEventId(),
      type: 'DELIVERY_FAILED',
      carrier: trackingInfo.carrier,
      trackingNumber: trackingInfo.trackingNumber,
      timestamp: new Date(),
      data: trackingInfo,
      signature: this.generateSignature(trackingInfo)
    };

    this.emit('webhook:event', webhookEvent);
  }

  /**
   * Handle delivery returned
   */
  private async handleDeliveryReturned(trackingInfo: TrackingInfo): Promise<void> {
    this.logger.warn('Delivery returned', {
      carrier: trackingInfo.carrier,
      trackingNumber: trackingInfo.trackingNumber
    });

    this.emit('delivery:returned', {
      trackingInfo,
      returnedAt: new Date()
    });
  }

  /**
   * Handle delivery exception
   */
  private async handleDeliveryException(trackingInfo: TrackingInfo): Promise<void> {
    this.logger.error('Delivery exception', {
      carrier: trackingInfo.carrier,
      trackingNumber: trackingInfo.trackingNumber
    });

    this.emit('delivery:exception', {
      trackingInfo,
      exceptionAt: new Date()
    });

    // Create webhook event
    const webhookEvent: WebhookEvent = {
      id: this.generateEventId(),
      type: 'EXCEPTION_OCCURRED',
      carrier: trackingInfo.carrier,
      trackingNumber: trackingInfo.trackingNumber,
      timestamp: new Date(),
      data: trackingInfo,
      signature: this.generateSignature(trackingInfo)
    };

    this.emit('webhook:event', webhookEvent);
  }

  /**
   * Get current status
   */
  getStatus(carrier: CarrierCode, trackingNumber: string): DeliveryStatus | null {
    const key = this.getKey(carrier, trackingNumber);
    return this.statusMap.get(key) || null;
  }

  /**
   * Get all tracked shipments
   */
  getTrackedShipments(): Array<{ carrier: CarrierCode; trackingNumber: string; status: DeliveryStatus }> {
    const shipments: Array<{ carrier: CarrierCode; trackingNumber: string; status: DeliveryStatus }> = [];
    
    this.statusMap.forEach((status, key) => {
      const [carrier, trackingNumber] = key.split(':');
      shipments.push({
        carrier: carrier as CarrierCode,
        trackingNumber,
        status
      });
    });

    return shipments;
  }

  /**
   * Remove tracking
   */
  async removeTracking(carrier: CarrierCode, trackingNumber: string): Promise<void> {
    const key = this.getKey(carrier, trackingNumber);
    this.statusMap.delete(key);
    
    if (this.config.storage?.enabled) {
      await this.saveStatuses();
    }

    this.logger.info('Tracking removed', { carrier, trackingNumber });
  }

  /**
   * Clear all trackings
   */
  async clearAll(): Promise<void> {
    this.statusMap.clear();
    
    if (this.config.storage?.enabled) {
      await this.storage.delete('statuses');
    }

    this.logger.info('All trackings cleared');
  }

  /**
   * Check if should notify
   */
  private shouldNotify(status: DeliveryStatus): boolean {
    if (!this.config.notifications?.enabled) {
      return false;
    }

    return this.config.notifications.events.includes(status);
  }

  /**
   * Save statuses to storage
   */
  private async saveStatuses(): Promise<void> {
    try {
      const statuses: Record<string, DeliveryStatus> = {};
      this.statusMap.forEach((status, key) => {
        statuses[key] = status;
      });
      await this.storage.set('statuses', statuses);
    } catch (error) {
      this.logger.error('Failed to save statuses', error);
    }
  }

  /**
   * Get storage key
   */
  private getKey(carrier: CarrierCode, trackingNumber: string): string {
    return `${carrier}:${trackingNumber}`;
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate signature
   */
  private generateSignature(data: any): string {
    // Simple signature for now - in production, use proper HMAC
    const payload = JSON.stringify(data);
    return Buffer.from(payload).toString('base64').substring(0, 32);
  }

  /**
   * Get status statistics
   */
  getStatusStatistics(): Record<DeliveryStatus, number> {
    const stats: Record<string, number> = {};
    
    this.statusMap.forEach(status => {
      stats[status] = (stats[status] || 0) + 1;
    });

    return stats as Record<DeliveryStatus, number>;
  }
}