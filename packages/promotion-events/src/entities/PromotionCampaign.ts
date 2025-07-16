/**
 * Promotion Campaign Entity
 * Domain entity for promotion campaigns with business logic
 */

import { 
  PromotionCampaign as IPromotionCampaign,
  CampaignStatus,
  DiscountType,
  AudienceType,
  DiscountConfig,
  UsageConditions,
  TargetAudience,
  ValidationError
} from '../types';

export class PromotionCampaign implements IPromotionCampaign {
  public id: string;
  public name: string;
  public description?: string;
  public status: CampaignStatus;
  public discountConfig: DiscountConfig;
  public usageConditions: UsageConditions;
  public targetAudience: TargetAudience;
  public startDate: Date;
  public endDate: Date;
  public priority: number;
  public isStackable: boolean;
  public tags: string[];
  public usage: {
    totalUsed: number;
    totalSavings: number;
    uniqueUsers: number;
  };
  public createdAt: Date;
  public updatedAt: Date;
  public createdBy: string;
  public updatedBy?: string;

  constructor(data: IPromotionCampaign) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.status = data.status;
    this.discountConfig = data.discountConfig;
    this.usageConditions = data.usageConditions;
    this.targetAudience = data.targetAudience;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.priority = data.priority;
    this.isStackable = data.isStackable;
    this.tags = data.tags;
    this.usage = data.usage;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.createdBy = data.createdBy;
    this.updatedBy = data.updatedBy;

