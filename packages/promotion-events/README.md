# Promotion Events Module

A comprehensive promotion and events management module for K-Commerce, providing advanced discount systems, event management, and promotional banners.

## Features

### 🎯 Promotion Campaigns
- **Multiple Discount Types**: Percentage, fixed amount, buy-x-get-y, free shipping
- **Advanced Targeting**: Target specific user groups, first-time buyers, VIP members
- **Usage Conditions**: Minimum/maximum order amounts, product/category restrictions
- **Stackable Promotions**: Combine multiple promotions for maximum savings
- **Usage Analytics**: Track performance, savings, and user engagement

### 🎪 Event Management
- **Event Types**: Flash sales, seasonal sales, clearance, product launches
- **Countdown Timers**: Real-time countdown displays with customizable formats
- **Recurring Events**: Support for daily, weekly, monthly, yearly patterns
- **Event Analytics**: Track views, clicks, conversions, and revenue

### 🎨 Promotional Banners
- **Flexible Positioning**: Top, header, hero, sidebar, footer, popup, floating
- **Smart Display Rules**: Page-specific, category-specific, user-targeted
- **Frequency Capping**: Control impression limits and user exposure
- **Click Tracking**: Monitor banner performance and CTR
- **Custom Styling**: Full control over appearance and animations

### 🎫 Coupon System
- **Code Generation**: Bulk generation with customizable patterns
- **Validation System**: Real-time coupon validation and usage tracking
- **Expiration Management**: Time-based and usage-based expiration
- **Fraud Prevention**: Unique code generation and usage limits

## Installation

```bash
npm install @kcommerce/promotion-events
```

## Quick Start

### Basic Setup

```typescript
import { 
  usePromotion, 
  PromotionService, 
  DiscountType, 
  AudienceType 
} from '@kcommerce/promotion-events';

// Using the hook (React)
const MyComponent = () => {
  const { 
    promotions, 
    createPromotion, 
    calculateDiscount 
  } = usePromotion();

  // Component logic...
};

// Using the service directly
const promotionService = new PromotionService();
```

### Creating a Promotion

```typescript
const promotion = await createPromotion({
  name: 'Summer Sale',
  description: '25% off everything',
  discountConfig: {
    type: DiscountType.PERCENTAGE,
    percentage: 25,
    maxAmount: 100000 // Maximum discount of ₩100,000
  },
  usageConditions: {
    minimumOrderAmount: 50000,
    usageLimit: 1000,
    userUsageLimit: 1
  },
  targetAudience: {
    type: AudienceType.ALL_USERS
  },
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-08-31'),
  priority: 10,
  isStackable: false,
  tags: ['summer', 'sale', 'discount']
});
```

### Calculating Discounts

```typescript
const orderData = {
  items: [
    {
      productId: 'prod-1',
      categoryId: 'electronics',
      quantity: 2,
      price: 150000,
      name: 'Smartphone'
    }
  ],
  subtotal: 300000,
  userId: 'user-123',
  userType: 'returning'
};

const discountResult = await calculateDiscount(orderData);

console.log(`Original: ${discountResult.originalAmount}`);
console.log(`Discount: ${discountResult.discountAmount}`);
console.log(`Final: ${discountResult.finalAmount}`);
console.log(`Applied: ${discountResult.appliedPromotions.length} promotions`);
```

## Components

### Promotion Banner

```tsx
import { PromotionBanner } from '@kcommerce/promotion-events';

<PromotionBanner
  banner={banner}
  onImpression={(bannerId) => console.log('Banner viewed:', bannerId)}
  onClick={(banner) => console.log('Banner clicked:', banner.title)}
/>
```

### Event Countdown

```tsx
import { EventCountdown } from '@kcommerce/promotion-events';

<EventCountdown
  event={event}
  format="full"
  showLabels={true}
  onEventStart={(event) => console.log('Event started:', event.name)}
  onEventEnd={(event) => console.log('Event ended:', event.name)}
/>
```

### Discount Calculator

```tsx
import { DiscountCalculator } from '@kcommerce/promotion-events';

<DiscountCalculator
  originalAmount={100000}
  discountResult={discountResult}
  showBreakdown={true}
  showSavings={true}
  currency="KRW"
/>
```

### Promotion List

```tsx
import { PromotionList } from '@kcommerce/promotion-events';

<PromotionList
  promotions={promotions}
  events={events}
  showFilters={true}
  showSearch={true}
  maxDisplay={10}
  onPromotionClick={(promotion) => navigateToPromotion(promotion.id)}
  onEventClick={(event) => navigateToEvent(event.id)}
/>
```

## Advanced Usage

### Creating Buy-X-Get-Y Promotions

