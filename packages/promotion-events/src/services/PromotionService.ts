/**
 * Promotion Service
 * Core service for managing promotion campaigns, discount calculations, and analytics
 */

import { nanoid } from 'nanoid';
import { 
  PromotionCampaign, 
  CreatePromotionRequest, 
  UpdatePromotionRequest,
  DiscountCalculationResult,
  CouponCode,
  CouponGenerationConfig,
  PromotionAnalytics,
  DiscountType,
  CampaignStatus,
  PromotionFilters,
  PromotionError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UsageConditions,
  AudienceType
} from '../types';

export interface OrderItem {
  productId: string;
  categoryId: string;
  quantity: number;
  price: number;
  name: string;
}

export interface OrderData {
  items: OrderItem[];
  subtotal: number;
  userId?: string;
  userType?: 'new' | 'returning' | 'vip';
  couponCode?: string;
  shippingAmount?: number;
}

export interface UserContext {
  id?: string;
  type?: 'new' | 'returning' | 'vip';
  orderHistory?: {
    totalOrders: number;
    totalSpent: number;
    lastOrderDate?: Date;
  };
  registrationDate?: Date;
  groupIds?: string[];
}

export class PromotionService {
  private promotions: Map<string, PromotionCampaign> = new Map();
  private coupons: Map<string, CouponCode> = new Map();
  private analytics: Map<string, PromotionAnalytics> = new Map();

