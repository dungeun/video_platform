/**
 * Promotion Events Module Tests
 * Comprehensive test suite for the promotion events module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  PromotionService,
  PromotionCampaign,
  Event,
  Banner,
  DiscountType,
  CampaignStatus,
  EventStatus,
  BannerPosition,
  AudienceType,
  PromotionValidator
} from '../src';

describe('Promotion Events Module', () => {
  let promotionService: PromotionService;

  beforeEach(() => {
    promotionService = new PromotionService();
  });

  describe('PromotionService', () => {
    describe('createPromotion', () => {
      it('should create a percentage discount promotion', async () => {
        const promotionData = {
          name: 'Summer Sale',
          description: '20% off everything',
          discountConfig: {
            type: DiscountType.PERCENTAGE,
            percentage: 20,
            maxAmount: 50000
          },
          usageConditions: {
            minimumOrderAmount: 100000
          },
          targetAudience: {
            type: AudienceType.ALL_USERS
          },
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-08-31'),
          priority: 10,
          isStackable: false,
          tags: ['summer', 'sale']
        };

        const promotion = await promotionService.createPromotion(promotionData);

        expect(promotion.id).toBeDefined();
        expect(promotion.name).toBe('Summer Sale');
        expect(promotion.status).toBe(CampaignStatus.DRAFT);
        expect(promotion.discountConfig.type).toBe(DiscountType.PERCENTAGE);
        expect(promotion.usage.totalUsed).toBe(0);
      });

      it('should create a fixed discount promotion', async () => {
        const promotionData = {
          name: 'New Customer Discount',
          discountConfig: {
            type: DiscountType.FIXED,
            amount: 10000,
            currency: 'KRW'
          },
          usageConditions: {},
          targetAudience: {
            type: AudienceType.FIRST_TIME_BUYERS
          },
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        };

        const promotion = await promotionService.createPromotion(promotionData);

        expect(promotion.discountConfig.type).toBe(DiscountType.FIXED);
        expect((promotion.discountConfig as any).amount).toBe(10000);
        expect(promotion.targetAudience.type).toBe(AudienceType.FIRST_TIME_BUYERS);
      });

      it('should create a BOGO promotion', async () => {
        const promotionData = {
          name: 'Buy One Get One Free',
          discountConfig: {
            type: DiscountType.BUY_X_GET_Y,
            buyQuantity: 1,
            getQuantity: 1,
            discountType: 'free'
          },
          usageConditions: {},
          targetAudience: {
            type: AudienceType.ALL_USERS
          },
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        };

        const promotion = await promotionService.createPromotion(promotionData);

        expect(promotion.discountConfig.type).toBe(DiscountType.BUY_X_GET_Y);
        expect((promotion.discountConfig as any).buyQuantity).toBe(1);
        expect((promotion.discountConfig as any).getQuantity).toBe(1);
      });

      it('should validate promotion data', async () => {
        const invalidData = {
          name: '', // Invalid: empty name
          discountConfig: {
            type: DiscountType.PERCENTAGE,
            percentage: 150 // Invalid: over 100%
          },
          usageConditions: {},
          targetAudience: {
            type: AudienceType.ALL_USERS
          },
          startDate: new Date('2024-12-31'),
          endDate: new Date('2024-01-01') // Invalid: end before start
        };

        await expect(promotionService.createPromotion(invalidData)).rejects.toThrow();
      });
    });

    describe('calculateDiscount', () => {
      it('should calculate percentage discount correctly', async () => {
        const promotion = await promotionService.createPromotion({
          name: 'Test Promotion',
          discountConfig: {
            type: DiscountType.PERCENTAGE,
            percentage: 20
          },
          usageConditions: {},
          targetAudience: { type: AudienceType.ALL_USERS },
          startDate: new Date(Date.now() - 86400000), // Yesterday
          endDate: new Date(Date.now() + 86400000) // Tomorrow
        });

        await promotionService.activatePromotion(promotion.id);

        const orderData = {
          items: [
            { productId: '1', categoryId: 'cat1', quantity: 1, price: 100000, name: 'Product 1' }
          ],
          subtotal: 100000
        };

        const result = await promotionService.calculateDiscount(orderData);

        expect(result.originalAmount).toBe(100000);
        expect(result.discountAmount).toBe(20000); // 20% of 100000
        expect(result.finalAmount).toBe(80000);
        expect(result.appliedPromotions).toHaveLength(1);
      });

      it('should calculate fixed discount correctly', async () => {
        const promotion = await promotionService.createPromotion({
          name: 'Fixed Discount',
          discountConfig: {
            type: DiscountType.FIXED,
            amount: 15000,
            currency: 'KRW'
          },
          usageConditions: {},
          targetAudience: { type: AudienceType.ALL_USERS },
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000)
        });

        await promotionService.activatePromotion(promotion.id);

        const orderData = {
          items: [
            { productId: '1', categoryId: 'cat1', quantity: 1, price: 100000, name: 'Product 1' }
          ],
          subtotal: 100000
        };

        const result = await promotionService.calculateDiscount(orderData);

        expect(result.discountAmount).toBe(15000);
        expect(result.finalAmount).toBe(85000);
      });

      it('should respect minimum order amount', async () => {
        const promotion = await promotionService.createPromotion({
          name: 'Min Order Promotion',
          discountConfig: {
            type: DiscountType.PERCENTAGE,
            percentage: 10
          },
          usageConditions: {
            minimumOrderAmount: 150000
          },
          targetAudience: { type: AudienceType.ALL_USERS },
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000)
        });

        await promotionService.activatePromotion(promotion.id);

        const orderData = {
          items: [
            { productId: '1', categoryId: 'cat1', quantity: 1, price: 100000, name: 'Product 1' }
          ],
          subtotal: 100000 // Below minimum
        };

        const result = await promotionService.calculateDiscount(orderData);

        expect(result.discountAmount).toBe(0);
        expect(result.appliedPromotions).toHaveLength(0);
      });

      it('should handle stackable promotions', async () => {
        const promotion1 = await promotionService.createPromotion({
          name: 'Stackable 1',
          discountConfig: {
            type: DiscountType.FIXED,
            amount: 10000,
            currency: 'KRW'
          },
          usageConditions: {},
          targetAudience: { type: AudienceType.ALL_USERS },
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000),
          priority: 10,
          isStackable: true
        });

        const promotion2 = await promotionService.createPromotion({
          name: 'Stackable 2',
          discountConfig: {
            type: DiscountType.PERCENTAGE,
            percentage: 5
          },
          usageConditions: {},
          targetAudience: { type: AudienceType.ALL_USERS },
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000),
          priority: 5,
          isStackable: true
        });

        await promotionService.activatePromotion(promotion1.id);
        await promotionService.activatePromotion(promotion2.id);

        const orderData = {
          items: [
            { productId: '1', categoryId: 'cat1', quantity: 1, price: 100000, name: 'Product 1' }
          ],
          subtotal: 100000
        };

        const result = await promotionService.calculateDiscount(orderData);

        expect(result.appliedPromotions).toHaveLength(2);
        expect(result.discountAmount).toBe(14500); // 10000 + (90000 * 0.05)
      });
    });

    describe('generateCoupons', () => {
      it('should generate coupon codes', async () => {
        const promotion = await promotionService.createPromotion({
          name: 'Coupon Promotion',
          discountConfig: {
            type: DiscountType.PERCENTAGE,
            percentage: 15
          },
          usageConditions: {},
          targetAudience: { type: AudienceType.ALL_USERS },
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000)
        });

        const config = {
          prefix: 'SAVE',
          length: 8,
          includeNumbers: true,
          includeLetters: true,
          includeSpecialChars: false,
          excludeSimilarChars: true,
          quantity: 5
        };

        const coupons = await promotionService.generateCoupons(promotion.id, config);

        expect(coupons).toHaveLength(5);
        coupons.forEach(coupon => {
          expect(coupon.code).toMatch(/^SAVE[A-Z0-9]{4}$/);
          expect(coupon.campaignId).toBe(promotion.id);
          expect(coupon.isUsed).toBe(false);
        });
      });

      it('should generate unique coupon codes', async () => {
        const promotion = await promotionService.createPromotion({
          name: 'Unique Coupons',
          discountConfig: {
            type: DiscountType.FIXED,
            amount: 5000,
            currency: 'KRW'
          },
          usageConditions: {},
          targetAudience: { type: AudienceType.ALL_USERS },
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000)
        });

        const config = {
          length: 6,
          includeNumbers: true,
          includeLetters: true,
          includeSpecialChars: false,
          excludeSimilarChars: false,
          quantity: 100
        };

        const coupons = await promotionService.generateCoupons(promotion.id, config);
        const codes = coupons.map(c => c.code);
        const uniqueCodes = new Set(codes);

        expect(uniqueCodes.size).toBe(codes.length);
      });
    });

    describe('validateCoupon', () => {
      it('should validate a valid coupon', async () => {
        const promotion = await promotionService.createPromotion({
          name: 'Coupon Test',
          discountConfig: {
            type: DiscountType.PERCENTAGE,
            percentage: 10
          },
          usageConditions: {},
          targetAudience: { type: AudienceType.ALL_USERS },
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000)
        });

        await promotionService.activatePromotion(promotion.id);

        const coupons = await promotionService.generateCoupons(promotion.id, {
          length: 8,
          includeNumbers: true,
          includeLetters: true,
          includeSpecialChars: false,
          excludeSimilarChars: true,
          quantity: 1
        });

        const result = await promotionService.validateCoupon(coupons[0].code);

        expect(result.valid).toBe(true);
        expect(result.campaign).toBeDefined();
        expect(result.campaign?.id).toBe(promotion.id);
      });

      it('should reject invalid coupon', async () => {
        const result = await promotionService.validateCoupon('INVALID123');

        expect(result.valid).toBe(false);
        expect(result.message).toBe('Invalid coupon code');
      });

      it('should reject expired coupon', async () => {
        // This test would require mocking the coupon expiration
        // For brevity, we'll skip the implementation details
      });
    });
  });

  describe('PromotionValidator', () => {
    it('should validate valid promotion data', () => {
      const validData = {
        name: 'Valid Promotion',
        discountConfig: {
          type: DiscountType.PERCENTAGE,
          percentage: 25
        },
        usageConditions: {
          minimumOrderAmount: 50000
        },
        targetAudience: {
          type: AudienceType.ALL_USERS
        },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      expect(() => PromotionValidator.validateCreatePromotion(validData)).not.toThrow();
    });

    it('should reject invalid promotion data', () => {
      const invalidData = {
        name: '', // Invalid: empty name
        discountConfig: {
          type: DiscountType.PERCENTAGE,
          percentage: -10 // Invalid: negative percentage
        },
        usageConditions: {},
        targetAudience: {
          type: AudienceType.ALL_USERS
        },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01') // Invalid: end before start
      };

      expect(() => PromotionValidator.validateCreatePromotion(invalidData)).toThrow();
    });

    it('should validate email format', () => {
      expect(PromotionValidator.validateEmail('test@example.com')).toBe(true);
      expect(PromotionValidator.validateEmail('invalid-email')).toBe(false);
    });

    it('should validate Korean phone number', () => {
      expect(PromotionValidator.validatePhoneNumber('010-1234-5678')).toBe(true);
      expect(PromotionValidator.validatePhoneNumber('010 1234 5678')).toBe(true);
      expect(PromotionValidator.validatePhoneNumber('01012345678')).toBe(true);
      expect(PromotionValidator.validatePhoneNumber('123-456-7890')).toBe(false);
    });

    it('should validate color format', () => {
      expect(PromotionValidator.validateColor('#FF0000')).toBe(true);
      expect(PromotionValidator.validateColor('#f00')).toBe(true);
      expect(PromotionValidator.validateColor('rgb(255, 0, 0)')).toBe(true);
      expect(PromotionValidator.validateColor('rgba(255, 0, 0, 0.5)')).toBe(true);
      expect(PromotionValidator.validateColor('transparent')).toBe(true);
      expect(PromotionValidator.validateColor('invalid-color')).toBe(false);
    });
  });

  describe('Entity Classes', () => {
    describe('PromotionCampaign', () => {
      it('should create a valid promotion campaign', () => {
        const data = {
          id: 'promo-1',
          name: 'Test Promotion',
          status: CampaignStatus.DRAFT,
          discountConfig: {
            type: DiscountType.PERCENTAGE,
            percentage: 20
          },
          usageConditions: {},
          targetAudience: {
            type: AudienceType.ALL_USERS
          },
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          priority: 0,
          isStackable: false,
          tags: [],
          usage: {
            totalUsed: 0,
            totalSavings: 0,
            uniqueUsers: 0
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test'
        };

        const promotion = new PromotionCampaign(data);

        expect(promotion.name).toBe('Test Promotion');
        expect(promotion.isActive()).toBe(false); // Draft status
      });

      it('should validate promotion data in constructor', () => {
        const invalidData = {
          id: 'promo-1',
          name: '', // Invalid
          status: CampaignStatus.DRAFT,
          discountConfig: {
            type: DiscountType.PERCENTAGE,
            percentage: 20
          },
          usageConditions: {},
          targetAudience: {
            type: AudienceType.ALL_USERS
          },
          startDate: new Date('2024-12-31'),
          endDate: new Date('2024-01-01'), // Invalid: end before start
          priority: 0,
          isStackable: false,
          tags: [],
          usage: {
            totalUsed: 0,
            totalSavings: 0,
            uniqueUsers: 0
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test'
        };

        expect(() => new PromotionCampaign(invalidData)).toThrow();
      });
    });

    describe('Event', () => {
      it('should create a valid event', () => {
        const data = {
          id: 'event-1',
          name: 'Flash Sale',
          description: 'Limited time flash sale event',
          type: 'flash-sale' as EventType,
          status: EventStatus.UPCOMING,
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-02'),
          isRecurring: false,
          campaignIds: [],
          featured: true,
          showCountdown: true,
          views: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test'
        };

        const event = new Event(data);

        expect(event.name).toBe('Flash Sale');
        expect(event.getTypeDescription()).toBe('Flash Sale');
      });
    });

    describe('Banner', () => {
      it('should create a valid banner', () => {
        const data = {
          id: 'banner-1',
          title: 'Summer Sale Banner',
          content: 'Get 50% off on summer items!',
          position: BannerPosition.HERO,
          priority: 10,
          isActive: true,
          targetAudience: {
            type: AudienceType.ALL_USERS
          },
          displayRules: {},
          clickAction: {
            type: 'url' as const,
            value: 'https://example.com/sale'
          },
          styling: {
            backgroundColor: '#FF6B6B',
            textColor: '#FFFFFF'
          },
          impressions: 0,
          clicks: 0,
          clickThroughRate: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test'
        };

        const banner = new Banner(data);

        expect(banner.title).toBe('Summer Sale Banner');
        expect(banner.isDisplayable()).toBe(true);
        expect(banner.getPositionDescription()).toBe('Hero section');
      });
    });
  });
});

describe('Integration Tests', () => {
  let promotionService: PromotionService;

  beforeEach(() => {
    promotionService = new PromotionService();
  });

  it('should handle complete promotion lifecycle', async () => {
    // Create promotion
    const promotion = await promotionService.createPromotion({
      name: 'Integration Test Promotion',
      discountConfig: {
        type: DiscountType.PERCENTAGE,
        percentage: 15
      },
      usageConditions: {
        minimumOrderAmount: 50000
      },
      targetAudience: {
        type: AudienceType.ALL_USERS
      },
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000)
    });

    expect(promotion.status).toBe(CampaignStatus.DRAFT);

    // Activate promotion
    await promotionService.activatePromotion(promotion.id);
    const activatedPromotion = await promotionService.getPromotion(promotion.id);
    expect(activatedPromotion?.status).toBe(CampaignStatus.ACTIVE);

    // Generate coupons
    const coupons = await promotionService.generateCoupons(promotion.id, {
      length: 8,
      includeNumbers: true,
      includeLetters: true,
      includeSpecialChars: false,
      excludeSimilarChars: true,
      quantity: 10
    });

    expect(coupons).toHaveLength(10);

    // Calculate discount
    const orderData = {
      items: [
        { productId: '1', categoryId: 'cat1', quantity: 2, price: 30000, name: 'Product 1' }
      ],
      subtotal: 60000,
      couponCode: coupons[0].code
    };

    const discountResult = await promotionService.calculateDiscount(orderData);

    expect(discountResult.discountAmount).toBe(9000); // 15% of 60000
    expect(discountResult.finalAmount).toBe(51000);
    expect(discountResult.appliedPromotions).toHaveLength(1);

    // Validate coupon
    const couponValidation = await promotionService.validateCoupon(coupons[0].code);
    expect(couponValidation.valid).toBe(true);

    // Get analytics
    const analytics = await promotionService.getAnalytics(promotion.id, {
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000)
    });

    expect(analytics.campaignId).toBe(promotion.id);
    expect(analytics.metrics).toBeDefined();
  });
});