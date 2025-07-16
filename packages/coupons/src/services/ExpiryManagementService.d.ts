import { EventEmitter, Logger } from '@company/core';
import { Coupon, ServiceResponse } from '../types';
import { CouponRepository } from '../repositories/interfaces';
export declare class ExpiryManagementService extends EventEmitter {
    private repository;
    private logger;
    private checkInterval;
    private readonly CHECK_INTERVAL_MS;
    constructor(repository: CouponRepository, logger?: Logger);
    startAutoCheck(intervalMs?: number): void;
    stopAutoCheck(): void;
    checkExpiredCoupons(): Promise<ServiceResponse<{
        expired: string[];
        expiringSoon: string[];
    }>>;
    extendExpiry(couponId: string, newExpiryDate: Date): Promise<ServiceResponse<Coupon>>;
    getExpiringCoupons(daysAhead?: number): Promise<ServiceResponse<Coupon[]>>;
    bulkExtendExpiry(couponIds: string[], extensionDays: number): Promise<ServiceResponse<{
        updated: string[];
        failed: string[];
    }>>;
    private handleExpiredCoupon;
    private handleExpiringSoonCoupon;
    private getDaysUntilExpiry;
}
//# sourceMappingURL=ExpiryManagementService.d.ts.map