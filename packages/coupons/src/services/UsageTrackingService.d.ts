import { EventEmitter } from '@repo/core';
import { CouponUsage, UsageStats, UsageQuery, ServiceResponse } from '../types';
import { CouponUsageRepository, CouponRepository } from '../repositories/interfaces';
export declare class UsageTrackingService extends EventEmitter {
    private usageRepository;
    private couponRepository;
    constructor(usageRepository: CouponUsageRepository, couponRepository: CouponRepository);
    trackUsage(data: Omit<CouponUsage, 'id' | 'usedAt'>): Promise<ServiceResponse<CouponUsage>>;
    getUsageStats(couponId: string): Promise<ServiceResponse<UsageStats>>;
    getUserUsageHistory(userId: string, query?: UsageQuery): Promise<ServiceResponse<{
        usages: CouponUsage[];
        total: number;
    }>>;
    getUsageByDateRange(startDate: Date, endDate: Date, couponId?: string): Promise<ServiceResponse<{
        usages: CouponUsage[];
        stats: UsageStats;
    }>>;
    getTopUsers(couponId: string, limit?: number): Promise<ServiceResponse<Array<{
        userId: string;
        usageCount: number;
        totalSaved: number;
    }>>>;
    private calculateConversionRate;
    private generateId;
}
//# sourceMappingURL=UsageTrackingService.d.ts.map