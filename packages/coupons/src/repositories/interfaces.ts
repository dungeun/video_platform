import { 
  Coupon, 
  CouponQuery, 
  CouponUsage, 
  UsageQuery,
  PromotionCampaign 
} from '../types';

export interface CouponRepository {
  create(data: Coupon): Promise<Coupon>;
  update(id: string, data: Partial<Coupon>): Promise<Coupon>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  findAll(query: CouponQuery): Promise<{ coupons: Coupon[]; total: number }>;
  incrementUsageCount(id: string): Promise<void>;
}

export interface CouponUsageRepository {
  create(data: CouponUsage): Promise<CouponUsage>;
  findById(id: string): Promise<CouponUsage | null>;
  findAll(query: UsageQuery): Promise<{ usages: CouponUsage[]; total: number }>;
  deleteByUserId(userId: string): Promise<void>;
  deleteByCouponId(couponId: string): Promise<void>;
}

export interface PromotionCampaignRepository {
  create(data: PromotionCampaign): Promise<PromotionCampaign>;
  update(id: string, data: Partial<PromotionCampaign>): Promise<PromotionCampaign>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<PromotionCampaign | null>;
  findAll(query: {
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ campaigns: PromotionCampaign[]; total: number }>;
}