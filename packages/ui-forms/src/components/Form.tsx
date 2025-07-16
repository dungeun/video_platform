/**
 * @company/ui-forms - Form Component
 * 
 * 폼 제출과 검증을 관리하는 메인 폼 컴포넌트
 */

import React, { createContext, useContext, FormEvent } from 'react';
import { FormProps, UseFormReturn } from '../types';
import { useForm } from '../hooks';

// ===== 폼 컨텍스트 =====
const FormContext = createContext<UseFormReturn | null>(null);

/**
 * 폼 컨텍스트 훅
 */
export const useFormContext = (): UseFormReturn => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a Form component');
  }
  return context;
};

/**
 * 폼 컴포넌트
 * 폼 상태를 관리하고 자식 컴포넌트들에게 컨텍스트를 제공
 */
export const Form: React.FC<FormProps> = ({
  initialValues,
  validationRules,
  onSubmit,
  onValidate,
  children,
  className = '',
  noValidate = true,
  autoComplete = 'off'
}) => {
  // 폼 상태 관리
  const formMethods = useForm({
    initialValues,
    validationRules,
    onSubmit,
    onValidate,
    validateOnChange: false,
    validateOnBlur: true,
    validateOnSubmit: true
  });

  // 폼 제출 핸들러
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    formMethods.submit();
  };

  return (
    <FormContext.Provider value={formMethods}>
      <form
        className={`form ${className}`.trim()}
        onSubmit={handleSubmit}
        noValidate={noValidate}
        autoComplete={autoComplete}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
};