import { ModuleBase } from '@modules/core';
import { CacheManager } from '@modules/cache';
import { DatabaseManager } from '@modules/database';
import type { 
  ProductVariant, 
  PriceRule, 
  PriceCondition 
} from '../types';

export class PricingService extends ModuleBase {
  private cache: CacheManager;
  private db: DatabaseManager;

  constructor() {
    super('PricingService');
    this.cache = new CacheManager({ prefix: 'pricing' });
    this.db = DatabaseManager.getInstance();
  }

  async initialize(): Promise<void> {
    await super.initialize();
    await this.cache.initialize();
    this.logger.info('PricingService initialized');
  }

  async calculatePrice(
    variant: ProductVariant,
    quantity: number = 1,
    context: Record<string, any> = {}
  ): Promise<{
    basePrice: number;
    finalPrice: number;
    discount: number;
    appliedRules: PriceRule[];
  }> {
    try {
      const basePrice = variant.price * quantity;
      const rules = await this.getApplicableRules(variant, quantity, context);
      
      let finalPrice = basePrice;
      const appliedRules: PriceRule[] = [];

      // Sort rules by priority
      rules.sort((a, b) => b.priority - a.priority);

      for (const rule of rules) {
        if (this.evaluateConditions(rule.conditions, { variant, quantity, context })) {
          const discount = this.calculateDiscount(finalPrice, rule);
          finalPrice -= discount;
          appliedRules.push(rule);

          // Log pricing event
          this.emit('pricing:rule:applied', {
            variantId: variant.id,
            ruleId: rule.id,
            discount
          });
        }
      }

      return {
        basePrice,
        finalPrice: Math.max(0, finalPrice),
        discount: basePrice - finalPrice,
        appliedRules
      };
    } catch (error) {
      this.logger.error('Failed to calculate price', error);
      throw error;
    }
  }

  async createPriceRule(
    ruleData: Omit<PriceRule, 'id'>
  ): Promise<PriceRule> {
    try {
      const rule: PriceRule = {
        ...ruleData,
        id: this.generateId('rule')
      };

      await this.db.insert('price_rules', rule);
      await this.invalidatePriceRulesCache(rule.productId);

      this.emit('pricing:rule:created', { rule });
      return rule;
    } catch (error) {
      this.logger.error('Failed to create price rule', error);
      throw error;
    }
  }

  async updatePriceRule(
    ruleId: string,
    updates: Partial<Omit<PriceRule, 'id'>>
  ): Promise<PriceRule> {
    try {
      const existing = await this.db.findOne<PriceRule>('price_rules', { id: ruleId });
      if (!existing) {
        throw new Error('Price rule not found');
      }

      const updated = { ...existing, ...updates };
      await this.db.update('price_rules', { id: ruleId }, updated);
      await this.invalidatePriceRulesCache(existing.productId);

      this.emit('pricing:rule:updated', { rule: updated });
      return updated;
    } catch (error) {
      this.logger.error('Failed to update price rule', error);
      throw error;
    }
  }

  async deletePriceRule(ruleId: string): Promise<boolean> {
    try {
      const rule = await this.db.findOne<PriceRule>('price_rules', { id: ruleId });
      if (!rule) return false;

      await this.db.delete('price_rules', { id: ruleId });
      await this.invalidatePriceRulesCache(rule.productId);

      this.emit('pricing:rule:deleted', { ruleId });
      return true;
    } catch (error) {
      this.logger.error('Failed to delete price rule', error);
      throw error;
    }
  }

  async getBulkPricing(
    variantId: string
  ): Promise<Array<{ minQuantity: number; price: number }>> {
    try {
      const variant = await this.db.findOne<ProductVariant>('product_variants', { 
        id: variantId 
      });
      if (!variant) return [];

      const rules = await this.getProductRules(variant.productId);
      const bulkRules = rules
        .filter(r => r.type === 'bulk' && (!r.variantId || r.variantId === variantId))
        .sort((a, b) => {
          const aMin = this.getMinQuantityFromRule(a);
          const bMin = this.getMinQuantityFromRule(b);
          return aMin - bMin;
        });

      return bulkRules.map(rule => {
        const minQuantity = this.getMinQuantityFromRule(rule);
        const { finalPrice } = this.calculatePriceWithRule(variant.price, rule);
        
        return {
          minQuantity,
          price: finalPrice
        };
      });
    } catch (error) {
      this.logger.error('Failed to get bulk pricing', error);
      throw error;
    }
  }

