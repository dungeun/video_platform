/**
 * @repo/ui-forms - Form Types
 * 
 * 폼 컴포넌트를 위한 타입 정의
 */

import { ReactNode, HTMLInputTypeAttribute, ChangeEvent, FocusEvent, FormEvent } from 'react';

// ===== 기본 폼 타입 =====
export type FormSize = 'small' | 'medium' | 'large';
export type FormVariant = 'default' | 'filled' | 'outlined' | 'borderless';
export type ValidationState = 'valid' | 'invalid' | 'warning' | 'pending';

// ===== 필드 값 타입 =====
export type FieldValue = string | number | boolean | string[] | File | File[] | null | undefined;

// ===== 검증 규칙 =====
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  custom?: (value: FieldValue) => boolean | string;
}

// ===== 필드 에러 =====
export interface FieldError {
  type: string;
  message: string;
}

// ===== 필드 상태 =====
export interface FieldState {
  value: FieldValue;
  error?: FieldError;
  touched: boolean;
  dirty: boolean;
  validating: boolean;
}

// ===== 폼 상태 =====
export interface FormState {
  values: Record<string, FieldValue>;
  errors: Record<string, FieldError>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
}

// ===== 기본 입력 Props =====
export interface BaseInputProps {
  name: string;
  value?: FieldValue;
  defaultValue?: FieldValue;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  size?: FormSize;
  variant?: FormVariant;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
  error?: FieldError | string;
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

// ===== 텍스트 입력 Props =====
export interface TextInputProps extends BaseInputProps {
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  spellCheck?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

// ===== 텍스트 영역 Props =====
export interface TextAreaProps extends BaseInputProps {
  rows?: number;
  cols?: number;
  wrap?: 'hard' | 'soft' | 'off';
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  autoResize?: boolean;
}

// ===== 선택 옵션 =====
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

// ===== 선택 컴포넌트 Props =====
export interface SelectProps extends BaseInputProps {
  options: SelectOption[];
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  noOptionsMessage?: string;
  loadingMessage?: string;
  maxMenuHeight?: number;
}

// ===== 체크박스 Props =====
export interface CheckboxProps extends Omit<BaseInputProps, 'value' | 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  label?: ReactNode;
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
}

// ===== 라디오 옵션 =====
export interface RadioOption {
  value: string | number;
  label: ReactNode;
  disabled?: boolean;
}

// ===== 라디오 그룹 Props =====
export interface RadioGroupProps extends Omit<BaseInputProps, 'onChange'> {
  options: RadioOption[];
  direction?: 'horizontal' | 'vertical';
  onChange?: (value: string | number, event: ChangeEvent<HTMLInputElement>) => void;
}

// ===== 파일 업로드 Props =====
export interface FileUploadProps extends Omit<BaseInputProps, 'value' | 'onChange'> {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  preview?: boolean;
  dragAndDrop?: boolean;
}

// ===== 슬라이더 Props =====
export interface SliderProps extends Omit<BaseInputProps, 'value' | 'onChange' | 'defaultValue'> {
  min?: number;
  max?: number;
  step?: number;
  value?: number | number[];
  defaultValue?: number | number[];
  range?: boolean;
  marks?: Record<number, string>;
  showTooltip?: boolean;
  onChange?: (value: number | number[]) => void;
}

// ===== 필드 컴포넌트 Props =====
export interface FieldProps {
  name: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | FieldError;
  required?: boolean;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
  hintClassName?: string;
  errorClassName?: string;
}

// ===== 폼 컴포넌트 Props =====
export interface FormProps {
  initialValues?: Record<string, FieldValue>;
  validationRules?: Record<string, ValidationRule>;
  onSubmit: (values: Record<string, FieldValue>, formState: FormState) => void | Promise<void>;
  onValidate?: (values: Record<string, FieldValue>) => Record<string, string | FieldError>;
  children: ReactNode;
  className?: string;
  noValidate?: boolean;
  autoComplete?: 'on' | 'off';
}

// ===== 폼 훅 반환 타입 =====
export interface UseFormReturn {
  values: Record<string, FieldValue>;
  errors: Record<string, FieldError>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
  
  setValue: (name: string, value: FieldValue) => void;
  setError: (name: string, error: string | FieldError) => void;
  clearError: (name: string) => void;
  clearErrors: () => void;
  setTouched: (name: string, touched?: boolean) => void;
  reset: (values?: Record<string, FieldValue>) => void;
  validate: (name?: string) => boolean | Promise<boolean>;
  submit: () => void;
  
  getFieldProps: (name: string) => {
    name: string;
    value: FieldValue;
    onChange: (event: ChangeEvent<any>) => void;
    onBlur: (event: FocusEvent<any>) => void;
    error?: FieldError;
    touched: boolean;
    dirty: boolean;
  };
}

// ===== 폼 테마 =====
export interface FormTheme {
  colors: {
    primary: string;
    error: string;
    warning: string;
    success: string;
    border: string;
    background: string;
    text: string;
    placeholder: string;
  };
  sizes: {
    small: {
      height: string;
      padding: string;
      fontSize: string;
    };
    medium: {
      height: string;
      padding: string;
      fontSize: string;
    };
    large: {
      height: string;
      padding: string;
      fontSize: string;
    };
  };
  borderRadius: string;
  borderWidth: string;
  focusRingWidth: string;
  focusRingOpacity: string;
}