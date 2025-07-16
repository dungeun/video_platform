import { EventEmitter } from '@company/core';
import { PromotionCampaignEntity } from '../entities';
export class PromotionCampaignService extends EventEmitter {
    constructor(campaignRepository, couponRepository, usageRepository) {
        super();
        this.campaignRepository = campaignRepository;
        this.couponRepository = couponRepository;
        this.usageRepository = usageRepository;
    }
    async create(data) {
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'CAMPAIGN_CREATE_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to create campaign'
                }
            };
        }
    }
    async update(id, data) {
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'CAMPAIGN_UPDATE_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to update campaign'
                }
            };
        }
    }
    async findById(id) {
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'CAMPAIGN_FIND_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to find campaign'
                }
            };
        }
    }
    async getCampaignPerformance(id) {
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
            const goalAchievement = this.calculateGoalAchievement(campaign, { totalRevenue, totalUsage, conversionRate });
            const performance = {
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'PERFORMANCE_CALC_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to calculate performance'
                }
            };
        }
    }
    async getCampaignCoupons(campaignId) {
        try {
            const { coupons } = await this.couponRepository.findAll({ campaignId });
            return {
                success: true,
                data: coupons
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'COUPONS_FETCH_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to fetch campaign coupons'
                }
            };
        }
    }
    async addSpending(campaignId, amount) {
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'SPENDING_UPDATE_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to update spending'
                }
            };
        }
    }
    async getUsageStats(couponId) {
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
    calculateGoalAchievement(campaign, metrics) {
        const achievement = {};
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
    generateId() {
        return `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=PromotionCampaignService.js.map