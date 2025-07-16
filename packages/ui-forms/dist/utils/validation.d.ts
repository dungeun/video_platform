/**
 * @company/ui-forms - Validation Utilities
 *
 * 폼 검증을 위한 유틸리티 함수들
 */
import { FieldValue, ValidationRule, FieldError } from '../types';
/**
 * 필수 값 검증
 */
export declare const validateRequired: (value: FieldValue) => boolean;
/**
 * 최소 길이 검증
 */
export declare const validateMinLength: (value: FieldValue, min: number) => boolean;
/**
 * 최대 길이 검증
 */
export declare const validateMaxLength: (value: FieldValue, max: number) => boolean;
/**
 * 최소값 검증
 */
export declare const validateMin: (value: FieldValue, min: number) => boolean;
/**
 * 최대값 검증
 */
export declare const validateMax: (value: FieldValue, max: number) => boolean;
/**
 * 패턴 검증
 */
export declare const validatePattern: (value: FieldValue, pattern: RegExp) => boolean;
/**
 * 이메일 검증
 */
export declare const validateEmail: (value: FieldValue) => boolean;
/**
 * URL 검증
 */
export declare const validateUrl: (value: FieldValue) => boolean;
/**
 * 단일 필드 검증
 */
export declare const validateField: (value: FieldValue, rules: ValidationRule) => FieldError | null;
/**
 * 여러 필드 검증
 */
export declare const validateFields: (values: Record<string, FieldValue>, rules: Record<string, ValidationRule>) => Record<string, FieldError>;
/**
 * 에러 메시지 가져오기
 */
export declare const getErrorMessage: (error: FieldError | string | undefined) => string;
/**
 * 필드가 유효한지 확인
 */
export declare const isFieldValid: (error: FieldError | string | undefined) => boolean;
/**
 * 폼이 유효한지 확인
 */
export declare const isFormValid: (errors: Record<string, FieldError | string>) => boolean;
/**
 * 필드 값 정규화
 */
export declare const normalizeFieldValue: (value: any) => FieldValue;
/**
 * 검증 규칙 병합
 */
export declare const mergeValidationRules: (...rules: (ValidationRule | undefined)[]) => ValidationRule;
//# sourceMappingURL=validation.d.ts.map