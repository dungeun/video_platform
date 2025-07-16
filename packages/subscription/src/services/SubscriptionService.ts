import {
  Subscription,
  SubscriptionPlan,
  SubscriptionOrder,
  SubscriptionAnalytics,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  PauseSubscriptionRequest,
  CancelSubscriptionRequest,
  SkipDeliveryRequest,
  SubscriptionListResponse,
  SubscriptionOrderListResponse,
  SubscriptionStatus,
  BillingCycle,
  SubscriptionConfig,
  SubscriptionError,
  SubscriptionEvent
} from '../types';
import { BillingService } from './BillingService';
import { DeliveryScheduler } from './DeliveryScheduler';
import { StorageManager } from '@modules/storage';

export class SubscriptionService {
  private billingService: BillingService;
  private deliveryScheduler: DeliveryScheduler;
  private storage: StorageManager;
  private config: SubscriptionConfig;
  private eventListeners: Map<string, Function[]>;

  constructor(config: SubscriptionConfig) {
    this.config = config;
    this.billingService = new BillingService(config);
    this.deliveryScheduler = new DeliveryScheduler(config);
    this.storage = new StorageManager('subscription');
    this.eventListeners = new Map();
  }

  /**
   * Create a new subscription
   */
  async createSubscription(request: CreateSubscriptionRequest): Promise<Subscription> {
    try {
      // Validate request
      await this.validateCreateRequest(request);

      // Get plan details
      const plan = await this.getSubscriptionPlan(request.planId);
      if (!plan || !plan.isActive) {
        throw new SubscriptionError('Invalid or inactive subscription plan', 'validation', 'plan_invalid');
      }

      // Calculate pricing
      const pricingDetails = await this.calculateSubscriptionPricing(request, plan);

      // Create subscription object
      const subscription: Subscription = {
        id: this.generateId(),
        userId: request.userId,
        planId: request.planId,
        plan,
        items: pricingDetails.items,
        status: request.trialDays ? 'trial' : 'active',
        
        billingFrequency: plan.billingFrequency,
        nextBillingDate: this.calculateNextBillingDate(new Date(), plan.billingFrequency, request.trialDays),
        billingCycleCount: 0,
        totalAmount: pricingDetails.totalAmount,
        discountAmount: pricingDetails.discountAmount,
        taxAmount: pricingDetails.taxAmount,
        
        deliverySchedule: request.deliverySchedule,
        nextDeliveryDate: this.deliveryScheduler.calculateNextDeliveryDate(
          new Date(),
          request.deliverySchedule,
          request.trialDays
        ),
        deliveryAddress: {
          ...request.deliveryAddress,
          id: this.generateId(),
          isDefault: false
        },
        
        startDate: new Date(),
        trialEndDate: request.trialDays ? 
          new Date(Date.now() + request.trialDays * 24 * 60 * 60 * 1000) : undefined,
        
        paymentMethodId: request.paymentMethodId,
        paymentMethod: await this.getPaymentMethod(request.paymentMethodId),
        
        preferences: {
          emailNotifications: {
            upcomingDelivery: true,
            paymentProcessed: true,
            paymentFailed: true,
            subscriptionChanges: true,
            promotions: false
          },
          smsNotifications: {
            upcomingDelivery: false,
            paymentFailed: true,
            deliveryUpdates: true
          },
          autoRenewal: true,
          allowPartialDelivery: false,
          maxRetryAttempts: this.config.retryAttempts,
          pauseOnPaymentFailure: false,
          ...request.preferences
        },
        
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save subscription
      await this.storage.set(`subscription_${subscription.id}`, subscription);
      await this.storage.append(`user_subscriptions_${request.userId}`, subscription.id);

      // Schedule first billing cycle
      if (!request.trialDays) {
        await this.billingService.scheduleInitialPayment(subscription);
      }

      // Schedule first delivery
      await this.deliveryScheduler.scheduleDelivery(subscription);

      // Emit event
      await this.emitEvent('subscription.created', subscription.id, subscription);

      return subscription;
    } catch (error) {
      if (error instanceof SubscriptionError) {
        throw error;
      }
      throw new SubscriptionError(
        'Failed to create subscription',
        'system',
        'creation_failed',
        { originalError: error }
      );
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    return this.storage.get(`subscription_${subscriptionId}`);
  }

  /**
   * Get subscriptions for a user
   */
  async getUserSubscriptions(
    userId: string,
    options: {
      status?: SubscriptionStatus;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<SubscriptionListResponse> {
    const { status, page = 1, limit = 10 } = options;
    
    const subscriptionIds = await this.storage.get(`user_subscriptions_${userId}`) || [];
    let subscriptions: Subscription[] = [];

    for (const id of subscriptionIds) {
      const subscription = await this.getSubscription(id);
      if (subscription && (!status || subscription.status === status)) {
        subscriptions.push(subscription);
      }
    }

    // Sort by creation date (newest first)
    subscriptions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedSubscriptions = subscriptions.slice(startIndex, startIndex + limit);

    return {
      subscriptions: paginatedSubscriptions,
      pagination: {
        page,
        limit,
        total: subscriptions.length,
        totalPages: Math.ceil(subscriptions.length / limit)
      }
    };
  }

  /**
   * Update subscription
   */
  async updateSubscription(request: UpdateSubscriptionRequest): Promise<Subscription> {
    const subscription = await this.getSubscription(request.subscriptionId);
    if (!subscription) {
      throw new SubscriptionError('Subscription not found', 'validation', 'not_found');
    }

    if (!this.canUpdateSubscription(subscription)) {
      throw new SubscriptionError('Subscription cannot be updated in current status', 'validation', 'invalid_status');
    }

    const updatedSubscription = { ...subscription };
    let hasChanges = false;

    // Update items
    if (request.items) {
      const pricingDetails = await this.calculateSubscriptionPricing(
        { ...request, userId: subscription.userId, planId: subscription.planId } as CreateSubscriptionRequest,
        subscription.plan
      );
      updatedSubscription.items = pricingDetails.items;
      updatedSubscription.totalAmount = pricingDetails.totalAmount;
      updatedSubscription.discountAmount = pricingDetails.discountAmount;
      updatedSubscription.taxAmount = pricingDetails.taxAmount;
      hasChanges = true;
    }

    // Update delivery address
    if (request.deliveryAddress) {
      updatedSubscription.deliveryAddress = {
        ...updatedSubscription.deliveryAddress,
        ...request.deliveryAddress
      };
      hasChanges = true;
    }

    // Update delivery schedule
    if (request.deliverySchedule) {
      updatedSubscription.deliverySchedule = {
        ...updatedSubscription.deliverySchedule,
        ...request.deliverySchedule
      };
      // Recalculate next delivery date
      updatedSubscription.nextDeliveryDate = this.deliveryScheduler.calculateNextDeliveryDate(
        new Date(),
        updatedSubscription.deliverySchedule
      );
      hasChanges = true;
    }

    // Update preferences
    if (request.preferences) {
      updatedSubscription.preferences = {
        ...updatedSubscription.preferences,
        ...request.preferences
      };
      hasChanges = true;
    }

    // Update payment method
    if (request.paymentMethodId) {
      updatedSubscription.paymentMethodId = request.paymentMethodId;
      updatedSubscription.paymentMethod = await this.getPaymentMethod(request.paymentMethodId);
      hasChanges = true;
    }

    if (hasChanges) {
      updatedSubscription.updatedAt = new Date();
      await this.storage.set(`subscription_${subscription.id}`, updatedSubscription);
      await this.emitEvent('subscription.updated', subscription.id, updatedSubscription);
    }

    return updatedSubscription;
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(request: PauseSubscriptionRequest): Promise<Subscription> {
    const subscription = await this.getSubscription(request.subscriptionId);
    if (!subscription) {
      throw new SubscriptionError('Subscription not found', 'validation', 'not_found');
    }

    if (subscription.status !== 'active') {
      throw new SubscriptionError('Only active subscriptions can be paused', 'validation', 'invalid_status');
    }

    // Validate pause duration
    const maxPauseDate = new Date();
    maxPauseDate.setMonth(maxPauseDate.getMonth() + this.config.maxPauseMonths);
    
    if (request.pauseUntil > maxPauseDate) {
      throw new SubscriptionError(
        `Cannot pause for more than ${this.config.maxPauseMonths} months`,
        'validation',
        'pause_too_long'
      );
    }

    const updatedSubscription = {
      ...subscription,
      status: 'paused' as SubscriptionStatus,
      pausedUntil: request.pauseUntil,
      updatedAt: new Date(),
      notes: request.reason ? `Paused: ${request.reason}` : undefined
    };

    // Cancel scheduled deliveries until resume date
    await this.deliveryScheduler.pauseDeliveries(subscription.id, request.pauseUntil);

    await this.storage.set(`subscription_${subscription.id}`, updatedSubscription);
    await this.emitEvent('subscription.paused', subscription.id, updatedSubscription);

    return updatedSubscription;
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = await this.getSubscription(subscriptionId);
    if (!subscription) {
      throw new SubscriptionError('Subscription not found', 'validation', 'not_found');
    }

    if (subscription.status !== 'paused') {
      throw new SubscriptionError('Only paused subscriptions can be resumed', 'validation', 'invalid_status');
    }

    const updatedSubscription = {
      ...subscription,
      status: 'active' as SubscriptionStatus,
      pausedUntil: undefined,
      nextDeliveryDate: this.deliveryScheduler.calculateNextDeliveryDate(
        new Date(),
        subscription.deliverySchedule
      ),
      updatedAt: new Date()
    };

    // Resume delivery scheduling
    await this.deliveryScheduler.resumeDeliveries(subscriptionId);

    await this.storage.set(`subscription_${subscription.id}`, updatedSubscription);
    await this.emitEvent('subscription.resumed', subscription.id, updatedSubscription);

    return updatedSubscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(request: CancelSubscriptionRequest): Promise<Subscription> {
    const subscription = await this.getSubscription(request.subscriptionId);
    if (!subscription) {
      throw new SubscriptionError('Subscription not found', 'validation', 'not_found');
    }

    if (['cancelled', 'expired'].includes(subscription.status)) {
      throw new SubscriptionError('Subscription is already cancelled', 'validation', 'already_cancelled');
    }

    // Check minimum commitment
    if (this.config.cancellationPolicy.minimumCommitmentEnforced && 
        subscription.plan.minimumCommitment &&
        subscription.billingCycleCount < subscription.plan.minimumCommitment.cycles) {
      throw new SubscriptionError(
        'Minimum commitment period not met',
        'validation',
        'commitment_not_met'
      );
    }

    const cancellationDate = request.immediate ? new Date() : subscription.nextBillingDate;
    
    const updatedSubscription = {
      ...subscription,
      status: 'cancelled' as SubscriptionStatus,
      cancellationDate,
      cancellationReason: request.reason,
      endDate: cancellationDate,
      updatedAt: new Date()
    };

    // Handle refunds if applicable
    if (request.refundUnusedPortion && this.config.cancellationPolicy.refundPolicy !== 'none') {
      await this.processRefund(subscription, cancellationDate);
    }

    // Cancel future deliveries and billing
    await this.deliveryScheduler.cancelDeliveries(subscription.id);
    await this.billingService.cancelFutureBilling(subscription.id);

    await this.storage.set(`subscription_${subscription.id}`, updatedSubscription);
    await this.emitEvent('subscription.cancelled', subscription.id, updatedSubscription);

    return updatedSubscription;
  }

  /**
   * Skip next delivery
   */
  async skipNextDelivery(request: SkipDeliveryRequest): Promise<void> {
    const subscription = await this.getSubscription(request.subscriptionId);
    if (!subscription) {
      throw new SubscriptionError('Subscription not found', 'validation', 'not_found');
    }

    if (subscription.status !== 'active') {
      throw new SubscriptionError('Can only skip deliveries for active subscriptions', 'validation', 'invalid_status');
    }

    await this.deliveryScheduler.skipDelivery(subscription.id, request.skipDate, request.reason);
    
    // Update next delivery date
    const updatedSubscription = {
      ...subscription,
      nextDeliveryDate: this.deliveryScheduler.calculateNextDeliveryDate(
        request.skipDate,
        subscription.deliverySchedule
      ),
      updatedAt: new Date()
    };

    await this.storage.set(`subscription_${subscription.id}`, updatedSubscription);
  }

  /**
   * Get subscription orders
   */
  async getSubscriptionOrders(
    subscriptionId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<SubscriptionOrderListResponse> {
    const { page = 1, limit = 10 } = options;
    
    const orderIds = await this.storage.get(`subscription_orders_${subscriptionId}`) || [];
    let orders: SubscriptionOrder[] = [];

    for (const orderId of orderIds) {
      const order = await this.storage.get(`order_${orderId}`);
      if (order) {
        orders.push(order);
      }
    }

    // Sort by creation date (newest first)
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedOrders = orders.slice(startIndex, startIndex + limit);

    return {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total: orders.length,
        totalPages: Math.ceil(orders.length / limit)
      }
    };
  }

  /**
   * Get subscription analytics
   */
  async getAnalytics(timeRange?: { start: Date; end: Date }): Promise<SubscriptionAnalytics> {
    // This would typically query the database for analytics
    // For now, return mock data
    return {
      totalSubscriptions: 1250,
      activeSubscriptions: 980,
      churnRate: 0.08,
      monthlyRecurringRevenue: 125000,
      averageOrderValue: 85.50,
      customerLifetimeValue: 450.75,
      retentionRate: 0.92,
      subscriptionsByPlan: {
        'monthly': 650,
        'quarterly': 280,
        'annual': 50
      },
      subscriptionsByStatus: {
        active: 980,
        paused: 120,
        cancelled: 100,
        expired: 30,
        trial: 20,
        pending: 0,
        past_due: 15,
        suspended: 5
      },
      revenueGrowth: [
        { period: '2024-01', revenue: 110000, growth: 0.12 },
        { period: '2024-02', revenue: 118000, growth: 0.07 },
        { period: '2024-03', revenue: 125000, growth: 0.06 }
      ]
    };
  }

  // Helper methods
  private async validateCreateRequest(request: CreateSubscriptionRequest): Promise<void> {
    if (!request.userId || !request.planId || !request.items?.length) {
      throw new SubscriptionError('Missing required fields', 'validation', 'missing_fields');
    }

    if (!request.paymentMethodId || !request.deliveryAddress) {
      throw new SubscriptionError('Payment method and delivery address required', 'validation', 'missing_required');
    }

    // Validate products are subscription eligible
    for (const item of request.items) {
      const product = await this.getProduct(item.productId);
      if (!product?.isSubscriptionEligible) {
        throw new SubscriptionError(`Product ${item.productId} is not eligible for subscription`, 'validation', 'ineligible_product');
      }
    }
  }

  private async calculateSubscriptionPricing(request: CreateSubscriptionRequest, plan: SubscriptionPlan) {
    let subtotal = 0;
    const items = [];

    for (const requestItem of request.items) {
      const product = await this.getProduct(requestItem.productId);
      if (!product) {
        throw new SubscriptionError(`Product ${requestItem.productId} not found`, 'validation', 'product_not_found');
      }

      const unitPrice = product.price;
      const discountedPrice = this.calculateDiscountedPrice(unitPrice, plan);
      const totalPrice = discountedPrice * requestItem.quantity;

      items.push({
        id: this.generateId(),
        productId: product.id,
        product,
        quantity: requestItem.quantity,
        unitPrice,
        discountedPrice,
        totalPrice,
        customizations: requestItem.customizations
      });

      subtotal += totalPrice;
    }

    const discountAmount = subtotal * (plan.discountPercentage / 100);
    const taxAmount = (subtotal - discountAmount) * 0.1; // 10% tax rate
    const totalAmount = subtotal - discountAmount + taxAmount;

    return {
      items,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount
    };
  }

  private calculateDiscountedPrice(basePrice: number, plan: SubscriptionPlan): number {
    return basePrice * (1 - plan.discountPercentage / 100);
  }

  private calculateNextBillingDate(startDate: Date, frequency: string, trialDays?: number): Date {
    const date = new Date(startDate);
    
    if (trialDays) {
      date.setDate(date.getDate() + trialDays);
    }

    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'bi-weekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'semi-annual':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'annual':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }

    return date;
  }

  private canUpdateSubscription(subscription: Subscription): boolean {
    return ['active', 'trial'].includes(subscription.status);
  }

  private async processRefund(subscription: Subscription, cancellationDate: Date): Promise<void> {
    // Implementation would depend on payment provider
    console.log(`Processing refund for subscription ${subscription.id}`);
  }

  private async emitEvent(type: string, subscriptionId: string, data: any): Promise<void> {
    const event: SubscriptionEvent = {
      id: this.generateId(),
      type: type as any,
      subscriptionId,
      data,
      timestamp: new Date(),
      version: '1.0'
    };

    const listeners = this.eventListeners.get(type) || [];
    for (const listener of listeners) {
      try {
        await listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${type}:`, error);
      }
    }
  }

  // Event management
  addEventListener(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  removeEventListener(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Mock data methods - replace with real implementations
  private async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    // Mock implementation
    return {
      id: planId,
      name: 'Monthly Plan',
      description: 'Monthly subscription with 10% discount',
      billingFrequency: 'monthly',
      discountPercentage: 10,
      features: ['Free shipping', 'Priority support'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async getProduct(productId: string): Promise<any> {
    // Mock implementation
    return {
      id: productId,
      name: 'Sample Product',
      price: 29.99,
      isSubscriptionEligible: true
    };
  }

  private async getPaymentMethod(paymentMethodId: string): Promise<any> {
    // Mock implementation
    return {
      id: paymentMethodId,
      type: 'card',
      last4: '1234',
      brand: 'visa',
      isDefault: true
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}