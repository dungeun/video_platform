import {
  Subscription,
  BillingCycle,
  PaymentStatus,
  SubscriptionConfig,
  SubscriptionError
} from '../types';
import { StorageManager } from '@modules/storage';

export class BillingService {
  private storage: StorageManager;
  private config: SubscriptionConfig;

  constructor(config: SubscriptionConfig) {
    this.config = config;
    this.storage = new StorageManager('billing');
  }

  /**
   * Schedule initial payment for a new subscription
   */
  async scheduleInitialPayment(subscription: Subscription): Promise<void> {
    const billingCycle: BillingCycle = {
      id: this.generateId(),
      subscriptionId: subscription.id,
      cycleNumber: 1,
      billingDate: subscription.nextBillingDate,
      dueDate: new Date(subscription.nextBillingDate.getTime() + this.config.gracePeriodDays * 24 * 60 * 60 * 1000),
      amount: subscription.totalAmount,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storage.set(`billing_cycle_${billingCycle.id}`, billingCycle);
    await this.storage.append(`subscription_billing_${subscription.id}`, billingCycle.id);
  }

  /**
   * Process payment for a billing cycle
   */
  async processPayment(cycleId: string): Promise<PaymentStatus> {
    const cycle = await this.storage.get(`billing_cycle_${cycleId}`);
    if (!cycle) {
      throw new SubscriptionError('Billing cycle not found', 'validation', 'cycle_not_found');
    }

    try {
      // Update cycle status
      cycle.status = 'processing';
      cycle.updatedAt = new Date();
      await this.storage.set(`billing_cycle_${cycleId}`, cycle);

      // Simulate payment processing
      const paymentResult = await this.simulatePayment(cycle);
      
      if (paymentResult.success) {
        cycle.status = 'completed';
        cycle.paymentId = paymentResult.paymentId;
      } else {
        cycle.status = 'failed';
        cycle.failureReason = paymentResult.reason;
        cycle.retryCount += 1;
        
        if (cycle.retryCount < this.config.retryAttempts) {
          cycle.nextRetryDate = this.calculateNextRetryDate(cycle.retryCount);
        }
      }

      cycle.updatedAt = new Date();
      await this.storage.set(`billing_cycle_${cycleId}`, cycle);
      
      return cycle.status;
    } catch (error) {
      cycle.status = 'failed';
      cycle.failureReason = error instanceof Error ? error.message : 'Unknown error';
      cycle.updatedAt = new Date();
      await this.storage.set(`billing_cycle_${cycleId}`, cycle);
      
      throw new SubscriptionError('Payment processing failed', 'payment', 'processing_failed');
    }
  }

  /**
   * Retry failed payment
   */
  async retryPayment(cycleId: string): Promise<PaymentStatus> {
    const cycle = await this.storage.get(`billing_cycle_${cycleId}`);
    if (!cycle || cycle.status !== 'failed') {
      throw new SubscriptionError('Invalid billing cycle for retry', 'validation', 'invalid_retry');
    }

    if (cycle.retryCount >= this.config.retryAttempts) {
      throw new SubscriptionError('Maximum retry attempts exceeded', 'validation', 'max_retries');
    }

    return this.processPayment(cycleId);
  }

  /**
   * Cancel future billing for a subscription
   */
  async cancelFutureBilling(subscriptionId: string): Promise<void> {
    const billingCycleIds = await this.storage.get(`subscription_billing_${subscriptionId}`) || [];
    
    for (const cycleId of billingCycleIds) {
      const cycle = await this.storage.get(`billing_cycle_${cycleId}`);
      if (cycle && cycle.status === 'pending' && cycle.billingDate > new Date()) {
        cycle.status = 'failed'; // Mark as cancelled
        cycle.failureReason = 'Subscription cancelled';
        cycle.updatedAt = new Date();
        await this.storage.set(`billing_cycle_${cycleId}`, cycle);
      }
    }
  }

  /**
   * Get billing history for a subscription
   */
  async getBillingHistory(subscriptionId: string): Promise<BillingCycle[]> {
    const billingCycleIds = await this.storage.get(`subscription_billing_${subscriptionId}`) || [];
    const cycles: BillingCycle[] = [];
    
    for (const cycleId of billingCycleIds) {
      const cycle = await this.storage.get(`billing_cycle_${cycleId}`);
      if (cycle) {
        cycles.push(cycle);
      }
    }
    
    return cycles.sort((a, b) => b.billingDate.getTime() - a.billingDate.getTime());
  }

  /**
   * Calculate next billing date
   */
  calculateNextBillingDate(lastBillingDate: Date, frequency: string): Date {
    const nextDate = new Date(lastBillingDate);
    
    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'bi-weekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'semi-annual':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 'annual':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate;
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, amount: number, reason: string): Promise<boolean> {
    // Mock refund processing
    console.log(`Processing refund: ${amount} for payment ${paymentId}, reason: ${reason}`);
    return true;
  }

  private async simulatePayment(cycle: BillingCycle): Promise<{ success: boolean; paymentId?: string; reason?: string }> {
    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    
    if (success) {
      return {
        success: true,
        paymentId: `pay_${this.generateId()}`
      };
    } else {
      const reasons = [
        'Insufficient funds',
        'Card expired',
        'Payment declined',
        'Network error'
      ];
      return {
        success: false,
        reason: reasons[Math.floor(Math.random() * reasons.length)]
      };
    }
  }

  private calculateNextRetryDate(retryCount: number): Date {
    const retryIntervals = this.config.retryIntervalDays;
    const intervalIndex = Math.min(retryCount - 1, retryIntervals.length - 1);
    const intervalDays = retryIntervals[intervalIndex];
    
    const nextRetryDate = new Date();
    nextRetryDate.setDate(nextRetryDate.getDate() + intervalDays);
    
    return nextRetryDate;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}