export class CouponError extends Error {
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'CouponError';
    }
}
export class CouponNotFoundError extends CouponError {
    constructor(couponId) {
        super('COUPON_NOT_FOUND', `Coupon with ID ${couponId} not found`);
    }
}
export class CouponExpiredError extends CouponError {
    constructor(couponCode) {
        super('COUPON_EXPIRED', `Coupon ${couponCode} has expired`);
    }
}
export class CouponLimitReachedError extends CouponError {
    constructor(couponCode) {
        super('COUPON_LIMIT_REACHED', `Coupon ${couponCode} has reached its usage limit`);
    }
}
export class InvalidCouponCodeError extends CouponError {
    constructor(code) {
        super('INVALID_COUPON_CODE', `Invalid coupon code: ${code}`);
    }
}
export class MinPurchaseNotMetError extends CouponError {
    constructor(required, actual) {
        super('MIN_PURCHASE_NOT_MET', `Minimum purchase amount of ${required} required, but only ${actual} in cart`);
    }
}
export class CouponValidationError extends CouponError {
    constructor(errors) {
        super('COUPON_VALIDATION_ERROR', 'Coupon validation failed', errors);
    }
}
export class CampaignBudgetExceededError extends CouponError {
    constructor(campaignId) {
        super('CAMPAIGN_BUDGET_EXCEEDED', `Campaign ${campaignId} has exceeded its budget`);
    }
}
export class DuplicateCouponCodeError extends CouponError {
    constructor(code) {
        super('DUPLICATE_COUPON_CODE', `Coupon code ${code} already exists`);
    }
}
//# sourceMappingURL=index.js.map