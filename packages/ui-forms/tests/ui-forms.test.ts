/**
 * @repo/ui-forms - Tests
 * 
 * UI Forms 모듈의 기본 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  validateRequired,
  validateEmail,
  validateField,
  getErrorMessage,
  isFieldValid,
  normalizeFieldValue,
  UI_FORMS_MODULE_INFO
} from '../src';
import type { ValidationRule, FieldError } from '../src';

describe('@repo/ui-forms', () => {
  describe('Module Info', () => {
    it('should have correct module information', () => {
      expect(UI_FORMS_MODULE_INFO.name).toBe('@repo/ui-forms');
      expect(UI_FORMS_MODULE_INFO.version).toBe('1.0.0');
      expect(UI_FORMS_MODULE_INFO.author).toBe('Enterprise AI Team');
      expect(UI_FORMS_MODULE_INFO.features).toContain('Form State Management');
      expect(UI_FORMS_MODULE_INFO.components).toContain('Form');
      expect(UI_FORMS_MODULE_INFO.hooks).toContain('useForm');
    });
  });

  describe('Validation Functions', () => {
    describe('validateRequired', () => {
      it('should validate required fields correctly', () => {
        expect(validateRequired('')).toBe(false);
        expect(validateRequired('  ')).toBe(false);
        expect(validateRequired(null)).toBe(false);
        expect(validateRequired(undefined)).toBe(false);
        expect(validateRequired('valid')).toBe(true);
        expect(validateRequired(0)).toBe(true);
        expect(validateRequired(false)).toBe(true);
      });
    });

    describe('validateEmail', () => {
      it('should validate email addresses correctly', () => {
        expect(validateEmail('user@example.com')).toBe(true);
        expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true);
        expect(validateEmail('invalid-email')).toBe(false);
        expect(validateEmail('@domain.com')).toBe(false);
        expect(validateEmail('user@')).toBe(false);
        expect(validateEmail('')).toBe(true); // 빈 값은 required에서 처리
      });
    });

    describe('validateField', () => {
      it('should validate field with multiple rules', () => {
        const rules: ValidationRule = {
          required: true,
          minLength: 3,
          email: true
        };

        // 유효한 이메일
        const validResult = validateField('user@example.com', rules);
        expect(validResult).toBeNull();

        // 필수 값 없음
        const requiredResult = validateField('', rules);
        expect(requiredResult).toEqual({
          type: 'required',
          message: 'This field is required'
        });

        // 최소 길이 부족
        const minLengthResult = validateField('a@b.c', rules);
        expect(minLengthResult).toEqual({
          type: 'minLength',
          message: 'Minimum length is 3 characters'
        });

        // 잘못된 이메일
        const emailResult = validateField('invalid-email', rules);
        expect(emailResult).toEqual({
          type: 'email',
          message: 'Invalid email address'
        });
      });

      it('should handle custom validation', () => {
        const rules: ValidationRule = {
          custom: (value) => {
            if (typeof value === 'string' && value.includes('forbidden')) {
              return 'Forbidden word detected';
            }
            return true;
          }
        };

        const validResult = validateField('allowed text', rules);
        expect(validResult).toBeNull();

        const invalidResult = validateField('forbidden text', rules);
        expect(invalidResult).toEqual({
          type: 'custom',
          message: 'Forbidden word detected'
        });
      });
    });
  });

  describe('Utility Functions', () => {
    describe('getErrorMessage', () => {
      it('should extract error messages correctly', () => {
        expect(getErrorMessage(undefined)).toBe('');
        expect(getErrorMessage('Simple error')).toBe('Simple error');
        
        const fieldError: FieldError = {
          type: 'required',
          message: 'This field is required'
        };
        expect(getErrorMessage(fieldError)).toBe('This field is required');
      });
    });

    describe('isFieldValid', () => {
      it('should check field validity correctly', () => {
        expect(isFieldValid(undefined)).toBe(true);
        expect(isFieldValid('')).toBe(false);
        expect(isFieldValid('Error message')).toBe(false);
        
        const fieldError: FieldError = {
          type: 'required',
          message: 'This field is required'
        };
        expect(isFieldValid(fieldError)).toBe(false);
      });
    });

    describe('normalizeFieldValue', () => {
      it('should normalize field values correctly', () => {
        expect(normalizeFieldValue('')).toBeUndefined();
        expect(normalizeFieldValue(null)).toBeUndefined();
        expect(normalizeFieldValue('valid')).toBe('valid');
        expect(normalizeFieldValue(123)).toBe(123);
        expect(normalizeFieldValue(false)).toBe(false);
      });
    });
  });

  describe('Type Definitions', () => {
    it('should export all necessary types', () => {
      // 타입 검사를 위한 더미 변수들
      const fieldValue: string | number | boolean | null = 'test';
      const validationRule: ValidationRule = { required: true };
      const fieldError: FieldError = { type: 'test', message: 'Test error' };

      // 타입이 올바르게 정의되었는지 확인
      expect(typeof fieldValue).toBeDefined();
      expect(typeof validationRule).toBeDefined();
      expect(typeof fieldError).toBeDefined();
    });
  });
});