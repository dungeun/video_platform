import { z } from 'zod';
export const CouponUsageSchema = z.object({
    id: z.string(),
    couponId: z.string(),
    userId: z.string(),
    orderId: z.string(),
    discountAmount: z.number().positive(),
    orderTotal: z.number().positive(),
    usedAt: z.date(),
    metadata: z.record(z.any()).optional()
});
export class CouponUsageEntity {
    constructor(data) {
        this.data = CouponUsageSchema.parse(data);
    }
    get id() {
        return this.data.id;
    }
    get couponId() {
        return this.data.couponId;
    }
    get userId() {
        return this.data.userId;
    }
    get discountPercentage() {
        return (this.data.discountAmount / this.data.orderTotal) * 100;
    }
    get savedAmount() {
        return this.data.discountAmount;
    }
    toJSON() {
        return { ...this.data };
    }
    static fromJSON(data) {
        return new CouponUsageEntity(CouponUsageSchema.parse(data));
    }
}
//# sourceMappingURL=CouponUsage.js.map