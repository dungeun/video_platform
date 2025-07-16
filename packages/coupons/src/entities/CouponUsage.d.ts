import { z } from 'zod';
export declare const CouponUsageSchema: z.ZodObject<{
    id: z.ZodString;
    couponId: z.ZodString;
    userId: z.ZodString;
    orderId: z.ZodString;
    discountAmount: z.ZodNumber;
    orderTotal: z.ZodNumber;
    usedAt: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    couponId: string;
    orderId: string;
    discountAmount: number;
    orderTotal: number;
    usedAt: Date;
    metadata?: Record<string, any> | undefined;
}, {
    id: string;
    userId: string;
    couponId: string;
    orderId: string;
    discountAmount: number;
    orderTotal: number;
    usedAt: Date;
    metadata?: Record<string, any> | undefined;
}>;
export declare class CouponUsageEntity {
    private data;
    constructor(data: z.infer<typeof CouponUsageSchema>);
    get id(): string;
    get couponId(): string;
    get userId(): string;
    get discountPercentage(): number;
    get savedAmount(): number;
    toJSON(): z.infer<typeof CouponUsageSchema>;
    static fromJSON(data: unknown): CouponUsageEntity;
}
//# sourceMappingURL=CouponUsage.d.ts.map