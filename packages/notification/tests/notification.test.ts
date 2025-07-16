import { describe, it, expect, vi } from 'vitest';
import {
  NotificationService,
  EmailService,
  SMSService,
  TemplateEngine,
  QueueService,
  DeliveryTrackingService
} from '../src';
import {
  NotificationType,
  NotificationPriority,
  DeliveryStatus,
  NotificationRequest
} from '../src/types';

describe('Notification Module', () => {
  describe('TemplateEngine', () => {
    it('should render template with variables', () => {
      const engine = new TemplateEngine();
      
      engine.registerTemplate({
        id: 'test-template',
        name: 'Test Template',
        type: NotificationType.EMAIL,
        subject: 'Hello {{userName}}',
        content: 'Welcome {{userName}}, your order {{orderNumber}} is confirmed.',
        language: 'en',
        variables: ['userName', 'orderNumber'],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = engine.render('test-template', {
        userName: 'John Doe',
        orderNumber: 'ORD-12345'
      });

      expect(result.subject).toBe('Hello John Doe');
      expect(result.content).toBe('Welcome John Doe, your order ORD-12345 is confirmed.');
    });

    it('should extract variables from template', () => {
      const engine = new TemplateEngine();
      const variables = engine.extractVariables('Hello {{userName}}, {{orderNumber}} {{nested.value}}');
      
      expect(variables).toContain('userName');
      expect(variables).toContain('orderNumber');
      expect(variables).toContain('nested.value');
    });

    it('should validate template syntax', () => {
      const engine = new TemplateEngine();
      
      const valid = engine.validateTemplate('Hello {{userName}}');
      expect(valid.valid).toBe(true);
      expect(valid.variables).toContain('userName');

      const invalid = engine.validateTemplate('Hello {{userName');
      expect(invalid.valid).toBe(false);
      expect(invalid.error).toBeDefined();
    });
  });

  describe('DeliveryTrackingService', () => {
    it('should create and update delivery', async () => {
      const tracker = new DeliveryTrackingService();
      
      const delivery = await tracker.createDelivery(
        'notif-123',
        NotificationType.EMAIL,
        'user@example.com',
        'sendgrid'
      );

      expect(delivery.id).toBeDefined();
      expect(delivery.status).toBe(DeliveryStatus.PENDING);
      expect(delivery.recipient).toBe('user@example.com');

      const updated = await tracker.updateDeliveryStatus(
        delivery.id,
        DeliveryStatus.SENT,
        { providerResponse: { messageId: 'msg-123' } }
      );

      expect(updated?.status).toBe(DeliveryStatus.SENT);
      expect(updated?.sentAt).toBeDefined();
    });

    it('should calculate delivery statistics', async () => {
      const tracker = new DeliveryTrackingService();
      
      // Create test deliveries
      const delivery1 = await tracker.createDelivery('n1', NotificationType.EMAIL, 'user1@example.com', 'ses');
      const delivery2 = await tracker.createDelivery('n2', NotificationType.SMS, '01012345678', 'aligo');
      
      await tracker.updateDeliveryStatus(delivery1.id, DeliveryStatus.DELIVERED);
      await tracker.updateDeliveryStatus(delivery2.id, DeliveryStatus.FAILED, { error: 'Invalid number' });

      const stats = await tracker.getDeliveryStats(
        new Date(Date.now() - 86400000), // Yesterday
        new Date() // Today
      );

      expect(stats.total).toBe(2);
      expect(stats.delivered).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.deliveryRate).toBe(50);
    });
  });

  describe('Validation', () => {
    it('should validate email addresses', async () => {
      const { validateEmail } = await import('../src/utils/validation');
      
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });

    it('should validate Korean phone numbers', async () => {
      const { validateKoreanPhoneNumber } = await import('../src/utils/validation');
      
      expect(validateKoreanPhoneNumber('010-1234-5678')).toBe(true);
      expect(validateKoreanPhoneNumber('01012345678')).toBe(true);
      expect(validateKoreanPhoneNumber('02-123-4567')).toBe(true);
      expect(validateKoreanPhoneNumber('8210-1234-5678')).toBe(true);
      expect(validateKoreanPhoneNumber('123-456-7890')).toBe(false);
    });

    it('should validate notification request', async () => {
      const { validateNotificationRequest } = await import('../src/utils/validation');
      
      const validRequest: NotificationRequest = {
        type: NotificationType.EMAIL,
        recipient: { email: 'user@example.com' },
        content: { subject: 'Test', body: 'Test message' }
      };
      
      const validation = validateNotificationRequest(validRequest);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      const invalidRequest: NotificationRequest = {
        type: NotificationType.EMAIL,
        recipient: { email: 'invalid' },
        content: { body: 'Test message' } // Missing subject
      };
      
      const invalidValidation = validateNotificationRequest(invalidRequest);
      expect(invalidValidation.valid).toBe(false);
      expect(invalidValidation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Template Helpers', () => {
    it('should get template character count for SMS', async () => {
      const { getTemplateCharacterCount } = await import('../src/utils/templateHelpers');
      
      const shortMessage = 'Hello World';
      const shortCount = getTemplateCharacterCount(shortMessage);
      expect(shortCount.type).toBe('SMS');
      expect(shortCount.count).toBe(11);

      const longMessage = 'A'.repeat(100);
      const longCount = getTemplateCharacterCount(longMessage);
      expect(longCount.type).toBe('LMS');

      const koreanMessage = '안녕하세요. 이것은 한글 메시지입니다.';
      const koreanCount = getTemplateCharacterCount(koreanMessage);
      expect(koreanCount.bytes).toBeGreaterThan(koreanCount.count);
    });

    it('should format Korean phone numbers', async () => {
      const { formatPhoneNumber } = await import('../src/utils/templateHelpers');
      
      expect(formatPhoneNumber('01012345678')).toBe('010-1234-5678');
      expect(formatPhoneNumber('010-1234-5678')).toBe('010-1234-5678');
      expect(formatPhoneNumber('821012345678')).toBe('+82-10-1234-5678');
    });
  });
});