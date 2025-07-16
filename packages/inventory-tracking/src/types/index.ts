/**
 * @module @company/inventory-tracking/types
 * @description Type definitions for inventory tracking module
 */

import { UUID, Timestamp } from '@company/types';

/**
 * Stock status enumeration
 */
export enum StockStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  SOLD = 'sold',
  DAMAGED = 'damaged',
  LOST = 'lost',
  IN_TRANSIT = 'in_transit',
  RETURNED = 'returned'
}

/**
 * Stock movement types
 */
export enum StockMovementType {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
  RESERVATION = 'reservation',
  CANCELLATION = 'cancellation',
  RETURN = 'return'
}

/**
 * Alert types for inventory
 */
export enum AlertType {
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  OVERSTOCK = 'overstock',
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired'
}

/**
 * Warehouse entity
 */
export interface Warehouse {
  id: UUID;
  code: string;
  name: string;
  address: string;
  city: string;
  country: string;
  isActive: boolean;
  capacity: number;
  currentOccupancy: number;
  metadata?: Record<string, any> | undefined;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Product inventory entity
 */
export interface ProductInventory {
  id: UUID;
  productId: UUID;
  warehouseId: UUID;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  lastRestockedAt?: Timestamp | undefined;
  expiryDate?: Timestamp | undefined;
  batchNumber?: string | undefined;
  serialNumbers?: string[] | undefined;
  metadata?: Record<string, any> | undefined;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Stock reservation entity
 */
export interface StockReservation {
  id: UUID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  productId: UUID;
  warehouseId: UUID;
  orderId?: UUID | undefined;
  customerId?: UUID | undefined;
  quantity: number;
  status: StockStatus;
  expiresAt: Timestamp;
  notes?: string | undefined;
  metadata?: Record<string, any>;
}

/**
 * Stock movement record
 */
export interface StockMovement {
  id: UUID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  productId: UUID;
  fromWarehouseId?: UUID | undefined;
  toWarehouseId?: UUID | undefined;
  movementType: StockMovementType;
  quantity: number;
  unitCost?: number | undefined;
  totalCost?: number | undefined;
  referenceType?: string | undefined;
  referenceId?: UUID | undefined;
  reason?: string | undefined;
  performedBy: UUID;
  notes?: string | undefined;
  metadata?: Record<string, any>;
}

/**
 * Stock alert entity
 */
export interface StockAlert {
  id: UUID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  productId: UUID;
  warehouseId?: UUID | undefined;
  alertType: AlertType;
  threshold: number;
  currentValue: number;
  isActive: boolean;
  isAcknowledged: boolean;
  acknowledgedBy?: UUID | undefined;
  acknowledgedAt?: Timestamp | undefined;
  notificationSent: boolean;
  notificationSentAt?: Timestamp | undefined;
  metadata?: Record<string, any>;
}

/**
 * Stock adjustment request
 */
export interface StockAdjustment {
  productId: UUID;
  warehouseId: UUID;
  adjustmentType: 'increase' | 'decrease' | 'set';
  quantity: number;
  reason: string;
  notes?: string;
}

/**
 * Stock transfer request
 */
export interface StockTransfer {
  productId: UUID;
  fromWarehouseId: UUID;
  toWarehouseId: UUID;
  quantity: number;
  notes?: string;
}

/**
 * Inventory report
 */
export interface InventoryReport {
  warehouseId?: UUID | undefined;
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockItems: number;
  expiringItems: number;
  reportDate: Timestamp;
}

/**
 * Stock level summary
 */
export interface StockLevelSummary {
  productId: UUID;
  productName: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  warehouses: {
    warehouseId: UUID;
    warehouseName: string;
    quantity: number;
    availableQuantity: number;
    reservedQuantity: number;
  }[];
}

/**
 * Inventory filter options
 */
export interface InventoryFilterOptions {
  warehouseId?: UUID;
  productIds?: UUID[];
  status?: StockStatus;
  minQuantity?: number;
  maxQuantity?: number;
  lowStockOnly?: boolean;
  expiringOnly?: boolean;
  includeReserved?: boolean;
}

/**
 * Movement filter options
 */
export interface MovementFilterOptions {
  productId?: UUID | undefined;
  warehouseId?: UUID | undefined;
  movementType?: StockMovementType | undefined;
  dateFrom?: Timestamp | undefined;
  dateTo?: Timestamp | undefined;
  performedBy?: UUID | undefined;
}

/**
 * Alert configuration
 */
export interface AlertConfiguration {
  productId: UUID;
  warehouseId?: UUID;
  lowStockThreshold: number;
  overstockThreshold?: number;
  expiryWarningDays?: number;
  emailNotification?: boolean;
  smsNotification?: boolean;
  webhookUrl?: string;
}