/**
 * @module @repo/inventory-tracking/validators
 * @description Validation schemas and utilities
 */

import { z } from 'zod';

/**
 * Stock adjustment validation
 */
export const StockAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  adjustmentType: z.enum(['increase', 'decrease', 'set']),
  quantity: z.number().positive(),
  reason: z.string().min(1).max(500),
  notes: z.string().max(1000).optional()
});

/**
 * Stock transfer validation
 */
export const StockTransferSchema = z.object({
  productId: z.string().uuid(),
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  quantity: z.number().positive(),
  notes: z.string().max(1000).optional()
}).refine(data => data.fromWarehouseId !== data.toWarehouseId, {
  message: 'Source and destination warehouses must be different'
});

/**
 * Reservation request validation
 */
export const ReservationRequestSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().positive(),
  orderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  expiryHours: z.number().min(1).max(168).optional(), // Max 7 days
  notes: z.string().max(500).optional()
});

/**
 * Alert configuration validation
 */
export const AlertConfigurationSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid().optional(),
  lowStockThreshold: z.number().min(0),
  overstockThreshold: z.number().min(0).optional(),
  expiryWarningDays: z.number().min(1).max(365).optional(),
  emailNotification: z.boolean().optional(),
  smsNotification: z.boolean().optional(),
  webhookUrl: z.string().url().optional()
});

/**
 * Inventory filter validation
 */
export const InventoryFilterSchema = z.object({
  warehouseId: z.string().uuid().optional(),
  productIds: z.array(z.string().uuid()).optional(),
  status: z.enum(['available', 'reserved', 'sold', 'damaged', 'lost', 'in_transit', 'returned']).optional(),
  minQuantity: z.number().min(0).optional(),
  maxQuantity: z.number().min(0).optional(),
  lowStockOnly: z.boolean().optional(),
  expiringOnly: z.boolean().optional(),
  includeReserved: z.boolean().optional()
});

/**
 * Movement filter validation
 */
export const MovementFilterSchema = z.object({
  productId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  movementType: z.enum(['inbound', 'outbound', 'transfer', 'adjustment', 'reservation', 'cancellation', 'return']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  performedBy: z.string().uuid().optional()
});

/**
 * Warehouse creation validation
 */
export const WarehouseCreateSchema = z.object({
  code: z.string().min(2).max(10).regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens'),
  name: z.string().min(1).max(100),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  country: z.string().length(2).regex(/^[A-Z]{2}$/, 'Country must be ISO 2-letter code'),
  capacity: z.number().positive(),
  metadata: z.record(z.any()).optional()
});

/**
 * Validate stock adjustment request
 */
export function validateStockAdjustment(data: unknown) {
  return StockAdjustmentSchema.parse(data);
}

/**
 * Validate stock transfer request
 */
export function validateStockTransfer(data: unknown) {
  return StockTransferSchema.parse(data);
}

/**
 * Validate reservation request
 */
export function validateReservationRequest(data: unknown) {
  return ReservationRequestSchema.parse(data);
}

/**
 * Validate alert configuration
 */
export function validateAlertConfiguration(data: unknown) {
  return AlertConfigurationSchema.parse(data);
}

/**
 * Validate warehouse creation
 */
export function validateWarehouseCreate(data: unknown) {
  return WarehouseCreateSchema.parse(data);
}