/**
 * Promotion Events Module Types
 * Complete type definitions for promotion campaigns, events, banners, and analytics
 */

// Base types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

// Discount types
export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  BUY_X_GET_Y = 'buy-x-get-y',
  FREE_SHIPPING = 'free-shipping'
}

// Campaign status
export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

// Target audience types
export enum AudienceType {
  ALL_USERS = 'all-users',
  FIRST_TIME_BUYERS = 'first-time-buyers',
  RETURNING_CUSTOMERS = 'returning-customers',
  VIP_MEMBERS = 'vip-members',
  SPECIFIC_USERS = 'specific-users',
  USER_GROUPS = 'user-groups'
}

// Banner positioning
export enum BannerPosition {
  TOP = 'top',
  HEADER = 'header',
  HERO = 'hero',
  SIDEBAR = 'sidebar',
  FOOTER = 'footer',
  POPUP = 'popup',
  FLOATING = 'floating'
}

// Discount configuration for different types
export interface PercentageDiscount {
  type: DiscountType.PERCENTAGE;
  percentage: number; // 0-100
  maxAmount?: number; // Maximum discount amount cap
}

export interface FixedDiscount {
  type: DiscountType.FIXED;
  amount: number;
  currency: string;
}

export interface BuyXGetYDiscount {
  type: DiscountType.BUY_X_GET_Y;
  buyQuantity: number;
  getQuantity: number;
  targetProductIds?: string[]; // If not specified, applies to same product
  discountType: 'free' | 'percentage' | 'fixed';
  discountValue?: number; // For percentage or fixed discount on Y items
}

export interface FreeShippingDiscount {
  type: DiscountType.FREE_SHIPPING;
  minimumOrderAmount?: number;
  shippingMethods?: string[]; // Specific shipping methods, if not all
}

export type DiscountConfig = 
  | PercentageDiscount 
  | FixedDiscount 
  | BuyXGetYDiscount 
  | FreeShippingDiscount;

// Usage conditions
export interface UsageConditions {
  minimumOrderAmount?: number;
  maximumOrderAmount?: number;
  allowedProductIds?: string[];
  excludedProductIds?: string[];
  allowedCategoryIds?: string[];
  excludedCategoryIds?: string[];
  usageLimit?: number; // Total usage limit
  userUsageLimit?: number; // Per user usage limit
  requiredCouponCode?: string;
}

// Target audience configuration
export interface TargetAudience {
  type: AudienceType;
  userIds?: string[]; // For SPECIFIC_USERS
  userGroupIds?: string[]; // For USER_GROUPS
  conditions?: {
    minOrderCount?: number;
    minOrderValue?: number;
    registrationDateAfter?: Date;
    registrationDateBefore?: Date;
    lastOrderDateAfter?: Date;
    lastOrderDateBefore?: Date;
  };
}

// Promotion Campaign
export interface PromotionCampaign extends BaseEntity {
  name: string;
  description?: string;
  status: CampaignStatus;
  discountConfig: DiscountConfig;
  usageConditions: UsageConditions;
  targetAudience: TargetAudience;
  startDate: Date;
  endDate: Date;
  priority: number; // Higher number = higher priority
  isStackable: boolean; // Can be combined with other promotions
  tags: string[];
  
  // Analytics
  usage: {
    totalUsed: number;
    totalSavings: number;
    uniqueUsers: number;
  };
}

// Event types
export enum EventType {
  FLASH_SALE = 'flash-sale',
  SEASONAL_SALE = 'seasonal-sale',
  CLEARANCE = 'clearance',
  NEW_PRODUCT_LAUNCH = 'new-product-launch',
  SPECIAL_OCCASION = 'special-occasion',
  LIMITED_TIME_OFFER = 'limited-time-offer'
}

export enum EventStatus {
  UPCOMING = 'upcoming',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

// Event entity
export interface Event extends BaseEntity {
  name: string;
  description: string;
  type: EventType;
  status: EventStatus;
  startDate: Date;
  endDate: Date;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endAfter?: number; // Number of occurrences  
    endDate?: Date;
  };
  
  // Associated campaigns
  campaignIds: string[];
  
  // Display settings
  featured: boolean;
  showCountdown: boolean;
  customStyling?: {
    backgroundColor?: string;
    textColor?: string;
    bannerImage?: string;
  };
  
  // Analytics
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

// Banner entity
export interface Banner extends BaseEntity {
  title: string;
  subtitle?: string;
  content: string;
  imageUrl?: string;
  position: BannerPosition;
  priority: number;
  isActive: boolean;
  
