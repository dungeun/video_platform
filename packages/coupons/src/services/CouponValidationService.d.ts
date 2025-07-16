import { Coupon, ValidationContext, ValidationResult } from '../types';
import { CouponUsageRepository } from '../repositories/interfaces';
import { DiscountCalculationService } from './DiscountCalculationService';
export declare class CouponValidationService {
    private usageRepository;
    private discountService;
    constructor(usageRepository: CouponUsageRepository, discountService: DiscountCalculationService);
    validate(coupon: Coupon, context: ValidationContext): Promise<ValidationResult>;
    validateMultiple(coupons: Coupon[], context: ValidationContext): Promise<ValidationResult[]>;
    private getUserUsageCount;
    private hasEligibleProducts;
    private getDaysUntilExpiry;
    canStackCoupons(coupons: Coupon[]): Promise<{
        canStack: boolean;
        reason?: string;
    }>;
}
//# sourceMappingURL=CouponValidationService.d.ts.map