import { Coupon, CouponType, DiscountType } from '../types';
export declare function generateCouponCode(prefix?: string, length?: number): string;
export declare function formatCouponCode(code: string): string;
export declare function isCouponValid(coupon: Coupon): boolean;
export declare function getCouponStatus(coupon: Coupon): {
    status: 'active' | 'expired' | 'inactive' | 'exhausted' | 'scheduled';
    message: string;
};
export declare function getDiscountTypeLabel(type: DiscountType): string;
export declare function getCouponTypeLabel(type: CouponType): string;
export declare function calculateDiscountedPrice(originalPrice: number, discountType: DiscountType, discountValue: number, maxDiscount?: number): number;
export declare function getDaysUntilExpiry(validUntil: Date | string): number;
export declare function formatExpiryText(validUntil: Date | string): string;
export declare function sortCouponsByPriority(coupons: Coupon[]): Coupon[];
//# sourceMappingURL=couponHelpers.d.ts.map