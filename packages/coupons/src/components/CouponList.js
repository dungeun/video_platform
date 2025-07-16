import { jsx as _jsx } from "react/jsx-runtime";
import { CouponDisplay } from './CouponDisplay';
export const CouponList = ({ coupons, onSelect, onRemove, selectedCouponId, showDetails = false, emptyMessage = 'No coupons available', className = '' }) => {
    if (coupons.length === 0) {
        return (_jsx("div", { className: `coupon-list-empty text-center py-8 ${className}`, children: _jsx("p", { className: "text-gray-500", children: emptyMessage }) }));
    }
    return (_jsx("div", { className: `coupon-list space-y-3 ${className}`, children: coupons.map((coupon) => (_jsx("div", { className: `
            cursor-pointer transition-all
            ${selectedCouponId === coupon.id ? 'ring-2 ring-blue-500 rounded-lg' : ''}
            ${onSelect ? 'hover:scale-[1.02]' : ''}
          `, onClick: () => onSelect?.(coupon), children: _jsx(CouponDisplay, { coupon: coupon, showDetails: showDetails, onRemove: onRemove ? () => onRemove(coupon) : undefined }) }, coupon.id))) }));
};
//# sourceMappingURL=CouponList.js.map