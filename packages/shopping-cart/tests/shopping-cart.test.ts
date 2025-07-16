import { describe, it, expect, beforeEach } from 'vitest';
import { CartModel, CartItemModel } from '../src/models';
import { CartService } from '../src/services';
import { CartValidator } from '../src/validators';

describe('Shopping Cart Module', () => {
  describe('CartModel', () => {
    let cart: CartModel;

    beforeEach(() => {
      cart = CartModel.createEmpty();
    });

    it('should create empty cart', () => {
      expect(cart.items).toHaveLength(0);
      expect(cart.subtotal).toBe(0);
      expect(cart.total).toBe(0);
    });

    it('should add item to cart', () => {
      const item = new CartItemModel({
        productId: 'prod-1',
        name: 'Test Product',
        price: 10,
        quantity: 2,
      });

      cart.addItem(item.toJSON());
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
    });

    it('should merge items with same product/variant', () => {
      const item1 = new CartItemModel({
        productId: 'prod-1',
        name: 'Test Product',
        price: 10,
        quantity: 2,
      });

      const item2 = new CartItemModel({
        productId: 'prod-1',
        name: 'Test Product',
        price: 10,
        quantity: 3,
      });

      cart.addItem(item1.toJSON());
      cart.addItem(item2.toJSON());

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5);
    });

    it('should calculate totals correctly', () => {
      const item1 = new CartItemModel({
        productId: 'prod-1',
        name: 'Product 1',
        price: 10,
        quantity: 2,
      });

      const item2 = new CartItemModel({
        productId: 'prod-2',
        name: 'Product 2',
        price: 15,
        quantity: 1,
      });

      cart.addItem(item1.toJSON());
      cart.addItem(item2.toJSON());

      const totals = cart.calculateTotals(0.1); // 10% tax
      
      expect(totals.subtotal).toBe(35); // (10*2) + (15*1)
      expect(totals.tax).toBe(3.5); // 35 * 0.1
      expect(totals.total).toBe(38.5); // 35 + 3.5
    });
  });

  describe('CartService', () => {
    let service: CartService;

    beforeEach(() => {
      service = new CartService({
        maxItems: 10,
        maxQuantityPerItem: 5,
      });
    });

    it('should initialize cart', async () => {
      const result = await service.initialize();
      
      expect(result.success).toBe(true);
      expect(result.cart).toBeDefined();
      expect(result.cart?.items).toHaveLength(0);
    });

    it('should add item to cart', async () => {
      await service.initialize();
      
      const result = await service.addItem({
        productId: 'prod-1',
        name: 'Test Product',
        price: 20,
        quantity: 2,
      });

      expect(result.success).toBe(true);
      expect(result.cart?.items).toHaveLength(1);
      expect(result.cart?.items[0].quantity).toBe(2);
    });

    it('should validate quantity limits', async () => {
      await service.initialize();
      
      const result = await service.addItem({
        productId: 'prod-1',
        name: 'Test Product',
        price: 20,
        quantity: 10, // Exceeds maxQuantityPerItem
      });

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.[0].code).toBe('MAX_QUANTITY_EXCEEDED');
    });
  });

  describe('CartValidator', () => {
    let validator: CartValidator;

    beforeEach(() => {
      validator = new CartValidator(100, 99);
    });

    it('should validate add to cart options', () => {
      const errors = validator.validateAddToCart({
        productId: 'prod-1',
        name: 'Test',
        price: 10,
        quantity: 5,
      });

      expect(errors).toHaveLength(0);
    });

    it('should catch invalid quantity', () => {
      const errors = validator.validateAddToCart({
        productId: 'prod-1',
        name: 'Test',
        price: 10,
        quantity: 150, // Exceeds max
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('quantity');
    });

    it('should catch negative price', () => {
      const errors = validator.validateAddToCart({
        productId: 'prod-1',
        name: 'Test',
        price: -10,
        quantity: 1,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('price');
    });
  });
});