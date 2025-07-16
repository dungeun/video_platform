import { EventEmitter } from '@company/core';
import { 
  Coupon, 
  CouponQuery, 
  ServiceResponse, 
  CouponEventType,
  CouponEvent 
} from '../types';
import { CouponEntity } from '../entities';
import { CouponRepository } from '../repositories/interfaces';
import { CouponValidator } from '../validators';

export class CouponService extends EventEmitter {
  constructor(
    private repository: CouponRepository,
    private validator: CouponValidator
  ) {
    super();
  }

  async create(data: Omit<Coupon, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<Coupon>> {
    try {
      // Validate coupon data
      const validation = await this.validator.validateCouponData(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_COUPON_DATA',
            message: 'Invalid coupon data',
            details: validation.errors
          }
        };
      }

      // Check if code already exists
      const existing = await this.repository.findByCode(data.code);
      if (existing) {
        return {
          success: false,
          error: {
            code: 'COUPON_CODE_EXISTS',
            message: 'Coupon code already exists'
          }
        };
      }

      // Create coupon
      const coupon = await this.repository.create({
        ...data,
        id: this.generateId(),
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Emit event
      this.emit('coupon:created', {
        type: CouponEventType.CREATED,
        couponId: coupon.id,
        timestamp: new Date()
      } as CouponEvent);

      return {
        success: true,
        data: coupon
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COUPON_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create coupon'
        }
      };
    }
  }

  async update(id: string, data: Partial<Coupon>): Promise<ServiceResponse<Coupon>> {
    try {
      const existing = await this.repository.findById(id);
      if (!existing) {
        return {
          success: false,
          error: {
            code: 'COUPON_NOT_FOUND',
            message: 'Coupon not found'
          }
        };
      }

      // Validate update data
      const validation = await this.validator.validateCouponData({ ...existing, ...data });
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_UPDATE_DATA',
            message: 'Invalid update data',
            details: validation.errors
          }
        };
      }

      // Update coupon
      const updated = await this.repository.update(id, {
        ...data,
        updatedAt: new Date()
      });

      // Emit event
      this.emit('coupon:updated', {
        type: CouponEventType.UPDATED,
        couponId: id,
        timestamp: new Date(),
        metadata: { changes: data }
      } as CouponEvent);

      return {
        success: true,
        data: updated
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COUPON_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update coupon'
        }
      };
    }
  }

  async activate(id: string): Promise<ServiceResponse<Coupon>> {
    try {
      const coupon = await this.repository.findById(id);
      if (!coupon) {
        return {
          success: false,
          error: {
            code: 'COUPON_NOT_FOUND',
            message: 'Coupon not found'
          }
        };
      }

      const entity = CouponEntity.fromJSON(coupon);
      if (entity.isExpired) {
        return {
          success: false,
          error: {
            code: 'COUPON_EXPIRED',
            message: 'Cannot activate expired coupon'
          }
        };
      }

      entity.activate();
      const updated = await this.repository.update(id, entity.toJSON());

      // Emit event
      this.emit('coupon:activated', {
        type: CouponEventType.ACTIVATED,
        couponId: id,
        timestamp: new Date()
      } as CouponEvent);

      return {
        success: true,
        data: updated
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COUPON_ACTIVATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to activate coupon'
        }
      };
    }
  }

  async deactivate(id: string): Promise<ServiceResponse<Coupon>> {
    try {
      const coupon = await this.repository.findById(id);
      if (!coupon) {
        return {
          success: false,
          error: {
            code: 'COUPON_NOT_FOUND',
            message: 'Coupon not found'
          }
        };
      }

      const entity = CouponEntity.fromJSON(coupon);
      entity.deactivate();
      const updated = await this.repository.update(id, entity.toJSON());

      // Emit event
      this.emit('coupon:deactivated', {
        type: CouponEventType.DEACTIVATED,
        couponId: id,
        timestamp: new Date()
      } as CouponEvent);

      return {
        success: true,
        data: updated
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COUPON_DEACTIVATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to deactivate coupon'
        }
      };
    }
  }

  async delete(id: string): Promise<ServiceResponse<void>> {
    try {
      const exists = await this.repository.findById(id);
      if (!exists) {
        return {
          success: false,
          error: {
            code: 'COUPON_NOT_FOUND',
            message: 'Coupon not found'
          }
        };
      }

      await this.repository.delete(id);

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COUPON_DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete coupon'
        }
      };
    }
  }

  async findById(id: string): Promise<ServiceResponse<Coupon>> {
    try {
      const coupon = await this.repository.findById(id);
      if (!coupon) {
        return {
          success: false,
          error: {
            code: 'COUPON_NOT_FOUND',
            message: 'Coupon not found'
          }
        };
      }

      return {
        success: true,
        data: coupon
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COUPON_FIND_ERROR',
          message: error instanceof Error ? error.message : 'Failed to find coupon'
        }
      };
    }
  }

  async findByCode(code: string): Promise<ServiceResponse<Coupon>> {
    try {
      const coupon = await this.repository.findByCode(code.toUpperCase());
      if (!coupon) {
        return {
          success: false,
          error: {
            code: 'COUPON_NOT_FOUND',
            message: 'Coupon not found'
          }
        };
      }

      return {
        success: true,
        data: coupon
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COUPON_FIND_ERROR',
          message: error instanceof Error ? error.message : 'Failed to find coupon'
        }
      };
    }
  }

  async findAll(query: CouponQuery = {}): Promise<ServiceResponse<{ coupons: Coupon[]; total: number }>> {
    try {
      const result = await this.repository.findAll(query);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COUPON_LIST_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list coupons'
        }
      };
    }
  }

  async checkExpiredCoupons(): Promise<void> {
    try {
      const { coupons } = await this.repository.findAll({
        isActive: true,
        validAt: new Date()
      });

      for (const coupon of coupons) {
        const entity = CouponEntity.fromJSON(coupon);
        if (entity.isExpired && coupon.isActive) {
          await this.deactivate(coupon.id);
          
          this.emit('coupon:expired', {
            type: CouponEventType.EXPIRED,
            couponId: coupon.id,
            timestamp: new Date()
          } as CouponEvent);
        }
      }
    } catch (error) {
      console.error('Failed to check expired coupons:', error);
    }
  }

  private generateId(): string {
    return `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}