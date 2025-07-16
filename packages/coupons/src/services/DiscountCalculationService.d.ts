import { Coupon, DiscountCalculation, ValidationContext } from '../types';
export declare class DiscountCalculationService {
    calculateDiscount(coupon: Coupon, context: ValidationContext): DiscountCalculation;
    private calculatePercentageDiscount;
    private calculateFixedDiscount;
    private calculateFreeShippingDiscount;
    private calculateBuyXGetYDiscount;
    private getEligibleAmount;
    private isProductEligible;
    calculateStackedDiscounts(coupons: Coupon[], context: ValidationContext): DiscountCalculation[];
}
//# sourceMappingURL=DiscountCalculationService.d.ts.map