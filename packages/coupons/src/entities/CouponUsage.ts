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
  private data: z.infer<typeof CouponUsageSchema>;

  constructor(data: z.infer<typeof CouponUsageSchema>) {
    this.data = CouponUsageSchema.parse(data);
  }

  get id(): string {
    return this.data.id;
  }

  get couponId(): string {
    return this.data.couponId;
  }

  get userId(): string {
    return this.data.userId;
  }

  get discountPercentage(): number {
    return (this.data.discountAmount / this.data.orderTotal) * 100;
  }

  get savedAmount(): number {
    return this.data.discountAmount;
  }

  toJSON(): z.infer<typeof CouponUsageSchema> {
    return { ...this.data };
  }

  static fromJSON(data: unknown): CouponUsageEntity {
    return new CouponUsageEntity(CouponUsageSchema.parse(data));
  }
}