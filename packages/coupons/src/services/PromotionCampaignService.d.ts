import { EventEmitter } from '@repo/core';
import { PromotionCampaign, CampaignPerformance, ServiceResponse, Coupon } from '../types';
import { PromotionCampaignRepository, CouponRepository, CouponUsageRepository } from '../repositories/interfaces';
export declare class PromotionCampaignService extends EventEmitter {
    private campaignRepository;
    private couponRepository;
    private usageRepository;
    constructor(campaignRepository: PromotionCampaignRepository, couponRepository: CouponRepository, usageRepository: CouponUsageRepository);
    create(data: Omit<PromotionCampaign, 'id' | 'spentAmount' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<PromotionCampaign>>;
    update(id: string, data: Partial<PromotionCampaign>): Promise<ServiceResponse<PromotionCampaign>>;
    findById(id: string): Promise<ServiceResponse<PromotionCampaign>>;
    getCampaignPerformance(id: string): Promise<ServiceResponse<CampaignPerformance>>;
    getCampaignCoupons(campaignId: string): Promise<ServiceResponse<Coupon[]>>;
    addSpending(campaignId: string, amount: number): Promise<ServiceResponse<void>>;
    private getUsageStats;
    private calculateGoalAchievement;
    private generateId;
}
//# sourceMappingURL=PromotionCampaignService.d.ts.map