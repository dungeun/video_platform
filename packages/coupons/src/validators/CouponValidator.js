import { z } from 'zod';
import { CouponType, DiscountType } from '../types';
export class CouponValidator {
    constructor() {
        this.couponSchema = z.object({
            code: z.string()
                .min(3, 'Code must be at least 3 characters')
                .max(50, 'Code must not exceed 50 characters')
                .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, hyphens, and underscores'),
            name: z.string()
                .min(1, 'Name is required')
                .max(100, 'Name must not exceed 100 characters'),
            description: z.string()
                .max(500, 'Description must not exceed 500 characters')
                .optional(),
            type: z.nativeEnum(CouponType),
            discountType: z.nativeEnum(DiscountType),
            discountValue: z.number()
                .positive('Discount value must be positive'),
            minPurchaseAmount: z.number()
                .nonnegative('Minimum purchase amount must be non-negative')
                .optional(),
            maxDiscountAmount: z.number()
                .positive('Maximum discount amount must be positive')
                .optional(),
            validFrom: z.date(),
            validUntil: z.date(),
            usageLimit: z.number()
                .int('Usage limit must be an integer')
                .positive('Usage limit must be positive')
                .optional(),
            usageLimitPerUser: z.number()
                .int('Usage limit per user must be an integer')
                .positive('Usage limit per user must be positive')
                .optional(),
            isActive: z.boolean(),
            campaignId: z.string().optional(),
            productIds: z.array(z.string()).optional(),
            categoryIds: z.array(z.string()).optional(),
            excludeProductIds: z.array(z.string()).optional(),
            excludeCategoryIds: z.array(z.string()).optional(),
            metadata: z.record(z.any()).optional()
        });
    }
    async validateCouponData(data) {
        try {
            const errors = [];
            // Basic schema validation
            const result = this.couponSchema.safeParse(data);
            if (!result.success) {
                result.error.errors.forEach(err => {
                    errors.push({
                        code: 'VALIDATION_ERROR',
                        message: err.message,
                        field: err.path.join('.')
                    });
                });
            }
            // Custom validations
            if (data.validFrom && data.validUntil) {
                if (data.validUntil <= data.validFrom) {
                    errors.push({
                        code: 'INVALID_DATE_RANGE',
                        message: 'Valid until date must be after valid from date',
                        field: 'validUntil'
                    });
                }
            }
            if (data.discountType === DiscountType.PERCENTAGE && data.discountValue) {
                if (data.discountValue > 100) {
                    errors.push({
                        code: 'INVALID_PERCENTAGE',
                        message: 'Percentage discount cannot exceed 100%',
                        field: 'discountValue'
                    });
                }
            }
            if (data.discountType === DiscountType.BUY_X_GET_Y && !data.metadata?.buyQuantity) {
                errors.push({
                    code: 'MISSING_BUY_QUANTITY',
                    message: 'Buy X Get Y discount requires buyQuantity in metadata',
                    field: 'metadata.buyQuantity'
                });
            }
            if (data.minPurchaseAmount && data.maxDiscountAmount) {
                if (data.discountType === DiscountType.FIXED &&
                    data.discountValue &&
                    data.maxDiscountAmount < data.discountValue) {
                    errors.push({
                        code: 'INVALID_MAX_DISCOUNT',
                        message: 'Maximum discount amount cannot be less than fixed discount value',
                        field: 'maxDiscountAmount'
                    });
                }
            }
            return {
                isValid: errors.length === 0,
                errors: errors.length > 0 ? errors : undefined
            };
        }
        catch (error) {
            return {
                isValid: false,
                errors: [{
                        code: 'VALIDATION_EXCEPTION',
                        message: error instanceof Error ? error.message : 'Validation failed'
                    }]
            };
        }
    }
    validateCouponCode(code) {
        const errors = [];
        if (!code || code.trim().length === 0) {
            errors.push({
                code: 'EMPTY_CODE',
                message: 'Coupon code cannot be empty'
            });
        }
        if (code.length < 3) {
            errors.push({
                code: 'CODE_TOO_SHORT',
                message: 'Coupon code must be at least 3 characters'
            });
        }
        if (code.length > 50) {
            errors.push({
                code: 'CODE_TOO_LONG',
                message: 'Coupon code must not exceed 50 characters'
            });
        }
        if (!/^[A-Z0-9_-]+$/.test(code)) {
            errors.push({
                code: 'INVALID_CODE_FORMAT',
                message: 'Coupon code must contain only uppercase letters, numbers, hyphens, and underscores'
            });
        }
        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }
    validateBulkCodes(codes) {
        const results = new Map();
        for (const code of codes) {
            results.set(code, this.validateCouponCode(code));
        }
        return results;
    }
}
//# sourceMappingURL=CouponValidator.js.map