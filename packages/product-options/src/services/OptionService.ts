import { ModuleBase } from '@modules/core';
import { CacheManager } from '@modules/cache';
import { DatabaseManager } from '@modules/database';
import type { 
  ProductOption, 
  OptionValue, 
  OptionValidationResult,
  OptionGroup 
} from '../types';
import { ProductOptionEntity } from '../entities/ProductOption';

export class OptionService extends ModuleBase {
  private cache: CacheManager;
  private db: DatabaseManager;

  constructor() {
    super('OptionService');
    this.cache = new CacheManager({ prefix: 'product-options' });
    this.db = DatabaseManager.getInstance();
  }

  async initialize(): Promise<void> {
    await super.initialize();
    await this.cache.initialize();
    this.logger.info('OptionService initialized');
  }

  async createOption(
    productId: string,
    optionData: Omit<ProductOption, 'id' | 'productId' | 'createdAt' | 'updatedAt'>
  ): Promise<ProductOption> {
    try {
      const option = new ProductOptionEntity({
        ...optionData,
        id: this.generateId('opt'),
        productId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const validation = await this.validateOption(option);
      if (!validation.isValid) {
        throw new Error(`Invalid option: ${validation.errors.join(', ')}`);
      }

      await this.db.insert('product_options', option.toJSON());
      await this.cache.set(`option:${option.id}`, option.toJSON());
      await this.invalidateProductOptionsCache(productId);

      this.emit('option:created', { option });
      return option.toJSON();
    } catch (error) {
      this.logger.error('Failed to create option', error);
      throw error;
    }
  }

  async getOption(optionId: string): Promise<ProductOption | null> {
    try {
      const cached = await this.cache.get<ProductOption>(`option:${optionId}`);
      if (cached) return cached;

      const option = await this.db.findOne<ProductOption>('product_options', { id: optionId });
      if (option) {
        await this.cache.set(`option:${optionId}`, option);
      }

      return option;
    } catch (error) {
      this.logger.error('Failed to get option', error);
      throw error;
    }
  }

  async getProductOptions(productId: string): Promise<ProductOption[]> {
    try {
      const cacheKey = `product-options:${productId}`;
      const cached = await this.cache.get<ProductOption[]>(cacheKey);
      if (cached) return cached;

      const options = await this.db.find<ProductOption>('product_options', { 
        productId 
      }, {
        orderBy: [{ field: 'position', direction: 'asc' }]
      });

      await this.cache.set(cacheKey, options, 300); // 5 minutes
      return options;
    } catch (error) {
      this.logger.error('Failed to get product options', error);
      throw error;
    }
  }

  async updateOption(
    optionId: string,
    updates: Partial<Omit<ProductOption, 'id' | 'productId' | 'createdAt'>>
  ): Promise<ProductOption> {
    try {
      const existing = await this.getOption(optionId);
      if (!existing) {
        throw new Error('Option not found');
      }

      const option = new ProductOptionEntity(existing);
      Object.assign(option, updates, { updatedAt: new Date() });

      const validation = await this.validateOption(option);
      if (!validation.isValid) {
        throw new Error(`Invalid option: ${validation.errors.join(', ')}`);
      }

      await this.db.update('product_options', { id: optionId }, option.toJSON());
      await this.cache.delete(`option:${optionId}`);
      await this.invalidateProductOptionsCache(option.productId);

      this.emit('option:updated', { option: option.toJSON() });
      return option.toJSON();
    } catch (error) {
      this.logger.error('Failed to update option', error);
      throw error;
    }
  }

  async deleteOption(optionId: string): Promise<boolean> {
    try {
      const option = await this.getOption(optionId);
      if (!option) return false;

      // Check if any variants use this option
      const variantsCount = await this.db.count('product_variants', {
        'optionCombination.optionId': optionId
      });

      if (variantsCount > 0) {
        throw new Error('Cannot delete option: variants exist with this option');
      }

      await this.db.delete('product_options', { id: optionId });
      await this.cache.delete(`option:${optionId}`);
      await this.invalidateProductOptionsCache(option.productId);

      this.emit('option:deleted', { optionId, productId: option.productId });
      return true;
    } catch (error) {
      this.logger.error('Failed to delete option', error);
      throw error;
    }
  }

  async addOptionValue(
    optionId: string,
    valueData: Omit<OptionValue, 'id' | 'optionId'>
  ): Promise<OptionValue> {
    try {
      const option = await this.getOption(optionId);
      if (!option) {
        throw new Error('Option not found');
      }

      const optionEntity = new ProductOptionEntity(option);
      const newValue = optionEntity.addValue(valueData);

      await this.updateOption(optionId, { 
        values: optionEntity.values,
        updatedAt: optionEntity.updatedAt
      });

      this.emit('option:value:added', { optionId, value: newValue });
      return newValue;
    } catch (error) {
      this.logger.error('Failed to add option value', error);
      throw error;
    }
  }

  async removeOptionValue(optionId: string, valueId: string): Promise<boolean> {
    try {
      const option = await this.getOption(optionId);
      if (!option) {
        throw new Error('Option not found');
      }

      // Check if any variants use this value
      const variantsCount = await this.db.count('product_variants', {
        'optionCombination.valueId': valueId
      });

      if (variantsCount > 0) {
        throw new Error('Cannot delete value: variants exist with this value');
      }

      const optionEntity = new ProductOptionEntity(option);
      const removed = optionEntity.removeValue(valueId);

      if (removed) {
        await this.updateOption(optionId, { 
          values: optionEntity.values,
          updatedAt: optionEntity.updatedAt
        });
        this.emit('option:value:removed', { optionId, valueId });
      }

      return removed;
    } catch (error) {
      this.logger.error('Failed to remove option value', error);
      throw error;
    }
  }

  async createOptionGroup(
    productId: string,
    groupData: Omit<OptionGroup, 'id'>
  ): Promise<OptionGroup> {
    try {
      const group: OptionGroup = {
        ...groupData,
        id: this.generateId('optgrp')
      };

      await this.db.insert('option_groups', group);
      await this.cache.set(`option-group:${group.id}`, group);

      this.emit('option:group:created', { productId, group });
      return group;
    } catch (error) {
      this.logger.error('Failed to create option group', error);
      throw error;
    }
  }

  async validateOption(option: ProductOption): Promise<OptionValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate option name uniqueness within product
    const existingOptions = await this.getProductOptions(option.productId);
    const duplicate = existingOptions.find(
      o => o.id !== option.id && o.name === option.name
    );
    if (duplicate) {
      errors.push(`Option name "${option.name}" already exists for this product`);
    }

    // Validate values
    if (option.values.length === 0) {
      errors.push('Option must have at least one value');
    }

    // Check for duplicate values
    const valueMap = new Set<string>();
    for (const value of option.values) {
      if (valueMap.has(value.value)) {
        errors.push(`Duplicate value "${value.value}" in option`);
      }
      valueMap.add(value.value);
    }

    // Validate price modifiers
    for (const value of option.values) {
      if (value.priceModifierType === 'percentage' && Math.abs(value.priceModifier) > 100) {
        warnings.push(`Price modifier ${value.priceModifier}% seems unusually high`);
      }
    }

    // Validate default value
    const defaultValues = option.values.filter(v => v.isDefault);
    if (defaultValues.length > 1) {
      errors.push('Only one value can be set as default');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async invalidateProductOptionsCache(productId: string): Promise<void> {
    await this.cache.delete(`product-options:${productId}`);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}