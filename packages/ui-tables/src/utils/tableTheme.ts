/**
 * @repo/ui-tables - Table Theme Utils
 * 
 * 테이블 테마 관련 유틸리티
 */

import { TableTheme, TableSize, TableVariant } from '../types';

// 기본 테마
const defaultTheme: TableTheme = {
  table: 'w-full border-collapse',
  header: 'bg-gray-50 border-b',
  headerCell: 'px-4 py-3 text-left text-sm font-medium text-gray-700',
  body: '',
  row: 'border-b hover:bg-gray-50 transition-colors',
  cell: 'px-4 py-3 text-sm text-gray-900',
  pagination: 'flex items-center justify-between py-3',
  toolbar: 'flex items-center justify-between py-2',
  filter: 'flex items-center gap-2',
  loading: 'flex items-center justify-center py-8',
  empty: 'text-center py-8 text-gray-500'
};

// 사이즈별 스타일
const sizeStyles: Record<TableSize, Partial<TableTheme>> = {
  small: {
    headerCell: 'px-2 py-1 text-xs',
    cell: 'px-2 py-1 text-xs'
  },
  medium: {
    headerCell: 'px-4 py-3 text-sm',
    cell: 'px-4 py-3 text-sm'
  },
  large: {
    headerCell: 'px-6 py-4 text-base',
    cell: 'px-6 py-4 text-base'
  }
};

// 변형별 스타일
const variantStyles: Record<TableVariant, Partial<TableTheme>> = {
  simple: {
    table: 'w-full',
    row: ''
  },
  striped: {
    table: 'w-full',
    row: 'even:bg-gray-50'
  },
  bordered: {
    table: 'w-full border',
    headerCell: 'border px-4 py-3',
    cell: 'border px-4 py-3'
  },
  hover: {
    table: 'w-full',
    row: 'hover:bg-gray-100 transition-colors cursor-pointer'
  }
};

let currentTheme = defaultTheme;

/**
 * 현재 테이블 테마 가져오기
 */
export function getTableTheme(): TableTheme {
  return { ...currentTheme };
}

/**
 * 테이블 테마 설정
 */
export function setTableTheme(theme: Partial<TableTheme>): void {
  currentTheme = { ...currentTheme, ...theme };
}

/**
 * 사이즈별 테이블 스타일 가져오기
 */
export function getTableSizeStyle(size: TableSize): Partial<TableTheme> {
  return sizeStyles[size] || sizeStyles.medium;
}

/**
 * 변형별 테이블 스타일 가져오기
 */
export function getTableVariantStyle(variant: TableVariant): Partial<TableTheme> {
  return variantStyles[variant] || variantStyles.simple;
}

/**
 * 테이블 클래스 병합
 */
export function mergeTableClasses(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 컬럼 정렬 클래스 가져오기
 */
export function getColumnAlignClass(align?: 'left' | 'center' | 'right'): string {
  switch (align) {
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    default:
      return 'text-left';
  }
}