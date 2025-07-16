/**
 * @module @repo/inventory-tracking/entities/Warehouse
 * @description Warehouse entity implementation
 */

import { z } from 'zod';
import { generateId } from '@repo/utils';
import type { Warehouse } from '../types';

/**
 * Warehouse validation schema
 */
export const WarehouseSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(2).max(10),
  name: z.string().min(1).max(100),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  country: z.string().min(2).max(2), // ISO country code
  isActive: z.boolean(),
  capacity: z.number().positive(),
  currentOccupancy: z.number().min(0),
  metadata: z.record(z.any()).optional(),
  createdAt: z.number(),
  updatedAt: z.number()
});

/**
 * Warehouse entity class
 */
export class WarehouseEntity implements Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  country: string;
  isActive: boolean;
  capacity: number;
  currentOccupancy: number;
  metadata?: Record<string, any> | undefined;
  createdAt: number;
  updatedAt: number;

  constructor(data: Partial<Warehouse>) {
    
    this.id = data.id || generateId();
    this.code = data.code || '';
    this.name = data.name || '';
    this.address = data.address || '';
    this.city = data.city || '';
    this.country = data.country || '';
    this.isActive = data.isActive ?? true;
    this.capacity = data.capacity || 0;
    this.currentOccupancy = data.currentOccupancy || 0;
    this.metadata = data.metadata ?? undefined;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  /**
   * Validate warehouse data
   */
  validate(): boolean {
    try {
      WarehouseSchema.parse(this);
      return true;
    } catch (error) {
      console.error('Warehouse validation failed', error);
      return false;
    }
  }

  /**
   * Check if warehouse has capacity
   */
  hasCapacity(quantity: number): boolean {
    return this.currentOccupancy + quantity <= this.capacity;
  }

  /**
   * Get available capacity
   */
  getAvailableCapacity(): number {
    return Math.max(0, this.capacity - this.currentOccupancy);
  }

  /**
   * Get occupancy percentage
   */
  getOccupancyPercentage(): number {
    if (this.capacity === 0) return 0;
    return (this.currentOccupancy / this.capacity) * 100;
  }

  /**
   * Update occupancy
   */
  updateOccupancy(change: number): void {
    const newOccupancy = this.currentOccupancy + change;
    if (newOccupancy < 0) {
      throw new Error('Occupancy cannot be negative');
    }
    if (newOccupancy > this.capacity) {
      throw new Error('Occupancy exceeds capacity');
    }
    this.currentOccupancy = newOccupancy;
    this.updatedAt = Date.now();
  }

  /**
   * Convert to plain object
   */
  toJSON(): Warehouse {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      address: this.address,
      city: this.city,
      country: this.country,
      isActive: this.isActive,
      capacity: this.capacity,
      currentOccupancy: this.currentOccupancy,
      metadata: this.metadata ?? {},
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}