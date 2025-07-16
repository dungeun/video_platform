/**
 * @module @repo/inventory-tracking/entities/StockAlert
 * @description Stock alert entity implementation
 */

import { z } from 'zod';
import { generateId } from '@repo/utils';
import type { StockAlert } from '../types';
import { AlertType } from '../types';

/**
 * Stock alert validation schema
 */
export const StockAlertSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  warehouseId: z.string().uuid().optional(),
  alertType: z.nativeEnum(AlertType),
  threshold: z.number().min(0),
  currentValue: z.number().min(0),
  isActive: z.boolean(),
  isAcknowledged: z.boolean(),
  acknowledgedBy: z.string().uuid().optional(),
  acknowledgedAt: z.number().optional(),
  notificationSent: z.boolean(),
  notificationSentAt: z.number().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.number(),
  updatedAt: z.number()
});

/**
 * Stock alert entity class
 */
export class StockAlertEntity implements StockAlert {
  id: string;
  productId: string;
  warehouseId?: string | undefined;
  alertType: AlertType;
  threshold: number;
  currentValue: number;
  isActive: boolean;
  isAcknowledged: boolean;
  acknowledgedBy?: string | undefined;
  acknowledgedAt?: number | undefined;
  notificationSent: boolean;
  notificationSentAt?: number | undefined;
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;

  constructor(data: Partial<StockAlert>) {
    
    this.id = data.id || generateId();
    this.productId = data.productId || '';
    this.warehouseId = data.warehouseId ?? undefined;
    this.alertType = data.alertType || AlertType.LOW_STOCK;
    this.threshold = data.threshold || 0;
    this.currentValue = data.currentValue || 0;
    this.isActive = data.isActive ?? true;
    this.isAcknowledged = data.isAcknowledged ?? false;
    this.acknowledgedBy = data.acknowledgedBy ?? undefined;
    this.acknowledgedAt = data.acknowledgedAt ?? undefined;
    this.notificationSent = data.notificationSent ?? false;
    this.notificationSentAt = data.notificationSentAt ?? undefined;
    this.metadata = data.metadata ?? {};
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  /**
   * Validate alert data
   */
  validate(): boolean {
    try {
      StockAlertSchema.parse(this);
      return true;
    } catch (error) {
      console.error('Stock alert validation failed', error);
      return false;
    }
  }

  /**
   * Check if alert condition is met
   */
  isTriggered(): boolean {
    if (!this.isActive) return false;

    switch (this.alertType) {
      case AlertType.LOW_STOCK:
        return this.currentValue <= this.threshold;
      case AlertType.OUT_OF_STOCK:
        return this.currentValue === 0;
      case AlertType.OVERSTOCK:
        return this.currentValue >= this.threshold;
      default:
        return false;
    }
  }

  /**
   * Update current value and check if alert should trigger
   */
  updateValue(newValue: number): boolean {
    this.currentValue = newValue;
    this.updatedAt = Date.now();
    
    const wasTriggered = this.isTriggered();
    if (wasTriggered && !this.notificationSent) {
      return true; // Should send notification
    }
    
    return false;
  }

  /**
   * Acknowledge alert
   */
  acknowledge(userId: string): void {
    if (!this.isActive) {
      throw new Error('Cannot acknowledge inactive alert');
    }
    
    this.isAcknowledged = true;
    this.acknowledgedBy = userId;
    this.acknowledgedAt = Date.now();
    this.updatedAt = Date.now();
  }

  /**
   * Mark notification as sent
   */
  markNotificationSent(): void {
    this.notificationSent = true;
    this.notificationSentAt = Date.now();
    this.updatedAt = Date.now();
  }

  /**
   * Reset alert
   */
  reset(): void {
    this.isAcknowledged = false;
    this.acknowledgedBy = undefined;
    this.acknowledgedAt = undefined;
    this.notificationSent = false;
    this.notificationSentAt = undefined;
    this.updatedAt = Date.now();
  }

  /**
   * Deactivate alert
   */
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = Date.now();
  }

  /**
   * Activate alert
   */
  activate(): void {
    this.isActive = true;
    this.reset();
  }

  /**
   * Get alert severity
   */
  getSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    switch (this.alertType) {
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
   * Convert to plain object
   */
  toJSON(): StockAlert {
    return {
      id: this.id,
      productId: this.productId,
      warehouseId: this.warehouseId,
      alertType: this.alertType,
      threshold: this.threshold,
      currentValue: this.currentValue,
      isActive: this.isActive,
      isAcknowledged: this.isAcknowledged,
      acknowledgedBy: this.acknowledgedBy,
      acknowledgedAt: this.acknowledgedAt,
      notificationSent: this.notificationSent,
      notificationSentAt: this.notificationSentAt,
      metadata: this.metadata ?? {},
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}