export interface Coupon {
    id: string;
    code: string;
    name: string;
    description?: string;
    type: CouponType;
    discountType: DiscountType;
    discountValue: number;
    minPurchaseAmount?: number;
    maxDiscountAmount?: number;
    validFrom: Date;
    validUntil: Date;
    usageLimit?: number;
    usageCount: number;
    usageLimitPerUser?: number;
    isActive: boolean;
    campaignId?: string;
    productIds?: string[];
    categoryIds?: string[];
    excludeProductIds?: string[];
    excludeCategoryIds?: string[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum CouponType {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE",
    SINGLE_USE = "SINGLE_USE",
    REFERRAL = "REFERRAL",
    FIRST_PURCHASE = "FIRST_PURCHASE",
    LOYALTY = "LOYALTY"
}
export declare enum DiscountType {
    PERCENTAGE = "PERCENTAGE",
    FIXED = "FIXED",
    FREE_SHIPPING = "FREE_SHIPPING",
    BUY_X_GET_Y = "BUY_X_GET_Y"
}
export interface PromotionCampaign {
    id: string;
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    budget?: number;
    spentAmount: number;
    targetAudience?: TargetAudience;
    goals?: CampaignGoals;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface TargetAudience {
    userSegments?: string[];
    minPurchaseHistory?: number;
    location?: string[];
    ageRange?: {
        min: number;
        max: number;
    };
    tags?: string[];
}
export interface CampaignGoals {
    targetRevenue?: number;
    targetUsage?: number;
    targetNewCustomers?: number;
    conversionRate?: number;
}
export interface CouponUsage {
    id: string;
    couponId: string;
    userId: string;
    orderId: string;
    discountAmount: number;
    orderTotal: number;
    usedAt: Date;
    metadata?: Record<string, any>;
}
export interface UsageStats {
    totalUsage: number;
    uniqueUsers: number;
    totalDiscountGiven: number;
    averageOrderValue: number;
    conversionRate: number;
    revenueGenerated: number;
}
export interface ValidationContext {
    userId: string;
    orderTotal: number;
    products?: Array<{
        id: string;
        categoryId: string;
        quantity: number;
        price: number;
    }>;
    shippingAddress?: {
        country: string;
        state?: string;
        city?: string;
        postalCode?: string;
    };
}
export interface ValidationResult {
    isValid: boolean;
    errors?: ValidationError[];
    warnings?: string[];
    discountAmount?: number;
    finalAmount?: number;
}
export interface ValidationError {
    code: string;
    message: string;
    field?: string;
}
export interface DiscountCalculation {
    couponCode: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    appliedRules: AppliedRule[];
}
export interface AppliedRule {
    ruleType: string;
    description: string;
    discountAmount: number;
}
export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
export interface CouponQuery {
    isActive?: boolean;
    type?: CouponType;
    campaignId?: string;
    validAt?: Date;
    code?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'usageCount' | 'validUntil';
    sortOrder?: 'asc' | 'desc';
}
export interface UsageQuery {
    couponId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}
export interface CouponEvent {
    type: CouponEventType;
    couponId: string;
    userId?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export declare enum CouponEventType {
    CREATED = "COUPON_CREATED",
    UPDATED = "COUPON_UPDATED",
    ACTIVATED = "COUPON_ACTIVATED",
    DEACTIVATED = "COUPON_DEACTIVATED",
    USED = "COUPON_USED",
    EXPIRED = "COUPON_EXPIRED",
    LIMIT_REACHED = "COUPON_LIMIT_REACHED"
}
export interface CouponBulkOperation {
    operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE';
    couponIds?: string[];
    data?: Partial<Coupon>;
}
export interface CouponReport {
    period: {
        start: Date;
        end: Date;
    };
    summary: {
        totalCoupons: number;
        activeCoupons: number;
        expiredCoupons: number;
        totalUsage: number;
        totalDiscountGiven: number;
        averageDiscountPerUse: number;
    };
    topCoupons: Array<{
        coupon: Coupon;
        stats: UsageStats;
    }>;
    campaigns: Array<{
        campaign: PromotionCampaign;
        performance: CampaignPerformance;
    }>;
}
export interface CampaignPerformance {
    roi: number;
    conversionRate: number;
    totalRevenue: number;
    totalCost: number;
    goalAchievement: Record<string, number>;
}
//# sourceMappingURL=index.d.ts.map