/**
 * Promotion Validator
 * Validation logic for promotion campaigns, events, and banners
 */

import { z } from 'zod';
import {
  DiscountType,
  CampaignStatus,
  EventType,
  EventStatus,
  BannerPosition,
  AudienceType,
  CreatePromotionRequest,
  CreateEventRequest,
  CreateBannerRequest,
  ValidationError
} from '../types';

// Base schemas
const BaseEntitySchema = z.object({
  id: z.string().min(1, 'ID is required'),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().min(1, 'Creator ID is required'),
  updatedBy: z.string().optional()
});

// Discount configuration schemas
const PercentageDiscountSchema = z.object({
  type: z.literal(DiscountType.PERCENTAGE),
  percentage: z.number()
    .min(0, 'Percentage must be at least 0')
    .max(100, 'Percentage cannot exceed 100'),
  maxAmount: z.number().positive('Max amount must be positive').optional()
});

const FixedDiscountSchema = z.object({
  type: z.literal(DiscountType.FIXED),
  amount: z.number().positive('Fixed amount must be positive'),
  currency: z.string().min(1, 'Currency is required')
});

const BuyXGetYDiscountSchema = z.object({
  type: z.literal(DiscountType.BUY_X_GET_Y),
  buyQuantity: z.number().int().positive('Buy quantity must be positive'),
  getQuantity: z.number().int().positive('Get quantity must be positive'),
  targetProductIds: z.array(z.string()).optional(),
  discountType: z.enum(['free', 'percentage', 'fixed']),
  discountValue: z.number().positive().optional()
});

const FreeShippingDiscountSchema = z.object({
  type: z.literal(DiscountType.FREE_SHIPPING),
  minimumOrderAmount: z.number().positive().optional(),
  shippingMethods: z.array(z.string()).optional()
});

const DiscountConfigSchema = z.discriminatedUnion('type', [
  PercentageDiscountSchema,
  FixedDiscountSchema,
  BuyXGetYDiscountSchema,
  FreeShippingDiscountSchema
]);

// Usage conditions schema
const UsageConditionsSchema = z.object({
  minimumOrderAmount: z.number().positive().optional(),
  maximumOrderAmount: z.number().positive().optional(),
  allowedProductIds: z.array(z.string()).optional(),
  excludedProductIds: z.array(z.string()).optional(),
  allowedCategoryIds: z.array(z.string()).optional(),
  excludedCategoryIds: z.array(z.string()).optional(),
  usageLimit: z.number().int().positive().optional(),
  userUsageLimit: z.number().int().positive().optional(),
  requiredCouponCode: z.string().optional()
}).refine(data => {
  if (data.minimumOrderAmount && data.maximumOrderAmount) {
    return data.minimumOrderAmount < data.maximumOrderAmount;
  }
  return true;
}, {
  message: 'Minimum order amount must be less than maximum order amount',
  path: ['minimumOrderAmount']
});

// Target audience schema
const TargetAudienceSchema = z.object({
  type: z.nativeEnum(AudienceType),
  userIds: z.array(z.string()).optional(),
  userGroupIds: z.array(z.string()).optional(),
  conditions: z.object({
    minOrderCount: z.number().int().nonnegative().optional(),
    minOrderValue: z.number().nonnegative().optional(),
    registrationDateAfter: z.date().optional(),
    registrationDateBefore: z.date().optional(),
    lastOrderDateAfter: z.date().optional(),
    lastOrderDateBefore: z.date().optional()
  }).optional()
}).refine(data => {
  if (data.type === AudienceType.SPECIFIC_USERS) {
    return data.userIds && data.userIds.length > 0;
  }
  if (data.type === AudienceType.USER_GROUPS) {
    return data.userGroupIds && data.userGroupIds.length > 0;
  }
  return true;
}, {
  message: 'User IDs or User Group IDs are required for specific audience types',
  path: ['userIds']
});

// Promotion campaign schemas
const CreatePromotionSchema = z.object({
  name: z.string()
    .min(1, 'Promotion name is required')
    .max(100, 'Promotion name cannot exceed 100 characters'),
  description: z.string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  discountConfig: DiscountConfigSchema,
  usageConditions: UsageConditionsSchema,
  targetAudience: TargetAudienceSchema,
  startDate: z.date(),
  endDate: z.date(),
  priority: z.number().int().nonnegative().optional(),
  isStackable: z.boolean().optional(),
  tags: z.array(z.string()).optional()
}).refine(data => data.startDate < data.endDate, {
  message: 'Start date must be before end date',
  path: ['startDate']
});

const UpdatePromotionSchema = CreatePromotionSchema.partial().extend({
  status: z.nativeEnum(CampaignStatus).optional()
});

