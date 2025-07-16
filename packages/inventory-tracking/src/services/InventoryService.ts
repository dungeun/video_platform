/**
 * @module @repo/inventory-tracking/services/InventoryService
 * @description Core inventory management service
 */

import { ModuleBase } from '@repo/core';
import { CacheManager } from '@repo/cache';
import type {
  ProductInventory,
  StockAdjustment,
  StockTransfer,
  InventoryReport,
  StockLevelSummary,
  InventoryFilterOptions,
  StockMovementType
} from '../types';
import type {
  IProductInventoryRepository,
  IWarehouseRepository,
  IStockMovementRepository
} from '../repositories/interfaces';
import { StockMovementService } from './StockMovementService';
import { AlertService } from './AlertService';

export class InventoryService extends ModuleBase {
  private cache: CacheManager;
  private cachePrefix = 'inventory:';
  private cacheTTL = 300; // 5 minutes

  constructor(
    private inventoryRepo: IProductInventoryRepository,
    private warehouseRepo: IWarehouseRepository,
    private movementRepo: IStockMovementRepository,
    private movementService: StockMovementService,
    private alertService: AlertService
  ) {
    super({
      name: 'InventoryService',
      version: '1.0.0',
      description: 'Core inventory management service'
    });
    this.cache = new CacheManager({ defaultTTL: this.cacheTTL });
  }

  /**
   * Get inventory by product and warehouse
   */
  async getInventory(productId: string, warehouseId: string): Promise<ProductInventory | null> {
    const cacheKey = `${this.cachePrefix}${productId}:${warehouseId}`;
    
    const cached = await this.cache.get<ProductInventory>(cacheKey);
    if (cached) return cached;

    const inventory = await this.inventoryRepo.findByProductAndWarehouse(productId, warehouseId);
    
    if (inventory) {
      await this.cache.set(cacheKey, inventory);
    }

    return inventory;
  }

  /**
   * Get stock levels across all warehouses
   */
  async getStockLevels(productId: string): Promise<StockLevelSummary> {
    const inventories = await this.inventoryRepo.findByProductId(productId);
    
    const warehouses = await Promise.all(
      inventories.map(async (inv) => {
        const warehouse = await this.warehouseRepo.findById(inv.warehouseId);
        return {
          warehouseId: inv.warehouseId,
          warehouseName: warehouse?.name || 'Unknown',
          quantity: inv.quantity,
          availableQuantity: inv.availableQuantity,
          reservedQuantity: inv.reservedQuantity
        };
      })
    );

    const totalQuantity = inventories.reduce((sum, inv) => sum + inv.quantity, 0);
    const availableQuantity = inventories.reduce((sum, inv) => sum + inv.availableQuantity, 0);
    const reservedQuantity = inventories.reduce((sum, inv) => sum + inv.reservedQuantity, 0);

    return {
      productId,
      productName: '', // Would need product service integration
      totalQuantity,
      availableQuantity,
      reservedQuantity,
      warehouses
    };
  }

  /**
   * Adjust stock quantity
   */
  async adjustStock(adjustment: StockAdjustment): Promise<ProductInventory> {
    const inventory = await this.getInventory(adjustment.productId, adjustment.warehouseId);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    let newQuantity: number;
    switch (adjustment.adjustmentType) {
      case 'increase':
        newQuantity = inventory.quantity + adjustment.quantity;
        break;
      case 'decrease':
        if (inventory.availableQuantity < adjustment.quantity) {
          throw new Error('Insufficient available stock');
        }
        newQuantity = inventory.quantity - adjustment.quantity;
        break;
      case 'set':
        if (adjustment.quantity < inventory.reservedQuantity) {
          throw new Error('Cannot set quantity below reserved amount');
        }
        newQuantity = adjustment.quantity;
        break;
      default:
        throw new Error('Invalid adjustment type');
    }

    // Update inventory
    const updated = await this.inventoryRepo.updateQuantity(inventory.id, newQuantity);

    // Record movement
    await this.movementService.recordMovement({
      productId: adjustment.productId,
      warehouseId: adjustment.warehouseId,
      movementType: 'ADJUSTMENT' as StockMovementType,
      quantity: Math.abs(newQuantity - inventory.quantity),
      reason: adjustment.reason,
      notes: adjustment.notes
    });

    // Check alerts
    await this.alertService.checkInventoryAlerts(updated);

    // Clear cache
    await this.clearInventoryCache(adjustment.productId, adjustment.warehouseId);

    return updated;
  }