  // Display conditions
  startDate?: Date;
  endDate?: Date;
  targetAudience: TargetAudience;
  displayRules: {
    showOnPages?: string[]; // Specific pages
    showOnCategories?: string[]; // Product categories
    maxImpressionsPerUser?: number;
    frequencyCap?: {
      impressions: number;
      period: 'hour' | 'day' | 'week' | 'month';
    };
  };
  
  // Interaction
  clickAction: {
    type: 'url' | 'promotion' | 'product' | 'category' | 'none';
    value?: string; // URL, promotion ID, product ID, category ID
  };
  
  // Styling
  styling: {
    width?: string;
    height?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    animation?: 'none' | 'fade' | 'slide' | 'bounce';
  };
  
  // Analytics
  impressions: number;
  clicks: number;
  clickThroughRate: number;
}

// Coupon code generation
export interface CouponCode extends BaseEntity {
  code: string;
  campaignId: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: Date;
  expiresAt?: Date;
}

export interface CouponGenerationConfig {
  prefix?: string;
  suffix?: string;
  length: number;
  includeNumbers: boolean;
  includeLetters: boolean;
  includeSpecialChars: boolean;
  excludeSimilarChars: boolean; // Exclude 0, O, I, l, etc.
  quantity: number;
  expirationDays?: number;
}

// Analytics and reporting
export interface PromotionAnalytics {
  campaignId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    savings: number;
    averageOrderValue: number;
    conversionRate: number;
    returnOnInvestment: number;
  };
  demographics: {
    userTypes: Record<string, number>;
    ageGroups: Record<string, number>;
    locations: Record<string, number>;
  };
  productPerformance: {
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }[];
}

export interface EventAnalytics {
  eventId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    totalViews: number;
    uniqueVisitors: number;
    participationRate: number;
    averageSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
    revenue: number;
  };
  timeSeriesData: {
    timestamp: Date;
    views: number;
    clicks: number;
    conversions: number;
  }[];
}

// API request/response types
export interface CreatePromotionRequest {
  name: string;
  description?: string;
  discountConfig: DiscountConfig;
  usageConditions: UsageConditions;
  targetAudience: TargetAudience;
  startDate: Date;
  endDate: Date;
  priority?: number;
  isStackable?: boolean;
  tags?: string[];
}

export interface UpdatePromotionRequest extends Partial<CreatePromotionRequest> {
  status?: CampaignStatus;
}

export interface CreateEventRequest {
  name: string;
  description: string;
  type: EventType;
  startDate: Date;
  endDate: Date;
  campaignIds?: string[];
  featured?: boolean;
  showCountdown?: boolean;
  customStyling?: Event['customStyling'];
}

export interface CreateBannerRequest {
  title: string;
  subtitle?: string;
  content: string;
  imageUrl?: string;
  position: BannerPosition;
  priority?: number;
  startDate?: Date;
  endDate?: Date;
  targetAudience: TargetAudience;
  displayRules: Banner['displayRules'];
  clickAction: Banner['clickAction'];
  styling?: Banner['styling'];
}

// Filter and search types
export interface PromotionFilters {
  status?: CampaignStatus[];
  discountType?: DiscountType[];
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  targetAudience?: AudienceType[];
}

export interface EventFilters {
  type?: EventType[];
  status?: EventStatus[];
  startDate?: Date;
  endDate?: Date;
  featured?: boolean;
}

export interface BannerFilters {
  position?: BannerPosition[];
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}

// Discount calculation result
export interface DiscountCalculationResult {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  appliedPromotions: {
    campaignId: string;
    campaignName: string;
    discountAmount: number;
    discountType: DiscountType;
  }[];
  freeShipping: boolean;
  messages: string[]; // User-friendly messages about applied discounts
}

// Hook return types
export interface UsePromotionReturn {
  promotions: PromotionCampaign[];
  loading: boolean;
  error: string | null;
  createPromotion: (data: CreatePromotionRequest) => Promise<PromotionCampaign>;
  updatePromotion: (id: string, data: UpdatePromotionRequest) => Promise<PromotionCampaign>;
  deletePromotion: (id: string) => Promise<void>;
  activatePromotion: (id: string) => Promise<void>;
  deactivatePromotion: (id: string) => Promise<void>;
  calculateDiscount: (orderData: any) => Promise<DiscountCalculationResult>;
  generateCoupons: (campaignId: string, config: CouponGenerationConfig) => Promise<CouponCode[]>;
  validateCoupon: (code: string) => Promise<{ valid: boolean; campaign?: PromotionCampaign; message: string }>;
  getAnalytics: (campaignId: string, period: { startDate: Date; endDate: Date }) => Promise<PromotionAnalytics>;
}

// Error types
export class PromotionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PromotionError';
  }
}

export class ValidationError extends PromotionError {
  constructor(message: string, public field: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends PromotionError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends PromotionError {
  constructor(message: string, details?: any) {
    super(message, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}