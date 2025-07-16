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
export { Form, useFormContext, Field, TextInput, TextArea, Select, Checkbox, RadioGroup } from './components';
export type { FormSize, FormVariant, ValidationState, FieldValue, ValidationRule, FieldError, FieldState, FormState, BaseInputProps, TextInputProps, TextAreaProps, SelectProps, SelectOption, CheckboxProps, RadioGroupProps, RadioOption, FileUploadProps, SliderProps, FieldProps, FormProps, UseFormReturn, FormTheme } from './types';
export { useForm, useFieldState, useFormClasses } from './hooks';
export type { UseFormOptions, UseFieldStateOptions, UseFormClassesOptions } from './hooks';
export { validateRequired, validateMinLength, validateMaxLength, validateMin, validateMax, validatePattern, validateEmail, validateUrl, validateField, validateFields, getErrorMessage, isFieldValid, isFormValid, normalizeFieldValue, mergeValidationRules, defaultFormTheme, getFormTheme, setFormTheme, resetFormTheme, getFormSizeStyle, getFormVariantStyle, getValidationStateStyle, getFocusStyle, getDisabledStyle, getReadOnlyStyle, getLabelStyle, getHintStyle, getErrorStyle, getInputStyle, getFormClasses } from './utils';
export declare const UI_FORMS_MODULE_INFO: {
    readonly name: "@repo/ui-forms";
    readonly version: "1.0.0";
    readonly description: "Ultra-Fine-Grained UI Form Components Module";
    readonly author: "Enterprise AI Team";
    readonly license: "MIT";
    readonly features: readonly ["Form State Management", "Input Validation", "Text Input Components", "Select Components", "Checkbox & Radio Components", "Form Field Wrapper", "Validation Utilities", "Theme Support", "Accessibility Support", "TypeScript Support"];
    readonly dependencies: {
        readonly react: ">=16.8.0";
    };
    readonly components: readonly ["Form", "Field", "TextInput", "TextArea", "Select", "Checkbox", "RadioGroup"];
    readonly hooks: readonly ["useForm", "useFieldState", "useFormClasses", "useFormContext"];
    readonly utilities: readonly ["Validation Functions", "Theme Functions", "Style Generators"];
};
//# sourceMappingURL=index.d.ts.map