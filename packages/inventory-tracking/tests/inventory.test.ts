/**
 * @module @repo/inventory-tracking/tests
 * @description Basic tests for inventory tracking module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  WarehouseEntity,
  ProductInventoryEntity,
  StockReservationEntity,
  StockMovementEntity,
  StockAlertEntity
} from '../src/entities';
import { StockStatus, StockMovementType, AlertType } from '../src/types';

describe('WarehouseEntity', () => {
  let warehouse: WarehouseEntity;

  beforeEach(() => {
    warehouse = new WarehouseEntity({
      code: 'WH-001',
      name: 'Test Warehouse',
      address: '123 Test St',
      city: 'Test City',
      country: 'US',
      capacity: 1000,
      currentOccupancy: 500
    });
  });

  it('should create a warehouse entity', () => {
    expect(warehouse).toBeDefined();
    expect(warehouse.code).toBe('WH-001');
    expect(warehouse.capacity).toBe(1000);
  });

  it('should calculate available capacity', () => {
    expect(warehouse.getAvailableCapacity()).toBe(500);
  });

  it('should calculate occupancy percentage', () => {
    expect(warehouse.getOccupancyPercentage()).toBe(50);
  });

  it('should check capacity', () => {
    expect(warehouse.hasCapacity(400)).toBe(true);
    expect(warehouse.hasCapacity(600)).toBe(false);
  });

  it('should update occupancy', () => {
    warehouse.updateOccupancy(100);
    expect(warehouse.currentOccupancy).toBe(600);
    expect(warehouse.getAvailableCapacity()).toBe(400);
  });

  it('should throw error for invalid occupancy', () => {
    expect(() => warehouse.updateOccupancy(-600)).toThrow('Occupancy cannot be negative');
    expect(() => warehouse.updateOccupancy(600)).toThrow('Occupancy exceeds capacity');
  });
});

describe('ProductInventoryEntity', () => {
  let inventory: ProductInventoryEntity;

  beforeEach(() => {
    inventory = new ProductInventoryEntity({
      productId: '123e4567-e89b-12d3-a456-426614174000',
      warehouseId: '123e4567-e89b-12d3-a456-426614174001',
      quantity: 100,
      reservedQuantity: 20,
      minimumStock: 10,
      maximumStock: 500,
      reorderPoint: 30,
      reorderQuantity: 100,
      unitCost: 25.50
    });
  });

  it('should create an inventory entity', () => {
    expect(inventory).toBeDefined();
    expect(inventory.quantity).toBe(100);
    expect(inventory.availableQuantity).toBe(80);
  });

  it('should update quantity correctly', () => {
    inventory.updateQuantity(150);
    expect(inventory.quantity).toBe(150);
    expect(inventory.availableQuantity).toBe(130);
  });

  it('should reserve stock', () => {
    inventory.reserveStock(30);
    expect(inventory.reservedQuantity).toBe(50);
    expect(inventory.availableQuantity).toBe(50);
  });

  it('should release reservation', () => {
    inventory.releaseReservation(10);
    expect(inventory.reservedQuantity).toBe(10);
    expect(inventory.availableQuantity).toBe(90);
  });

  it('should check stock levels', () => {
    expect(inventory.isLowStock()).toBe(false);
    expect(inventory.needsReorder()).toBe(false);
    expect(inventory.isOverstock()).toBe(false);
  });

  it('should calculate total value', () => {
    expect(inventory.getTotalValue()).toBe(2550);
  });
});

describe('StockReservationEntity', () => {
  let reservation: StockReservationEntity;

  beforeEach(() => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 24);
    
    reservation = new StockReservationEntity({
      productId: '123e4567-e89b-12d3-a456-426614174000',
      warehouseId: '123e4567-e89b-12d3-a456-426614174001',
      quantity: 10,
      status: StockStatus.RESERVED,
      expiresAt: futureDate.toISOString()
    });
  });

  it('should create a reservation entity', () => {
    expect(reservation).toBeDefined();
    expect(reservation.status).toBe(StockStatus.RESERVED);
    expect(reservation.quantity).toBe(10);
  });

  it('should check if active', () => {
    expect(reservation.isActive()).toBe(true);
    expect(reservation.isExpired()).toBe(false);
  });

  it('should extend expiry', () => {
    const originalExpiry = reservation.expiresAt;
    reservation.extendExpiry(24);
    expect(new Date(reservation.expiresAt) > new Date(originalExpiry)).toBe(true);
  });

  it('should cancel reservation', () => {
    reservation.cancel();
    expect(reservation.status).toBe(StockStatus.AVAILABLE);
  });

  it('should confirm reservation', () => {
    reservation.confirm();
    expect(reservation.status).toBe(StockStatus.SOLD);
  });
});

describe('StockMovementEntity', () => {
  let movement: StockMovementEntity;

  beforeEach(() => {
    movement = new StockMovementEntity({
      productId: '123e4567-e89b-12d3-a456-426614174000',
      fromWarehouseId: '123e4567-e89b-12d3-a456-426614174001',
      toWarehouseId: '123e4567-e89b-12d3-a456-426614174002',
      movementType: StockMovementType.TRANSFER,
      quantity: 50,
      unitCost: 25.50,
      performedBy: '123e4567-e89b-12d3-a456-426614174003'
    });
  });

  it('should create a movement entity', () => {
    expect(movement).toBeDefined();
    expect(movement.movementType).toBe(StockMovementType.TRANSFER);
    expect(movement.quantity).toBe(50);
  });

  it('should calculate total cost', () => {
    expect(movement.calculateTotalCost()).toBe(1275);
  });

  it('should identify movement type', () => {
    expect(movement.isTransfer()).toBe(true);
    expect(movement.isInbound()).toBe(true);
    expect(movement.isOutbound()).toBe(true);
  });

  it('should get direction for warehouse', () => {
    expect(movement.getDirectionForWarehouse('123e4567-e89b-12d3-a456-426614174001')).toBe('out');
    expect(movement.getDirectionForWarehouse('123e4567-e89b-12d3-a456-426614174002')).toBe('in');
    expect(movement.getDirectionForWarehouse('123e4567-e89b-12d3-a456-426614174999')).toBe('none');
  });
});

describe('StockAlertEntity', () => {
  let alert: StockAlertEntity;

  beforeEach(() => {
    alert = new StockAlertEntity({
      productId: '123e4567-e89b-12d3-a456-426614174000',
      alertType: AlertType.LOW_STOCK,
      threshold: 50,
      currentValue: 30,
      isActive: true
    });
  });

  it('should create an alert entity', () => {
    expect(alert).toBeDefined();
    expect(alert.alertType).toBe(AlertType.LOW_STOCK);
    expect(alert.threshold).toBe(50);
  });

  it('should check if triggered', () => {
    expect(alert.isTriggered()).toBe(true);
  });

  it('should update value and check trigger', () => {
    const shouldNotify = alert.updateValue(60);
    expect(shouldNotify).toBe(false);
    expect(alert.currentValue).toBe(60);
  });

  it('should acknowledge alert', () => {
    alert.acknowledge('123e4567-e89b-12d3-a456-426614174001');
    expect(alert.isAcknowledged).toBe(true);
    expect(alert.acknowledgedBy).toBe('123e4567-e89b-12d3-a456-426614174001');
  });

  it('should get severity', () => {
    expect(alert.getSeverity()).toBe('high');
  });

  it('should deactivate and activate', () => {
    alert.deactivate();
    expect(alert.isActive).toBe(false);
    
    alert.activate();
    expect(alert.isActive).toBe(true);
    expect(alert.isAcknowledged).toBe(false);
  });
});