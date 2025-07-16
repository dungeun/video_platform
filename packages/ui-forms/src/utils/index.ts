/**
 * @repo/ui-forms - Utilities Index
 * 
 * 폼 유틸리티 함수들의 통합 내보내기
 */

// ===== 검증 유틸리티 =====
export {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateMin,
  validateMax,
  validatePattern,
  validateEmail,
  validateUrl,
  validateField,
  validateFields,
  getErrorMessage,
  isFieldValid,
  isFormValid,
  normalizeFieldValue,
  mergeValidationRules
} from './validation';

// ===== 테마 유틸리티 =====
export {
  defaultFormTheme,
  getFormTheme,
  setFormTheme,
  resetFormTheme,
  getFormSizeStyle,
  getFormVariantStyle,
  getValidationStateStyle,
  getFocusStyle,
  getDisabledStyle,
  getReadOnlyStyle,
  getLabelStyle,
  getHintStyle,
  getErrorStyle,
  getInputStyle,
  getFormClasses
} from './formTheme';