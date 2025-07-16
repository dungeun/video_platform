/**
 * @module @company/inventory-tracking/entities/ProductInventory
 * @description Product inventory entity implementation
 */

import { z } from 'zod';
import { generateId } from '@company/utils';
import type { ProductInventory } from '../types';

/**
 * Product inventory validation schema
 */
export const ProductInventorySchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().min(0),
  reservedQuantity: z.number().min(0),
  availableQuantity: z.number().min(0),
  minimumStock: z.number().min(0),
  maximumStock: z.number().min(0),
  reorderPoint: z.number().min(0),
  reorderQuantity: z.number().min(0),
  unitCost: z.number().min(0),
  lastRestockedAt: z.number().optional(),
  expiryDate: z.number().optional(),
  batchNumber: z.string().optional(),
  serialNumbers: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.number(),
  updatedAt: z.number()
}).refine(data => data.availableQuantity === data.quantity - data.reservedQuantity, {
  message: 'Available quantity must equal quantity minus reserved quantity'
});

/**
 * Product inventory entity class
 */
export class ProductInventoryEntity implements ProductInventory {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  lastRestockedAt?: number | undefined;
  expiryDate?: number | undefined;
  batchNumber?: string | undefined;
  serialNumbers?: string[] | undefined;
  metadata?: Record<string, any> | undefined;
  createdAt: number;
  updatedAt: number;

  constructor(data: Partial<ProductInventory>) {
    
    this.id = data.id || generateId();
    this.productId = data.productId || '';
    this.warehouseId = data.warehouseId || '';
    this.quantity = data.quantity || 0;
    this.reservedQuantity = data.reservedQuantity || 0;
    this.availableQuantity = this.quantity - this.reservedQuantity;
    this.minimumStock = data.minimumStock || 0;
    this.maximumStock = data.maximumStock || 0;
    this.reorderPoint = data.reorderPoint || 0;
    this.reorderQuantity = data.reorderQuantity || 0;
    this.unitCost = data.unitCost || 0;
    this.lastRestockedAt = data.lastRestockedAt ?? undefined;
    this.expiryDate = data.expiryDate ?? undefined;
    this.batchNumber = data.batchNumber ?? undefined;
    this.serialNumbers = data.serialNumbers ?? undefined;
    this.metadata = data.metadata ?? undefined;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  /**
   * Validate inventory data
   */
  validate(): boolean {
    try {
      ProductInventorySchema.parse(this);
      return true;
    } catch (error) {
      console.error('Product inventory validation failed', error);
      return false;
    }
  }

  /**
   * Update quantity
   */
  updateQuantity(newQuantity: number): void {
    if (newQuantity < 0) {
      throw new Error('Quantity cannot be negative');
    }
    if (newQuantity < this.reservedQuantity) {
      throw new Error('Quantity cannot be less than reserved quantity');
    }
    this.quantity = newQuantity;
    this.availableQuantity = this.quantity - this.reservedQuantity;
    this.updatedAt = Date.now();
  }

  /**
   * Reserve stock
   */
  reserveStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Reserve quantity must be positive');
    }
    if (quantity > this.availableQuantity) {
      throw new Error('Insufficient available stock');
    }
    this.reservedQuantity += quantity;
    this.availableQuantity = this.quantity - this.reservedQuantity;
    this.updatedAt = Date.now();
  }

  /**
   * Release reserved stock
   */
  releaseReservation(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Release quantity must be positive');
    }
    if (quantity > this.reservedQuantity) {
      throw new Error('Release quantity exceeds reserved quantity');
    }
    this.reservedQuantity -= quantity;
    this.availableQuantity = this.quantity - this.reservedQuantity;
    this.updatedAt = Date.now();
  }

  /**
   * Check if low stock
   */
  isLowStock(): boolean {
    return this.quantity <= this.minimumStock;
  }

  /**
   * Check if needs reorder
   */
  needsReorder(): boolean {
    return this.quantity <= this.reorderPoint;
  }

  /**
   * Check if overstock
   */
  isOverstock(): boolean {
    return this.quantity > this.maximumStock;
  }

  /**
   * Check if expiring soon (within days)
   */
  isExpiringSoon(days: number = 30): boolean {
    if (!this.expiryDate) return false;
    const daysInMs = days * 24 * 60 * 60 * 1000;
    return this.expiryDate - Date.now() <= daysInMs;
  }

  /**
   * Check if expired
   */
  isExpired(): boolean {
    if (!this.expiryDate) return false;
    return this.expiryDate < Date.now();
  }

  /**
   * Get total value
   */
  getTotalValue(): number {
    return this.quantity * this.unitCost;
  }

  /**
   * Convert to plain object
   */
  toJSON(): ProductInventory {
    return {
      id: this.id,
      productId: this.productId,
      warehouseId: this.warehouseId,
      quantity: this.quantity,
      reservedQuantity: this.reservedQuantity,
      availableQuantity: this.availableQuantity,
      minimumStock: this.minimumStock,
      maximumStock: this.maximumStock,
      reorderPoint: this.reorderPoint,
      reorderQuantity: this.reorderQuantity,
      unitCost: this.unitCost,
      lastRestockedAt: this.lastRestockedAt,
      expiryDate: this.expiryDate,
      batchNumber: this.batchNumber,
      serialNumbers: this.serialNumbers,
      metadata: this.metadata ?? {},
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}