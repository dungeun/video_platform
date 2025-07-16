/**
 * Validation utilities for shipping module
 */

import { CarrierCode } from '../types';

/**
 * Tracking number validation patterns
 */
const TRACKING_PATTERNS: Record<CarrierCode, RegExp> = {
  CJ: /^\d{10,12}$/,                    // CJ대한통운: 10-12자리 숫자
  HANJIN: /^\d{10,12}$/,                // 한진택배: 10-12자리 숫자
  LOTTE: /^\d{11,13}$/,                 // 롯데택배: 11-13자리 숫자
  POST_OFFICE: /^\d{13}$/,              // 우체국택배: 13자리 숫자
  LOGEN: /^\d{11}$/                     // 로젠택배: 11자리 숫자
};

/**
 * Validate tracking number format
 */
export function validateTrackingNumber(
  carrier: CarrierCode,
  trackingNumber: string
): { valid: boolean; message?: string } {
  if (!trackingNumber) {
    return { valid: false, message: '운송장 번호를 입력해주세요.' };
  }

  const pattern = TRACKING_PATTERNS[carrier];
  if (!pattern) {
    return { valid: false, message: '지원하지 않는 택배사입니다.' };
  }

  if (!pattern.test(trackingNumber)) {
    return { 
      valid: false, 
      message: `${carrier} 운송장 번호 형식이 올바르지 않습니다.` 
    };
  }

  return { valid: true };
}

/**
 * Validate postal code
 */
export function validatePostalCode(postalCode: string): boolean {
  // Korean postal code: 5 digits
  return /^\d{5}$/.test(postalCode);
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Check Korean phone number formats
  // Mobile: 010-XXXX-XXXX (11 digits)
  // Landline: 02-XXX-XXXX or 0XX-XXX-XXXX (9-10 digits)
  return /^(010\d{8}|0[2-9]\d{7,8})$/.test(digits);
}

/**
 * Validate package dimensions
 */
export function validatePackageDimensions(dimensions: {
  length: number;
  width: number;
  height: number;
}): { valid: boolean; message?: string } {
  const { length, width, height } = dimensions;

  if (length <= 0 || width <= 0 || height <= 0) {
    return { valid: false, message: '패키지 크기는 0보다 커야 합니다.' };
  }

  const maxDimension = Math.max(length, width, height);
  const girth = 2 * (width + height);

  // Common carrier restrictions
  if (maxDimension > 160) {
    return { valid: false, message: '한 변의 길이가 160cm를 초과할 수 없습니다.' };
  }

  if (length + girth > 300) {
    return { valid: false, message: '길이 + 둘레가 300cm를 초과할 수 없습니다.' };
  }

  return { valid: true };
}

/**
 * Validate package weight
 */
export function validatePackageWeight(weight: number): { valid: boolean; message?: string } {
  if (weight <= 0) {
    return { valid: false, message: '중량은 0보다 커야 합니다.' };
  }

  if (weight > 30) {
    return { valid: false, message: '일반 택배는 30kg을 초과할 수 없습니다.' };
  }

  return { valid: true };
}

/**
 * Validate address
 */
export function validateAddress(address: {
  postalCode: string;
  province: string;
  city: string;
  street: string;
  phone: string;
  name: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!validatePostalCode(address.postalCode)) {
    errors.push('우편번호가 올바르지 않습니다.');
  }

  if (!address.province || address.province.length < 2) {
    errors.push('시/도를 입력해주세요.');
  }

  if (!address.city || address.city.length < 2) {
    errors.push('시/군/구를 입력해주세요.');
  }

  if (!address.street || address.street.length < 5) {
    errors.push('도로명 주소를 입력해주세요.');
  }

  if (!validatePhoneNumber(address.phone)) {
    errors.push('전화번호가 올바르지 않습니다.');
  }

  if (!address.name || address.name.length < 2) {
    errors.push('수령인 이름을 입력해주세요.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Tracking number validator with auto-detection
 */
export const trackingNumberValidator = {
  /**
   * Validate tracking number
   */
  validate(carrier: CarrierCode, trackingNumber: string): boolean {
    const result = validateTrackingNumber(carrier, trackingNumber);
    return result.valid;
  },

  /**
   * Auto-detect carrier from tracking number
   */
  detectCarrier(trackingNumber: string): CarrierCode | null {
    for (const [carrier, pattern] of Object.entries(TRACKING_PATTERNS)) {
      if (pattern.test(trackingNumber)) {
        return carrier as CarrierCode;
      }
    }
    return null;
  },

  /**
   * Format tracking number for display
   */
  format(trackingNumber: string): string {
    // Remove all non-digits
    const digits = trackingNumber.replace(/\D/g, '');
    
    // Add dashes for readability (example format)
    if (digits.length === 10) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 11) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
    } else if (digits.length === 12) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
    } else if (digits.length === 13) {
      return `${digits.slice(0, 6)}-${digits.slice(6)}`;
    }
    
    return digits;
  }
};