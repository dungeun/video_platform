/**
 * @module @company/inventory-tracking/entities/StockReservation
 * @description Stock reservation entity implementation
 */

import { z } from 'zod';
import { generateId } from '@company/utils';
import type { StockReservation } from '../types';
import { StockStatus } from '../types';

/**
 * Stock reservation validation schema
 */
export const StockReservationSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  quantity: z.number().positive(),
  status: z.nativeEnum(StockStatus),
  expiresAt: z.number(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.number(),
  updatedAt: z.number()
});

/**
 * Stock reservation entity class
 */
export class StockReservationEntity implements StockReservation {
  id: string;
  productId: string;
  warehouseId: string;
  orderId?: string | undefined;
  customerId?: string | undefined;
  quantity: number;
  status: StockStatus;
  expiresAt: number;
  notes?: string | undefined;
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;

  constructor(data: Partial<StockReservation>) {
    
    const defaultExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    this.id = data.id || generateId();
    this.productId = data.productId || '';
    this.warehouseId = data.warehouseId || '';
    this.orderId = data.orderId ?? undefined;
    this.customerId = data.customerId ?? undefined;
    this.quantity = data.quantity || 0;
    this.status = data.status || StockStatus.RESERVED;
    this.expiresAt = data.expiresAt || defaultExpiry;
    this.notes = data.notes ?? undefined;
    this.metadata = data.metadata ?? {};
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  /**
   * Validate reservation data
   */
  validate(): boolean {
    try {
      StockReservationSchema.parse(this);
      return true;
    } catch (error) {
      console.error('Stock reservation validation failed', error);
      return false;
    }
  }

  /**
   * Check if reservation is expired
   */
  isExpired(): boolean {
    return this.expiresAt < Date.now();
  }

  /**
   * Check if reservation is active
   */
  isActive(): boolean {
    return this.status === StockStatus.RESERVED && !this.isExpired();
  }

  /**
   * Extend reservation expiry
   */
  extendExpiry(hours: number): void {
    if (hours <= 0) {
      throw new Error('Extension hours must be positive');
    }
    if (!this.isActive()) {
      throw new Error('Cannot extend inactive reservation');
    }
    
    this.expiresAt = this.expiresAt + (hours * 60 * 60 * 1000);
    this.updatedAt = Date.now();
  }

  /**
   * Cancel reservation
   */
  cancel(): void {
    if (this.status !== StockStatus.RESERVED) {
      throw new Error('Can only cancel reserved status');
    }
    this.status = StockStatus.AVAILABLE;
    this.updatedAt = Date.now();
  }

  /**
   * Confirm reservation (convert to sold)
   */
  confirm(): void {
    if (!this.isActive()) {
      throw new Error('Cannot confirm inactive reservation');
    }
    this.status = StockStatus.SOLD;
    this.updatedAt = Date.now();
  }

  /**
   * Get time until expiry in milliseconds
   */
  getTimeUntilExpiry(): number {
    return this.expiresAt - Date.now();
  }

  /**
   * Convert to plain object
   */
  toJSON(): StockReservation {
    return {
      id: this.id,
      productId: this.productId,
      warehouseId: this.warehouseId,
      orderId: this.orderId,
      customerId: this.customerId,
      quantity: this.quantity,
      status: this.status,
      expiresAt: this.expiresAt,
      notes: this.notes,
      metadata: this.metadata ?? {},
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}