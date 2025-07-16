import { EventEmitter } from '@repo/core';
import { 
  PromotionCampaign, 
  CampaignPerformance,
  ServiceResponse,
  Coupon,
  UsageStats
} from '../types';
import { PromotionCampaignEntity } from '../entities';
import { 
  PromotionCampaignRepository, 
  CouponRepository,
  CouponUsageRepository 
} from '../repositories/interfaces';

export class PromotionCampaignService extends EventEmitter {
  constructor(
    private campaignRepository: PromotionCampaignRepository,
    private couponRepository: CouponRepository,
    private usageRepository: CouponUsageRepository
  ) {
    super();
  }

  async create(
    data: Omit<PromotionCampaign, 'id' | 'spentAmount' | 'createdAt' | 'updatedAt'>
  ): Promise<ServiceResponse<PromotionCampaign>> {
    try {
      const campaign = await this.campaignRepository.create({
        ...data,
        id: this.generateId(),
        spentAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      this.emit('campaign:created', { campaignId: campaign.id });

      return {
        success: true,
        data: campaign
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CAMPAIGN_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create campaign'
        }
      };
    }
  }

  async update(
    id: string,
    data: Partial<PromotionCampaign>
  ): Promise<ServiceResponse<PromotionCampaign>> {
    try {
      const existing = await this.campaignRepository.findById(id);
      if (!existing) {
        return {
          success: false,
          error: {
            code: 'CAMPAIGN_NOT_FOUND',
            message: 'Campaign not found'
          }
        };
      }

      const updated = await this.campaignRepository.update(id, {
        ...data,
        updatedAt: new Date()
      });

      this.emit('campaign:updated', { campaignId: id });

      return {
        success: true,
        data: updated
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CAMPAIGN_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update campaign'
        }
      };
    }
  }

  async findById(id: string): Promise<ServiceResponse<PromotionCampaign>> {
    try {
      const campaign = await this.campaignRepository.findById(id);
      if (!campaign) {
        return {
          success: false,
          error: {
            code: 'CAMPAIGN_NOT_FOUND',
            message: 'Campaign not found'
          }
        };
      }

      return {
        success: true,
        data: campaign
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CAMPAIGN_FIND_ERROR',
          message: error instanceof Error ? error.message : 'Failed to find campaign'
        }
      };
    }
  }

  async getCampaignPerformance(id: string): Promise<ServiceResponse<CampaignPerformance>> {
    try {
      const campaign = await this.campaignRepository.findById(id);
      if (!campaign) {
        return {
          success: false,
          error: {
            code: 'CAMPAIGN_NOT_FOUND',
            message: 'Campaign not found'
          }
        };
      }

      // Get all coupons for this campaign
      const { coupons } = await this.couponRepository.findAll({ campaignId: id });
      
      // Get usage stats for all campaign coupons
      let totalRevenue = 0;
      let totalUsage = 0;
      let totalDiscountGiven = 0;

      for (const coupon of coupons) {
        const stats = await this.getUsageStats(coupon.id);
        totalRevenue += stats.revenueGenerated;
        totalUsage += stats.totalUsage;
        totalDiscountGiven += stats.totalDiscountGiven;
      }

      const roi = campaign.budget && campaign.spentAmount > 0
        ? ((totalRevenue - campaign.spentAmount) / campaign.spentAmount) * 100
        : 0;

      const conversionRate = totalUsage > 0
        ? (totalUsage / coupons.length) * 100
        : 0;

      const goalAchievement = this.calculateGoalAchievement(
        campaign,
        { totalRevenue, totalUsage, conversionRate }
      );

      const performance: CampaignPerformance = {
        roi,
        conversionRate,
        totalRevenue,
        totalCost: campaign.spentAmount,
        goalAchievement
      };

      return {
        success: true,
        data: performance
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PERFORMANCE_CALC_ERROR',
          message: error instanceof Error ? error.message : 'Failed to calculate performance'
        }
      };
    }
  }

  async getCampaignCoupons(campaignId: string): Promise<ServiceResponse<Coupon[]>> {
    try {
      const { coupons } = await this.couponRepository.findAll({ campaignId });
      
      return {
        success: true,
        data: coupons
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COUPONS_FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch campaign coupons'
        }
      };
    }
  }

  async addSpending(campaignId: string, amount: number): Promise<ServiceResponse<void>> {
    try {
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        return {
          success: false,
          error: {
            code: 'CAMPAIGN_NOT_FOUND',
            message: 'Campaign not found'
          }
        };
      }

      const entity = PromotionCampaignEntity.fromJSON(campaign);
      
      // Check budget limit
      if (campaign.budget && entity.remainingBudget !== null && amount > entity.remainingBudget) {
        return {
          success: false,
          error: {
            code: 'BUDGET_EXCEEDED',
            message: 'Spending would exceed campaign budget'
          }
        };
      }

      entity.addSpending(amount);
      await this.campaignRepository.update(campaignId, entity.toJSON());

      this.emit('campaign:spending', { campaignId, amount });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SPENDING_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update spending'
        }
      };
    }
  }

  private async getUsageStats(couponId: string): Promise<UsageStats> {
    const { usages } = await this.usageRepository.findAll({ couponId });
    
    const uniqueUsers = new Set(usages.map(u => u.userId)).size;
    const totalDiscountGiven = usages.reduce((sum, u) => sum + u.discountAmount, 0);
    const revenueGenerated = usages.reduce((sum, u) => sum + u.orderTotal, 0);
    const averageOrderValue = usages.length > 0 
      ? revenueGenerated / usages.length 
      : 0;

    return {
      totalUsage: usages.length,
      uniqueUsers,
      totalDiscountGiven,
      averageOrderValue,
      conversionRate: 0, // Would need additional data to calculate
      revenueGenerated
    };
  }

  private calculateGoalAchievement(
    campaign: PromotionCampaign,
    metrics: { totalRevenue: number; totalUsage: number; conversionRate: number }
  ): Record<string, number> {
    const achievement: Record<string, number> = {};

    if (campaign.goals?.targetRevenue) {
      achievement.revenueGoal = (metrics.totalRevenue / campaign.goals.targetRevenue) * 100;
    }

    if (campaign.goals?.targetUsage) {
      achievement.usageGoal = (metrics.totalUsage / campaign.goals.targetUsage) * 100;
    }

    if (campaign.goals?.conversionRate) {
      achievement.conversionGoal = (metrics.conversionRate / campaign.goals.conversionRate) * 100;
    }

    return achievement;
  }

  private generateId(): string {
    return `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}