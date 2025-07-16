import { EventEmitter } from '@repo/core';
import { CouponEventType } from '../types';
export class UsageTrackingService extends EventEmitter {
    constructor(usageRepository, couponRepository) {
        super();
        this.usageRepository = usageRepository;
        this.couponRepository = couponRepository;
    }
    async trackUsage(data) {
        try {
            // Verify coupon exists
            const coupon = await this.couponRepository.findById(data.couponId);
            if (!coupon) {
                return {
                    success: false,
                    error: {
                        code: 'COUPON_NOT_FOUND',
                        message: 'Coupon not found'
                    }
                };
            }
            // Create usage record
            const usage = await this.usageRepository.create({
                ...data,
                id: this.generateId(),
                usedAt: new Date()
            });
            // Update coupon usage count
            await this.couponRepository.incrementUsageCount(data.couponId);
            // Emit event
            this.emit('coupon:used', {
                type: CouponEventType.USED,
                couponId: data.couponId,
                userId: data.userId,
                timestamp: new Date(),
                metadata: {
                    orderId: data.orderId,
                    discountAmount: data.discountAmount
                }
            });
            // Check if limit reached
            const updatedCoupon = await this.couponRepository.findById(data.couponId);
            if (updatedCoupon && updatedCoupon.usageLimit &&
                updatedCoupon.usageCount >= updatedCoupon.usageLimit) {
                this.emit('coupon:limitReached', {
                    type: CouponEventType.LIMIT_REACHED,
                    couponId: data.couponId,
                    timestamp: new Date()
                });
            }
            return {
                success: true,
                data: usage
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'USAGE_TRACK_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to track usage'
                }
            };
        }
    }
    async getUsageStats(couponId) {
        try {
            const { usages } = await this.usageRepository.findAll({ couponId });
            if (usages.length === 0) {
                return {
                    success: true,
                    data: {
                        totalUsage: 0,
                        uniqueUsers: 0,
                        totalDiscountGiven: 0,
                        averageOrderValue: 0,
                        conversionRate: 0,
                        revenueGenerated: 0
                    }
                };
            }
            const uniqueUsers = new Set(usages.map(u => u.userId)).size;
            const totalDiscountGiven = usages.reduce((sum, u) => sum + u.discountAmount, 0);
            const revenueGenerated = usages.reduce((sum, u) => sum + u.orderTotal, 0);
            const averageOrderValue = revenueGenerated / usages.length;
            // Calculate conversion rate (would need additional data in real scenario)
            const conversionRate = this.calculateConversionRate(usages);
            const stats = {
                totalUsage: usages.length,
                uniqueUsers,
                totalDiscountGiven,
                averageOrderValue,
                conversionRate,
                revenueGenerated
            };
            return {
                success: true,
                data: stats
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'STATS_CALC_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to calculate stats'
                }
            };
        }
    }
    async getUserUsageHistory(userId, query = {}) {
        try {
            const result = await this.usageRepository.findAll({
                ...query,
                userId
            });
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'USAGE_HISTORY_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to get usage history'
                }
            };
        }
    }
    async getUsageByDateRange(startDate, endDate, couponId) {
        try {
            const query = {
                startDate,
                endDate,
                ...(couponId && { couponId })
            };
            const { usages } = await this.usageRepository.findAll(query);
            // Calculate stats for the period
            const uniqueUsers = new Set(usages.map(u => u.userId)).size;
            const totalDiscountGiven = usages.reduce((sum, u) => sum + u.discountAmount, 0);
            const revenueGenerated = usages.reduce((sum, u) => sum + u.orderTotal, 0);
            const averageOrderValue = usages.length > 0 ? revenueGenerated / usages.length : 0;
            const stats = {
                totalUsage: usages.length,
                uniqueUsers,
                totalDiscountGiven,
                averageOrderValue,
                conversionRate: this.calculateConversionRate(usages),
                revenueGenerated
            };
            return {
                success: true,
                data: { usages, stats }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'DATE_RANGE_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to get usage by date range'
                }
            };
        }
    }
    async getTopUsers(couponId, limit = 10) {
        try {
            const { usages } = await this.usageRepository.findAll({ couponId });
            const userStats = new Map();
            for (const usage of usages) {
                const current = userStats.get(usage.userId) || { count: 0, saved: 0 };
                userStats.set(usage.userId, {
                    count: current.count + 1,
                    saved: current.saved + usage.discountAmount
                });
            }
            const topUsers = Array.from(userStats.entries())
                .map(([userId, stats]) => ({
                userId,
                usageCount: stats.count,
                totalSaved: stats.saved
            }))
                .sort((a, b) => b.usageCount - a.usageCount)
                .slice(0, limit);
            return {
                success: true,
                data: topUsers
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'TOP_USERS_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to get top users'
                }
            };
        }
    }
    calculateConversionRate(usages) {
        // In a real scenario, this would compare against total views/attempts
        // For now, return a placeholder based on usage patterns
        if (usages.length === 0)
            return 0;
        const uniqueUsers = new Set(usages.map(u => u.userId)).size;
        const avgUsagePerUser = usages.length / uniqueUsers;
        // Higher usage per user indicates better conversion
        return Math.min(avgUsagePerUser * 20, 100);
    }
    generateId() {
        return `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=UsageTrackingService.js.map