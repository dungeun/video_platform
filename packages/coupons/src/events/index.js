import { EventEmitter } from '@company/core';
import { CouponEventType } from '../types';
export class CouponEventBus extends EventEmitter {
    constructor() {
        super();
    }
    static getInstance() {
        if (!CouponEventBus.instance) {
            CouponEventBus.instance = new CouponEventBus();
        }
        return CouponEventBus.instance;
    }
    emitCouponEvent(event) {
        this.emit(event.type, event);
        this.emit('coupon:*', event); // Wildcard event for all coupon events
    }
    onCouponCreated(handler) {
        this.on(CouponEventType.CREATED, handler);
    }
    onCouponUpdated(handler) {
        this.on(CouponEventType.UPDATED, handler);
    }
    onCouponUsed(handler) {
        this.on(CouponEventType.USED, handler);
    }
    onCouponExpired(handler) {
        this.on(CouponEventType.EXPIRED, handler);
    }
    onCouponLimitReached(handler) {
        this.on(CouponEventType.LIMIT_REACHED, handler);
    }
    onAnyCouponEvent(handler) {
        this.on('coupon:*', handler);
    }
}
export const couponEventBus = CouponEventBus.getInstance();
//# sourceMappingURL=index.js.map