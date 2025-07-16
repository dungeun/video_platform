/**
 * @module @company/inventory-tracking/services/WarehouseService
 * @description Warehouse management service
 */

import { ModuleBase } from '@company/core';
import { CacheManager } from '@company/cache';
import type { Warehouse } from '../types';
import type { IWarehouseRepository } from '../repositories/interfaces';

export interface WarehouseCreateRequest {
  code: string;
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
  metadata?: Record<string, any>;
}

export interface WarehouseUpdateRequest {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  capacity?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export class WarehouseService extends ModuleBase {
  private cache: CacheManager;
  private cachePrefix = 'warehouse:';
  private cacheTTL = 600; // 10 minutes

  constructor(private warehouseRepo: IWarehouseRepository) {
    super({
      name: 'WarehouseService',
      version: '1.0.0', 
      description: 'Warehouse management service'
    });
    this.cache = new CacheManager({ defaultTTL: this.cacheTTL });
  }

  /**
   * Create a new warehouse
   */
  async createWarehouse(request: WarehouseCreateRequest): Promise<Warehouse> {
    // Check if code already exists
    const existing = await this.warehouseRepo.findByCode(request.code);
    if (existing) {
      throw new Error(`Warehouse with code ${request.code} already exists`);
    }

    const warehouse = await this.warehouseRepo.create({
      ...request,
      isActive: true,
      currentOccupancy: 0
    });

    this.logger.info('Warehouse created', {
      warehouseId: warehouse.id,
      code: warehouse.code,
      name: warehouse.name
    });

    return warehouse;
  }

  /**
   * Get warehouse by ID
   */
  async getWarehouse(id: string): Promise<Warehouse | null> {
    const cacheKey = `${this.cachePrefix}${id}`;
    
    const cached = await this.cache.get<Warehouse>(cacheKey);
    if (cached) return cached;

    const warehouse = await this.warehouseRepo.findById(id);
    
    if (warehouse) {
      await this.cache.set(cacheKey, warehouse);
    }

    return warehouse;
  }

  /**
   * Get warehouse by code
   */
  async getWarehouseByCode(code: string): Promise<Warehouse | null> {
    const cacheKey = `${this.cachePrefix}code:${code}`;
    
    const cached = await this.cache.get<Warehouse>(cacheKey);
    if (cached) return cached;

    const warehouse = await this.warehouseRepo.findByCode(code);
    
    if (warehouse) {
      await this.cache.set(cacheKey, warehouse);
    }

    return warehouse;
  }

  /**
   * Update warehouse
   */
  async updateWarehouse(id: string, request: WarehouseUpdateRequest): Promise<Warehouse> {
    const warehouse = await this.getWarehouse(id);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // If capacity is being reduced, check current occupancy
    if (request.capacity !== undefined && request.capacity < warehouse.currentOccupancy) {
      throw new Error('Cannot reduce capacity below current occupancy');
    }

    const updated = await this.warehouseRepo.update(id, request);

    // Clear cache
    await this.clearWarehouseCache(id);
    if (warehouse.code) {
      await this.clearWarehouseCacheByCode(warehouse.code);
    }

    this.logger.info('Warehouse updated', {
      warehouseId: id,
      changes: Object.keys(request)
    });

    return updated;
  }

  /**
   * Deactivate warehouse
   */
  async deactivateWarehouse(id: string): Promise<Warehouse> {
    const warehouse = await this.getWarehouse(id);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    if (warehouse.currentOccupancy > 0) {
      throw new Error('Cannot deactivate warehouse with inventory');
    }

    const updated = await this.updateWarehouse(id, { isActive: false });

    this.logger.warn('Warehouse deactivated', {
      warehouseId: id,
      code: warehouse.code
    });

    return updated;
  }

  /**
   * Get all active warehouses
   */
  async getActiveWarehouses(): Promise<Warehouse[]> {
    const cacheKey = `${this.cachePrefix}active:all`;
    
    const cached = await this.cache.get<Warehouse[]>(cacheKey);
    if (cached) return cached;

    const warehouses = await this.warehouseRepo.findActive();
    
    await this.cache.set(cacheKey, warehouses, 300); // 5 minutes

    return warehouses;
  }

  /**
   * Get warehouses by country
   */
  async getWarehousesByCountry(country: string): Promise<Warehouse[]> {
    const cacheKey = `${this.cachePrefix}country:${country}`;
    
    const cached = await this.cache.get<Warehouse[]>(cacheKey);
    if (cached) return cached;

    const warehouses = await this.warehouseRepo.findByCountry(country);
    
    await this.cache.set(cacheKey, warehouses);

    return warehouses;
  }

  /**
   * Check warehouse capacity
   */
  async checkCapacity(id: string, requiredSpace: number): Promise<{
    hasCapacity: boolean;
    availableCapacity: number;
    requiredSpace: number;
    percentageUsed: number;
  }> {
    const warehouse = await this.getWarehouse(id);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    const availableCapacity = warehouse.capacity - warehouse.currentOccupancy;
    const hasCapacity = availableCapacity >= requiredSpace;
    const percentageUsed = (warehouse.currentOccupancy / warehouse.capacity) * 100;

    return {
      hasCapacity,
      availableCapacity,
      requiredSpace,
      percentageUsed
    };
  }

  /**
   * Update warehouse occupancy
   */
  async updateOccupancy(id: string, change: number): Promise<Warehouse> {
    const updated = await this.warehouseRepo.updateOccupancy(id, change);
    
    // Clear cache
    await this.clearWarehouseCache(id);

    this.logger.info('Warehouse occupancy updated', {
      warehouseId: id,
      change,
      newOccupancy: updated.currentOccupancy
    });

    return updated;
  }

  /**
   * Get warehouse statistics
   */
  async getWarehouseStats(id: string): Promise<{
    warehouse: Warehouse;
    utilizationRate: number;
    availableCapacity: number;
    isNearCapacity: boolean;
  }> {
    const warehouse = await this.getWarehouse(id);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    const utilizationRate = (warehouse.currentOccupancy / warehouse.capacity) * 100;
    const availableCapacity = warehouse.capacity - warehouse.currentOccupancy;
    const isNearCapacity = utilizationRate >= 80;

    return {
      warehouse,
      utilizationRate,
      availableCapacity,
      isNearCapacity
    };
  }

  /**
   * Clear warehouse cache
   */
  private async clearWarehouseCache(id: string): Promise<void> {
    await this.cache.delete(`${this.cachePrefix}${id}`);
    await this.cache.delete(`${this.cachePrefix}active:all`);
  }

  /**
   * Clear warehouse cache by code
   */
  private async clearWarehouseCacheByCode(code: string): Promise<void> {
    await this.cache.delete(`${this.cachePrefix}code:${code}`);
  }

  /**
   * Initialize the module
   */
  protected async onInitialize(): Promise<{ success: boolean; data?: void; error?: Error }> {
    try {
      this.logger.info('Initializing WarehouseService');
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
      this.logger.info('Destroying WarehouseService');
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
      await this.warehouseRepo.findActive();
      return { success: true, data: true };
    } catch (error) {
      return { success: false, data: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
}