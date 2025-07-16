import { z } from 'zod';
import { CouponType, DiscountType } from '../types';
export const CouponSchema = z.object({
    id: z.string(),
    code: z.string().min(3).max(50).toUpperCase(),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    type: z.nativeEnum(CouponType),
    discountType: z.nativeEnum(DiscountType),
    discountValue: z.number().positive(),
    minPurchaseAmount: z.number().nonnegative().optional(),
    maxDiscountAmount: z.number().positive().optional(),
    validFrom: z.date(),
    validUntil: z.date(),
    usageLimit: z.number().int().positive().optional(),
    usageCount: z.number().int().nonnegative().default(0),
    usageLimitPerUser: z.number().int().positive().optional(),
    isActive: z.boolean().default(true),
    campaignId: z.string().optional(),
    productIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    excludeProductIds: z.array(z.string()).optional(),
    excludeCategoryIds: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
    createdAt: z.date(),
    updatedAt: z.date()
}).refine(data => data.validUntil > data.validFrom, {
    message: "Valid until date must be after valid from date"
}).refine(data => {
    if (data.discountType === DiscountType.PERCENTAGE) {
        return data.discountValue <= 100;
    }
    return true;
}, {
    message: "Percentage discount cannot exceed 100%"
});
export class CouponEntity {
    constructor(data) {
        this.data = CouponSchema.parse(data);
    }
    get id() {
        return this.data.id;
    }
    get code() {
        return this.data.code;
    }
    get isValid() {
        const now = new Date();
        return (this.data.isActive &&
            now >= this.data.validFrom &&
            now <= this.data.validUntil &&
            (!this.data.usageLimit || this.data.usageCount < this.data.usageLimit));
    }
    get isExpired() {
        return new Date() > this.data.validUntil;
    }
    get hasReachedLimit() {
        return !!this.data.usageLimit && this.data.usageCount >= this.data.usageLimit;
    }
    get remainingUsage() {
        if (!this.data.usageLimit)
            return null;
        return Math.max(0, this.data.usageLimit - this.data.usageCount);
    }
    incrementUsage() {
        this.data.usageCount++;
        this.data.updatedAt = new Date();
    }
    activate() {
        this.data.isActive = true;
        this.data.updatedAt = new Date();
    }
    deactivate() {
        this.data.isActive = false;
        this.data.updatedAt = new Date();
    }
    toJSON() {
        return { ...this.data };
    }
    static fromJSON(data) {
        return new CouponEntity(CouponSchema.parse(data));
    }
}
//# sourceMappingURL=Coupon.js.map