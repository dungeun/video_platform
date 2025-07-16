/**
 * @module @repo/inventory-tracking/admin
 * @description Admin utilities for inventory tracking module
 */

export const adminConfig = {
  moduleName: '@repo/inventory-tracking',
  displayName: 'Inventory Tracking',
  description: 'E-commerce inventory management with stock tracking, reservations, and alerts',
  version: '1.0.0',
  adminRoutes: [
    {
      path: '/admin/inventory',
      label: 'Inventory Management',
      icon: 'inventory'
    },
    {
      path: '/admin/warehouses',
      label: 'Warehouse Management',
      icon: 'warehouse'
    },
    {
      path: '/admin/stock-movements',
      label: 'Stock Movements',
      icon: 'history'
    },
    {
      path: '/admin/stock-alerts',
      label: 'Stock Alerts',
      icon: 'alert'
    }
  ]
};