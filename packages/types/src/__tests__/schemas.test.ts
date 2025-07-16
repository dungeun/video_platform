/**
 * @repo/types - Zod 스키마 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  IdSchema,
  EmailSchema,
  MoneySchema,
  AddressSchema,
  LoginCredentialsSchema,
  UserSchema,
  ProductSchema,
  OrderSchema,
  FormFieldSchema,
  validate,
  validateAsync
} from '../schemas';

describe('Basic Schemas', () => {
  it('validates ID schema', () => {
    expect(IdSchema.safeParse('valid-id').success).toBe(true);
    expect(IdSchema.safeParse('').success).toBe(false);
    expect(IdSchema.safeParse(123).success).toBe(false);
  });

  it('validates Email schema', () => {
    expect(EmailSchema.safeParse('test@example.com').success).toBe(true);
    expect(EmailSchema.safeParse('invalid-email').success).toBe(false);
    expect(EmailSchema.safeParse('').success).toBe(false);
  });

  it('validates Money schema', () => {
    const validMoney = { amount: 100, currency: 'USD' };
    const invalidMoney = { amount: -100, currency: 'INVALID' };
    
    expect(MoneySchema.safeParse(validMoney).success).toBe(true);
    expect(MoneySchema.safeParse(invalidMoney).success).toBe(false);
  });

  it('validates Address schema', () => {
    const validAddress = {
      country: 'South Korea',
      city: 'Seoul',
      street: '123 Main St',
      postalCode: '12345'
    };
    
    const invalidAddress = {
      country: '',
      city: 'Seoul'
    };
    
    expect(AddressSchema.safeParse(validAddress).success).toBe(true);
    expect(AddressSchema.safeParse(invalidAddress).success).toBe(false);
  });
});

describe('Auth Schemas', () => {
  it('validates LoginCredentials schema', () => {
    const validCredentials = {
      email: 'user@example.com',
      password: 'password123'
    };
    
    const invalidCredentials = {
      password: '123' // too short
    };
    
    expect(LoginCredentialsSchema.safeParse(validCredentials).success).toBe(true);
    expect(LoginCredentialsSchema.safeParse(invalidCredentials).success).toBe(false);
  });

  it('validates User schema', () => {
    const validUser = {
      id: 'user-123',
      email: 'user@example.com',
      displayName: 'John Doe',
      status: 'active',
      emailVerified: true,
      phoneVerified: false,
      twoFactorEnabled: false,
      roles: [],
      permissions: [],
      profile: {
        language: 'en',
        timezone: 'UTC'
      },
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        currency: 'USD',
        notifications: {
          email: true,
          push: true,
          sms: false,
          inApp: true,
          marketing: false,
          digest: 'daily'
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
          showLastSeen: true,
          allowDirectMessages: true,
          allowFriendRequests: true
        },
        accessibility: {
          fontSize: 'medium',
          highContrast: false,
          reduceMotion: false,
          screenReader: false,
          keyboardNavigation: false
        }
      },
      security: {
        failedLoginAttempts: 0,
        trustedDevices: [],
        sessions: [],
        auditLog: []
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };
    
    expect(UserSchema.safeParse(validUser).success).toBe(true);
  });
});

describe('Business Schemas', () => {
  it('validates Product schema', () => {
    const validProduct = {
      id: 'product-123',
      sku: 'SKU-001',
      name: 'Test Product',
      description: 'A test product',
      categoryId: 'cat-123',
      status: 'active',
      type: 'simple',
      price: { amount: 100, currency: 'USD' },
      inventory: {
        quantity: 10,
        reservedQuantity: 0,
        minQuantity: 1,
        trackQuantity: true,
        allowBackorder: false,
        stockStatus: 'in_stock'
      },
      images: [],
      attributes: [],
      seo: {
        slug: 'test-product'
      },
      isDigital: false,
      isTaxable: true,
      isShippable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };
    
    expect(ProductSchema.safeParse(validProduct).success).toBe(true);
  });

  it('validates Order schema', () => {
    const validOrder = {
      id: 'order-123',
      orderNumber: 'ORD-001',
      status: 'pending',
      items: [{
        id: 'item-1',
        productId: 'product-123',
        sku: 'SKU-001',
        name: 'Test Product',
        quantity: 1,
        unitPrice: { amount: 100, currency: 'USD' },
        totalPrice: { amount: 100, currency: 'USD' },
        tax: { amount: 10, currency: 'USD' },
        discount: { amount: 0, currency: 'USD' }
      }],
      subtotal: { amount: 100, currency: 'USD' },
      tax: { amount: 10, currency: 'USD' },
      shipping: { amount: 5, currency: 'USD' },
      discount: { amount: 0, currency: 'USD' },
      total: { amount: 115, currency: 'USD' },
      shippingAddress: {
        country: 'South Korea',
        city: 'Seoul',
        street: '123 Main St',
        postalCode: '12345'
      },
      billingAddress: {
        country: 'South Korea',
        city: 'Seoul',
        street: '123 Main St',
        postalCode: '12345'
      },
      shippingMethod: {
        id: 'shipping-1',
        name: 'Standard Shipping',
        price: { amount: 5, currency: 'USD' },
        estimatedDays: 3,
        trackingEnabled: true
      },
      payment: {
        method: 'credit_card',
        status: 'pending'
      },
      source: 'web',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };
    
    expect(OrderSchema.safeParse(validOrder).success).toBe(true);
  });
});

describe('UI Schemas', () => {
  it('validates FormField schema', () => {
    const validField = {
      id: 'field-1',
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'Enter your email'
    };
    
    expect(FormFieldSchema.safeParse(validField).success).toBe(true);
  });
});

describe('Validation Helpers', () => {
  it('validate function works correctly', () => {
    const result = validate(EmailSchema, 'test@example.com');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('test@example.com');
    }
    
    const errorResult = validate(EmailSchema, 'invalid');
    expect(errorResult.success).toBe(false);
    if (!errorResult.success) {
      expect(errorResult.errors).toBeDefined();
    }
  });

  it('validateAsync function works correctly', async () => {
    const result = await validateAsync(EmailSchema, 'test@example.com');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('test@example.com');
    }
    
    const errorResult = await validateAsync(EmailSchema, 'invalid');
    expect(errorResult.success).toBe(false);
    if (!errorResult.success) {
      expect(errorResult.errors).toBeDefined();
    }
  });
});