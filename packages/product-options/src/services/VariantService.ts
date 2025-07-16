import { ModuleBase } from '@modules/core';
import { CacheManager } from '@modules/cache';
import { DatabaseManager } from '@modules/database';
import type { 
  ProductVariant, 
  VariantSearchParams,
  BulkVariantUpdate,
  VariantMatrix,
  ProductOption,
  OptionCombination
} from '../types';
import { ProductVariantEntity } from '../entities/ProductVariant';

export class VariantService extends ModuleBase {
  private cache: CacheManager;
  private db: DatabaseManager;

  constructor() {
    super('VariantService');
    this.cache = new CacheManager({ prefix: 'product-variants' });
    this.db = DatabaseManager.getInstance();
  }

  async initialize(): Promise<void> {
    await super.initialize();
    await this.cache.initialize();
    this.logger.info('VariantService initialized');
  }

  async createVariant(
    productId: string,
    variantData: Omit<ProductVariant, 'id' | 'productId' | 'createdAt' | 'updatedAt'>
  ): Promise<ProductVariant> {
    try {
      // Check for duplicate SKU
      const existingBySku = await this.findVariantBySku(variantData.sku);
      if (existingBySku) {
        throw new Error(`SKU "${variantData.sku}" already exists`);
      }

      // Check for duplicate option combination
      const existingByOptions = await this.findVariantByOptions(
        productId,
        variantData.optionCombination
      );
      if (existingByOptions) {
        throw new Error('Variant with this option combination already exists');
      }

      const variant = new ProductVariantEntity({
        ...variantData,
        id: this.generateId('var'),
        productId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await this.db.insert('product_variants', variant.toJSON());
      await this.cache.set(`variant:${variant.id}`, variant.toJSON());
      await this.invalidateProductVariantsCache(productId);

      this.emit('variant:created', { variant: variant.toJSON() });
      return variant.toJSON();
    } catch (error) {
      this.logger.error('Failed to create variant', error);
      throw error;
    }
  }

  async getVariant(variantId: string): Promise<ProductVariant | null> {
    try {
      const cached = await this.cache.get<ProductVariant>(`variant:${variantId}`);
      if (cached) return cached;

      const variant = await this.db.findOne<ProductVariant>('product_variants', { 
        id: variantId 
      });
      
      if (variant) {
        await this.cache.set(`variant:${variantId}`, variant);
      }

      return variant;
    } catch (error) {
      this.logger.error('Failed to get variant', error);
      throw error;
    }
  }

  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    try {
      const cacheKey = `product-variants:${productId}`;
      const cached = await this.cache.get<ProductVariant[]>(cacheKey);
      if (cached) return cached;

      const variants = await this.db.find<ProductVariant>('product_variants', { 
        productId 
      });

      await this.cache.set(cacheKey, variants, 300); // 5 minutes
      return variants;
    } catch (error) {
      this.logger.error('Failed to get product variants', error);
      throw error;
    }
  }

  async updateVariant(
    variantId: string,
    updates: Partial<Omit<ProductVariant, 'id' | 'productId' | 'createdAt'>>
  ): Promise<ProductVariant> {
    try {
      const existing = await this.getVariant(variantId);
      if (!existing) {
        throw new Error('Variant not found');
      }

      // Check SKU uniqueness if updating
      if (updates.sku && updates.sku !== existing.sku) {
        const duplicateSku = await this.findVariantBySku(updates.sku);
        if (duplicateSku) {
          throw new Error(`SKU "${updates.sku}" already exists`);
        }
      }

      const variant = new ProductVariantEntity(existing);
      Object.assign(variant, updates, { updatedAt: new Date() });

      await this.db.update('product_variants', { id: variantId }, variant.toJSON());
      await this.cache.delete(`variant:${variantId}`);
      await this.invalidateProductVariantsCache(variant.productId);

      this.emit('variant:updated', { variant: variant.toJSON() });
      return variant.toJSON();
    } catch (error) {
      this.logger.error('Failed to update variant', error);
      throw error;
    }
  }

  async bulkUpdateVariants(update: BulkVariantUpdate): Promise<ProductVariant[]> {
    try {
      const updatedVariants: ProductVariant[] = [];

      for (const variantId of update.variantIds) {
        const updated = await this.updateVariant(variantId, update.updates);
        updatedVariants.push(updated);
      }

      this.emit('variants:bulk:updated', { 
        count: updatedVariants.length,
        updates: update.updates
      });

      return updatedVariants;
    } catch (error) {
      this.logger.error('Failed to bulk update variants', error);
      throw error;
    }
  }

  async deleteVariant(variantId: string): Promise<boolean> {
    try {
      const variant = await this.getVariant(variantId);
      if (!variant) return false;

      // Check if variant has orders
      const ordersCount = await this.db.count('order_items', { variantId });
      if (ordersCount > 0) {
        throw new Error('Cannot delete variant: orders exist');
      }

      await this.db.delete('product_variants', { id: variantId });
      await this.cache.delete(`variant:${variantId}`);
      await this.invalidateProductVariantsCache(variant.productId);

      this.emit('variant:deleted', { variantId, productId: variant.productId });
      return true;
    } catch (error) {
      this.logger.error('Failed to delete variant', error);
      throw error;
    }
  }

  async searchVariants(params: VariantSearchParams): Promise<ProductVariant[]> {
    try {
      const query: any = {};

      if (params.productId) query.productId = params.productId;
      if (params.sku) query.sku = params.sku;
      if (params.barcode) query.barcode = params.barcode;
      if (params.isActive !== undefined) query.isActive = params.isActive;

      if (params.priceRange) {
        query.price = {
          $gte: params.priceRange.min,
          $lte: params.priceRange.max
        };
      }

      if (params.stockRange) {
        query.stock = {
          $gte: params.stockRange.min,
          $lte: params.stockRange.max
        };
      }

      const variants = await this.db.find<ProductVariant>('product_variants', query);

      // Filter by option values if specified
      if (params.optionValues) {
        return variants.filter(variant => {
          const variantEntity = new ProductVariantEntity(variant);
          return variantEntity.matchesOptions(params.optionValues!);
        });
      }

      return variants;
    } catch (error) {
      this.logger.error('Failed to search variants', error);
      throw error;
    }
  }

  async generateVariants(
    productId: string,
    options: ProductOption[]
  ): Promise<ProductVariant[]> {
    try {
      const combinations = this.generateOptionCombinations(options);
      const generatedVariants: ProductVariant[] = [];

      for (const combination of combinations) {
        const sku = this.generateSku(productId, combination);
        
        // Skip if variant already exists
        const existing = await this.findVariantByOptions(productId, combination);
        if (existing) continue;

        const variant = await this.createVariant(productId, {
          sku,
          optionCombination: combination,
          price: 0, // Default price, should be updated
          stock: 0,
          isActive: false // Inactive by default
        });

        generatedVariants.push(variant);
      }

      this.emit('variants:generated', { 
        productId, 
        count: generatedVariants.length 
      });

      return generatedVariants;
    } catch (error) {
      this.logger.error('Failed to generate variants', error);
      throw error;
    }
  }

  async getVariantMatrix(productId: string): Promise<VariantMatrix> {
    try {
      const [options, variants] = await Promise.all([
        this.db.find<ProductOption>('product_options', { productId }),
        this.getProductVariants(productId)
      ]);

      const totalCombinations = options.reduce(
        (total, option) => total * option.values.length,
        1
      );

      const activeCombinations = variants.filter(v => v.isActive).length;

      return {
        productId,
        options,
        variants,
        totalCombinations,
        activeCombinations
      };
    } catch (error) {
      this.logger.error('Failed to get variant matrix', error);
      throw error;
    }
  }

  async updateVariantStock(
    variantId: string,
    quantity: number,
    operation: 'set' | 'adjust' = 'set'
  ): Promise<ProductVariant> {
    try {
      const variant = await this.getVariant(variantId);
      if (!variant) {
        throw new Error('Variant not found');
      }

      const variantEntity = new ProductVariantEntity(variant);
      
      if (operation === 'set') {
        variantEntity.updateStock(quantity);
      } else {
        variantEntity.adjustStock(quantity);
      }

      const updated = await this.updateVariant(variantId, {
        stock: variantEntity.stock,
        updatedAt: variantEntity.updatedAt
      });

      this.emit('variant:stock:updated', { 
        variantId,
        previousStock: variant.stock,
        newStock: updated.stock,
        operation
      });

      return updated;
    } catch (error) {
      this.logger.error('Failed to update variant stock', error);
      throw error;
    }
  }

  private async findVariantBySku(sku: string): Promise<ProductVariant | null> {
    return await this.db.findOne<ProductVariant>('product_variants', { sku });
  }

  private async findVariantByOptions(
    productId: string,
    optionCombination: OptionCombination[]
  ): Promise<ProductVariant | null> {
    const variants = await this.getProductVariants(productId);
    
    return variants.find(variant => {
      if (variant.optionCombination.length !== optionCombination.length) {
        return false;
      }

      return optionCombination.every(combo => {
        return variant.optionCombination.some(
          vc => vc.optionId === combo.optionId && vc.valueId === combo.valueId
        );
      });
    }) || null;
  }

  private generateOptionCombinations(options: ProductOption[]): OptionCombination[][] {
    if (options.length === 0) return [];

    const combinations: OptionCombination[][] = [];

    const generate = (
      index: number,
      current: OptionCombination[]
    ): void => {
      if (index === options.length) {
        combinations.push([...current]);
        return;
      }

      const option = options[index];
      for (const value of option.values) {
        current.push({
          optionId: option.id,
          optionName: option.name,
          valueId: value.id,
          value: value.value
        });
        generate(index + 1, current);
        current.pop();
      }
    };

    generate(0, []);
    return combinations;
  }

  private generateSku(productId: string, combination: OptionCombination[]): string {
    const valueStr = combination
      .map(c => c.value.substring(0, 3).toUpperCase())
      .join('-');
    return `${productId}-${valueStr}-${Date.now()}`;
  }

  private async invalidateProductVariantsCache(productId: string): Promise<void> {
    await this.cache.delete(`product-variants:${productId}`);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}