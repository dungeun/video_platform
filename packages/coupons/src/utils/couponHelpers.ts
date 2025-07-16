import { Coupon, CouponType, DiscountType } from '../types';

export function generateCouponCode(prefix?: string, length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix ? `${prefix}_` : '';
  
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

export function formatCouponCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

export function isCouponValid(coupon: Coupon): boolean {
  const now = new Date();
  return (
    coupon.isActive &&
    now >= new Date(coupon.validFrom) &&
    now <= new Date(coupon.validUntil) &&
    (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit)
  );
}

export function getCouponStatus(coupon: Coupon): {
  status: 'active' | 'expired' | 'inactive' | 'exhausted' | 'scheduled';
  message: string;
} {
  const now = new Date();
  const validFrom = new Date(coupon.validFrom);
  const validUntil = new Date(coupon.validUntil);

  if (!coupon.isActive) {
    return { status: 'inactive', message: 'Coupon is inactive' };
  }

  if (now < validFrom) {
    return { status: 'scheduled', message: `Available from ${validFrom.toLocaleDateString()}` };
  }

  if (now > validUntil) {
    return { status: 'expired', message: 'Coupon has expired' };
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return { status: 'exhausted', message: 'Usage limit reached' };
  }

  return { status: 'active', message: 'Coupon is valid' };
}

export function getDiscountTypeLabel(type: DiscountType): string {
  switch (type) {
    case DiscountType.PERCENTAGE:
      return 'Percentage Off';
    case DiscountType.FIXED:
      return 'Fixed Amount Off';
    case DiscountType.FREE_SHIPPING:
      return 'Free Shipping';
    case DiscountType.BUY_X_GET_Y:
      return 'Buy X Get Y';
    default:
      return 'Discount';
  }
}

export function getCouponTypeLabel(type: CouponType): string {
  switch (type) {
    case CouponType.PUBLIC:
      return 'Public';
    case CouponType.PRIVATE:
      return 'Private';
    case CouponType.SINGLE_USE:
      return 'Single Use';
    case CouponType.REFERRAL:
      return 'Referral';
    case CouponType.FIRST_PURCHASE:
      return 'First Purchase';
    case CouponType.LOYALTY:
      return 'Loyalty';
    default:
      return type;
  }
}

export function calculateDiscountedPrice(
  originalPrice: number,
  discountType: DiscountType,
  discountValue: number,
  maxDiscount?: number
): number {
  let discount = 0;

  switch (discountType) {
    case DiscountType.PERCENTAGE:
      discount = (originalPrice * discountValue) / 100;
      break;
    case DiscountType.FIXED:
      discount = Math.min(discountValue, originalPrice);
      break;
    case DiscountType.FREE_SHIPPING:
      // This would typically be handled separately
      discount = 0;
      break;
    case DiscountType.BUY_X_GET_Y:
      // This requires more complex logic based on cart items
      discount = 0;
      break;
  }

  if (maxDiscount && discount > maxDiscount) {
    discount = maxDiscount;
  }

  return Math.max(0, originalPrice - discount);
}

export function getDaysUntilExpiry(validUntil: Date | string): number {
  const expiryDate = new Date(validUntil);
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function formatExpiryText(validUntil: Date | string): string {
  const days = getDaysUntilExpiry(validUntil);
  
  if (days < 0) {
    return 'Expired';
  } else if (days === 0) {
    return 'Expires today';
  } else if (days === 1) {
    return 'Expires tomorrow';
  } else if (days <= 7) {
    return `Expires in ${days} days`;
  } else if (days <= 30) {
    const weeks = Math.floor(days / 7);
    return `Expires in ${weeks} week${weeks > 1 ? 's' : ''}`;
  } else {
    const months = Math.floor(days / 30);
    return `Expires in ${months} month${months > 1 ? 's' : ''}`;
  }
}

export function sortCouponsByPriority(coupons: Coupon[]): Coupon[] {
  return [...coupons].sort((a, b) => {
    // Active coupons first
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }

    // Higher discount value first (for percentage types)
    if (a.discountType === DiscountType.PERCENTAGE && 
        b.discountType === DiscountType.PERCENTAGE) {
      return b.discountValue - a.discountValue;
    }

    // Expiring soon first
    const aDays = getDaysUntilExpiry(a.validUntil);
    const bDays = getDaysUntilExpiry(b.validUntil);
    if (aDays !== bDays) {
      return aDays - bDays;
    }

    // Lower usage count first
    return a.usageCount - b.usageCount;
  });
}