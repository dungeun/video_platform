import { EventEmitter, Logger } from '@repo/core';
import { CouponEventType } from '../types';
import { CouponEntity } from '../entities';
export class ExpiryManagementService extends EventEmitter {
    constructor(repository, logger) {
        super();
        this.repository = repository;
        this.checkInterval = null;
        this.CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
        this.logger = logger || new Logger('ExpiryManagementService');
    }
    startAutoCheck(intervalMs) {
        const interval = intervalMs || this.CHECK_INTERVAL_MS;
        if (this.checkInterval) {
            this.stopAutoCheck();
        }
        this.checkInterval = setInterval(() => {
            this.checkExpiredCoupons().catch(error => {
                this.logger.error('Auto check failed', error);
            });
        }, interval);
        this.logger.info(`Started auto expiry check with interval: ${interval}ms`);
    }
    stopAutoCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            this.logger.info('Stopped auto expiry check');
        }
    }
    async checkExpiredCoupons() {
        try {
            const now = new Date();
            const { coupons } = await this.repository.findAll({ isActive: true });
            const expired = [];
            const expiringSoon = [];
            for (const coupon of coupons) {
                const entity = CouponEntity.fromJSON(coupon);
                if (entity.isExpired) {
                    await this.handleExpiredCoupon(coupon);
                    expired.push(coupon.id);
                }
                else {
                    const daysUntilExpiry = this.getDaysUntilExpiry(coupon.validUntil);
                    if (daysUntilExpiry <= 7) {
                        await this.handleExpiringSoonCoupon(coupon, daysUntilExpiry);
                        expiringSoon.push(coupon.id);
                    }
                }
            }
            this.logger.info(`Expiry check completed: ${expired.length} expired, ${expiringSoon.length} expiring soon`);
            return {
                success: true,
                data: { expired, expiringSoon }
            };
        }
        catch (error) {
            this.logger.error('Failed to check expired coupons', error);
            return {
                success: false,
                error: {
                    code: 'EXPIRY_CHECK_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to check expired coupons'
                }
            };
        }
    }
    async extendExpiry(couponId, newExpiryDate) {
        try {
            const coupon = await this.repository.findById(couponId);
            if (!coupon) {
                return {
                    success: false,
                    error: {
                        code: 'COUPON_NOT_FOUND',
                        message: 'Coupon not found'
                    }
                };
            }
            if (newExpiryDate <= coupon.validFrom) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_EXPIRY_DATE',
                        message: 'New expiry date must be after the valid from date'
                    }
                };
            }
            const updated = await this.repository.update(couponId, {
                validUntil: newExpiryDate,
                updatedAt: new Date()
            });
            this.emit('coupon:expiryExtended', {
                couponId,
                oldExpiry: coupon.validUntil,
                newExpiry: newExpiryDate
            });
            this.logger.info(`Extended expiry for coupon ${couponId} to ${newExpiryDate}`);
            return {
                success: true,
                data: updated
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'EXTEND_EXPIRY_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to extend expiry'
                }
            };
        }
    }
    async getExpiringCoupons(daysAhead = 7) {
        try {
            const now = new Date();
            const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
            const { coupons } = await this.repository.findAll({ isActive: true });
            const expiringCoupons = coupons.filter(coupon => {
                return coupon.validUntil >= now && coupon.validUntil <= futureDate;
            });
            return {
                success: true,
                data: expiringCoupons
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'GET_EXPIRING_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to get expiring coupons'
                }
            };
        }
    }
    async bulkExtendExpiry(couponIds, extensionDays) {
        try {
            const updated = [];
            const failed = [];
            for (const couponId of couponIds) {
                const coupon = await this.repository.findById(couponId);
                if (!coupon) {
                    failed.push(couponId);
                    continue;
                }
                const newExpiry = new Date(coupon.validUntil.getTime() + (extensionDays * 24 * 60 * 60 * 1000));
                const result = await this.extendExpiry(couponId, newExpiry);
                if (result.success) {
                    updated.push(couponId);
                }
                else {
                    failed.push(couponId);
                }
            }
            return {
                success: true,
                data: { updated, failed }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'BULK_EXTEND_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to bulk extend expiry'
                }
            };
        }
    }
    async handleExpiredCoupon(coupon) {
        try {
            // Deactivate the coupon
            await this.repository.update(coupon.id, {
                isActive: false,
                updatedAt: new Date()
            });
            // Emit expiry event
            this.emit('coupon:expired', {
                type: CouponEventType.EXPIRED,
                couponId: coupon.id,
                timestamp: new Date()
            });
            this.logger.info(`Coupon ${coupon.code} has expired and been deactivated`);
        }
        catch (error) {
            this.logger.error(`Failed to handle expired coupon ${coupon.id}`, error);
        }
    }
    async handleExpiringSoonCoupon(coupon, daysUntilExpiry) {
        // Emit warning event
        this.emit('coupon:expiringSoon', {
            couponId: coupon.id,
            code: coupon.code,
            daysUntilExpiry,
            expiryDate: coupon.validUntil
        });
        this.logger.warn(`Coupon ${coupon.code} expires in ${daysUntilExpiry} days`);
    }
    getDaysUntilExpiry(expiryDate) {
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
}
//# sourceMappingURL=ExpiryManagementService.js.map