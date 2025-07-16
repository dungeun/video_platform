import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  CouponEntity,
  CouponValidator,
  DiscountCalculationService,
  CouponValidationService,
  generateCouponCode,
  formatCouponCode,
  isCouponValid,
  calculateDiscountedPrice
} from '../src';
import { 
  Coupon, 
  CouponType, 
  DiscountType,
  ValidationContext 
} from '../src/types';

describe('Coupon Entity', () => {
  const mockCoupon: Coupon = {
    id: '1',
    code: 'TEST10',
    name: 'Test Coupon',
    type: CouponType.PUBLIC,
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    usageCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('should create a valid coupon entity', () => {
    const entity = new CouponEntity(mockCoupon);
    expect(entity.code).toBe('TEST10');
    expect(entity.isValid).toBe(true);
  });

  it('should detect expired coupons', () => {
    const expiredCoupon = {
      ...mockCoupon,
      validUntil: new Date('2023-12-31')
    };
    const entity = new CouponEntity(expiredCoupon);
    expect(entity.isExpired).toBe(true);
    expect(entity.isValid).toBe(false);
  });

  it('should calculate remaining usage', () => {
    const limitedCoupon = {
      ...mockCoupon,
      usageLimit: 100,
      usageCount: 75
    };
    const entity = new CouponEntity(limitedCoupon);
    expect(entity.remainingUsage).toBe(25);
  });
});

describe('Coupon Validator', () => {
  const validator = new CouponValidator();

  it('should validate coupon code format', () => {
    const validResult = validator.validateCouponCode('TEST123');
    expect(validResult.isValid).toBe(true);

    const invalidResult = validator.validateCouponCode('test@123');
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toHaveLength(1);
  });

  it('should validate percentage discount limits', async () => {
    const invalidCoupon = {
      code: 'OVER100',
      name: 'Invalid Coupon',
      type: CouponType.PUBLIC,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 150,
      validFrom: new Date(),
      validUntil: new Date(),
      isActive: true
    };

    const result = await validator.validateCouponData(invalidCoupon);
    expect(result.isValid).toBe(false);
    expect(result.errors?.some(e => e.code === 'INVALID_PERCENTAGE')).toBe(true);
  });
});

describe('Discount Calculation Service', () => {
  const service = new DiscountCalculationService();

  it('should calculate percentage discount', () => {
    const coupon: Coupon = {
      id: '1',
      code: 'PERCENT20',
      name: 'Test',
      type: CouponType.PUBLIC,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      validFrom: new Date(),
      validUntil: new Date(),
      usageCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const context: ValidationContext = {
      userId: 'user1',
      orderTotal: 100
    };

    const result = service.calculateDiscount(coupon, context);
    expect(result.discountAmount).toBe(20);
    expect(result.finalAmount).toBe(80);
  });

  it('should apply maximum discount limit', () => {
    const coupon: Coupon = {
      id: '1',
      code: 'MAXLIMIT',
      name: 'Test',
      type: CouponType.PUBLIC,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 50,
      maxDiscountAmount: 25,
      validFrom: new Date(),
      validUntil: new Date(),
      usageCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const context: ValidationContext = {
      userId: 'user1',
      orderTotal: 100
    };

    const result = service.calculateDiscount(coupon, context);
    expect(result.discountAmount).toBe(25);
    expect(result.finalAmount).toBe(75);
  });
});

describe('Coupon Helpers', () => {
  it('should generate valid coupon codes', () => {
    const code = generateCouponCode('SUMMER', 6);
    expect(code).toMatch(/^SUMMER_[A-Z0-9]{6}$/);
  });

  it('should format coupon codes correctly', () => {
    expect(formatCouponCode('test-code-123')).toBe('TEST-CODE-123');
    expect(formatCouponCode('code@#$123')).toBe('CODE123');
  });

  it('should calculate discounted prices', () => {
    expect(calculateDiscountedPrice(100, DiscountType.PERCENTAGE, 20)).toBe(80);
    expect(calculateDiscountedPrice(100, DiscountType.FIXED, 30)).toBe(70);
    expect(calculateDiscountedPrice(20, DiscountType.FIXED, 30)).toBe(0);
  });
});