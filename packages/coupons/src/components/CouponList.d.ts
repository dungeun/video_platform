import React from 'react';
import { Coupon } from '../types';
interface CouponListProps {
    coupons: Coupon[];
    onSelect?: (coupon: Coupon) => void;
    onRemove?: (coupon: Coupon) => void;
    selectedCouponId?: string;
    showDetails?: boolean;
    emptyMessage?: string;
    className?: string;
}
export declare const CouponList: React.FC<CouponListProps>;
export {};
//# sourceMappingURL=CouponList.d.ts.map