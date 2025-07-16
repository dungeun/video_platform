/**
 * Tests for shipping-korea module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  TrackingService,
  CostCalculator,
  StatusManager,
  trackingNumberValidator,
  addressFormatter,
  formatDeliveryStatus,
  getCarrierInfo,
  isServiceSupported
} from '../src';

describe('Shipping Korea Module', () => {
  describe('TrackingService', () => {
    let trackingService: TrackingService;

    beforeEach(() => {
      trackingService = new TrackingService({
        carriers: {
          cj: {
            apiKey: 'test-key',
            apiSecret: 'test-secret',
            baseUrl: 'https://api.test.com'
          }
        },
        cache: {
          enabled: true,
          ttl: 300000
        }
      });
    });

    it('should initialize with supported carriers', () => {
      const carriers = trackingService.getSupportedCarriers();
      expect(carriers).toContain('CJ');
    });

    it('should check if carrier is supported', () => {
      expect(trackingService.isCarrierSupported('CJ')).toBe(true);
      expect(trackingService.isCarrierSupported('UNKNOWN' as any)).toBe(false);
    });
  });

  describe('Validators', () => {
    it('should validate tracking numbers', () => {
      expect(trackingNumberValidator.validate('CJ', '1234567890')).toBe(true);
      expect(trackingNumberValidator.validate('CJ', '123')).toBe(false);
    });

    it('should auto-detect carrier from tracking number', () => {
      expect(trackingNumberValidator.detectCarrier('1234567890')).toBe('CJ');
      expect(trackingNumberValidator.detectCarrier('12345678901')).toBe('LOTTE');
    });

    it('should format tracking numbers', () => {
      expect(trackingNumberValidator.format('1234567890')).toBe('1234-567-890');
    });
  });

  describe('Formatters', () => {
    it('should format addresses', () => {
      const address = {
        postalCode: '06234',
        province: '서울특별시',
        city: '강남구',
        district: '역삼동',
        street: '테헤란로 123',
        detail: '4층',
        building: 'ABC빌딩',
        phone: '02-1234-5678',
        name: '홍길동'
      };

      const formatted = addressFormatter.format(address);
      expect(formatted).toBe('서울특별시 강남구 역삼동 테헤란로 123 4층 ABC빌딩');
    });

    it('should format phone numbers', () => {
      expect(addressFormatter.formatPhone('01012345678')).toBe('010-1234-5678');
      expect(addressFormatter.formatPhone('0212345678')).toBe('02-1234-5678');
    });

    it('should format delivery status', () => {
      expect(formatDeliveryStatus('DELIVERED')).toBe('배송완료');
      expect(formatDeliveryStatus('IN_TRANSIT')).toBe('이동중');
    });
  });

  describe('CarrierInfo', () => {
    it('should get carrier information', () => {
      const info = getCarrierInfo('CJ');
      expect(info).toBeDefined();
      expect(info?.displayName).toBe('CJ대한통운');
      expect(info?.customerServiceNumber).toBe('1588-1255');
    });

    it('should check supported services', () => {
      expect(isServiceSupported('CJ', 'STANDARD')).toBe(true);
      expect(isServiceSupported('CJ', 'INTERNATIONAL')).toBe(false);
    });
  });

  describe('StatusManager', () => {
    let statusManager: StatusManager;

    beforeEach(() => {
      statusManager = new StatusManager({
        storage: {
          enabled: false
        },
        notifications: {
          enabled: true,
          events: ['DELIVERED', 'FAILED']
        }
      });
    });

    it('should get status statistics', () => {
      const stats = statusManager.getStatusStatistics();
      expect(stats).toBeDefined();
    });
  });
});