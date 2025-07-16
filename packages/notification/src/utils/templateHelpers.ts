import { NotificationTemplate, NotificationType } from '../types';

/**
 * Extract variables from a template string
 */
export const extractTemplateVariables = (content: string): string[] => {
  const regex = /\{\{[\s]*([a-zA-Z_$][a-zA-Z0-9_$\.]*)[\s]*\}\}/g;
  const variables = new Set<string>();
  let match;

  while ((match = regex.exec(content)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
};

/**
 * Validate template syntax
 */
export const validateTemplateSyntax = (content: string): {
  valid: boolean;
  error?: string;
  variables?: string[];
} => {
  try {
    // Check for basic Handlebars syntax errors
    const openCount = (content.match(/\{\{/g) || []).length;
    const closeCount = (content.match(/\}\}/g) || []).length;
    
    if (openCount !== closeCount) {
      return {
        valid: false,
        error: 'Mismatched template brackets'
      };
    }

    // Check for invalid variable names
    const invalidVarRegex = /\{\{[\s]*[^a-zA-Z_$].*?\}\}/g;
    if (invalidVarRegex.test(content)) {
      return {
        valid: false,
        error: 'Invalid variable name. Variables must start with a letter, $ or _'
      };
    }

    const variables = extractTemplateVariables(content);
    return { valid: true, variables };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid template syntax'
    };
  }
};

/**
 * Generate sample data for template preview
 */
export const generateSampleData = (variables: string[]): Record<string, any> => {
  const sampleData: Record<string, any> = {};
  
  const samples: Record<string, any> = {
    // User-related
    userName: '홍길동',
    userEmail: 'user@example.com',
    userId: 'USER123',
    firstName: '길동',
    lastName: '홍',
    phoneNumber: '010-1234-5678',
    
    // Order-related
    orderNumber: 'ORD-2024-0001',
    orderDate: new Date().toISOString(),
    orderStatus: '배송중',
    trackingNumber: '1234567890',
    deliveryDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    
    // Product-related
    productName: '샘플 상품',
    productId: 'PROD123',
    quantity: 2,
    price: 50000,
    totalAmount: 100000,
    
    // Company-related
    companyName: '우리 회사',
    companyEmail: 'support@company.com',
    companyPhone: '02-1234-5678',
    
    // Common
    date: new Date().toISOString(),
    time: new Date().toTimeString().slice(0, 5),
    url: 'https://example.com',
    code: 'ABC123',
    password: 'TempPass123!',
    
    // Korean specific
    recipientName: '수신자명',
    senderName: '발신자명',
    address: '서울시 강남구 테헤란로 123',
    postalCode: '06234'
  };

  variables.forEach(variable => {
    if (samples[variable] !== undefined) {
      sampleData[variable] = samples[variable];
    } else {
      // Generate default value based on variable name patterns
      if (variable.includes('Date')) {
        sampleData[variable] = new Date().toISOString();
      } else if (variable.includes('Amount') || variable.includes('Price')) {
        sampleData[variable] = 10000;
      } else if (variable.includes('Count') || variable.includes('Quantity')) {
        sampleData[variable] = 1;
      } else if (variable.includes('Email')) {
        sampleData[variable] = 'example@email.com';
      } else if (variable.includes('Phone')) {
        sampleData[variable] = '010-0000-0000';
      } else if (variable.includes('Name')) {
        sampleData[variable] = '이름';
      } else {
        sampleData[variable] = `{{${variable}}}`;
      }
    }
  });

  return sampleData;
};

/**
 * Get template character count for SMS
 */
export const getTemplateCharacterCount = (
  content: string,
  variables?: Record<string, any>
): {
  count: number;
  bytes: number;
  type: 'SMS' | 'LMS' | 'MMS';
} => {
  let processedContent = content;
  
  // Replace variables with sample data if provided
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      processedContent = processedContent.replace(regex, String(value));
    });
  }

  const bytes = Buffer.from(processedContent, 'utf-8').length;
  const count = processedContent.length;
  
  let type: 'SMS' | 'LMS' | 'MMS';
  if (bytes <= 90) {
    type = 'SMS';
  } else if (bytes <= 2000) {
    type = 'LMS';
  } else {
    type = 'MMS';
  }

  return { count, bytes, type };
};

/**
 * Validate template for specific notification type
 */
export const validateTemplateForType = (
  template: Partial<NotificationTemplate>,
  type: NotificationType
): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!template.content) {
    errors.push('템플릿 내용이 필요합니다');
  }

  switch (type) {
    case NotificationType.EMAIL:
      if (!template.subject) {
        errors.push('이메일 템플릿에는 제목이 필요합니다');
      }
      break;
      
    case NotificationType.SMS:
      if (template.content) {
        const { bytes } = getTemplateCharacterCount(template.content);
        if (bytes > 2000) {
          errors.push('SMS 내용이 너무 깁니다 (최대 2000 바이트)');
        }
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Format phone number for Korean SMS
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a Korean mobile number
  if (cleaned.startsWith('010')) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (cleaned.startsWith('01')) {
    return cleaned.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
  } else if (cleaned.startsWith('82')) {
    // International format
    const localNumber = cleaned.substring(2);
    if (localNumber.startsWith('10')) {
      return `+82-${localNumber.substring(0, 2)}-${localNumber.substring(2, 6)}-${localNumber.substring(6)}`;
    }
  }
  
  return phone;
};

/**
 * Sanitize template content
 */
export const sanitizeTemplateContent = (content: string): string => {
  // Remove any script tags or potentially harmful content
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};