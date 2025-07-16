import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { DiscountType } from '../types';
import { format } from 'date-fns';
export const CouponDisplay = ({ coupon, showDetails = false, onRemove, className = '' }) => {
    const getDiscountText = () => {
        switch (coupon.discountType) {
            case DiscountType.PERCENTAGE:
                return `${coupon.discountValue}% OFF`;
            case DiscountType.FIXED:
                return `$${coupon.discountValue} OFF`;
            case DiscountType.FREE_SHIPPING:
                return 'FREE SHIPPING';
            case DiscountType.BUY_X_GET_Y:
                return 'BUY X GET Y';
            default:
                return 'DISCOUNT';
        }
    };
    const isExpired = new Date() > new Date(coupon.validUntil);
    const isNotYetValid = new Date() < new Date(coupon.validFrom);
    return (_jsx("div", { className: `coupon-display ${className}`, children: _jsx("div", { className: "bg-white border border-gray-200 rounded-lg p-4 shadow-sm", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-mono text-lg font-bold text-gray-900", children: coupon.code }), !coupon.isActive && (_jsx("span", { className: "px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded", children: "Inactive" })), isExpired && (_jsx("span", { className: "px-2 py-1 text-xs font-medium bg-red-100 text-red-600 rounded", children: "Expired" })), isNotYetValid && (_jsx("span", { className: "px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-600 rounded", children: "Not Yet Valid" }))] }), _jsx("p", { className: "mt-1 text-xl font-semibold text-blue-600", children: getDiscountText() }), coupon.name && (_jsx("p", { className: "mt-1 text-sm text-gray-700", children: coupon.name })), showDetails && (_jsxs(_Fragment, { children: [coupon.description && (_jsx("p", { className: "mt-2 text-sm text-gray-600", children: coupon.description })), _jsxs("div", { className: "mt-3 space-y-1 text-sm text-gray-500", children: [coupon.minPurchaseAmount && (_jsxs("p", { children: ["Minimum purchase: $", coupon.minPurchaseAmount] })), coupon.maxDiscountAmount && (_jsxs("p", { children: ["Maximum discount: $", coupon.maxDiscountAmount] })), _jsxs("p", { children: ["Valid: ", format(new Date(coupon.validFrom), 'MMM d, yyyy'), " - ", format(new Date(coupon.validUntil), 'MMM d, yyyy')] }), coupon.usageLimit && (_jsxs("p", { children: ["Usage: ", coupon.usageCount, " / ", coupon.usageLimit] }))] })] }))] }), onRemove && (_jsx("button", { onClick: onRemove, className: "ml-4 text-gray-400 hover:text-gray-600", "aria-label": "Remove coupon", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }))] }) }) }));
};
//# sourceMappingURL=CouponDisplay.js.map