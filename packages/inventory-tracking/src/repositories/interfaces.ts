/**
 * @module @repo/inventory-tracking/repositories/interfaces
 * @description Repository interfaces for inventory tracking
 */

import type { 
  Warehouse, 
  ProductInventory, 
  StockReservation, 
  StockMovement, 
  StockAlert,
  InventoryFilterOptions,
  MovementFilterOptions
} from '../types';

/**
 * Base repository interface
 */
export interface BaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

/**
 * Warehouse repository interface
 */
export interface IWarehouseRepository extends BaseRepository<Warehouse> {
  findByCode(code: string): Promise<Warehouse | null>;
  findActive(): Promise<Warehouse[]>;
  findByCountry(country: string): Promise<Warehouse[]>;
  updateOccupancy(id: string, change: number): Promise<Warehouse>;
}

/**
 * Product inventory repository interface
 */
export interface IProductInventoryRepository extends BaseRepository<ProductInventory> {
  findByProductId(productId: string): Promise<ProductInventory[]>;
  findByWarehouseId(warehouseId: string): Promise<ProductInventory[]>;
  findByProductAndWarehouse(productId: string, warehouseId: string): Promise<ProductInventory | null>;
  findLowStock(warehouseId?: string): Promise<ProductInventory[]>;
  findExpiring(days: number, warehouseId?: string): Promise<ProductInventory[]>;
  search(filters: InventoryFilterOptions): Promise<ProductInventory[]>;
  updateQuantity(id: string, quantity: number): Promise<ProductInventory>;
  adjustStock(id: string, adjustment: number): Promise<ProductInventory>;
}

/**
 * Stock reservation repository interface
 */
export interface IStockReservationRepository extends BaseRepository<StockReservation> {
  findByProductId(productId: string): Promise<StockReservation[]>;
  findByOrderId(orderId: string): Promise<StockReservation[]>;
  findByCustomerId(customerId: string): Promise<StockReservation[]>;
  findActive(): Promise<StockReservation[]>;
  findExpired(): Promise<StockReservation[]>;
  extendExpiry(id: string, hours: number): Promise<StockReservation>;
  cancel(id: string): Promise<StockReservation>;
  confirm(id: string): Promise<StockReservation>;
}

/**
 * Stock movement repository interface
 */
export interface IStockMovementRepository extends BaseRepository<StockMovement> {
  findByProductId(productId: string): Promise<StockMovement[]>;
  findByWarehouseId(warehouseId: string): Promise<StockMovement[]>;
  findByDateRange(startDate: string, endDate: string): Promise<StockMovement[]>;
  findByReference(referenceType: string, referenceId: string): Promise<StockMovement[]>;
  search(filters: MovementFilterOptions): Promise<StockMovement[]>;
  getMovementSummary(productId: string, warehouseId?: string): Promise<{
    totalInbound: number;
    totalOutbound: number;
    netChange: number;
  }>;
}

/**
 * Stock alert repository interface
 */
export interface IStockAlertRepository extends BaseRepository<StockAlert> {
  findByProductId(productId: string): Promise<StockAlert[]>;
  findByWarehouseId(warehouseId: string): Promise<StockAlert[]>;
  findActive(): Promise<StockAlert[]>;
  findUnacknowledged(): Promise<StockAlert[]>;
  findTriggered(): Promise<StockAlert[]>;
  acknowledge(id: string, userId: string): Promise<StockAlert>;
  markNotificationSent(id: string): Promise<StockAlert>;
  deactivate(id: string): Promise<StockAlert>;
}