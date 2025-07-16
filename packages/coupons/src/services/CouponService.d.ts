import { EventEmitter } from '@company/core';
import { Coupon, CouponQuery, ServiceResponse } from '../types';
import { CouponRepository } from '../repositories/interfaces';
import { CouponValidator } from '../validators';
export declare class CouponService extends EventEmitter {
    private repository;
    private validator;
    constructor(repository: CouponRepository, validator: CouponValidator);
    create(data: Omit<Coupon, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<Coupon>>;
    update(id: string, data: Partial<Coupon>): Promise<ServiceResponse<Coupon>>;
    activate(id: string): Promise<ServiceResponse<Coupon>>;
    deactivate(id: string): Promise<ServiceResponse<Coupon>>;
    delete(id: string): Promise<ServiceResponse<void>>;
    findById(id: string): Promise<ServiceResponse<Coupon>>;
    findByCode(code: string): Promise<ServiceResponse<Coupon>>;
    findAll(query?: CouponQuery): Promise<ServiceResponse<{
        coupons: Coupon[];
        total: number;
    }>>;
    checkExpiredCoupons(): Promise<void>;
    private generateId;
}
//# sourceMappingURL=CouponService.d.ts.map