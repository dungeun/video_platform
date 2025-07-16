/**
 * @module @company/inventory-tracking/services/AlertService
 * @description Inventory alert management service
 */

import { ModuleBase } from '@company/core';
import { EventEmitter } from '@company/core';
import type { 
  StockAlert, 
  ProductInventory,
  AlertConfiguration 
} from '../types';
import { AlertType } from '../types';
import type { IStockAlertRepository } from '../repositories/interfaces';

export interface AlertNotification {
  alert: StockAlert;
  product: { id: string; name?: string };
  warehouse?: { id: string; name: string };
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AlertService extends ModuleBase {
  protected override eventEmitter: EventEmitter;
  private checkInterval?: NodeJS.Timeout;

  constructor(private alertRepo: IStockAlertRepository) {
    super({
      name: 'AlertService',
      version: '1.0.0',
      description: 'Inventory alert management service'
    });
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Configure alerts for a product
   */
  async configureAlerts(config: AlertConfiguration): Promise<StockAlert[]> {
    const alerts: StockAlert[] = [];

    // Create low stock alert
    if (config.lowStockThreshold > 0) {
      const lowStockAlert = await this.alertRepo.create({
        productId: config.productId,
        warehouseId: config.warehouseId,
        alertType: AlertType.LOW_STOCK,
        threshold: config.lowStockThreshold,
        currentValue: 0,
        metadata: {
          emailNotification: config.emailNotification,
          smsNotification: config.smsNotification,
          webhookUrl: config.webhookUrl
        }
      });
      alerts.push(lowStockAlert);
    }

    // Create overstock alert
    if (config.overstockThreshold) {
      const overstockAlert = await this.alertRepo.create({
        productId: config.productId,
        warehouseId: config.warehouseId,
        alertType: AlertType.OVERSTOCK,
        threshold: config.overstockThreshold,
        currentValue: 0,
        metadata: {
          emailNotification: config.emailNotification,
          smsNotification: config.smsNotification,
          webhookUrl: config.webhookUrl
        }
      });
      alerts.push(overstockAlert);
    }

    // Create expiry warning alert
    if (config.expiryWarningDays) {
      const expiryAlert = await this.alertRepo.create({
        productId: config.productId,
        warehouseId: config.warehouseId,
        alertType: 'EXPIRING_SOON' as AlertType,
        threshold: config.expiryWarningDays,
        currentValue: 0,
        metadata: {
          emailNotification: config.emailNotification,
          smsNotification: config.smsNotification,
          webhookUrl: config.webhookUrl
        }
      });
      alerts.push(expiryAlert);
    }

    this.logger.info('Alerts configured', {
      productId: config.productId,
      alertCount: alerts.length
    });

    return alerts;
  }

  /**
   * Check inventory alerts
   */
  async checkInventoryAlerts(inventory: ProductInventory): Promise<void> {
    const alerts = await this.alertRepo.findByProductId(inventory.productId);
    const relevantAlerts = alerts.filter(a => 
      !a.warehouseId || a.warehouseId === inventory.warehouseId
    );

    for (const alert of relevantAlerts) {
      await this.evaluateAlert(alert, inventory);
    }
  }

  /**
   * Evaluate a single alert
   */
  private async evaluateAlert(alert: StockAlert, inventory: ProductInventory): Promise<void> {
    let shouldTrigger = false;
    let currentValue = 0;

    switch (alert.alertType) {
      case AlertType.LOW_STOCK:
        currentValue = inventory.quantity;
        shouldTrigger = inventory.quantity <= alert.threshold;
        break;

      case AlertType.OUT_OF_STOCK:
        currentValue = inventory.quantity;
        shouldTrigger = inventory.quantity === 0;
        break;

      case AlertType.OVERSTOCK:
        currentValue = inventory.quantity;
        shouldTrigger = inventory.quantity >= alert.threshold;
        break;

      case AlertType.EXPIRING_SOON:
        if (inventory.expiryDate) {
          const daysUntilExpiry = Math.floor(
            (inventory.expiryDate - Date.now()) / (1000 * 60 * 60 * 24)
          );
          currentValue = daysUntilExpiry;
          shouldTrigger = daysUntilExpiry <= alert.threshold && daysUntilExpiry >= 0;
        }
        break;

      case AlertType.EXPIRED:
        if (inventory.expiryDate) {
          currentValue = 0;
          shouldTrigger = inventory.expiryDate < Date.now();
        }
        break;
    }

    // Update alert current value
    await this.alertRepo.update(alert.id, { currentValue });

    // Trigger alert if needed
    if (shouldTrigger && alert.isActive && !alert.notificationSent) {
      await this.triggerAlert(alert, inventory);
    } else if (!shouldTrigger && alert.notificationSent) {
      // Reset alert if condition is no longer met
      await this.alertRepo.update(alert.id, {
        notificationSent: false,
        notificationSentAt: undefined,
        isAcknowledged: false,
        acknowledgedBy: undefined,
        acknowledgedAt: undefined
      });
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(alert: StockAlert, inventory: ProductInventory): Promise<void> {
    const notification: AlertNotification = {
      alert,
      product: { id: inventory.productId },
      message: this.generateAlertMessage(alert, inventory),
      severity: this.getAlertSeverity(alert.alertType)
    };

    // Mark as sent
    await this.alertRepo.markNotificationSent(alert.id);

    // Emit notification event
    this.eventEmitter.emit('alert:triggered', notification);

    // Send notifications based on configuration
    if (alert.metadata?.['emailNotification']) {
      this.eventEmitter.emit('alert:email', notification);
    }
    if (alert.metadata?.['smsNotification']) {
      this.eventEmitter.emit('alert:sms', notification);
    }
    if (alert.metadata?.['webhookUrl']) {
      this.eventEmitter.emit('alert:webhook', {
        ...notification,
        webhookUrl: alert.metadata['webhookUrl']
      });
    }

    this.logger.warn('Alert triggered', {
      alertId: alert.id,
      type: alert.alertType,
      productId: alert.productId,
      threshold: alert.threshold,
      currentValue: alert.currentValue
    });
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(alert: StockAlert, inventory: ProductInventory): string {
    switch (alert.alertType) {
      case AlertType.LOW_STOCK:
        return `Low stock alert: Product ${inventory.productId} has ${inventory.quantity} units (threshold: ${alert.threshold})`;
      
      case AlertType.OUT_OF_STOCK:
        return `Out of stock: Product ${inventory.productId} is out of stock`;
      
      case AlertType.OVERSTOCK:
        return `Overstock alert: Product ${inventory.productId} has ${inventory.quantity} units (threshold: ${alert.threshold})`;
      
      case AlertType.EXPIRING_SOON:
        const daysUntilExpiry = Math.floor(
          (inventory.expiryDate! - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return `Expiry warning: Product ${inventory.productId} expires in ${daysUntilExpiry} days`;
      
      case AlertType.EXPIRED:
        return `Expired: Product ${inventory.productId} has expired`;
      
      default:
        return `Alert: ${alert.alertType} for product ${inventory.productId}`;
    }
  }

  /**
   * Get alert severity
   */
  private getAlertSeverity(alertType: AlertType): 'low' | 'medium' | 'high' | 'critical' {
    switch (alertType) {
      case AlertType.OUT_OF_STOCK:
      case AlertType.EXPIRED:
        return 'critical';
      case AlertType.LOW_STOCK:
      case AlertType.EXPIRING_SOON:
        return 'high';
      case AlertType.OVERSTOCK:
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<StockAlert> {
    return this.alertRepo.acknowledge(alertId, userId);
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<StockAlert[]> {
    return this.alertRepo.findActive();
  }

  /**
   * Get unacknowledged alerts
   */
  async getUnacknowledgedAlerts(): Promise<StockAlert[]> {
    return this.alertRepo.findUnacknowledged();
  }

  /**
   * Get alerts for a product
   */
  async getProductAlerts(productId: string): Promise<StockAlert[]> {
    return this.alertRepo.findByProductId(productId);
  }

  /**
   * Deactivate an alert
   */
  async deactivateAlert(alertId: string): Promise<StockAlert> {
    return this.alertRepo.deactivate(alertId);
  }

  /**
   * Subscribe to alert events
   */
  public override on(event: string, handler: (...args: any[]) => void): string {
    return this.eventEmitter.on(event, handler);
  }

  /**
   * Initialize the module
   */
  protected async onInitialize(): Promise<{ success: boolean; data?: void; error?: Error }> {
    try {
      this.logger.info('Initializing AlertService');
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  /**
   * Destroy the module
   */
  protected async onDestroy(): Promise<{ success: boolean; data?: void; error?: Error }> {
    try {
      this.logger.info('Destroying AlertService');
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ success: boolean; data?: boolean; error?: Error }> {
    try {
      await this.alertRepo.findActive();
      return { success: true, data: true };
    } catch (error) {
      return { success: false, data: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
}