import React from 'react';
import { Coupon, DiscountType } from '../types';
import { format } from 'date-fns';

interface CouponDisplayProps {
  coupon: Coupon;
  showDetails?: boolean;
  onRemove?: () => void;
  className?: string;
}

export const CouponDisplay: React.FC<CouponDisplayProps> = ({
  coupon,
  showDetails = false,
  onRemove,
  className = ''
}) => {
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

  return (
    <div className={`coupon-display ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-gray-900">
                {coupon.code}
              </span>
              {!coupon.isActive && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                  Inactive
                </span>
              )}
              {isExpired && (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-600 rounded">
                  Expired
                </span>
              )}
              {isNotYetValid && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-600 rounded">
                  Not Yet Valid
                </span>
              )}
            </div>
            
            <p className="mt-1 text-xl font-semibold text-blue-600">
              {getDiscountText()}
            </p>
            
            {coupon.name && (
              <p className="mt-1 text-sm text-gray-700">{coupon.name}</p>
            )}
            
            {showDetails && (
              <>
                {coupon.description && (
                  <p className="mt-2 text-sm text-gray-600">{coupon.description}</p>
                )}
                
                <div className="mt-3 space-y-1 text-sm text-gray-500">
                  {coupon.minPurchaseAmount && (
                    <p>Minimum purchase: ${coupon.minPurchaseAmount}</p>
                  )}
                  {coupon.maxDiscountAmount && (
                    <p>Maximum discount: ${coupon.maxDiscountAmount}</p>
                  )}
                  <p>
                    Valid: {format(new Date(coupon.validFrom), 'MMM d, yyyy')} - {format(new Date(coupon.validUntil), 'MMM d, yyyy')}
                  </p>
                  {coupon.usageLimit && (
                    <p>
                      Usage: {coupon.usageCount} / {coupon.usageLimit}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          
          {onRemove && (
            <button
              onClick={onRemove}
              className="ml-4 text-gray-400 hover:text-gray-600"
              aria-label="Remove coupon"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};