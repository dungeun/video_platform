import { z } from 'zod';
import { TargetAudience, CampaignGoals } from '../types';

export const TargetAudienceSchema = z.object({
  userSegments: z.array(z.string()).optional(),
  minPurchaseHistory: z.number().int().nonnegative().optional(),
  location: z.array(z.string()).optional(),
  ageRange: z.object({
    min: z.number().int().positive(),
    max: z.number().int().positive()
  }).optional(),
  tags: z.array(z.string()).optional()
});

export const CampaignGoalsSchema = z.object({
  targetRevenue: z.number().positive().optional(),
  targetUsage: z.number().int().positive().optional(),
  targetNewCustomers: z.number().int().positive().optional(),
  conversionRate: z.number().min(0).max(100).optional()
});

export const PromotionCampaignSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  budget: z.number().positive().optional(),
  spentAmount: z.number().nonnegative().default(0),
  targetAudience: TargetAudienceSchema.optional(),
  goals: CampaignGoalsSchema.optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date"
});

export class PromotionCampaignEntity {
  private data: z.infer<typeof PromotionCampaignSchema>;

  constructor(data: z.infer<typeof PromotionCampaignSchema>) {
    this.data = PromotionCampaignSchema.parse(data);
  }

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get isRunning(): boolean {
    const now = new Date();
    return (
      this.data.isActive &&
      now >= this.data.startDate &&
      now <= this.data.endDate
    );
  }

  get hasEnded(): boolean {
    return new Date() > this.data.endDate;
  }

  get remainingBudget(): number | null {
    if (!this.data.budget) return null;
    return Math.max(0, this.data.budget - this.data.spentAmount);
  }

  get budgetUtilization(): number | null {
    if (!this.data.budget || this.data.budget === 0) return null;
    return (this.data.spentAmount / this.data.budget) * 100;
  }

  addSpending(amount: number): void {
    this.data.spentAmount += amount;
    this.data.updatedAt = new Date();
  }

  activate(): void {
    this.data.isActive = true;
    this.data.updatedAt = new Date();
  }

  deactivate(): void {
    this.data.isActive = false;
    this.data.updatedAt = new Date();
  }

  toJSON(): z.infer<typeof PromotionCampaignSchema> {
    return { ...this.data };
  }

  static fromJSON(data: unknown): PromotionCampaignEntity {
    return new PromotionCampaignEntity(PromotionCampaignSchema.parse(data));
  }
}