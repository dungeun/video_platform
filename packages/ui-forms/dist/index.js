/**
 * @repo/ui-forms - UI Forms Module
 *
 * 초세분화된 폼 전용 모듈
 * - 폼 컴포넌트만 담당
 * - 입력 검증 및 상태 관리
 * - 다른 UI 요소와 완전히 분리
 * - 최소 의존성 원칙 적용
 *
 * @version 1.0.0
 * @author Enterprise AI Team
 */
// ===== 컴포넌트 =====
export { Form, useFormContext, Field, TextInput, TextArea, Select, Checkbox, RadioGroup } from './components';
// ===== 훅 =====
export { useForm, useFieldState, useFormClasses } from './hooks';
// ===== 유틸리티 =====
export { 
// 검증 함수
validateRequired, validateMinLength, validateMaxLength, validateMin, validateMax, validatePattern, validateEmail, validateUrl, validateField, validateFields, getErrorMessage, isFieldValid, isFormValid, normalizeFieldValue, mergeValidationRules, 
// 테마 함수
defaultFormTheme, getFormTheme, setFormTheme, resetFormTheme, getFormSizeStyle, getFormVariantStyle, getValidationStateStyle, getFocusStyle, getDisabledStyle, getReadOnlyStyle, getLabelStyle, getHintStyle, getErrorStyle, getInputStyle, getFormClasses } from './utils';
// ===== 모듈 정보 =====
export const UI_FORMS_MODULE_INFO = {
    name: '@repo/ui-forms',
    version: '1.0.0',
    description: 'Ultra-Fine-Grained UI Form Components Module',
    author: 'Enterprise AI Team',
    license: 'MIT',
    features: [
        'Form State Management',
        'Input Validation',
        'Text Input Components',
        'Select Components',
        'Checkbox & Radio Components',
        'Form Field Wrapper',
        'Validation Utilities',
        'Theme Support',
        'Accessibility Support',
        'TypeScript Support'
    ],
    dependencies: {
        react: '>=16.8.0'
    },
    components: [
        'Form',
        'Field',
        'TextInput',
        'TextArea',
        'Select',
        'Checkbox',
        'RadioGroup'
    ],
    hooks: [
        'useForm',
        'useFieldState',
        'useFormClasses',
        'useFormContext'
    ],
    utilities: [
        'Validation Functions',
        'Theme Functions',
        'Style Generators'
    ]
};
//# sourceMappingURL=index.js.map