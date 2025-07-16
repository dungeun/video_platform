import {
  Subscription,
  DeliverySchedule,
  SubscriptionOrder,
  DeliveryStatus,
  SubscriptionConfig,
  BillingFrequency
} from '../types';
import { StorageManager } from '@modules/storage';
import * as cronParser from 'cron-parser';

export class DeliveryScheduler {
  private storage: StorageManager;
  private config: SubscriptionConfig;

  constructor(config: SubscriptionConfig) {
    this.config = config;
    this.storage = new StorageManager('delivery');
  }

  /**
   * Calculate next delivery date based on schedule
   */
  calculateNextDeliveryDate(
    fromDate: Date,
    schedule: DeliverySchedule,
    trialDays?: number
  ): Date {
    const startDate = new Date(fromDate);
    
    if (trialDays) {
      startDate.setDate(startDate.getDate() + trialDays);
    }

    // Add lead time
    startDate.setDate(startDate.getDate() + this.config.delivery.defaultLeadTimeDays);

    let nextDate = new Date(startDate);

    if (schedule.customInterval) {
      switch (schedule.customInterval.unit) {
        case 'days':
          nextDate.setDate(nextDate.getDate() + schedule.customInterval.value);
          break;
        case 'weeks':
          nextDate.setDate(nextDate.getDate() + (schedule.customInterval.value * 7));
          break;
        case 'months':
          nextDate.setMonth(nextDate.getMonth() + schedule.customInterval.value);
          break;
      }
    } else {
      switch (schedule.frequency) {
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
    }

    // Adjust for preferred day of week
    if (schedule.preferredDayOfWeek !== undefined) {
      const currentDay = nextDate.getDay();
      const targetDay = schedule.preferredDayOfWeek;
      const daysToAdd = (targetDay - currentDay + 7) % 7;
      nextDate.setDate(nextDate.getDate() + daysToAdd);
    }

    // Skip weekends if configured
    if (schedule.skipWeekends) {
      nextDate = this.adjustForWeekends(nextDate);
    }

    // Skip holidays if configured
    if (schedule.skipHolidays) {
      nextDate = this.adjustForHolidays(nextDate);
    }

    return nextDate;
  }

  /**
   * Schedule delivery for a subscription
   */
  async scheduleDelivery(subscription: Subscription): Promise<SubscriptionOrder> {
    const order: SubscriptionOrder = {
      id: this.generateId(),
      subscriptionId: subscription.id,
      orderNumber: this.generateOrderNumber(),
      status: 'scheduled',
      items: subscription.items,
      
      subtotal: subscription.totalAmount - subscription.taxAmount,
      discountAmount: subscription.discountAmount,
      taxAmount: subscription.taxAmount,
      shippingAmount: 0, // Free shipping for subscriptions
      totalAmount: subscription.totalAmount,
      
      scheduledDate: subscription.nextDeliveryDate,
      deliveryAddress: subscription.deliveryAddress,
      
      paymentStatus: 'pending',
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storage.set(`order_${order.id}`, order);
    await this.storage.append(`subscription_orders_${subscription.id}`, order.id);
    await this.storage.append(`scheduled_deliveries`, {
      orderId: order.id,
      subscriptionId: subscription.id,
      scheduledDate: order.scheduledDate
    });

    return order;
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(
    orderId: string,
    status: DeliveryStatus,
    trackingNumber?: string
  ): Promise<SubscriptionOrder> {
    const order = await this.storage.get(`order_${orderId}`);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    order.updatedAt = new Date();
    
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    
    if (status === 'delivered') {
      order.deliveredDate = new Date();
    }

    await this.storage.set(`order_${orderId}`, order);
    
    // If delivered, schedule next delivery
    if (status === 'delivered') {
      await this.scheduleNextDelivery(order.subscriptionId);
    }

    return order;
  }

  /**
   * Skip a delivery
   */
  async skipDelivery(
    subscriptionId: string,
    skipDate: Date,
    reason?: string
  ): Promise<void> {
    // Find and cancel the scheduled delivery
    const scheduledDeliveries = await this.storage.get('scheduled_deliveries') || [];
    const deliveryIndex = scheduledDeliveries.findIndex(
      (d: any) => d.subscriptionId === subscriptionId && 
      new Date(d.scheduledDate).toDateString() === skipDate.toDateString()
    );

    if (deliveryIndex !== -1) {
      const delivery = scheduledDeliveries[deliveryIndex];
      await this.updateDeliveryStatus(delivery.orderId, 'skipped');
      
      // Remove from scheduled deliveries
      scheduledDeliveries.splice(deliveryIndex, 1);
      await this.storage.set('scheduled_deliveries', scheduledDeliveries);
      
      // Log the skip
      await this.storage.append(`delivery_skips_${subscriptionId}`, {
        date: skipDate,
        reason,
        timestamp: new Date()
      });
    }
  }

  /**
   * Pause deliveries for a subscription
   */
  async pauseDeliveries(subscriptionId: string, pauseUntil: Date): Promise<void> {
    const scheduledDeliveries = await this.storage.get('scheduled_deliveries') || [];
    
    // Cancel all deliveries scheduled before pause end date
    for (const delivery of scheduledDeliveries) {
      if (delivery.subscriptionId === subscriptionId && 
          new Date(delivery.scheduledDate) <= pauseUntil) {
        await this.updateDeliveryStatus(delivery.orderId, 'cancelled');
      }
    }

    // Store pause information
    await this.storage.set(`delivery_pause_${subscriptionId}`, {
      pauseUntil,
      pausedAt: new Date()
    });
  }

  /**
   * Resume deliveries for a subscription
   */
  async resumeDeliveries(subscriptionId: string): Promise<void> {
    // Remove pause information
    await this.storage.delete(`delivery_pause_${subscriptionId}`);
    
    // Schedule next delivery
    await this.scheduleNextDelivery(subscriptionId);
  }

  /**
   * Cancel all deliveries for a subscription
   */
  async cancelDeliveries(subscriptionId: string): Promise<void> {
    const scheduledDeliveries = await this.storage.get('scheduled_deliveries') || [];
    
    // Cancel all future deliveries
    for (const delivery of scheduledDeliveries) {
      if (delivery.subscriptionId === subscriptionId && 
          new Date(delivery.scheduledDate) > new Date()) {
        await this.updateDeliveryStatus(delivery.orderId, 'cancelled');
      }
    }
  }

  /**
   * Get delivery history for a subscription
   */
  async getDeliveryHistory(subscriptionId: string): Promise<SubscriptionOrder[]> {
    const orderIds = await this.storage.get(`subscription_orders_${subscriptionId}`) || [];
    const orders: SubscriptionOrder[] = [];
    
    for (const orderId of orderIds) {
      const order = await this.storage.get(`order_${orderId}`);
      if (order) {
        orders.push(order);
      }
    }
    
    return orders.sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime());
  }

  /**
   * Get upcoming deliveries
   */
  async getUpcomingDeliveries(daysAhead: number = 7): Promise<SubscriptionOrder[]> {
    const scheduledDeliveries = await this.storage.get('scheduled_deliveries') || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    
    const upcomingOrders: SubscriptionOrder[] = [];
    
    for (const delivery of scheduledDeliveries) {
      const deliveryDate = new Date(delivery.scheduledDate);
      if (deliveryDate >= new Date() && deliveryDate <= cutoffDate) {
        const order = await this.storage.get(`order_${delivery.orderId}`);
        if (order && order.status === 'scheduled') {
          upcomingOrders.push(order);
        }
      }
    }
    
    return upcomingOrders.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }

  private async scheduleNextDelivery(subscriptionId: string): Promise<void> {
    const subscription = await this.storage.get(`subscription_${subscriptionId}`);
    if (!subscription || subscription.status !== 'active') {
      return;
    }

    const nextDeliveryDate = this.calculateNextDeliveryDate(
      new Date(),
      subscription.deliverySchedule
    );

    // Update subscription with next delivery date
    subscription.nextDeliveryDate = nextDeliveryDate;
    subscription.lastDeliveryDate = new Date();
    subscription.updatedAt = new Date();
    
    await this.storage.set(`subscription_${subscriptionId}`, subscription);
    
    // Schedule the delivery
    await this.scheduleDelivery(subscription);
  }

  private adjustForWeekends(date: Date): Date {
    const adjustedDate = new Date(date);
    const dayOfWeek = adjustedDate.getDay();
    
    if (dayOfWeek === 0) { // Sunday
      adjustedDate.setDate(adjustedDate.getDate() + 1);
    } else if (dayOfWeek === 6) { // Saturday
      adjustedDate.setDate(adjustedDate.getDate() + 2);
    }
    
    return adjustedDate;
  }

  private adjustForHolidays(date: Date): Date {
    // Simple holiday check - would need a proper holiday calendar in production
    const holidays = [
      '01-01', // New Year's Day
      '07-04', // Independence Day
      '12-25'  // Christmas
    ];
    
    const dateString = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (holidays.includes(dateString)) {
      const adjustedDate = new Date(date);
      adjustedDate.setDate(adjustedDate.getDate() + 1);
      return this.adjustForHolidays(adjustedDate); // Recursive in case of consecutive holidays
    }
    
    return date;
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    return `SUB-${timestamp}-${random}`.toUpperCase();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}