    this.validate();
  }

  /**
   * Validate the promotion campaign data
   */
  private validate(): void {
    if (!this.name?.trim()) {
      throw new ValidationError('Campaign name is required', 'name');
    }

    if (this.startDate >= this.endDate) {
      throw new ValidationError('Start date must be before end date', 'startDate');
    }

    this.validateDiscountConfig();
    this.validateUsageConditions();
    this.validateTargetAudience();
  }

  /**
   * Validate discount configuration
   */
  private validateDiscountConfig(): void {
    switch (this.discountConfig.type) {
      case DiscountType.PERCENTAGE:
        const percentageConfig = this.discountConfig as any;
        if (percentageConfig.percentage < 0 || percentageConfig.percentage > 100) {
          throw new ValidationError('Percentage must be between 0 and 100', 'discountConfig.percentage');
        }
        if (percentageConfig.maxAmount && percentageConfig.maxAmount < 0) {
          throw new ValidationError('Maximum amount must be positive', 'discountConfig.maxAmount');
        }
        break;

      case DiscountType.FIXED:
        const fixedConfig = this.discountConfig as any;
        if (fixedConfig.amount <= 0) {
          throw new ValidationError('Fixed discount amount must be positive', 'discountConfig.amount');
        }
        if (!fixedConfig.currency) {
          throw new ValidationError('Currency is required for fixed discount', 'discountConfig.currency');
        }
        break;

      case DiscountType.BUY_X_GET_Y:
        const bogoConfig = this.discountConfig as any;
        if (bogoConfig.buyQuantity <= 0) {
          throw new ValidationError('Buy quantity must be positive', 'discountConfig.buyQuantity');
        }
        if (bogoConfig.getQuantity <= 0) {
          throw new ValidationError('Get quantity must be positive', 'discountConfig.getQuantity');
        }
        if (bogoConfig.discountType && !['free', 'percentage', 'fixed'].includes(bogoConfig.discountType)) {
          throw new ValidationError('Invalid discount type for BOGO', 'discountConfig.discountType');
        }
        break;

      case DiscountType.FREE_SHIPPING:
        const shippingConfig = this.discountConfig as any;
        if (shippingConfig.minimumOrderAmount && shippingConfig.minimumOrderAmount < 0) {
          throw new ValidationError('Minimum order amount must be positive', 'discountConfig.minimumOrderAmount');
        }
        break;
    }
  }

  /**
   * Validate usage conditions
   */
  private validateUsageConditions(): void {
    if (this.usageConditions.minimumOrderAmount && this.usageConditions.minimumOrderAmount < 0) {
      throw new ValidationError('Minimum order amount must be positive', 'usageConditions.minimumOrderAmount');
    }

    if (this.usageConditions.maximumOrderAmount && this.usageConditions.maximumOrderAmount < 0) {
      throw new ValidationError('Maximum order amount must be positive', 'usageConditions.maximumOrderAmount');
    }

    if (this.usageConditions.minimumOrderAmount && 
        this.usageConditions.maximumOrderAmount &&
        this.usageConditions.minimumOrderAmount >= this.usageConditions.maximumOrderAmount) {
      throw new ValidationError('Minimum order amount must be less than maximum', 'usageConditions.minimumOrderAmount');
    }

    if (this.usageConditions.usageLimit && this.usageConditions.usageLimit <= 0) {
      throw new ValidationError('Usage limit must be positive', 'usageConditions.usageLimit');
    }

    if (this.usageConditions.userUsageLimit && this.usageConditions.userUsageLimit <= 0) {
      throw new ValidationError('User usage limit must be positive', 'usageConditions.userUsageLimit');
    }
  }

  /**
   * Validate target audience
   */
  private validateTargetAudience(): void {
    if (!Object.values(AudienceType).includes(this.targetAudience.type)) {
      throw new ValidationError('Invalid audience type', 'targetAudience.type');
    }

    if (this.targetAudience.type === AudienceType.SPECIFIC_USERS) {
      if (!this.targetAudience.userIds || this.targetAudience.userIds.length === 0) {
        throw new ValidationError('User IDs required for specific users audience', 'targetAudience.userIds');
      }
    }

    if (this.targetAudience.type === AudienceType.USER_GROUPS) {
      if (!this.targetAudience.userGroupIds || this.targetAudience.userGroupIds.length === 0) {
        throw new ValidationError('User group IDs required for user groups audience', 'targetAudience.userGroupIds');
      }
    }
  }

  /**
   * Check if the campaign is currently active
   */
  public isActive(): boolean {
    const now = new Date();
    return this.status === CampaignStatus.ACTIVE && 
           this.startDate <= now && 
           this.endDate >= now;
  }

  /**
   * Check if the campaign is scheduled to start
   */
  public isScheduled(): boolean {
    const now = new Date();
    return this.status === CampaignStatus.SCHEDULED && this.startDate > now;
  }

  /**
   * Check if the campaign has ended
   */
  public hasEnded(): boolean {
    const now = new Date();
    return this.endDate < now;
  }

  /**
   * Check if the campaign has reached its usage limit
   */
  public hasReachedUsageLimit(): boolean {
    if (!this.usageConditions.usageLimit) return false;
    return this.usage.totalUsed >= this.usageConditions.usageLimit;
  }

  /**
   * Check if a user has reached their usage limit for this campaign
   */
  public hasUserReachedLimit(userUsageCount: number): boolean {
    if (!this.usageConditions.userUsageLimit) return false;
    return userUsageCount >= this.usageConditions.userUsageLimit;
  }

  /**
   * Activate the campaign
   */
  public activate(): void {
    if (this.hasEnded()) {
      throw new ValidationError('Cannot activate expired campaign', 'endDate');
    }

    const now = new Date();
    if (this.startDate > now) {
      this.status = CampaignStatus.SCHEDULED;
    } else {
      this.status = CampaignStatus.ACTIVE;
    }
    
    this.updatedAt = new Date();
  }

  /**
   * Deactivate the campaign
   */
  public deactivate(): void {
    this.status = CampaignStatus.PAUSED;
    this.updatedAt = new Date();
  }

  /**
   * End the campaign
   */
  public end(): void {
    this.status = CampaignStatus.ENDED;
    this.updatedAt = new Date();
  }

  /**
   * Cancel the campaign
   */
  public cancel(): void {
    this.status = CampaignStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  /**
   * Update usage statistics
   */
  public recordUsage(discountAmount: number, userId?: string): void {
    this.usage.totalUsed++;
    this.usage.totalSavings += discountAmount;
    
    // In a real implementation, we'd track unique users properly
    if (userId) {
      this.usage.uniqueUsers++;
    }
    
    this.updatedAt = new Date();
  }

  /**
   * Get campaign performance metrics
   */
  public getPerformanceMetrics(): {
    averageDiscount: number;
    conversionRate: number;
    totalSavings: number;
    usageRate: number;
  } {
    const averageDiscount = this.usage.totalUsed > 0 ? 
      this.usage.totalSavings / this.usage.totalUsed : 0;
    
    const usageRate = this.usageConditions.usageLimit ? 
      (this.usage.totalUsed / this.usageConditions.usageLimit) * 100 : 0;

    return {
      averageDiscount,
      conversionRate: 0, // Would need impression data to calculate
      totalSavings: this.usage.totalSavings,
      usageRate
    };
  }

  /**
   * Get display-friendly discount description
   */
  public getDiscountDescription(): string {
    switch (this.discountConfig.type) {
      case DiscountType.PERCENTAGE:
        const percentageConfig = this.discountConfig as any;
        return `${percentageConfig.percentage}% off${percentageConfig.maxAmount ? ` (max ${percentageConfig.maxAmount})` : ''}`;
      
      case DiscountType.FIXED:
        const fixedConfig = this.discountConfig as any;
        return `${fixedConfig.amount} ${fixedConfig.currency} off`;
      
      case DiscountType.BUY_X_GET_Y:
        const bogoConfig = this.discountConfig as any;
        return `Buy ${bogoConfig.buyQuantity}, get ${bogoConfig.getQuantity} ${bogoConfig.discountType || 'free'}`;
      
      case DiscountType.FREE_SHIPPING:
        const shippingConfig = this.discountConfig as any;
        return `Free shipping${shippingConfig.minimumOrderAmount ? ` on orders over ${shippingConfig.minimumOrderAmount}` : ''}`;
      
      default:
        return 'Special discount';
    }
  }

  /**
   * Clone the campaign with a new ID
   */
  public clone(newName?: string): PromotionCampaign {
    const clonedData: IPromotionCampaign = {
      ...this,
      id: '', // Will be set by the service
      name: newName || `${this.name} (Copy)`,
      status: CampaignStatus.DRAFT,
      usage: {
        totalUsed: 0,
        totalSavings: 0,
        uniqueUsers: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return new PromotionCampaign(clonedData);
  }

  /**
   * Convert to JSON representation
   */
  public toJSON(): IPromotionCampaign {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      status: this.status,
      discountConfig: this.discountConfig,
      usageConditions: this.usageConditions,
      targetAudience: this.targetAudience,
      startDate: this.startDate,
      endDate: this.endDate,
      priority: this.priority,
      isStackable: this.isStackable,
      tags: this.tags,
      usage: this.usage,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy
    };
  }
}