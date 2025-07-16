/**
 * @module @repo/inventory-tracking/errors
 * @description Custom error classes for inventory tracking
 */

/**
 * Base inventory error
 */
export class InventoryError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'InventoryError';
  }
}

/**
 * Insufficient stock error
 */
export class InsufficientStockError extends InventoryError {
  constructor(
    public productId: string,
    public warehouseId: string,
    public requested: number,
    public available: number
  ) {
    super(
      `Insufficient stock for product ${productId} in warehouse ${warehouseId}. Requested: ${requested}, Available: ${available}`,
      'INSUFFICIENT_STOCK',
      400
    );
    this.name = 'InsufficientStockError';
  }
}

/**
 * Warehouse capacity error
 */
export class WarehouseCapacityError extends InventoryError {
  constructor(
    public warehouseId: string,
    public required: number,
    public available: number
  ) {
    super(
      `Insufficient capacity in warehouse ${warehouseId}. Required: ${required}, Available: ${available}`,
      'INSUFFICIENT_CAPACITY',
      400
    );
    this.name = 'WarehouseCapacityError';
  }
}

/**
 * Product not found error
 */
export class ProductNotFoundError extends InventoryError {
  constructor(
    public productId: string,
    public warehouseId?: string
  ) {
    const message = warehouseId
      ? `Product ${productId} not found in warehouse ${warehouseId}`
      : `Product ${productId} not found`;
    super(message, 'PRODUCT_NOT_FOUND', 404);
    this.name = 'ProductNotFoundError';
  }
}

/**
 * Warehouse not found error
 */
export class WarehouseNotFoundError extends InventoryError {
  constructor(public warehouseId: string) {
    super(
      `Warehouse ${warehouseId} not found`,
      'WAREHOUSE_NOT_FOUND',
      404
    );
    this.name = 'WarehouseNotFoundError';
  }
}

/**
 * Reservation error
 */
export class ReservationError extends InventoryError {
  constructor(message: string, code: string = 'RESERVATION_ERROR') {
    super(message, code, 400);
    this.name = 'ReservationError';
  }
}

/**
 * Expired reservation error
 */
export class ExpiredReservationError extends ReservationError {
  constructor(public reservationId: string) {
    super(
      `Reservation ${reservationId} has expired`,
      'RESERVATION_EXPIRED'
    );
    this.name = 'ExpiredReservationError';
  }
}

/**
 * Stock movement error
 */
export class StockMovementError extends InventoryError {
  constructor(message: string, code: string = 'MOVEMENT_ERROR') {
    super(message, code, 400);
    this.name = 'StockMovementError';
  }
}

/**
 * Invalid warehouse state error
 */
export class InvalidWarehouseStateError extends InventoryError {
  constructor(
    public warehouseId: string,
    public reason: string
  ) {
    super(
      `Invalid warehouse state for ${warehouseId}: ${reason}`,
      'INVALID_WAREHOUSE_STATE',
      400
    );
    this.name = 'InvalidWarehouseStateError';
  }
}

/**
 * Alert configuration error
 */
export class AlertConfigurationError extends InventoryError {
  constructor(message: string) {
    super(message, 'ALERT_CONFIG_ERROR', 400);
    this.name = 'AlertConfigurationError';
  }
}

/**
 * Duplicate entity error
 */
export class DuplicateEntityError extends InventoryError {
  constructor(
    public entityType: string,
    public field: string,
    public value: string
  ) {
    super(
      `${entityType} with ${field} '${value}' already exists`,
      'DUPLICATE_ENTITY',
      409
    );
    this.name = 'DuplicateEntityError';
  }
}