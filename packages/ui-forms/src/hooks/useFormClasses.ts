/**
 * @repo/ui-forms - useFormClasses Hook
 * 
 * 폼 컴포넌트의 CSS 클래스를 생성하는 훅
 */

import { useMemo } from 'react';
import { FormSize, FormVariant, ValidationState } from '../types';
import { getFormClasses } from '../utils';

export interface UseFormClassesOptions {
  size?: FormSize;
  variant?: FormVariant;
  validationState?: ValidationState;
  disabled?: boolean;
  readOnly?: boolean;
  focused?: boolean;
  className?: string;
}

/**
 * 폼 입력 컴포넌트의 CSS 클래스를 생성하는 훅
 */
export const useFormClasses = (
  baseClass: string,
  options: UseFormClassesOptions = {}
) => {
  const {
    size,
    variant,
    validationState,
    disabled,
    readOnly,
    focused,
    className
  } = options;

  const classes = useMemo(() => {
    return getFormClasses(
      baseClass,
      size,
      variant,
      validationState,
      disabled,
      readOnly,
      focused,
      className
    );
  }, [
    baseClass,
    size,
    variant,
    validationState,
    disabled,
    readOnly,
    focused,
    className
  ]);

  return classes;
};