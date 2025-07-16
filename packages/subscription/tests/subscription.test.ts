import { describe, it, expect, beforeEach } from 'vitest';
import { SubscriptionService, BillingService, DeliveryScheduler } from '../src';
import { defaultSubscriptionConfig } from '../src';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  beforeEach(() => {
    service = new SubscriptionService(defaultSubscriptionConfig);
  });

  it('should create subscription service instance', () => {
    expect(service).toBeInstanceOf(SubscriptionService);
  });

  it('should create a new subscription', async () => {
    const request = {
      userId: 'user123',
      planId: 'plan_monthly',
      items: [
        {
          productId: 'product1',
          quantity: 2
        }
      ],
      deliveryAddress: {
        name: 'John Doe',
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'US'
      },
      paymentMethodId: 'pm_123',
      deliverySchedule: {
        frequency: 'monthly' as const,
        skipHolidays: true,
        skipWeekends: false
      }
    };

    const subscription = await service.createSubscription(request);
    
    expect(subscription).toHaveProperty('id');
    expect(subscription.userId).toBe(request.userId);
    expect(subscription.planId).toBe(request.planId);
    expect(subscription.status).toBe('active');
  });

  it('should get subscription by ID', async () => {
    const subscription = await service.getSubscription('sub_123');
    // Since this is a mock, it will return null
    expect(subscription).toBeNull();
  });

  it('should get user subscriptions', async () => {
    const response = await service.getUserSubscriptions('user123');
    
    expect(response).toHaveProperty('subscriptions');
    expect(response).toHaveProperty('pagination');
    expect(response.subscriptions).toBeInstanceOf(Array);
  });

  it('should get subscription analytics', async () => {
    const analytics = await service.getAnalytics();
    
    expect(analytics).toHaveProperty('totalSubscriptions');
    expect(analytics).toHaveProperty('activeSubscriptions');
    expect(analytics).toHaveProperty('churnRate');
    expect(analytics).toHaveProperty('monthlyRecurringRevenue');
  });
});

describe('BillingService', () => {
  let billingService: BillingService;

  beforeEach(() => {
    billingService = new BillingService(defaultSubscriptionConfig);
  });

  it('should create billing service instance', () => {
    expect(billingService).toBeInstanceOf(BillingService);
  });

  it('should calculate next billing date', () => {
    const lastBillingDate = new Date('2024-01-01');
    const nextDate = billingService.calculateNextBillingDate(lastBillingDate, 'monthly');
    
    expect(nextDate.getMonth()).toBe(1); // February (0-indexed)
    expect(nextDate.getFullYear()).toBe(2024);
  });

  it('should process refund', async () => {
    const result = await billingService.processRefund('pay_123', 100, 'Customer request');
    expect(result).toBe(true);
  });
});

describe('DeliveryScheduler', () => {
  let deliveryScheduler: DeliveryScheduler;

  beforeEach(() => {
    deliveryScheduler = new DeliveryScheduler(defaultSubscriptionConfig);
  });

  it('should create delivery scheduler instance', () => {
    expect(deliveryScheduler).toBeInstanceOf(DeliveryScheduler);
  });

  it('should calculate next delivery date', () => {
    const fromDate = new Date('2024-01-01');
    const schedule = {
      frequency: 'monthly' as const,
      skipHolidays: false,
      skipWeekends: false
    };
    
    const nextDate = deliveryScheduler.calculateNextDeliveryDate(fromDate, schedule);
    
    // Should be at least a few days later due to lead time
    expect(nextDate.getTime()).toBeGreaterThan(fromDate.getTime());
  });

  it('should handle weekly frequency', () => {
    const fromDate = new Date('2024-01-01');
    const schedule = {
      frequency: 'weekly' as const,
      skipHolidays: false,
      skipWeekends: false
    };
    
    const nextDate = deliveryScheduler.calculateNextDeliveryDate(fromDate, schedule);
    
    // Should be about a week later (plus lead time)
    const expectedMinimum = new Date(fromDate);
    expectedMinimum.setDate(expectedMinimum.getDate() + 7); // weekly + lead time
    
    expect(nextDate.getTime()).toBeGreaterThanOrEqual(expectedMinimum.getTime());
  });

  it('should handle custom intervals', () => {
    const fromDate = new Date('2024-01-01');
    const schedule = {
      frequency: 'custom' as const,
      customInterval: {
        value: 2,
        unit: 'weeks' as const
      },
      skipHolidays: false,
      skipWeekends: false
    };
    
    const nextDate = deliveryScheduler.calculateNextDeliveryDate(fromDate, schedule);
    
    // Should be about 2 weeks later (plus lead time)
    const expectedMinimum = new Date(fromDate);
    expectedMinimum.setDate(expectedMinimum.getDate() + 14); // 2 weeks + lead time
    
    expect(nextDate.getTime()).toBeGreaterThanOrEqual(expectedMinimum.getTime());
  });
});