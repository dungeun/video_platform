import { z } from 'zod';
import {
  NotificationRequest,
  NotificationType,
  NotificationPriority,
  NotificationTemplate
} from '../types';

/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Korean phone number
 */
export const validateKoreanPhoneNumber = (phone: string): boolean => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Korean mobile numbers
  const mobileRegex = /^(010|011|016|017|018|019)\d{7,8}$/;
  
  // Korean landline numbers
  const landlineRegex = /^(02|0[3-6][1-5])\d{7,8}$/;
  
  // International format (Korea)
  const internationalRegex = /^82(10|11|16|17|18|19|2|[3-6][1-5])\d{7,8}$/;
  
  return mobileRegex.test(cleaned) || 
         landlineRegex.test(cleaned) || 
         internationalRegex.test(cleaned);
};

/**
 * Validate notification request
 */
export const validateNotificationRequest = (
  request: NotificationRequest
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate recipient based on notification type
  switch (request.type) {
    case NotificationType.EMAIL:
      if (!request.recipient.email) {
        errors.push('이메일 주소가 필요합니다');
      } else if (!validateEmail(request.recipient.email)) {
        errors.push('유효하지 않은 이메일 주소입니다');
      }
      break;
      
    case NotificationType.SMS:
      if (!request.recipient.phone) {
        errors.push('전화번호가 필요합니다');
      } else if (!validateKoreanPhoneNumber(request.recipient.phone)) {
        errors.push('유효하지 않은 전화번호입니다');
      }
      break;
      
    case NotificationType.PUSH:
      if (!request.recipient.deviceToken && !request.recipient.userId) {
        errors.push('디바이스 토큰 또는 사용자 ID가 필요합니다');
      }
      break;
      
    case NotificationType.IN_APP:
      if (!request.recipient.userId) {
        errors.push('사용자 ID가 필요합니다');
      }
      break;
  }

  // Validate content or template
  if (!request.templateId && !request.content) {
    errors.push('템플릿 ID 또는 콘텐츠가 필요합니다');
  }

  if (request.content) {
    if (!request.content.body) {
      errors.push('메시지 본문이 필요합니다');
    }
    
    if (request.type === NotificationType.EMAIL && !request.content.subject) {
      errors.push('이메일 제목이 필요합니다');
    }
  }

  // Validate scheduled time
  if (request.scheduledAt && new Date(request.scheduledAt) < new Date()) {
    errors.push('예약 시간은 현재 시간 이후여야 합니다');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate template
 */
export const validateTemplate = (
  template: Partial<NotificationTemplate>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!template.name || template.name.trim().length === 0) {
    errors.push('템플릿 이름이 필요합니다');
  }

  if (!template.content || template.content.trim().length === 0) {
    errors.push('템플릿 내용이 필요합니다');
  }

  if (template.type === NotificationType.EMAIL && !template.subject) {
    errors.push('이메일 템플릿에는 제목이 필요합니다');
  }

  if (!template.language) {
    errors.push('언어 설정이 필요합니다');
  }

  // Validate template syntax
  if (template.content) {
    try {
      // Basic validation for unclosed brackets
      const openCount = (template.content.match(/\{\{/g) || []).length;
      const closeCount = (template.content.match(/\}\}/g) || []).length;
      
      if (openCount !== closeCount) {
        errors.push('템플릿 구문 오류: 괄호가 일치하지 않습니다');
      }
    } catch (error) {
      errors.push('템플릿 구문 검증 실패');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Create Zod schemas for runtime validation
 */
export const EmailRecipientSchema = z.object({
  email: z.string().email('유효하지 않은 이메일 주소입니다'),
  userId: z.string().optional(),
  locale: z.string().optional()
});

export const SMSRecipientSchema = z.object({
  phone: z.string().refine(validateKoreanPhoneNumber, {
    message: '유효하지 않은 전화번호입니다'
  }),
  userId: z.string().optional(),
  locale: z.string().optional()
});

export const NotificationContentSchema = z.object({
  subject: z.string().optional(),
  body: z.string().min(1, '메시지 본문이 필요합니다'),
  html: z.string().optional()
});

export const TemplateVariablesSchema = z.record(z.any());

/**
 * Validate bulk notification requests
 */
export const validateBulkNotifications = (
  requests: NotificationRequest[]
): {
  valid: boolean;
  errors: Array<{ index: number; errors: string[] }>;
} => {
  const errors: Array<{ index: number; errors: string[] }> = [];

  requests.forEach((request, index) => {
    const validation = validateNotificationRequest(request);
    if (!validation.valid) {
      errors.push({ index, errors: validation.errors });
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
};

/**
 * Validate file attachment
 */
export const validateAttachment = (
  file: { filename: string; size: number; contentType?: string }
): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (file.size > maxSize) {
    return { valid: false, error: '파일 크기는 10MB를 초과할 수 없습니다' };
  }

  if (file.contentType && !allowedTypes.includes(file.contentType)) {
    return { valid: false, error: '허용되지 않은 파일 형식입니다' };
  }

  return { valid: true };
};