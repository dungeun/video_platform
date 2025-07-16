/**
 * @module @company/inventory-tracking/entities/StockMovement
 * @description Stock movement entity implementation
 */

import { z } from 'zod';
import { generateId } from '@company/utils';
import type { StockMovement } from '../types';
import { StockMovementType } from '../types';

/**
 * Stock movement validation schema
 */
export const StockMovementSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  fromWarehouseId: z.string().uuid().optional(),
  toWarehouseId: z.string().uuid().optional(),
  movementType: z.nativeEnum(StockMovementType),
  quantity: z.number().positive(),
  unitCost: z.number().min(0).optional(),
  totalCost: z.number().min(0).optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().uuid().optional(),
  reason: z.string().optional(),
  performedBy: z.string().uuid(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.number(),
  updatedAt: z.number()
}).refine(data => {
  // Validate warehouse IDs based on movement type
  if (data.movementType === StockMovementType.TRANSFER) {
    return data.fromWarehouseId && data.toWarehouseId && data.fromWarehouseId !== data.toWarehouseId;
  }
  if (data.movementType === StockMovementType.INBOUND) {
    return data.toWarehouseId && !data.fromWarehouseId;
  }
  if (data.movementType === StockMovementType.OUTBOUND) {
    return data.fromWarehouseId && !data.toWarehouseId;
  }
  return true;
}, {
  message: 'Invalid warehouse configuration for movement type'
});

/**
 * Stock movement entity class
 */
export class StockMovementEntity implements StockMovement {
  id: string;
  productId: string;
  fromWarehouseId?: string | undefined;
  toWarehouseId?: string | undefined;
  movementType: StockMovementType;
  quantity: number;
  unitCost?: number | undefined;
  totalCost?: number | undefined;
  referenceType?: string | undefined;
  referenceId?: string | undefined;
  reason?: string | undefined;
  performedBy: string;
  notes?: string | undefined;
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;

  constructor(data: Partial<StockMovement>) {
    
    this.id = data.id || generateId();
    this.productId = data.productId || '';
    this.fromWarehouseId = data.fromWarehouseId ?? undefined;
    this.toWarehouseId = data.toWarehouseId ?? undefined;
    this.movementType = data.movementType || StockMovementType.ADJUSTMENT;
    this.quantity = data.quantity || 0;
    this.unitCost = data.unitCost ?? undefined;
    this.totalCost = data.totalCost || (this.unitCost ? this.unitCost * this.quantity : undefined);
    this.referenceType = data.referenceType ?? undefined;
    this.referenceId = data.referenceId ?? undefined;
    this.reason = data.reason ?? undefined;
    this.performedBy = data.performedBy || '';
    this.notes = data.notes ?? undefined;
    this.metadata = data.metadata ?? {};
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  /**
   * Validate movement data
   */
  validate(): boolean {
    try {
      StockMovementSchema.parse(this);
      return true;
    } catch (error) {
      console.error('Stock movement validation failed', error);
      return false;
    }
  }

  /**
   * Calculate total cost if unit cost is provided
   */
  calculateTotalCost(): number | undefined {
    if (this.unitCost !== undefined) {
      this.totalCost = this.unitCost * this.quantity;
      return this.totalCost;
    }
    return undefined;
  }

  /**
   * Check if movement is a transfer
   */
  isTransfer(): boolean {
    return this.movementType === StockMovementType.TRANSFER;
  }

  /**
   * Check if movement is inbound
   */
  isInbound(): boolean {
    return this.movementType === StockMovementType.INBOUND || 
           (this.isTransfer() && this.toWarehouseId !== undefined);
  }

  /**
   * Check if movement is outbound
   */
  isOutbound(): boolean {
    return this.movementType === StockMovementType.OUTBOUND || 
           (this.isTransfer() && this.fromWarehouseId !== undefined);
  }

  /**
   * Get movement direction for a specific warehouse
   */
  getDirectionForWarehouse(warehouseId: string): 'in' | 'out' | 'none' {
    if (this.toWarehouseId === warehouseId) return 'in';
    if (this.fromWarehouseId === warehouseId) return 'out';
    return 'none';
  }

  /**
   * Convert to plain object
   */
  toJSON(): StockMovement {
    return {
      id: this.id,
      productId: this.productId,
      fromWarehouseId: this.fromWarehouseId,
      toWarehouseId: this.toWarehouseId,
      movementType: this.movementType,
      quantity: this.quantity,
      unitCost: this.unitCost,
      totalCost: this.totalCost,
      referenceType: this.referenceType,
      referenceId: this.referenceId,
      reason: this.reason,
      performedBy: this.performedBy,
      notes: this.notes,
      metadata: this.metadata ?? {},
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}