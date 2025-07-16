/**
 * @module @repo/inventory-tracking/services/ReservationService
 * @description Stock reservation management service
 */

import { ModuleBase } from '@repo/core';
import { EventEmitter } from '@repo/core';
import type { StockReservation } from '../types';
import type {
  IStockReservationRepository,
  IProductInventoryRepository
} from '../repositories/interfaces';

export interface ReservationRequest {
  productId: string;
  warehouseId: string;
  quantity: number;
  orderId?: string | undefined;
  customerId?: string | undefined;
  expiryHours?: number | undefined;
  notes?: string | undefined;
}

export class ReservationService extends ModuleBase {
  protected override eventEmitter: EventEmitter;
  private cleanupInterval?: NodeJS.Timeout | undefined;

  constructor(
    private reservationRepo: IStockReservationRepository,
    private inventoryRepo: IProductInventoryRepository
  ) {
    super({
      name: 'ReservationService',
      version: '1.0.0',
      description: 'Stock reservation management service'
    });
    this.eventEmitter = new EventEmitter();
    this.startCleanupJob();
  }

  /**
   * Create a new reservation
   */
  async createReservation(request: ReservationRequest): Promise<StockReservation> {
    // Check inventory availability
    const inventory = await this.inventoryRepo.findByProductAndWarehouse(
      request.productId,
      request.warehouseId
    );

    if (!inventory) {
      throw new Error('Product not found in warehouse');
    }

    if (inventory.availableQuantity < request.quantity) {
      throw new Error('Insufficient available stock');
    }

    // Create reservation
    const expiresAt = Date.now() + ((request.expiryHours || 24) * 60 * 60 * 1000);

    const reservation = await this.reservationRepo.create({
      productId: request.productId,
      warehouseId: request.warehouseId,
      quantity: request.quantity,
      orderId: request.orderId,
      customerId: request.customerId,
      expiresAt: expiresAt,
      notes: request.notes
    });

    // Update inventory reserved quantity
    const updatedInventory = await this.inventoryRepo.update(inventory.id, {
      reservedQuantity: inventory.reservedQuantity + request.quantity,
      availableQuantity: inventory.availableQuantity - request.quantity
    });

    // Emit event
    this.eventEmitter.emit('reservation:created', {
      reservation,
      inventory: updatedInventory
    });

    this.logger.info('Reservation created', {
      reservationId: reservation.id,
      productId: request.productId,
      quantity: request.quantity
    });

    return reservation;
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(reservationId: string): Promise<StockReservation> {
    const reservation = await this.reservationRepo.findById(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status !== 'reserved') {
      throw new Error('Can only cancel reserved items');
    }

    // Update reservation status
    const cancelled = await this.reservationRepo.cancel(reservationId);

    // Release reserved stock
    const inventory = await this.inventoryRepo.findByProductAndWarehouse(
      reservation.productId,
      reservation.warehouseId
    );

    if (inventory) {
      await this.inventoryRepo.update(inventory.id, {
        reservedQuantity: Math.max(0, inventory.reservedQuantity - reservation.quantity),
        availableQuantity: inventory.availableQuantity + reservation.quantity
      });
    }

    // Emit event
    this.eventEmitter.emit('reservation:cancelled', {
      reservation: cancelled
    });

    this.logger.info('Reservation cancelled', {
      reservationId,
      quantity: reservation.quantity
    });

    return cancelled;
  }

  /**
   * Confirm a reservation (convert to sold)
   */
  async confirmReservation(reservationId: string): Promise<StockReservation> {
    const reservation = await this.reservationRepo.findById(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    const confirmed = await this.reservationRepo.confirm(reservationId);

    // Update inventory - reduce reserved quantity but keep stock reduced
    const inventory = await this.inventoryRepo.findByProductAndWarehouse(
      reservation.productId,
      reservation.warehouseId
    );

    if (inventory) {
      await this.inventoryRepo.update(inventory.id, {
        quantity: inventory.quantity - reservation.quantity,
        reservedQuantity: Math.max(0, inventory.reservedQuantity - reservation.quantity)
      });
    }

    // Emit event
    this.eventEmitter.emit('reservation:confirmed', {
      reservation: confirmed
    });

    this.logger.info('Reservation confirmed', {
      reservationId,
      quantity: reservation.quantity
    });

    return confirmed;
  }

  /**
   * Extend reservation expiry
   */
  async extendReservation(reservationId: string, hours: number): Promise<StockReservation> {
    const extended = await this.reservationRepo.extendExpiry(reservationId, hours);

    this.eventEmitter.emit('reservation:extended', {
      reservation: extended,
      extensionHours: hours
    });

    return extended;
  }

  /**
   * Get reservations by order
   */
  async getOrderReservations(orderId: string): Promise<StockReservation[]> {
    return this.reservationRepo.findByOrderId(orderId);
  }

  /**
   * Get reservations by customer
   */
  async getCustomerReservations(customerId: string): Promise<StockReservation[]> {
    return this.reservationRepo.findByCustomerId(customerId);
  }

  /**
   * Get active reservations for product
   */
  async getProductReservations(productId: string): Promise<StockReservation[]> {
    const reservations = await this.reservationRepo.findByProductId(productId);
    return reservations.filter(r => r.status === 'reserved' && new Date(r.expiresAt) > new Date());
  }

  /**
   * Clean up expired reservations
   */
  async cleanupExpiredReservations(): Promise<void> {
    const expired = await this.reservationRepo.findExpired();
    
    for (const reservation of expired) {
      if (reservation.status === 'reserved') {
        try {
          await this.cancelReservation(reservation.id);
        } catch (error) {
          this.logger.error('Failed to cleanup expired reservation', {
            reservationId: reservation.id,
            error
          });
        }
      }
    }

    this.logger.info(`Cleaned up ${expired.length} expired reservations`);
  }

  /**
   * Start cleanup job
   */
  private startCleanupJob(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredReservations().catch(error => {
        this.logger.error('Reservation cleanup job failed', error);
      });
    }, 60 * 60 * 1000);
  }

  /**
   * Stop cleanup job
   */
  public stopCleanupJob(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Subscribe to reservation events
   */
  public override on(event: string, handler: (...args: any[]) => void): string {
    return this.eventEmitter.on(event, handler);
  }

  /**
   * Initialize the module
   */
  protected async onInitialize(): Promise<{ success: boolean; data?: void; error?: Error }> {
    try {
      this.logger.info('Initializing ReservationService');
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
      this.logger.info('Destroying ReservationService');
      this.stopCleanupJob();
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
      await this.reservationRepo.findActive();
      return { success: true, data: true };
    } catch (error) {
      return { success: false, data: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
}