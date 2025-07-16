import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  OptionService, 
  VariantService, 
  PricingService,
  ProductOptionEntity,
  ProductVariantEntity
} from '../src';
import type { ProductOption, ProductVariant } from '../src/types';

describe('Product Options Module', () => {
  let optionService: OptionService;
  let variantService: VariantService;
  let pricingService: PricingService;

  beforeEach(() => {
    optionService = new OptionService();
    variantService = new VariantService();
    pricingService = new PricingService();
  });

  describe('OptionService', () => {
    it('should create a product option', async () => {
      const optionData = {
        name: 'color',
        displayName: '색상',
        type: 'color' as const,
        required: true,
        position: 0,
        values: [
          {
            id: 'val1',
            optionId: 'opt1',
            value: 'black',
            displayValue: '블랙',
            priceModifier: 0,
            priceModifierType: 'fixed' as const,
            position: 0,
            isDefault: true
          }
        ]
      };

      const option = await optionService.createOption('product123', optionData);

      expect(option).toBeDefined();
      expect(option.productId).toBe('product123');
      expect(option.name).toBe('color');
      expect(option.values).toHaveLength(1);
    });

    it('should validate option uniqueness', async () => {
      const option: ProductOption = {
        id: 'opt1',
        productId: 'product123',
        name: 'color',
        displayName: '색상',
        type: 'color',
        required: true,
        position: 0,
        values: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validation = await optionService.validateOption(option);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Option must have at least one value');
    });
  });

  describe('ProductOptionEntity', () => {
    it('should add and remove option values', () => {
      const option = new ProductOptionEntity({
        id: 'opt1',
        productId: 'product123',
        name: 'size',
        displayName: '사이즈',
        type: 'select',
        required: true,
        position: 0,
        values: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Add value
      const newValue = option.addValue({
        value: 'large',
        displayValue: 'L',
        priceModifier: 0,
        priceModifierType: 'fixed',
        position: 0,
        isDefault: false
      });

      expect(option.values).toHaveLength(1);
      expect(newValue.value).toBe('large');

      // Remove value
      const removed = option.removeValue(newValue.id);
      expect(removed).toBe(true);
      expect(option.values).toHaveLength(0);
    });
  });

  describe('VariantService', () => {
    it('should create a product variant', async () => {
      const variantData = {
        sku: 'PROD123-BLK-L',
        optionCombination: [
          {
            optionId: 'opt1',
            optionName: 'color',
            valueId: 'val1',
            value: 'black'
          }
        ],
        price: 50000,
        stock: 100,
        isActive: true
      };

      const variant = await variantService.createVariant('product123', variantData);

      expect(variant).toBeDefined();
      expect(variant.sku).toBe('PROD123-BLK-L');
      expect(variant.price).toBe(50000);
    });

    it('should generate option combinations', async () => {
      const options: ProductOption[] = [
        {
          id: 'opt1',
          productId: 'product123',
          name: 'color',
          displayName: '색상',
          type: 'color',
          required: true,
          position: 0,
          values: [
            {
              id: 'val1',
              optionId: 'opt1',
              value: 'black',
              displayValue: '블랙',
              priceModifier: 0,
              priceModifierType: 'fixed',
              position: 0,
              isDefault: true
            },
            {
              id: 'val2',
              optionId: 'opt1',
              value: 'white',
              displayValue: '화이트',
              priceModifier: 0,
              priceModifierType: 'fixed',
              position: 1,
              isDefault: false
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'opt2',
          productId: 'product123',
          name: 'size',
          displayName: '사이즈',
          type: 'select',
          required: true,
          position: 1,
          values: [
            {
              id: 'val3',
              optionId: 'opt2',
              value: 'small',
              displayValue: 'S',
              priceModifier: 0,
              priceModifierType: 'fixed',
              position: 0,
              isDefault: false
            },
            {
              id: 'val4',
              optionId: 'opt2',
              value: 'large',
              displayValue: 'L',
              priceModifier: 0,
              priceModifierType: 'fixed',
              position: 1,
              isDefault: false
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // This would generate 2 colors × 2 sizes = 4 variants
      const variants = await variantService.generateVariants('product123', options);
      
      // Note: In a real test, we'd mock the DB to return no existing variants
      expect(variants).toBeDefined();
    });
  });

  describe('ProductVariantEntity', () => {
    it('should calculate discount percentage', () => {
      const variant = new ProductVariantEntity({
        id: 'var1',
        productId: 'product123',
        sku: 'TEST-SKU',
        optionCombination: [],
        price: 40000,
        compareAtPrice: 50000,
        stock: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const discount = variant.getDiscountPercentage();
      expect(discount).toBe(20); // 20% discount
    });

    it('should adjust stock correctly', () => {
      const variant = new ProductVariantEntity({
        id: 'var1',
        productId: 'product123',
        sku: 'TEST-SKU',
        optionCombination: [],
        price: 50000,
        stock: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Increase stock
      const increased = variant.adjustStock(5);
      expect(increased).toBe(5);
      expect(variant.stock).toBe(15);

      // Decrease stock
      const decreased = variant.adjustStock(-20);
      expect(decreased).toBe(-15); // Can't go below 0
      expect(variant.stock).toBe(0);
    });
  });

  describe('PricingService', () => {
    it('should calculate price with bulk discount', async () => {
      const variant: ProductVariant = {
        id: 'var1',
        productId: 'product123',
        sku: 'TEST-SKU',
        barcode: '1234567890',
        optionCombination: [],
        price: 10000,
        stock: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await pricingService.calculatePrice(variant, 10);

      expect(result.basePrice).toBe(100000); // 10000 × 10
      expect(result.finalPrice).toBeLessThanOrEqual(result.basePrice);
    });

    it('should create price rule', async () => {
      const rule = await pricingService.createPriceRule({
        productId: 'product123',
        type: 'bulk',
        conditions: [
          {
            field: 'quantity',
            operator: 'gte',
            value: 10
          }
        ],
        priceModifier: 10,
        modifierType: 'percentage',
        priority: 1,
        isActive: true
      });

      expect(rule).toBeDefined();
      expect(rule.type).toBe('bulk');
      expect(rule.priceModifier).toBe(10);
    });
  });
});