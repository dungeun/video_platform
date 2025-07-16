# @company/inventory-tracking

E-commerce inventory management module with stock tracking, reservations, alerts, and warehouse management.

## Features

- **Multi-warehouse inventory tracking**: Track stock levels across multiple warehouse locations
- **Stock reservations**: Reserve inventory for orders with automatic expiry
- **Low stock alerts**: Configurable alerts for low stock, out of stock, and overstock conditions
- **Stock movement history**: Complete audit trail of all inventory movements
- **Warehouse capacity management**: Track and manage warehouse space utilization
- **Expiry tracking**: Monitor product expiry dates and receive alerts
- **Batch and serial number tracking**: Support for batch and serial number management

## Installation

```bash
npm install @company/inventory-tracking
```

## Usage

### Basic Inventory Management

```typescript
import { 
  InventoryService, 
  WarehouseService,
  ReservationService 
} from '@company/inventory-tracking';

// Initialize services
const inventoryService = new InventoryService(
  inventoryRepo,
  warehouseRepo,
  movementRepo,
  movementService,
  alertService
);

// Get inventory levels
const inventory = await inventoryService.getInventory(productId, warehouseId);

// Adjust stock
await inventoryService.adjustStock({
  productId,
  warehouseId,
  adjustmentType: 'increase',
  quantity: 100,
  reason: 'New shipment received'
});

// Transfer between warehouses
await inventoryService.transferStock({
  productId,
  fromWarehouseId,
  toWarehouseId,
  quantity: 50
});
```

### Stock Reservations

```typescript
// Create reservation
const reservation = await reservationService.createReservation({
  productId,
  warehouseId,
  quantity: 10,
  orderId,
  customerId,
  expiryHours: 24
});

// Confirm reservation (convert to sale)
await reservationService.confirmReservation(reservation.id);

// Cancel reservation
await reservationService.cancelReservation(reservation.id);
```

### Warehouse Management

```typescript
// Create warehouse
const warehouse = await warehouseService.createWarehouse({
  code: 'WH-001',
  name: 'Main Warehouse',
  address: '123 Storage St',
  city: 'New York',
  country: 'US',
  capacity: 10000
});

// Check warehouse capacity
const capacity = await warehouseService.checkCapacity(warehouseId, 100);
console.log(capacity.hasCapacity); // true/false
console.log(capacity.availableCapacity); // 9500
```

### Inventory Alerts

```typescript
// Configure alerts
await alertService.configureAlerts({
  productId,
  warehouseId,
  lowStockThreshold: 50,
  overstockThreshold: 1000,
  expiryWarningDays: 30,
  emailNotification: true
});

// Subscribe to alert events
alertService.on('alert:triggered', (notification) => {
  console.log(`Alert: ${notification.message}`);
  console.log(`Severity: ${notification.severity}`);
});
```

### Stock Movement History

```typescript
// Get movement history
const movements = await movementService.getProductMovements(productId, {
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  movementType: 'TRANSFER'
});

// Get movement summary
const summary = await movementService.getMovementSummary(productId, warehouseId);
console.log(summary.totalInbound);
console.log(summary.totalOutbound);
console.log(summary.netChange);
```

## API Reference

### Types

- `Warehouse` - Warehouse entity
- `ProductInventory` - Product inventory record
- `StockReservation` - Stock reservation
- `StockMovement` - Movement history record
- `StockAlert` - Alert configuration and status

### Services

- `InventoryService` - Core inventory management
- `WarehouseService` - Warehouse operations
- `ReservationService` - Stock reservations
- `StockMovementService` - Movement tracking
- `AlertService` - Alert management

### Events

The module emits various events for inventory changes:

- `inventory:stock_updated` - Stock level changed
- `reservation:created` - New reservation created
- `alert:triggered` - Alert condition met
- `warehouse:near_capacity` - Warehouse approaching capacity

## Configuration

The module can be configured through environment variables:

```env
INVENTORY_CACHE_TTL=300
RESERVATION_DEFAULT_EXPIRY=24
ALERT_CHECK_INTERVAL=300
```

## Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

## License

Proprietary