  async applyDynamicPricing(
    productId: string,
    algorithm: 'competition' | 'demand' | 'inventory' | 'time',
    params: Record<string, any>
  ): Promise<void> {
    try {
      const variants = await this.db.find<ProductVariant>('product_variants', { 
        productId 
      });

      for (const variant of variants) {
        const newPrice = await this.calculateDynamicPrice(variant, algorithm, params);
        
        if (newPrice !== variant.price) {
          await this.db.update(
            'product_variants',
            { id: variant.id },
            { price: newPrice, updatedAt: new Date() }
          );

          this.emit('pricing:dynamic:applied', {
            variantId: variant.id,
            oldPrice: variant.price,
            newPrice,
            algorithm
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to apply dynamic pricing', error);
      throw error;
    }
  }

  private async getApplicableRules(
    variant: ProductVariant,
    quantity: number,
    context: Record<string, any>
  ): Promise<PriceRule[]> {
    const rules = await this.getProductRules(variant.productId);
    const now = new Date();

    return rules.filter(rule => {
      // Check if rule is active
      if (!rule.isActive) return false;

      // Check date range
      if (rule.startDate && rule.startDate > now) return false;
      if (rule.endDate && rule.endDate < now) return false;

      // Check variant specificity
      if (rule.variantId && rule.variantId !== variant.id) return false;

      return true;
    });
  }

  private async getProductRules(productId: string): Promise<PriceRule[]> {
    const cacheKey = `price-rules:${productId}`;
    const cached = await this.cache.get<PriceRule[]>(cacheKey);
    if (cached) return cached;

    const rules = await this.db.find<PriceRule>('price_rules', { productId });
    await this.cache.set(cacheKey, rules, 300); // 5 minutes

    return rules;
  }

  private evaluateConditions(
    conditions: PriceCondition[],
    data: { variant: ProductVariant; quantity: number; context: Record<string, any> }
  ): boolean {
    return conditions.every(condition => {
      const value = this.getFieldValue(condition.field, data);
      return this.evaluateCondition(value, condition.operator, condition.value);
    });
  }

  private getFieldValue(
    field: string,
    data: { variant: ProductVariant; quantity: number; context: Record<string, any> }
  ): any {
    const parts = field.split('.');
    let value: any = data;

    for (const part of parts) {
      value = value?.[part];
    }

    return value;
  }

  private evaluateCondition(value: any, operator: string, target: any): boolean {
    switch (operator) {
      case 'eq': return value === target;
      case 'gt': return value > target;
      case 'gte': return value >= target;
      case 'lt': return value < target;
      case 'lte': return value <= target;
      case 'between': 
        return value >= target[0] && value <= target[1];
      case 'in': 
        return Array.isArray(target) && target.includes(value);
      default: 
        return false;
    }
  }

  private calculateDiscount(price: number, rule: PriceRule): number {
    if (rule.modifierType === 'percentage') {
      return price * (rule.priceModifier / 100);
    } else {
      return Math.min(price, rule.priceModifier);
    }
  }

  private calculatePriceWithRule(basePrice: number, rule: PriceRule): { finalPrice: number } {
    const discount = this.calculateDiscount(basePrice, rule);
    return { finalPrice: Math.max(0, basePrice - discount) };
  }

  private getMinQuantityFromRule(rule: PriceRule): number {
    const quantityCondition = rule.conditions.find(c => c.field === 'quantity');
    if (!quantityCondition) return 1;

    if (quantityCondition.operator === 'gte') {
      return quantityCondition.value;
    } else if (quantityCondition.operator === 'gt') {
      return quantityCondition.value + 1;
    }

    return 1;
  }

  private async calculateDynamicPrice(
    variant: ProductVariant,
    algorithm: string,
    params: Record<string, any>
  ): Promise<number> {
    switch (algorithm) {
      case 'competition':
        return this.calculateCompetitionBasedPrice(variant, params);
      case 'demand':
        return this.calculateDemandBasedPrice(variant, params);
      case 'inventory':
        return this.calculateInventoryBasedPrice(variant, params);
      case 'time':
        return this.calculateTimeBasedPrice(variant, params);
      default:
        return variant.price;
    }
  }

  private calculateCompetitionBasedPrice(
    variant: ProductVariant,
    params: { competitorPrices: number[]; strategy: 'match' | 'beat' | 'premium' }
  ): number {
    const avgCompetitorPrice = params.competitorPrices.reduce((a, b) => a + b, 0) / 
                              params.competitorPrices.length;

    switch (params.strategy) {
      case 'match':
        return avgCompetitorPrice;
      case 'beat':
        return avgCompetitorPrice * 0.95; // 5% lower
      case 'premium':
        return avgCompetitorPrice * 1.1; // 10% higher
      default:
        return variant.price;
    }
  }

  private calculateDemandBasedPrice(
    variant: ProductVariant,
    params: { demandScore: number; elasticity: number }
  ): number {
    // High demand = higher price
    const priceMultiplier = 1 + (params.demandScore * params.elasticity);
    return variant.price * priceMultiplier;
  }

  private calculateInventoryBasedPrice(
    variant: ProductVariant,
    params: { stockThreshold: number; discountRate: number }
  ): number {
    if (variant.stock > params.stockThreshold) {
      // Excess inventory - apply discount
      return variant.price * (1 - params.discountRate);
    }
    return variant.price;
  }

  private calculateTimeBasedPrice(
    variant: ProductVariant,
    params: { peakHours: number[]; peakMultiplier: number }
  ): number {
    const currentHour = new Date().getHours();
    if (params.peakHours.includes(currentHour)) {
      return variant.price * params.peakMultiplier;
    }
    return variant.price;
  }

  private async invalidatePriceRulesCache(productId: string): Promise<void> {
    await this.cache.delete(`price-rules:${productId}`);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}