/**
 * @company/ui-buttons - Base Button Component
 * 기본 버튼 컴포넌트 (버튼 기능만 담당)
 */

import React, { forwardRef } from 'react';
import { BaseButtonProps, LoadingState } from '../types';
import { useButtonClasses } from '../hooks/useButtonClasses';

/**
 * 기본 버튼 컴포넌트
 */
export const Button = forwardRef<HTMLButtonElement, BaseButtonProps>(({
  size = 'md',
  variant = 'primary',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  rounded = false,
  shadow = false,
  noAnimation = false,
  className = '',
  children,
  disabled,
  ...props
}, ref) => {
  // 로딩 상태 처리
  const loadingState: LoadingState = typeof loading === 'boolean' 
    ? { isLoading: loading }
    : loading;

  // 버튼 클래스 생성
  const buttonClasses = useButtonClasses({
    size,
    variant,
    fullWidth,
    loading: loadingState.isLoading,
    rounded,
    shadow,
    noAnimation,
    hasIcon: !!icon,
    iconPosition,
    className
  });

  // 로딩 스피너 기본값
  const defaultSpinner = (
    <svg 
      className="animate-spin h-4 w-4" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const renderContent = () => {
    // 로딩 중일 때
    if (loadingState.isLoading) {
      return (
        <>
          {loadingState.spinner || defaultSpinner}
          {loadingState.loadingText && (
            <span className="ml-2">{loadingState.loadingText}</span>
          )}
        </>
      );
    }

    // 아이콘만 있는 경우
    if (icon && iconPosition === 'only') {
      return icon;
    }

    // 아이콘과 텍스트
    if (icon && children) {
      return iconPosition === 'left' ? (
        <>
          <span className="mr-2">{icon}</span>
          {children}
        </>
      ) : (
        <>
          {children}
          <span className="ml-2">{icon}</span>
        </>
      );
    }

    // 텍스트만
    return children;
  };

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || loadingState.isLoading}
      {...props}
    >
      {renderContent()}
    </button>
  );
});

Button.displayName = 'Button';