  /**
   * Transfer stock between warehouses
   */
  async transferStock(transfer: StockTransfer): Promise<void> {
    // Validate source inventory
    const sourceInventory = await this.getInventory(transfer.productId, transfer.fromWarehouseId);
    if (!sourceInventory) {
      throw new Error('Source inventory not found');
    }
    if (sourceInventory.availableQuantity < transfer.quantity) {
      throw new Error('Insufficient available stock in source warehouse');
    }

    // Validate warehouses
    const [fromWarehouse, toWarehouse] = await Promise.all([
      this.warehouseRepo.findById(transfer.fromWarehouseId),
      this.warehouseRepo.findById(transfer.toWarehouseId)
    ]);

    if (!fromWarehouse || !toWarehouse) {
      throw new Error('Invalid warehouse');
    }
    if (!fromWarehouse.isActive || !toWarehouse.isActive) {
      throw new Error('Warehouse is not active');
    }

    // Check destination capacity
    const availableCapacity = toWarehouse.capacity - toWarehouse.currentOccupancy;
    if (availableCapacity < transfer.quantity) {
      throw new Error('Insufficient capacity in destination warehouse');
    }

    // Get or create destination inventory
    let destInventory = await this.getInventory(transfer.productId, transfer.toWarehouseId);
    if (!destInventory) {
      destInventory = await this.inventoryRepo.create({
        productId: transfer.productId,
        warehouseId: transfer.toWarehouseId,
        quantity: 0,
        minimumStock: sourceInventory.minimumStock,
        maximumStock: sourceInventory.maximumStock,
        reorderPoint: sourceInventory.reorderPoint,
        reorderQuantity: sourceInventory.reorderQuantity,
        unitCost: sourceInventory.unitCost
      });
    }

    // Perform transfer
    await Promise.all([
      this.inventoryRepo.updateQuantity(sourceInventory.id, sourceInventory.quantity - transfer.quantity),
      this.inventoryRepo.updateQuantity(destInventory.id, destInventory.quantity + transfer.quantity)
    ]);

    // Record movement
    await this.movementService.recordTransfer({
      productId: transfer.productId,
      fromWarehouseId: transfer.fromWarehouseId,
      toWarehouseId: transfer.toWarehouseId,
      quantity: transfer.quantity,
      notes: transfer.notes
    });

    // Update warehouse occupancy
    await Promise.all([
      this.warehouseRepo.updateOccupancy(transfer.fromWarehouseId, -transfer.quantity),
      this.warehouseRepo.updateOccupancy(transfer.toWarehouseId, transfer.quantity)
    ]);

    // Clear cache
    await Promise.all([
      this.clearInventoryCache(transfer.productId, transfer.fromWarehouseId),
      this.clearInventoryCache(transfer.productId, transfer.toWarehouseId)
    ]);
  }

  /**
   * Get inventory report
   */
  async getInventoryReport(warehouseId?: string): Promise<InventoryReport> {
    const filters: InventoryFilterOptions = warehouseId ? { warehouseId } : {};
    const inventories = await this.inventoryRepo.search(filters);

    const report: InventoryReport = {
      warehouseId,
      totalProducts: new Set(inventories.map(inv => inv.productId)).size,
      totalQuantity: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      overstockItems: 0,
      expiringItems: 0,
      reportDate: Date.now()
    };

    for (const inventory of inventories) {
      report.totalQuantity += inventory.quantity;
      report.totalValue += inventory.quantity * inventory.unitCost;

      if (inventory.quantity === 0) {
        report.outOfStockItems++;
      } else if (inventory.quantity <= inventory.minimumStock) {
        report.lowStockItems++;
      } else if (inventory.quantity > inventory.maximumStock) {
        report.overstockItems++;
      }

      if (inventory.expiryDate) {
        const daysUntilExpiry = (new Date(inventory.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry <= 30) {
          report.expiringItems++;
        }
      }
    }

    return report;
  }

  /**
   * Search inventory with filters
   */
  async searchInventory(filters: InventoryFilterOptions): Promise<ProductInventory[]> {
    return this.inventoryRepo.search(filters);
  }

  /**
   * Check reorder requirements
   */
  async checkReorderRequirements(warehouseId?: string): Promise<ProductInventory[]> {
    const inventories = warehouseId 
      ? await this.inventoryRepo.findByWarehouseId(warehouseId)
      : await this.inventoryRepo.findAll();

    return inventories.filter(inv => inv.quantity <= inv.reorderPoint);
  }

  /**
   * Clear inventory cache
   */
  private async clearInventoryCache(productId: string, warehouseId: string): Promise<void> {
    const cacheKey = `${this.cachePrefix}${productId}:${warehouseId}`;
    await this.cache.delete(cacheKey);
  }

  /**
   * Initialize the module
   */
  protected async onInitialize(): Promise<{ success: boolean; data?: void; error?: Error }> {
    try {
      this.logger.info('Initializing InventoryService');
      await this.cache.initialize();
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
      this.logger.info('Destroying InventoryService');
      await this.cache.destroy();
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
      // Check if repositories are accessible
      await this.inventoryRepo.search({ minQuantity: 0 });
      return { success: true, data: true };
    } catch (error) {
      return { success: false, data: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
}