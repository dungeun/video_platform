# @repo/coupons

Comprehensive coupon management module with discount calculation, validation, promotion campaigns, usage tracking, and expiry management.

## Features

- **Coupon Management**: Create, update, and manage various types of coupons
- **Discount Calculation**: Support for percentage, fixed amount, free shipping, and Buy X Get Y discounts
- **Validation System**: Robust validation for coupon eligibility and constraints
- **Promotion Campaigns**: Organize coupons into targeted marketing campaigns
- **Usage Tracking**: Monitor coupon usage patterns and effectiveness
- **Expiry Management**: Automatic handling of coupon expiration with notifications

## Installation

```bash
pnpm add @repo/coupons
```

## Usage

### Basic Coupon Creation

```typescript
import { CouponService, CouponValidator } from '@repo/coupons';

const service = new CouponService(repository, validator);

// Create a percentage discount coupon
const coupon = await service.create({
  code: 'SUMMER20',
  name: 'Summer Sale 20% Off',
  type: CouponType.PUBLIC,
  discountType: DiscountType.PERCENTAGE,
  discountValue: 20,
  minPurchaseAmount: 50,
  validFrom: new Date(),
  validUntil: new Date('2024-08-31'),
  usageLimit: 1000
});
```

### Validating and Applying Coupons

```typescript
import { CouponValidationService, DiscountCalculationService } from '@repo/coupons';

const validationService = new CouponValidationService(usageRepo, discountService);

// Validate coupon
const context = {
  userId: 'user123',
  orderTotal: 100,
  products: [
    { id: 'prod1', categoryId: 'cat1', quantity: 2, price: 50 }
  ]
};

const validation = await validationService.validate(coupon, context);

if (validation.isValid) {
  // Calculate discount
  const calculation = discountService.calculateDiscount(coupon, context);
  console.log(`Discount: $${calculation.discountAmount}`);
  console.log(`Final price: $${calculation.finalAmount}`);
}
```

### React Components

```tsx
import { CouponInput, DiscountSummary, useCoupon } from '@repo/coupons';

function CheckoutForm() {
  const { applyCoupon, calculation, error } = useCoupon();

  const handleApplyCoupon = async (code: string) => {
    await applyCoupon(code, {
      userId: currentUser.id,
      orderTotal: cart.total,
      products: cart.items
    });
  };

  return (
    <div>
      <CouponInput 
        onApply={handleApplyCoupon}
        error={error?.message}
      />
      
      {calculation && (
        <DiscountSummary 
          calculation={calculation}
          showDetails
        />
      )}
    </div>
  );
}
```

### Campaign Management

```typescript
import { PromotionCampaignService } from '@repo/coupons';

// Create a campaign
const campaign = await campaignService.create({
  name: 'Summer Sale 2024',
  description: 'Annual summer promotion',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-08-31'),
  budget: 10000,
  goals: {
    targetRevenue: 100000,
    targetUsage: 5000,
    conversionRate: 15
  }
});

// Track performance
const performance = await campaignService.getCampaignPerformance(campaign.id);
console.log(`ROI: ${performance.roi}%`);
```

### Usage Tracking

```typescript
import { UsageTrackingService } from '@repo/coupons';

// Track coupon usage
await usageService.trackUsage({
  couponId: coupon.id,
  userId: 'user123',
  orderId: 'order456',
  discountAmount: 20,
  orderTotal: 100
});

// Get usage statistics
const stats = await usageService.getUsageStats(coupon.id);
console.log(`Total usage: ${stats.totalUsage}`);
console.log(`Unique users: ${stats.uniqueUsers}`);
```

### Expiry Management

```typescript
import { ExpiryManagementService } from '@repo/coupons';

const expiryService = new ExpiryManagementService(repository);

// Start automatic expiry checking
expiryService.startAutoCheck();

// Listen for expiry events
expiryService.on('coupon:expired', (event) => {
  console.log(`Coupon ${event.couponId} has expired`);
});

// Get coupons expiring soon
const expiringSoon = await expiryService.getExpiringCoupons(7); // 7 days
```

## Coupon Types

- **PUBLIC**: Available to all users
- **PRIVATE**: Requires special access or invitation
- **SINGLE_USE**: Can only be used once per coupon
- **REFERRAL**: For referral programs
- **FIRST_PURCHASE**: For new customers only
- **LOYALTY**: For loyalty program members

## Discount Types

- **PERCENTAGE**: Percentage off the order total
- **FIXED**: Fixed amount discount
- **FREE_SHIPPING**: Free shipping on the order
- **BUY_X_GET_Y**: Buy X items, get Y items free

## API Reference

### Services

- `CouponService`: Core CRUD operations for coupons
- `DiscountCalculationService`: Calculate discount amounts
- `CouponValidationService`: Validate coupon eligibility
- `PromotionCampaignService`: Manage marketing campaigns
- `UsageTrackingService`: Track and analyze usage
- `ExpiryManagementService`: Handle coupon expiration

### React Hooks

- `useCoupon`: Apply and manage single coupon
- `useCouponList`: Manage lists of coupons
- `useCampaign`: Campaign management operations

### Components

- `CouponInput`: Input field for coupon codes
- `CouponDisplay`: Display coupon details
- `DiscountSummary`: Show discount calculation
- `CouponList`: List of available coupons
- `CampaignCard`: Campaign overview card

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test -- --watch
```

## License

MIT