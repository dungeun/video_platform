import { EventEmitter } from '@company/core';
import { CouponEvent } from '../types';
export declare class CouponEventBus extends EventEmitter {
    private static instance;
    private constructor();
    static getInstance(): CouponEventBus;
    emitCouponEvent(event: CouponEvent): void;
    onCouponCreated(handler: (event: CouponEvent) => void): void;
    onCouponUpdated(handler: (event: CouponEvent) => void): void;
    onCouponUsed(handler: (event: CouponEvent) => void): void;
    onCouponExpired(handler: (event: CouponEvent) => void): void;
    onCouponLimitReached(handler: (event: CouponEvent) => void): void;
    onAnyCouponEvent(handler: (event: CouponEvent) => void): void;
}
export declare const couponEventBus: CouponEventBus;
//# sourceMappingURL=index.d.ts.map