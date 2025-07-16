import { EventEmitter } from '@repo/core';
import { CouponEvent, CouponEventType } from '../types';

export class CouponEventBus extends EventEmitter {
  private static instance: CouponEventBus;

  private constructor() {
    super();
  }

  static getInstance(): CouponEventBus {
    if (!CouponEventBus.instance) {
      CouponEventBus.instance = new CouponEventBus();
    }
    return CouponEventBus.instance;
  }

  emitCouponEvent(event: CouponEvent): void {
    this.emit(event.type, event);
    this.emit('coupon:*', event); // Wildcard event for all coupon events
  }

  onCouponCreated(handler: (event: CouponEvent) => void): void {
    this.on(CouponEventType.CREATED, handler);
  }

  onCouponUpdated(handler: (event: CouponEvent) => void): void {
    this.on(CouponEventType.UPDATED, handler);
  }

  onCouponUsed(handler: (event: CouponEvent) => void): void {
    this.on(CouponEventType.USED, handler);
  }

  onCouponExpired(handler: (event: CouponEvent) => void): void {
    this.on(CouponEventType.EXPIRED, handler);
  }

  onCouponLimitReached(handler: (event: CouponEvent) => void): void {
    this.on(CouponEventType.LIMIT_REACHED, handler);
  }

  onAnyCouponEvent(handler: (event: CouponEvent) => void): void {
    this.on('coupon:*', handler);
  }
}

export const couponEventBus = CouponEventBus.getInstance();