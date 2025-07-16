/**
 * @company/ui-buttons - Button Theme
 * 버튼 테마 설정 및 스타일 유틸리티
 */

import { ButtonTheme, ButtonSize, ButtonVariant } from '../types';

/**
 * 기본 버튼 테마
 */
const defaultButtonTheme: ButtonTheme = {
  sizes: {
    xs: 'text-xs px-2 py-1 h-6',
    sm: 'text-sm px-3 py-1.5 h-8',
    md: 'text-sm px-4 py-2 h-10',
    lg: 'text-base px-5 py-2.5 h-11',
    xl: 'text-base px-6 py-3 h-12'
  },
  
  variants: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
    info: 'bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-500',
    light: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    dark: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500',
    
    'outline-primary': 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    'outline-secondary': 'border border-gray-600 text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
    'outline-success': 'border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
    'outline-danger': 'border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
    'outline-warning': 'border border-yellow-500 text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-500',
    'outline-info': 'border border-cyan-600 text-cyan-600 hover:bg-cyan-50 focus:ring-cyan-500',
    'outline-light': 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    'outline-dark': 'border border-gray-900 text-gray-900 hover:bg-gray-50 focus:ring-gray-500',
    
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    link: 'text-blue-600 underline-offset-4 hover:underline focus:ring-blue-500'
  },
  
  animations: {
    hover: 'hover:transform hover:-translate-y-0.5',
    active: 'active:transform active:scale-95',
    loading: 'animate-pulse'
  },
  
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  },
  
  rounded: {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  }
};

/**
 * 현재 테마 조회
 */
export function getButtonTheme(): ButtonTheme {
  return defaultButtonTheme;
}

/**
 * 크기별 스타일 조회
 */
export function getButtonSizeStyle(size: ButtonSize): string {
  return defaultButtonTheme.sizes[size];
}

/**
 * 변형별 스타일 조회
 */
export function getButtonVariantStyle(variant: ButtonVariant): string {
  return defaultButtonTheme.variants[variant];
}

/**
 * 커스텀 테마 적용 (추후 확장용)
 */
export function setButtonTheme(customTheme: Partial<ButtonTheme>): void {
  // 현재는 기본 테마만 사용
  // 추후 다크모드, 커스텀 테마 지원 시 확장
  console.warn('커스텀 테마 기능은 아직 구현되지 않았습니다.');
}