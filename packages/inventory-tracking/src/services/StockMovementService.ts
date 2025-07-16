/**
 * @module @repo/inventory-tracking/services/StockMovementService
 * @description Stock movement tracking service
 */

import { ModuleBase } from '@repo/core';
import type { StockMovement, StockMovementType, MovementFilterOptions } from '../types';
import type { IStockMovementRepository } from '../repositories/interfaces';

export interface MovementRequest {
  productId: string;
  warehouseId: string;
  movementType: StockMovementType;
  quantity: number;
  unitCost?: number | undefined;
  referenceType?: string | undefined;
  referenceId?: string | undefined;
  reason?: string | undefined;
  notes?: string | undefined;
  performedBy?: string | undefined;
}

export interface TransferRequest {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  unitCost?: number | undefined;
  notes?: string | undefined;
  performedBy?: string | undefined;
}

export class StockMovementService extends ModuleBase {
  constructor(private movementRepo: IStockMovementRepository) {
    super({
      name: 'StockMovementService',
      version: '1.0.0',
      description: 'Stock movement tracking service'
    });
  }

  /**
   * Record a stock movement
   */
  async recordMovement(request: MovementRequest): Promise<StockMovement> {
    const movement = await this.movementRepo.create({
      productId: request.productId,
      movementType: request.movementType,
      quantity: request.quantity,
      unitCost: request.unitCost,
      referenceType: request.referenceType,
      referenceId: request.referenceId,
      reason: request.reason,
      notes: request.notes,
      performedBy: request.performedBy || 'system',
      ...(request.movementType === 'inbound' && { toWarehouseId: request.warehouseId }),
      ...(request.movementType === 'outbound' && { fromWarehouseId: request.warehouseId }),
      ...(request.movementType === 'adjustment' && { 
        toWarehouseId: request.quantity > 0 ? request.warehouseId : undefined,
        fromWarehouseId: request.quantity < 0 ? request.warehouseId : undefined
      })
    });

    this.logger.info('Stock movement recorded', {
      movementId: movement.id,
      type: request.movementType,
      productId: request.productId,
      quantity: request.quantity
    });

    return movement;
  }

  /**
   * Record a transfer between warehouses
   */
  async recordTransfer(request: TransferRequest): Promise<StockMovement> {
    const movement = await this.movementRepo.create({
      productId: request.productId,
      fromWarehouseId: request.fromWarehouseId,
      toWarehouseId: request.toWarehouseId,
      movementType: 'transfer' as StockMovementType,
      quantity: request.quantity,
      unitCost: request.unitCost,
      notes: request.notes,
      performedBy: request.performedBy || 'system'
    });

    this.logger.info('Stock transfer recorded', {
      movementId: movement.id,
      productId: request.productId,
      from: request.fromWarehouseId,
      to: request.toWarehouseId,
      quantity: request.quantity
    });

    return movement;
  }

  /**
   * Get movement history for a product
   */
  async getProductMovements(productId: string, filters?: MovementFilterOptions): Promise<StockMovement[]> {
    return this.movementRepo.search({
      ...filters,
      productId
    });
  }

  /**
   * Get movement history for a warehouse
   */
  async getWarehouseMovements(warehouseId: string, filters?: MovementFilterOptions): Promise<StockMovement[]> {
    return this.movementRepo.search({
      ...filters,
      warehouseId
    });
  }

  /**
   * Get movements by reference
   */
  async getMovementsByReference(referenceType: string, referenceId: string): Promise<StockMovement[]> {
    return this.movementRepo.findByReference(referenceType, referenceId);
  }

  /**
   * Get movement summary for a product
   */
  async getMovementSummary(productId: string, warehouseId?: string): Promise<{
    totalInbound: number;
    totalOutbound: number;
    netChange: number;
    movements: StockMovement[];
  }> {
    const summary = await this.movementRepo.getMovementSummary(productId, warehouseId);
    const movements = await this.getProductMovements(productId, { warehouseId });

    return {
      ...summary,
      movements
    };
  }

  /**
   * Get movements for date range
   */
  async getMovementsByDateRange(
    startDate: string,
    endDate: string,
    filters?: MovementFilterOptions
  ): Promise<StockMovement[]> {
    return this.movementRepo.search({
      ...filters,
      dateFrom: new Date(startDate).getTime(),
      dateTo: new Date(endDate).getTime()
    });
  }

  /**
   * Calculate stock value changes
   */
  async calculateValueChanges(
    productId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    openingValue: number;
    closingValue: number;
    totalInboundValue: number;
    totalOutboundValue: number;
    netChange: number;
  }> {
    const movements = await this.getMovementsByDateRange(startDate, endDate, { productId });
    
    let totalInboundValue = 0;
    let totalOutboundValue = 0;

    for (const movement of movements) {
      const value = movement.totalCost || (movement.quantity * (movement.unitCost || 0));
      
      if (movement.movementType === 'inbound' || 
          (movement.movementType === 'transfer' && movement.toWarehouseId)) {
        totalInboundValue += value;
      } else if (movement.movementType === 'outbound' || 
                 (movement.movementType === 'transfer' && movement.fromWarehouseId)) {
        totalOutboundValue += value;
      }
    }

    return {
      openingValue: 0, // Would need historical data
      closingValue: 0, // Would need current inventory data
      totalInboundValue,
      totalOutboundValue,
      netChange: totalInboundValue - totalOutboundValue
    };
  }

  /**
   * Initialize the module
   */
  protected async onInitialize(): Promise<{ success: boolean; data?: void; error?: Error }> {
    try {
      this.logger.info('Initializing StockMovementService');
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
      this.logger.info('Destroying StockMovementService');
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
      await this.movementRepo.search({ productId: 'test' });
      return { success: true, data: true };
    } catch (error) {
      return { success: false, data: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
}