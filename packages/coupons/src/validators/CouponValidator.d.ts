import { Coupon, ValidationResult } from '../types';
export declare class CouponValidator {
    private couponSchema;
    validateCouponData(data: Partial<Coupon>): Promise<ValidationResult>;
    validateCouponCode(code: string): ValidationResult;
    validateBulkCodes(codes: string[]): Map<string, ValidationResult>;
}
//# sourceMappingURL=CouponValidator.d.ts.map