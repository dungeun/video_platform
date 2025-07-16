import { Coupon, ValidationContext, ValidationResult, DiscountCalculation } from '../types';
interface UseCouponOptions {
    onValidate?: (result: ValidationResult) => void;
    onApply?: (calculation: DiscountCalculation) => void;
    onError?: (error: Error) => void;
}
export declare function useCoupon(options?: UseCouponOptions): {
    coupon: Coupon | null;
    validationResult: ValidationResult | null;
    calculation: DiscountCalculation | null;
    isValidating: boolean;
    isApplying: boolean;
    error: Error | null;
    fetchCoupon: (code: string) => Promise<any>;
    validateCoupon: (couponData: Coupon, context: ValidationContext) => Promise<ValidationResult>;
    applyCoupon: (code: string, context: ValidationContext) => Promise<DiscountCalculation>;
    removeCoupon: () => void;
    reset: () => void;
};
export {};
//# sourceMappingURL=useCoupon.d.ts.map