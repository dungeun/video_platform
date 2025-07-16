import React from 'react';
import type { ProductVariant } from '../types';

interface VariantPriceDisplayProps {
  variant: ProductVariant | null;
  basePrice?: number;
  quantity?: number;
  currency?: string;
  className?: string;
}

export const VariantPriceDisplay: React.FC<VariantPriceDisplayProps> = ({
  variant,
  basePrice = 0,
  quantity = 1,
  currency = '원',
  className = ''
}) => {
  const price = variant ? variant.price : basePrice;
  const compareAtPrice = variant?.compareAtPrice;
  const totalPrice = price * quantity;
  const totalCompareAtPrice = compareAtPrice ? compareAtPrice * quantity : null;

  const discountPercentage = compareAtPrice && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-baseline space-x-2">
        {totalCompareAtPrice && totalCompareAtPrice > totalPrice && (
          <span className="text-gray-500 line-through text-sm">
            {totalCompareAtPrice.toLocaleString()}{currency}
          </span>
        )}
        <span className="text-2xl font-bold text-gray-900">
          {totalPrice.toLocaleString()}{currency}
        </span>
        {discountPercentage > 0 && (
          <span className="text-sm font-semibold text-red-600">
            {discountPercentage}% 할인
          </span>
        )}
      </div>

      {quantity > 1 && (
        <div className="text-sm text-gray-600">
          개당 {price.toLocaleString()}{currency}
        </div>
      )}

      {variant && !variant.isActive && (
        <div className="text-sm text-red-600 font-medium">
          현재 판매 중지
        </div>
      )}

      {variant && variant.stock === 0 && (
        <div className="text-sm text-red-600 font-medium">
          품절
        </div>
      )}

      {variant && variant.stock > 0 && variant.stock <= 5 && (
        <div className="text-sm text-orange-600 font-medium">
          재고 {variant.stock}개 남음
        </div>
      )}
    </div>
  );
};