  /**
   * Create a new promotion campaign
   */
  async createPromotion(data: CreatePromotionRequest): Promise<PromotionCampaign> {
    // Validate promotion data
    await this.validatePromotionData(data);

    const promotion: PromotionCampaign = {
      id: nanoid(),
      ...data,
      status: CampaignStatus.DRAFT,
      priority: data.priority || 0,
      isStackable: data.isStackable || false,
      tags: data.tags || [],
      usage: {
        totalUsed: 0,
        totalSavings: 0,
        uniqueUsers: 0
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system', // TODO: Get from context
      updatedBy: undefined
    };

    // Check for conflicts with existing promotions
    await this.checkPromotionConflicts(promotion);

    this.promotions.set(promotion.id, promotion);
    return promotion;
  }

  /**
   * Update an existing promotion campaign
   */
  async updatePromotion(id: string, data: UpdatePromotionRequest): Promise<PromotionCampaign> {
    const existing = this.promotions.get(id);
    if (!existing) {
      throw new NotFoundError('Promotion', id);
    }

    // Validate update data
    if (data.discountConfig || data.usageConditions || data.targetAudience) {
      await this.validatePromotionData(data as CreatePromotionRequest);
    }

    const updated: PromotionCampaign = {
      ...existing,
      ...data,
      updatedAt: new Date(),
      updatedBy: 'system' // TODO: Get from context
    };

    this.promotions.set(id, updated);
    return updated;
  }

  /**
   * Delete a promotion campaign
   */
  async deletePromotion(id: string): Promise<void> {
    const promotion = this.promotions.get(id);
    if (!promotion) {
      throw new NotFoundError('Promotion', id);
    }

    // Check if promotion is currently active
    if (promotion.status === CampaignStatus.ACTIVE) {
      throw new ConflictError('Cannot delete active promotion. Please deactivate first.');
    }

    this.promotions.delete(id);
  }

  /**
   * Get promotion by ID
   */
  async getPromotion(id: string): Promise<PromotionCampaign | null> {
    return this.promotions.get(id) || null;
  }

  /**
   * Get all promotions with optional filters
   */
  async getPromotions(filters?: PromotionFilters): Promise<PromotionCampaign[]> {
    let promotions = Array.from(this.promotions.values());

    if (filters) {
      promotions = promotions.filter(promotion => {
        if (filters.status && !filters.status.includes(promotion.status)) return false;
        if (filters.discountType && !filters.discountType.includes(promotion.discountConfig.type)) return false;
        if (filters.startDate && promotion.startDate < filters.startDate) return false;
        if (filters.endDate && promotion.endDate > filters.endDate) return false;
        if (filters.tags && !filters.tags.some(tag => promotion.tags.includes(tag))) return false;
        if (filters.targetAudience && !filters.targetAudience.includes(promotion.targetAudience.type)) return false;
        
        return true;
      });
    }

    return promotions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Activate a promotion campaign
   */
  async activatePromotion(id: string): Promise<void> {
    const promotion = this.promotions.get(id);
    if (!promotion) {
      throw new NotFoundError('Promotion', id);
    }

    const now = new Date();
    if (promotion.startDate > now) {
      promotion.status = CampaignStatus.SCHEDULED;
    } else if (promotion.endDate < now) {
      throw new ConflictError('Cannot activate expired promotion');
    } else {
      promotion.status = CampaignStatus.ACTIVE;
    }

    promotion.updatedAt = new Date();
    this.promotions.set(id, promotion);
  }

  /**
   * Deactivate a promotion campaign
   */
  async deactivatePromotion(id: string): Promise<void> {
    const promotion = this.promotions.get(id);
    if (!promotion) {
      throw new NotFoundError('Promotion', id);
    }

    promotion.status = CampaignStatus.PAUSED;
    promotion.updatedAt = new Date();
    this.promotions.set(id, promotion);
  }

  /**
   * Calculate discount for an order
   */
  async calculateDiscount(
    orderData: OrderData, 
    userContext?: UserContext
  ): Promise<DiscountCalculationResult> {
    const result: DiscountCalculationResult = {
      originalAmount: orderData.subtotal,
      discountAmount: 0,
      finalAmount: orderData.subtotal,
      appliedPromotions: [],
      freeShipping: false,
      messages: []
    };

    // Get eligible promotions
    const eligiblePromotions = await this.getEligiblePromotions(orderData, userContext);
    
    // Sort by priority (highest first)
    eligiblePromotions.sort((a, b) => b.priority - a.priority);

    let currentAmount = orderData.subtotal;
    const appliedPromotionIds = new Set<string>();

    for (const promotion of eligiblePromotions) {
      // Skip if already applied and not stackable
      if (appliedPromotionIds.has(promotion.id) && !promotion.isStackable) {
        continue;
      }

      const discount = await this.calculatePromotionDiscount(promotion, orderData, currentAmount);
      
      if (discount.amount > 0) {
        result.discountAmount += discount.amount;
        currentAmount -= discount.amount;
        
        result.appliedPromotions.push({
          campaignId: promotion.id,
          campaignName: promotion.name,
          discountAmount: discount.amount,
          discountType: promotion.discountConfig.type
        });

        result.messages.push(discount.message);
        appliedPromotionIds.add(promotion.id);

        // Track usage
        promotion.usage.totalUsed++;
        promotion.usage.totalSavings += discount.amount;
        this.promotions.set(promotion.id, promotion);
      }

      // Check for free shipping
      if (promotion.discountConfig.type === DiscountType.FREE_SHIPPING) {
        result.freeShipping = true;
        result.messages.push('Free shipping applied!');
      }

      // Stop if we've reached maximum applicable promotions
      if (!promotion.isStackable) break;
    }

    result.finalAmount = Math.max(0, currentAmount);
    return result;
  }

  /**
   * Generate coupon codes for a campaign
   */
  async generateCoupons(campaignId: string, config: CouponGenerationConfig): Promise<CouponCode[]> {
    const promotion = this.promotions.get(campaignId);
    if (!promotion) {
      throw new NotFoundError('Promotion', campaignId);
    }

    const coupons: CouponCode[] = [];
    const existingCodes = new Set(Array.from(this.coupons.values()).map(c => c.code));

    for (let i = 0; i < config.quantity; i++) {
      let code: string;
      let attempts = 0;
      
      // Generate unique code
      do {
        code = this.generateCouponCode(config);
        attempts++;
        if (attempts > 1000) {
          throw new PromotionError('Failed to generate unique coupon codes', 'GENERATION_ERROR');
        }
      } while (existingCodes.has(code));

      const coupon: CouponCode = {
        id: nanoid(),
        code,
        campaignId,
        isUsed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        expiresAt: config.expirationDays ? 
          new Date(Date.now() + config.expirationDays * 24 * 60 * 60 * 1000) : 
          undefined
      };

      coupons.push(coupon);
      this.coupons.set(coupon.code, coupon);
      existingCodes.add(code);
    }

    return coupons;
  }

  /**
   * Validate a coupon code
   */
  async validateCoupon(code: string, userContext?: UserContext): Promise<{
    valid: boolean;
    campaign?: PromotionCampaign;
    message: string;
  }> {
    const coupon = this.coupons.get(code);
    
    if (!coupon) {
      return { valid: false, message: 'Invalid coupon code' };
    }

    if (coupon.isUsed) {
      return { valid: false, message: 'Coupon code has already been used' };
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { valid: false, message: 'Coupon code has expired' };
    }

    const campaign = this.promotions.get(coupon.campaignId);
    if (!campaign) {
      return { valid: false, message: 'Associated campaign not found' };
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      return { valid: false, message: 'Campaign is not currently active' };
    }

    const now = new Date();
    if (campaign.startDate > now || campaign.endDate < now) {
      return { valid: false, message: 'Campaign is not currently active' };
    }

    // Check audience eligibility
    if (userContext && !await this.isUserEligible(campaign, userContext)) {
      return { valid: false, message: 'You are not eligible for this promotion' };
    }

    return { 
      valid: true, 
      campaign,
      message: `Coupon applied: ${campaign.name}` 
    };
  }

  /**
   * Get analytics for a promotion campaign
   */
  async getAnalytics(
    campaignId: string, 
    period: { startDate: Date; endDate: Date }
  ): Promise<PromotionAnalytics> {
    const promotion = this.promotions.get(campaignId);
    if (!promotion) {
      throw new NotFoundError('Promotion', campaignId);
    }

    // In a real implementation, this would query the database
    // For now, return mock analytics based on usage data
    const analytics: PromotionAnalytics = {
      campaignId,
      period,
      metrics: {
        impressions: promotion.usage.totalUsed * 10, // Mock data
        clicks: promotion.usage.totalUsed * 5,
        conversions: promotion.usage.totalUsed,
        revenue: promotion.usage.totalSavings * 10,
        savings: promotion.usage.totalSavings,
        averageOrderValue: promotion.usage.totalUsed > 0 ? 
          (promotion.usage.totalSavings * 10) / promotion.usage.totalUsed : 0,
        conversionRate: 0.2, // 20%
        returnOnInvestment: 5.0 // 500%
      },
      demographics: {
        userTypes: { new: 30, returning: 50, vip: 20 },
        ageGroups: { '18-25': 25, '26-35': 40, '36-45': 25, '46+': 10 },
        locations: { 'Seoul': 40, 'Busan': 20, 'Incheon': 15, 'Other': 25 }
      },
      productPerformance: [] // Would be populated from actual order data
    };

    return analytics;
  }

  // Private helper methods

  private async validatePromotionData(data: CreatePromotionRequest): Promise<void> {
    if (!data.name?.trim()) {
      throw new ValidationError('Promotion name is required', 'name');
    }

    if (data.startDate >= data.endDate) {
      throw new ValidationError('Start date must be before end date', 'startDate');
    }

    if (data.discountConfig.type === DiscountType.PERCENTAGE) {
      const config = data.discountConfig as any;
      if (config.percentage < 0 || config.percentage > 100) {
        throw new ValidationError('Percentage must be between 0 and 100', 'discountConfig.percentage');
      }
    }

    if (data.discountConfig.type === DiscountType.FIXED) {
      const config = data.discountConfig as any;
      if (config.amount <= 0) {
        throw new ValidationError('Fixed discount amount must be positive', 'discountConfig.amount');
      }
    }
  }

  private async checkPromotionConflicts(promotion: PromotionCampaign): Promise<void> {
    // Check for overlapping promotions with same target audience
    const overlapping = Array.from(this.promotions.values()).filter(p => 
      p.targetAudience.type === promotion.targetAudience.type &&
      p.status === CampaignStatus.ACTIVE &&
      !(p.endDate < promotion.startDate || p.startDate > promotion.endDate)
    );

    if (overlapping.length > 0 && !promotion.isStackable) {
      throw new ConflictError('Promotion conflicts with existing active promotion');
    }
  }

  private async getEligiblePromotions(
    orderData: OrderData, 
    userContext?: UserContext
  ): Promise<PromotionCampaign[]> {
    const now = new Date();
    
    return Array.from(this.promotions.values()).filter(promotion => {
      // Check if promotion is active
      if (promotion.status !== CampaignStatus.ACTIVE) return false;
      
      // Check date range
      if (promotion.startDate > now || promotion.endDate < now) return false;
      
      // Check usage conditions
      if (!this.checkUsageConditions(promotion.usageConditions, orderData)) return false;
      
      // Check audience eligibility
      if (userContext && !this.isUserEligibleSync(promotion, userContext)) return false;
      
      // Check coupon requirement
      if (promotion.usageConditions.requiredCouponCode) {
        if (!orderData.couponCode || orderData.couponCode !== promotion.usageConditions.requiredCouponCode) {
          return false;
        }
      }
      
      return true;
    });
  }

  private checkUsageConditions(conditions: UsageConditions, orderData: OrderData): boolean {
    if (conditions.minimumOrderAmount && orderData.subtotal < conditions.minimumOrderAmount) {
      return false;
    }

    if (conditions.maximumOrderAmount && orderData.subtotal > conditions.maximumOrderAmount) {
      return false;
    }

    // Check product eligibility
    if (conditions.allowedProductIds) {
      const hasAllowedProduct = orderData.items.some(item => 
        conditions.allowedProductIds!.includes(item.productId)
      );
      if (!hasAllowedProduct) return false;
    }

    if (conditions.excludedProductIds) {
      const hasExcludedProduct = orderData.items.some(item => 
        conditions.excludedProductIds!.includes(item.productId)
      );
      if (hasExcludedProduct) return false;
    }

    // Check category eligibility
    if (conditions.allowedCategoryIds) {
      const hasAllowedCategory = orderData.items.some(item => 
        conditions.allowedCategoryIds!.includes(item.categoryId)
      );
      if (!hasAllowedCategory) return false;
    }

    if (conditions.excludedCategoryIds) {
      const hasExcludedCategory = orderData.items.some(item => 
        conditions.excludedCategoryIds!.includes(item.categoryId)
      );
      if (hasExcludedCategory) return false;
    }

    return true;
  }

  private async isUserEligible(promotion: PromotionCampaign, userContext: UserContext): Promise<boolean> {
    return this.isUserEligibleSync(promotion, userContext);
  }

  private isUserEligibleSync(promotion: PromotionCampaign, userContext: UserContext): boolean {
    const audience = promotion.targetAudience;

    switch (audience.type) {
      case AudienceType.ALL_USERS:
        return true;
      
      case AudienceType.FIRST_TIME_BUYERS:
        return userContext.type === 'new';
      
      case AudienceType.RETURNING_CUSTOMERS:
        return userContext.type === 'returning';
      
      case AudienceType.VIP_MEMBERS:
        return userContext.type === 'vip';
      
      case AudienceType.SPECIFIC_USERS:
        return audience.userIds?.includes(userContext.id || '') || false;
      
      case AudienceType.USER_GROUPS:
        return audience.userGroupIds?.some(groupId => 
          userContext.groupIds?.includes(groupId)
        ) || false;
      
      default:
        return false;
    }
  }

  private async calculatePromotionDiscount(
    promotion: PromotionCampaign, 
    orderData: OrderData,
    currentAmount: number
  ): Promise<{ amount: number; message: string }> {
    const config = promotion.discountConfig;

    switch (config.type) {
      case DiscountType.PERCENTAGE:
        const percentageDiscount = (currentAmount * config.percentage) / 100;
        const cappedDiscount = config.maxAmount ? 
          Math.min(percentageDiscount, config.maxAmount) : 
          percentageDiscount;
        return {
          amount: cappedDiscount,
          message: `${config.percentage}% discount applied (${promotion.name})`
        };

      case DiscountType.FIXED:
        const fixedDiscount = Math.min(config.amount, currentAmount);
        return {
          amount: fixedDiscount,
          message: `${config.amount} ${config.currency} discount applied (${promotion.name})`
        };

      case DiscountType.BUY_X_GET_Y:
        return this.calculateBuyXGetYDiscount(config, orderData, promotion.name);

      case DiscountType.FREE_SHIPPING:
        return {
          amount: 0, // Free shipping doesn't reduce order total
          message: `Free shipping applied (${promotion.name})`
        };

      default:
        return { amount: 0, message: '' };
    }
  }

  private calculateBuyXGetYDiscount(
    config: any,
    orderData: OrderData,
    promotionName: string
  ): { amount: number; message: string } {
    let totalDiscount = 0;
    let freeItems = 0;

    // Group items by product ID
    const productGroups = new Map<string, OrderItem[]>();
    orderData.items.forEach(item => {
      if (!productGroups.has(item.productId)) {
        productGroups.set(item.productId, []);
      }
      productGroups.get(item.productId)!.push(item);
    });

    // Calculate discount for each product group
    for (const [productId, items] of productGroups) {
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const qualifyingSets = Math.floor(totalQuantity / config.buyQuantity);
      const freeQuantity = qualifyingSets * config.getQuantity;
      
      if (qualifyingSets > 0) {
        const itemPrice = items[0].price;
        
        if (config.discountType === 'free') {
          totalDiscount += freeQuantity * itemPrice;
          freeItems += freeQuantity;
        } else if (config.discountType === 'percentage') {
          totalDiscount += (freeQuantity * itemPrice * config.discountValue) / 100;
        } else if (config.discountType === 'fixed') {
          totalDiscount += Math.min(freeQuantity * config.discountValue, freeQuantity * itemPrice);
        }
      }
    }

    return {
      amount: totalDiscount,
      message: freeItems > 0 ? 
        `Buy ${config.buyQuantity}, get ${config.getQuantity} free! (${promotionName})` :
        `Buy ${config.buyQuantity}, get ${config.getQuantity} discount! (${promotionName})`
    };
  }

  private generateCouponCode(config: CouponGenerationConfig): string {
    const numbers = '0123456789';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const specialChars = '!@#$%&*';
    const similarChars = '0O1Il';

    let charset = '';
    if (config.includeNumbers) charset += numbers;
    if (config.includeLetters) charset += letters;
    if (config.includeSpecialChars) charset += specialChars;

    if (config.excludeSimilarChars) {
      charset = charset.split('').filter(char => !similarChars.includes(char)).join('');
    }

    const codeLength = config.length - (config.prefix?.length || 0) - (config.suffix?.length || 0);
    let code = '';

    for (let i = 0; i < codeLength; i++) {
      code += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return `${config.prefix || ''}${code}${config.suffix || ''}`;
  }
}