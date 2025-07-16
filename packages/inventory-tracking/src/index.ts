/**
 * @module @company/inventory-tracking
 * @description E-commerce inventory tracking module
 * 
 * This module provides comprehensive inventory management features including:
 * - Stock tracking across multiple warehouses
 * - Stock reservations for orders
 * - Low stock and expiry alerts
 * - Stock movement history
 * - Warehouse capacity management
 */

// Export types
export * from './types';

// Export entities
export * from './entities';

// Export repository interfaces
export * from './repositories/interfaces';

// Export services
export * from './services';

// Export validators
export * from './validators';

// Export errors
export * from './errors';

// Export events
export * from './events';

// Module metadata
export const MODULE_NAME = '@company/inventory-tracking';
export const MODULE_VERSION = '1.0.0';