/**
 * @repo/ui-forms - Form Theme Utilities
 * 
 * 폼 컴포넌트의 테마와 스타일을 관리하는 유틸리티
 */

import { FormTheme, FormSize, FormVariant, ValidationState } from '../types';

// ===== 기본 테마 =====
export const defaultFormTheme: FormTheme = {
  colors: {
    primary: '#3b82f6',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    border: '#d1d5db',
    background: '#ffffff',
    text: '#374151',
    placeholder: '#9ca3af'
  },
  sizes: {
    small: {
      height: '2rem',
      padding: '0.25rem 0.5rem',
      fontSize: '0.875rem'
    },
    medium: {
      height: '2.5rem',
      padding: '0.5rem 0.75rem',
      fontSize: '1rem'
    },
    large: {
      height: '3rem',
      padding: '0.75rem 1rem',
      fontSize: '1.125rem'
    }
  },
  borderRadius: '0.375rem',
  borderWidth: '1px',
  focusRingWidth: '2px',
  focusRingOpacity: '0.5'
};

// ===== 테마 관리 =====
let currentTheme: FormTheme = { ...defaultFormTheme };

/**
 * 현재 테마 가져오기
 */
export const getFormTheme = (): FormTheme => {
  return { ...currentTheme };
};

/**
 * 테마 설정
 */
export const setFormTheme = (theme: Partial<FormTheme>): void => {
  currentTheme = {
    ...currentTheme,
    ...theme,
    colors: { ...currentTheme.colors, ...theme.colors },
    sizes: { ...currentTheme.sizes, ...theme.sizes }
  };
};

/**
 * 테마 초기화
 */
export const resetFormTheme = (): void => {
  currentTheme = { ...defaultFormTheme };
};

// ===== 스타일 생성 함수들 =====

/**
 * 크기별 스타일 가져오기
 */
export const getFormSizeStyle = (size: FormSize = 'medium'): React.CSSProperties => {
  const theme = getFormTheme();
  const sizeConfig = theme.sizes[size];
  
  return {
    height: sizeConfig.height,
    padding: sizeConfig.padding,
    fontSize: sizeConfig.fontSize
  };
};

/**
 * 변형별 스타일 가져오기
 */
export const getFormVariantStyle = (variant: FormVariant = 'default'): React.CSSProperties => {
  const theme = getFormTheme();
  
  const baseStyle: React.CSSProperties = {
    borderRadius: theme.borderRadius,
    borderWidth: theme.borderWidth,
    borderStyle: 'solid',
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    transition: 'all 0.2s ease-in-out'
  };

  switch (variant) {
    case 'filled':
      return {
        ...baseStyle,
        backgroundColor: '#f9fafb',
        borderColor: 'transparent'
      };
    
    case 'outlined':
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderWidth: '2px'
      };
    
    case 'borderless':
      return {
        ...baseStyle,
        borderColor: 'transparent',
        borderRadius: '0'
      };
    
    default:
      return baseStyle;
  }
};

/**
 * 검증 상태별 스타일 가져오기
 */
export const getValidationStateStyle = (state?: ValidationState): React.CSSProperties => {
  const theme = getFormTheme();
  
  if (!state || state === 'valid') {
    return {};
  }
  
  const stateColors = {
    invalid: theme.colors.error,
    warning: theme.colors.warning,
    pending: theme.colors.primary
  };
  
  const color = stateColors[state];
  
  return {
    borderColor: color,
    boxShadow: `0 0 0 ${theme.focusRingWidth} ${color}${Math.round(parseFloat(theme.focusRingOpacity) * 255).toString(16).padStart(2, '0')}`
  };
};

/**
 * 포커스 스타일 가져오기
 */
export const getFocusStyle = (): React.CSSProperties => {
  const theme = getFormTheme();
  
  return {
    outline: 'none',
    borderColor: theme.colors.primary,
    boxShadow: `0 0 0 ${theme.focusRingWidth} ${theme.colors.primary}${Math.round(parseFloat(theme.focusRingOpacity) * 255).toString(16).padStart(2, '0')}`
  };
};

/**
 * 비활성화 스타일 가져오기
 */
export const getDisabledStyle = (): React.CSSProperties => {
  return {
    opacity: 0.6,
    cursor: 'not-allowed',
    backgroundColor: '#f3f4f6'
  };
};

/**
 * 읽기 전용 스타일 가져오기
 */
export const getReadOnlyStyle = (): React.CSSProperties => {
  return {
    backgroundColor: '#f9fafb',
    cursor: 'default'
  };
};

/**
 * 라벨 스타일 가져오기
 */
export const getLabelStyle = (required?: boolean): React.CSSProperties => {
  const theme = getFormTheme();
  
  return {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: '0.25rem',
    ...(required && {
      '&::after': {
        content: '" *"',
        color: theme.colors.error
      }
    })
  };
};

/**
 * 힌트 스타일 가져오기
 */
export const getHintStyle = (): React.CSSProperties => {
  const theme = getFormTheme();
  
  return {
    fontSize: '0.75rem',
    color: theme.colors.placeholder,
    marginTop: '0.25rem'
  };
};

/**
 * 에러 스타일 가져오기
 */
export const getErrorStyle = (): React.CSSProperties => {
  const theme = getFormTheme();
  
  return {
    fontSize: '0.75rem',
    color: theme.colors.error,
    marginTop: '0.25rem'
  };
};

// ===== 복합 스타일 생성 =====

/**
 * 전체 입력 스타일 가져오기
 */
export const getInputStyle = (
  size?: FormSize,
  variant?: FormVariant,
  validationState?: ValidationState,
  disabled?: boolean,
  readOnly?: boolean,
  focused?: boolean
): React.CSSProperties => {
  const sizeStyle = getFormSizeStyle(size);
  const variantStyle = getFormVariantStyle(variant);
  const validationStyle = getValidationStateStyle(validationState);
  const focusStyle = focused ? getFocusStyle() : {};
  const disabledStyle = disabled ? getDisabledStyle() : {};
  const readOnlyStyle = readOnly ? getReadOnlyStyle() : {};
  
  return {
    ...sizeStyle,
    ...variantStyle,
    ...validationStyle,
    ...focusStyle,
    ...disabledStyle,
    ...readOnlyStyle
  };
};

/**
 * CSS 클래스명 생성
 */
export const getFormClasses = (
  baseClass: string,
  size?: FormSize,
  variant?: FormVariant,
  validationState?: ValidationState,
  disabled?: boolean,
  readOnly?: boolean,
  focused?: boolean,
  className?: string
): string => {
  const classes = [baseClass];
  
  if (size) classes.push(`${baseClass}--${size}`);
  if (variant) classes.push(`${baseClass}--${variant}`);
  if (validationState) classes.push(`${baseClass}--${validationState}`);
  if (disabled) classes.push(`${baseClass}--disabled`);
  if (readOnly) classes.push(`${baseClass}--readonly`);
  if (focused) classes.push(`${baseClass}--focused`);
  if (className) classes.push(className);
  
  return classes.join(' ');
};