// Event schemas
const RecurringPatternSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().positive('Interval must be positive'),
  endAfter: z.number().int().positive().optional(),
  endDate: z.date().optional()
}).refine(data => {
  return data.endAfter || data.endDate;
}, {
  message: 'Either endAfter or endDate must be specified for recurring events',
  path: ['endAfter']
});

const CreateEventSchema = z.object({
  name: z.string()
    .min(1, 'Event name is required')
    .max(100, 'Event name cannot exceed 100 characters'),
  description: z.string()
    .min(1, 'Event description is required')
    .max(1000, 'Description cannot exceed 1000 characters'),
  type: z.nativeEnum(EventType),
  startDate: z.date(),
  endDate: z.date(),
  isRecurring: z.boolean().optional(),
  recurringPattern: RecurringPatternSchema.optional(),
  campaignIds: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  showCountdown: z.boolean().optional(),
  customStyling: z.object({
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    bannerImage: z.string().url().optional()
  }).optional()
}).refine(data => data.startDate < data.endDate, {
  message: 'Start date must be before end date',
  path: ['startDate']
}).refine(data => {
  if (data.isRecurring) {
    return data.recurringPattern;
  }
  return true;
}, {
  message: 'Recurring pattern is required for recurring events',
  path: ['recurringPattern']
});

// Banner schemas
const DisplayRulesSchema = z.object({
  showOnPages: z.array(z.string()).optional(),
  showOnCategories: z.array(z.string()).optional(),
  maxImpressionsPerUser: z.number().int().positive().optional(),
  frequencyCap: z.object({
    impressions: z.number().int().positive('Frequency cap impressions must be positive'),
    period: z.enum(['hour', 'day', 'week', 'month'])
  }).optional()
});

