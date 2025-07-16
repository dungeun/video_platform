export declare class CouponError extends Error {
    code: string;
    details?: any | undefined;
    constructor(code: string, message: string, details?: any | undefined);
}
export declare class CouponNotFoundError extends CouponError {
    constructor(couponId: string);
}
export declare class CouponExpiredError extends CouponError {
    constructor(couponCode: string);
}
export declare class CouponLimitReachedError extends CouponError {
    constructor(couponCode: string);
}
export declare class InvalidCouponCodeError extends CouponError {
    constructor(code: string);
}
export declare class MinPurchaseNotMetError extends CouponError {
    constructor(required: number, actual: number);
}
export declare class CouponValidationError extends CouponError {
    constructor(errors: Array<{
        field?: string;
        message: string;
    }>);
}
export declare class CampaignBudgetExceededError extends CouponError {
    constructor(campaignId: string);
}
export declare class DuplicateCouponCodeError extends CouponError {
    constructor(code: string);
}
//# sourceMappingURL=index.d.ts.map