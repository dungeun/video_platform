import { 
  Coupon, 
  ValidationContext, 
  ValidationResult, 
  ValidationError,
  CouponUsage 
} from '../types';
import { CouponEntity } from '../entities';
import { CouponUsageRepository } from '../repositories/interfaces';
import { DiscountCalculationService } from './DiscountCalculationService';

export class CouponValidationService {
  constructor(
    private usageRepository: CouponUsageRepository,
    private discountService: DiscountCalculationService
  ) {}

  async validate(
    coupon: Coupon,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Convert to entity for validation
    const entity = CouponEntity.fromJSON(coupon);

    // Check if coupon is active
    if (!coupon.isActive) {
      errors.push({
        code: 'COUPON_INACTIVE',
        message: 'This coupon is not active'
      });
    }

    // Check validity period
    const now = new Date();
    if (now < coupon.validFrom) {
      errors.push({
        code: 'COUPON_NOT_YET_VALID',
        message: 'This coupon is not yet valid'
      });
    }

    if (entity.isExpired) {
      errors.push({
        code: 'COUPON_EXPIRED',
        message: 'This coupon has expired'
      });
    }

    // Check usage limits
    if (entity.hasReachedLimit) {
      errors.push({
        code: 'COUPON_LIMIT_REACHED',
        message: 'This coupon has reached its usage limit'
      });
    }

    // Check user-specific usage limit
    if (coupon.usageLimitPerUser) {
      const userUsageCount = await this.getUserUsageCount(coupon.id, context.userId);
      if (userUsageCount >= coupon.usageLimitPerUser) {
        errors.push({
          code: 'USER_LIMIT_REACHED',
          message: 'You have already used this coupon the maximum number of times'
        });
      }
    }

    // Check minimum purchase amount
    if (coupon.minPurchaseAmount && context.orderTotal < coupon.minPurchaseAmount) {
      errors.push({
        code: 'MIN_PURCHASE_NOT_MET',
        message: `Minimum purchase amount of ${coupon.minPurchaseAmount} required`,
        field: 'orderTotal'
      });
    }

    // Validate product/category restrictions
    if (context.products && (coupon.productIds || coupon.categoryIds)) {
      const hasEligibleProducts = this.hasEligibleProducts(coupon, context);
      if (!hasEligibleProducts) {
        errors.push({
          code: 'NO_ELIGIBLE_PRODUCTS',
          message: 'This coupon is not valid for the products in your cart'
        });
      }
    }

    // Add warnings
    const remainingUsage = entity.remainingUsage;
    if (remainingUsage !== null && remainingUsage <= 5) {
      warnings.push(`Only ${remainingUsage} uses remaining for this coupon`);
    }

    const daysUntilExpiry = this.getDaysUntilExpiry(coupon.validUntil);
    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      warnings.push(`This coupon expires in ${daysUntilExpiry} days`);
    }

    // Calculate discount if valid
    let discountAmount: number | undefined;
    let finalAmount: number | undefined;

    if (errors.length === 0) {
      const calculation = this.discountService.calculateDiscount(coupon, context);
      discountAmount = calculation.discountAmount;
      finalAmount = calculation.finalAmount;
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      discountAmount,
      finalAmount
    };
  }

  async validateMultiple(
    coupons: Coupon[],
    context: ValidationContext
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const coupon of coupons) {
      const result = await this.validate(coupon, context);
      results.push(result);
    }

    return results;
  }

  private async getUserUsageCount(couponId: string, userId: string): Promise<number> {
    const { usages } = await this.usageRepository.findAll({
      couponId,
      userId
    });
    return usages.length;
  }

  private hasEligibleProducts(coupon: Coupon, context: ValidationContext): boolean {
    if (!context.products) return false;

    for (const product of context.products) {
      // Check exclusions
      if (coupon.excludeProductIds?.includes(product.id)) continue;
      if (coupon.excludeCategoryIds?.includes(product.categoryId)) continue;

      // Check inclusions
      const productMatch = !coupon.productIds || coupon.productIds.includes(product.id);
      const categoryMatch = !coupon.categoryIds || coupon.categoryIds.includes(product.categoryId);

      if (productMatch && categoryMatch) {
        return true;
      }
    }

    return false;
  }

  private getDaysUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  async canStackCoupons(coupons: Coupon[]): Promise<{
    canStack: boolean;
    reason?: string;
  }> {
    // Check if any coupon prohibits stacking
    const nonStackable = coupons.find(c => 
      c.metadata?.allowStacking === false
    );

    if (nonStackable) {
      return {
        canStack: false,
        reason: `Coupon ${nonStackable.code} cannot be combined with other coupons`
      };
    }

    // Check for conflicting discount types
    const discountTypes = new Set(coupons.map(c => c.discountType));
    if (discountTypes.size > 2) {
      return {
        canStack: false,
        reason: 'Too many different discount types'
      };
    }

    return { canStack: true };
  }
}