/**
 * @module @company/inventory-tracking/events
 * @description Event definitions for inventory tracking
 */

import type {
  ProductInventory,
  StockReservation,
  StockMovement,
  StockAlert,
  Warehouse
} from '../types';

/**
 * Inventory event types
 */
export enum InventoryEventType {
  // Inventory events
  STOCK_UPDATED = 'inventory:stock_updated',
  STOCK_ADJUSTED = 'inventory:stock_adjusted',
  STOCK_TRANSFERRED = 'inventory:stock_transferred',
  LOW_STOCK_DETECTED = 'inventory:low_stock_detected',
  OUT_OF_STOCK = 'inventory:out_of_stock',
  STOCK_REPLENISHED = 'inventory:stock_replenished',

  // Reservation events
  RESERVATION_CREATED = 'reservation:created',
  RESERVATION_CONFIRMED = 'reservation:confirmed',
  RESERVATION_CANCELLED = 'reservation:cancelled',
  RESERVATION_EXPIRED = 'reservation:expired',
  RESERVATION_EXTENDED = 'reservation:extended',

  // Movement events
  MOVEMENT_RECORDED = 'movement:recorded',
  TRANSFER_INITIATED = 'movement:transfer_initiated',
  TRANSFER_COMPLETED = 'movement:transfer_completed',

  // Alert events
  ALERT_TRIGGERED = 'alert:triggered',
  ALERT_ACKNOWLEDGED = 'alert:acknowledged',
  ALERT_RESOLVED = 'alert:resolved',

  // Warehouse events
  WAREHOUSE_CREATED = 'warehouse:created',
  WAREHOUSE_UPDATED = 'warehouse:updated',
  WAREHOUSE_DEACTIVATED = 'warehouse:deactivated',
  WAREHOUSE_NEAR_CAPACITY = 'warehouse:near_capacity',
  WAREHOUSE_AT_CAPACITY = 'warehouse:at_capacity'
}

/**
 * Base event interface
 */
export interface BaseInventoryEvent {
  type: InventoryEventType;
  timestamp: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

/**
 * Stock updated event
 */
export interface StockUpdatedEvent extends BaseInventoryEvent {
  type: InventoryEventType.STOCK_UPDATED;
  data: {
    inventory: ProductInventory;
    previousQuantity: number;
    newQuantity: number;
    changeAmount: number;
    reason?: string;
  };
}

/**
 * Stock transferred event
 */
export interface StockTransferredEvent extends BaseInventoryEvent {
  type: InventoryEventType.STOCK_TRANSFERRED;
  data: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    movement: StockMovement;
  };
}

/**
 * Low stock detected event
 */
export interface LowStockDetectedEvent extends BaseInventoryEvent {
  type: InventoryEventType.LOW_STOCK_DETECTED;
  data: {
    inventory: ProductInventory;
    threshold: number;
    currentStock: number;
    reorderPoint: number;
  };
}

/**
 * Reservation created event
 */
export interface ReservationCreatedEvent extends BaseInventoryEvent {
  type: InventoryEventType.RESERVATION_CREATED;
  data: {
    reservation: StockReservation;
    inventory: ProductInventory;
  };
}

/**
 * Alert triggered event
 */
export interface AlertTriggeredEvent extends BaseInventoryEvent {
  type: InventoryEventType.ALERT_TRIGGERED;
  data: {
    alert: StockAlert;
    product: { id: string; name?: string };
    warehouse?: Warehouse;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}

/**
 * Warehouse near capacity event
 */
export interface WarehouseNearCapacityEvent extends BaseInventoryEvent {
  type: InventoryEventType.WAREHOUSE_NEAR_CAPACITY;
  data: {
    warehouse: Warehouse;
    utilizationPercentage: number;
    availableCapacity: number;
  };
}

/**
 * Union type for all inventory events
 */
export type InventoryEvent =
  | StockUpdatedEvent
  | StockTransferredEvent
  | LowStockDetectedEvent
  | ReservationCreatedEvent
  | AlertTriggeredEvent
  | WarehouseNearCapacityEvent;

/**
 * Event handler type
 */
export type InventoryEventHandler<T extends InventoryEvent = InventoryEvent> = (event: T) => void | Promise<void>;

/**
 * Event subscription options
 */
export interface EventSubscriptionOptions {
  once?: boolean;
  filter?: (event: InventoryEvent) => boolean;
}

/**
 * Create an inventory event
 */
export function createInventoryEvent<T extends InventoryEvent>(
  type: T['type'],
  data: T['data'],
  metadata?: Record<string, any>
): T {
  return {
    type,
    timestamp: new Date().toISOString(),
    data,
    metadata
  } as T;
}