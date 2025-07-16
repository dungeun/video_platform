export class CouponError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CouponError';
  }
}

export class CouponNotFoundError extends CouponError {
  constructor(couponId: string) {
    super('COUPON_NOT_FOUND', `Coupon with ID ${couponId} not found`);
  }
}

export class CouponExpiredError extends CouponError {
  constructor(couponCode: string) {
    super('COUPON_EXPIRED', `Coupon ${couponCode} has expired`);
  }
}

export class CouponLimitReachedError extends CouponError {
  constructor(couponCode: string) {
    super('COUPON_LIMIT_REACHED', `Coupon ${couponCode} has reached its usage limit`);
  }
}

export class InvalidCouponCodeError extends CouponError {
  constructor(code: string) {
    super('INVALID_COUPON_CODE', `Invalid coupon code: ${code}`);
  }
}

export class MinPurchaseNotMetError extends CouponError {
  constructor(required: number, actual: number) {
    super(
      'MIN_PURCHASE_NOT_MET',
      `Minimum purchase amount of ${required} required, but only ${actual} in cart`
    );
  }
}

export class CouponValidationError extends CouponError {
  constructor(errors: Array<{ field?: string; message: string }>) {
    super('COUPON_VALIDATION_ERROR', 'Coupon validation failed', errors);
  }
}

export class CampaignBudgetExceededError extends CouponError {
  constructor(campaignId: string) {
    super('CAMPAIGN_BUDGET_EXCEEDED', `Campaign ${campaignId} has exceeded its budget`);
  }
}

export class DuplicateCouponCodeError extends CouponError {
  constructor(code: string) {
    super('DUPLICATE_COUPON_CODE', `Coupon code ${code} already exists`);
  }
}