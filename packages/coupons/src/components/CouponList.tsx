import React from 'react';
import { Coupon } from '../types';
import { CouponDisplay } from './CouponDisplay';

interface CouponListProps {
  coupons: Coupon[];
  onSelect?: (coupon: Coupon) => void;
  onRemove?: (coupon: Coupon) => void;
  selectedCouponId?: string;
  showDetails?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const CouponList: React.FC<CouponListProps> = ({
  coupons,
  onSelect,
  onRemove,
  selectedCouponId,
  showDetails = false,
  emptyMessage = 'No coupons available',
  className = ''
}) => {
  if (coupons.length === 0) {
    return (
      <div className={`coupon-list-empty text-center py-8 ${className}`}>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`coupon-list space-y-3 ${className}`}>
      {coupons.map((coupon) => (
        <div
          key={coupon.id}
          className={`
            cursor-pointer transition-all
            ${selectedCouponId === coupon.id ? 'ring-2 ring-blue-500 rounded-lg' : ''}
            ${onSelect ? 'hover:scale-[1.02]' : ''}
          `}
          onClick={() => onSelect?.(coupon)}
        >
          <CouponDisplay
            coupon={coupon}
            showDetails={showDetails}
            onRemove={onRemove ? () => onRemove(coupon) : undefined}
          />
        </div>
      ))}
    </div>
  );
};