const ClickActionSchema = z.object({
  type: z.enum(['url', 'promotion', 'product', 'category', 'none']),
  value: z.string().optional()
}).refine(data => {
  if (data.type !== 'none') {
    return data.value && data.value.trim().length > 0;
  }
  return true;
}, {
  message: 'Value is required for click actions other than none',
  path: ['value']
}).refine(data => {
  if (data.type === 'url' && data.value) {
    try {
      new URL(data.value);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}, {
  message: 'Invalid URL format',
  path: ['value']
});

const BannerStylingSchema = z.object({
  width: z.string().optional(),
  height: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  borderRadius: z.string().optional(),
  animation: z.enum(['none', 'fade', 'slide', 'bounce']).optional()
});

const CreateBannerSchema = z.object({
  title: z.string()
    .min(1, 'Banner title is required')
    .max(100, 'Title cannot exceed 100 characters'),
  subtitle: z.string()
    .max(200, 'Subtitle cannot exceed 200 characters')
    .optional(),
  content: z.string()
    .min(1, 'Banner content is required')
    .max(1000, 'Content cannot exceed 1000 characters'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  position: z.nativeEnum(BannerPosition),
  priority: z.number().int().nonnegative().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  targetAudience: TargetAudienceSchema,
  displayRules: DisplayRulesSchema,
  clickAction: ClickActionSchema,
  styling: BannerStylingSchema.optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.startDate < data.endDate;
  }
  return true;
}, {
  message: 'Start date must be before end date',
  path: ['startDate']
});

// Coupon generation schema
const CouponGenerationConfigSchema = z.object({
  prefix: z.string().max(10, 'Prefix cannot exceed 10 characters').optional(),
  suffix: z.string().max(10, 'Suffix cannot exceed 10 characters').optional(),
  length: z.number().int().min(4, 'Coupon length must be at least 4').max(20, 'Coupon length cannot exceed 20'),
  includeNumbers: z.boolean(),
  includeLetters: z.boolean(),
  includeSpecialChars: z.boolean(),
  excludeSimilarChars: z.boolean(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10000, 'Quantity cannot exceed 10,000'),
  expirationDays: z.number().int().positive().optional()
}).refine(data => {
  return data.includeNumbers || data.includeLetters || data.includeSpecialChars;
}, {
  message: 'At least one character type must be included',
  path: ['includeNumbers']
});

// Validator class
export class PromotionValidator {
  /**
   * Validate promotion creation data
   */
  static validateCreatePromotion(data: unknown): CreatePromotionRequest {
    try {
      return CreatePromotionSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new ValidationError(firstError.message, firstError.path.join('.'), error.errors);
      }
      throw error;
    }
  }

  /**
   * Validate promotion update data
   */
  static validateUpdatePromotion(data: unknown): Partial<CreatePromotionRequest> & { status?: CampaignStatus } {
    try {
      return UpdatePromotionSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new ValidationError(firstError.message, firstError.path.join('.'), error.errors);
      }
      throw error;
    }
  }

  /**
   * Validate event creation data
   */
  static validateCreateEvent(data: unknown): CreateEventRequest {
    try {
      return CreateEventSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new ValidationError(firstError.message, firstError.path.join('.'), error.errors);
      }
      throw error;
    }
  }

  /**
   * Validate banner creation data
   */
  static validateCreateBanner(data: unknown): CreateBannerRequest {
    try {
      return CreateBannerSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new ValidationError(firstError.message, firstError.path.join('.'), error.errors);
      }
      throw error;
    }
  }

  /**
   * Validate coupon generation configuration
   */
  static validateCouponConfig(data: unknown): any {
    try {
      return CouponGenerationConfigSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new ValidationError(firstError.message, firstError.path.join('.'), error.errors);
      }
      throw error;
    }
  }

  /**
   * Validate discount configuration
   */
  static validateDiscountConfig(data: unknown): any {
    try {
      return DiscountConfigSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new ValidationError(firstError.message, firstError.path.join('.'), error.errors);
      }
      throw error;
    }
  }

  /**
   * Validate usage conditions
   */
  static validateUsageConditions(data: unknown): any {
    try {
      return UsageConditionsSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new ValidationError(firstError.message, firstError.path.join('.'), error.errors);
      }
      throw error;
    }
  }

  /**
   * Validate target audience
   */
  static validateTargetAudience(data: unknown): any {
    try {
      return TargetAudienceSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new ValidationError(firstError.message, firstError.path.join('.'), error.errors);
      }
      throw error;
    }
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number (Korean format)
   */
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^(010|011|016|017|018|019)-?\d{3,4}-?\d{4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Validate color format (hex, rgb, rgba, or named colors)
   */
  static validateColor(color: string): boolean {
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const rgbPattern = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
    const rgbaPattern = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0|1|0?\.\d+)\s*\)$/;
    const namedColors = ['transparent', 'inherit', 'currentColor'];

    return hexPattern.test(color) || 
           rgbPattern.test(color) || 
           rgbaPattern.test(color) || 
           namedColors.includes(color);
  }

  /**
   * Validate URL format
   */
  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate date range
   */
  static validateDateRange(startDate: Date, endDate: Date): boolean {
    return startDate < endDate;
  }

  /**
   * Validate promotion overlap
   */
  static validatePromotionOverlap(
    newPromotion: { startDate: Date; endDate: Date; targetAudience: any; isStackable: boolean },
    existingPromotions: { startDate: Date; endDate: Date; targetAudience: any; isStackable: boolean }[]
  ): boolean {
    if (newPromotion.isStackable) {
      return true; // Stackable promotions can overlap
    }

    return !existingPromotions.some(existing => {
      // Check if target audiences overlap
      const audienceOverlap = existing.targetAudience.type === newPromotion.targetAudience.type;
      
      if (!audienceOverlap || existing.isStackable) {
        return false;
      }

      // Check if date ranges overlap
      return !(existing.endDate <= newPromotion.startDate || existing.startDate >= newPromotion.endDate);
    });
  }

  /**
   * Sanitize HTML content for banners
   */
  static sanitizeHtml(html: string): string {
    // Basic HTML sanitization - in production, use a proper library like DOMPurify
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '');
  }

  /**
   * Validate business rules for promotions
   */
  static validateBusinessRules(promotion: CreatePromotionRequest): string[] {
    const warnings: string[] = [];

    // Check if discount is too high
    if (promotion.discountConfig.type === DiscountType.PERCENTAGE) {
      const percentageConfig = promotion.discountConfig as any;
      if (percentageConfig.percentage > 80) {
        warnings.push('Discount percentage is very high (>80%). Consider if this is intentional.');
      }
    }

    // Check if promotion duration is very long
    const durationDays = (promotion.endDate.getTime() - promotion.startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (durationDays > 365) {
      warnings.push('Promotion duration is longer than 1 year. Consider if this is intentional.');
    }

    // Check if promotion starts in the past
    if (promotion.startDate < new Date()) {
      warnings.push('Promotion start date is in the past.');
    }

    // Check for conflicting conditions
    if (promotion.usageConditions.minimumOrderAmount && 
        promotion.discountConfig.type === DiscountType.FIXED) {
      const fixedConfig = promotion.discountConfig as any;
      if (fixedConfig.amount >= promotion.usageConditions.minimumOrderAmount) {
        warnings.push('Fixed discount amount is equal to or greater than minimum order amount.');
      }
    }

    return warnings;
  }
}

export default PromotionValidator;