```typescript
const bogoPromotion = await createPromotion({
  name: 'Buy 2 Get 1 Free',
  discountConfig: {
    type: DiscountType.BUY_X_GET_Y,
    buyQuantity: 2,
    getQuantity: 1,
    discountType: 'free',
    targetProductIds: ['prod-1', 'prod-2'] // Optional: specific products
  },
  // ... other configuration
});
```

### Generating Coupon Codes

```typescript
const coupons = await generateCoupons(promotionId, {
  prefix: 'SAVE',
  length: 8,
  includeNumbers: true,
  includeLetters: true,
  includeSpecialChars: false,
  excludeSimilarChars: true,
  quantity: 1000,
  expirationDays: 30
});
```

### Creating Events with Recurring Patterns

```typescript
const recurringEvent = await createEvent({
  name: 'Weekly Flash Sale',
  description: 'Every Friday flash sale',
  type: EventType.FLASH_SALE,
  startDate: new Date('2024-01-05T10:00:00'), // First Friday
  endDate: new Date('2024-01-05T23:59:59'),
  isRecurring: true,
  recurringPattern: {
    frequency: 'weekly',
    interval: 1,
    endDate: new Date('2024-12-31')
  },
  showCountdown: true,
  featured: true
});
```

### Custom Banner with Advanced Targeting

```typescript
const banner = await createBanner({
  title: 'VIP Member Special',
  content: 'Exclusive 30% discount for VIP members only',
  position: BannerPosition.HERO,
  priority: 100,
  targetAudience: {
    type: AudienceType.VIP_MEMBERS
  },
  displayRules: {
    showOnPages: ['/products', '/categories'],
    maxImpressionsPerUser: 3,
    frequencyCap: {
      impressions: 5,
      period: 'day'
    }
  },
  clickAction: {
    type: 'promotion',
    value: 'vip-promotion-id'
  },
  styling: {
    backgroundColor: '#FFD700',
    textColor: '#000000',
    animation: 'fade'
  }
});
```

## Validation

The module includes comprehensive validation using Zod schemas:

```typescript
import { PromotionValidator } from '@kcommerce/promotion-events';

// Validate promotion data
try {
  const validatedData = PromotionValidator.validateCreatePromotion(promotionData);
  console.log('Valid promotion data:', validatedData);
} catch (error) {
  console.error('Validation failed:', error.message);
}

// Validate business rules
const warnings = PromotionValidator.validateBusinessRules(promotionData);
if (warnings.length > 0) {
  console.warn('Business rule warnings:', warnings);
}
```

## Utilities

The module provides various utility functions:

```typescript
import { PromotionUtils } from '@kcommerce/promotion-events';

// Format currency
const formatted = PromotionUtils.formatCurrency(150000, 'KRW');

// Get promotion status
const status = PromotionUtils.getPromotionStatus(promotion);

// Calculate time remaining
const timeLeft = PromotionUtils.getTimeRemaining(event.endDate);

// Generate SEO-friendly URLs
const promotionUrl = PromotionUtils.generatePromotionUrl(promotion);
```

## Admin Configuration

The module includes comprehensive admin interface configuration:

```typescript
import { promotionEventsAdminConfig } from '@kcommerce/promotion-events/admin';

// Use in your admin panel
const adminConfig = promotionEventsAdminConfig;
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run coverage
```

## API Reference

### Types

- `PromotionCampaign` - Main promotion campaign interface
- `Event` - Promotional event interface  
- `Banner` - Promotional banner interface
- `DiscountType` - Enum of supported discount types
- `CampaignStatus` - Enum of campaign statuses
- `EventStatus` - Enum of event statuses
- `BannerPosition` - Enum of banner positions
- `AudienceType` - Enum of target audience types

### Services

- `PromotionService` - Main service for promotion management
- `PromotionValidator` - Validation utilities

### Hooks

- `usePromotion()` - React hook for promotion management
- `useEvents()` - React hook for event management
- `useBanners()` - React hook for banner management

### Components

- `PromotionBanner` - Display promotional banners
- `EventCountdown` - Show event countdown timers
- `DiscountCalculator` - Display discount calculations
- `PromotionList` - List active promotions

## Configuration Options

Initialize the module with custom configuration:

```typescript
import { initializePromotionModule } from '@kcommerce/promotion-events';

initializePromotionModule({
  currency: 'KRW',
  locale: 'ko-KR',
  autoRefresh: true,
  refreshInterval: 30000,
  enableCache: true,
  maxCacheAge: 300000
});
```

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Add tests for your changes
4. Ensure all tests pass
5. Submit a pull request

## Support

For support and questions, please create an issue in the repository or contact the development team.