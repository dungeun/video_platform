/**
 * @repo/ui-forms - TextArea Component
 * 
 * 여러 줄 텍스트 입력을 위한 컴포넌트
 */

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TextAreaProps } from '../types';
import { useFormClasses } from '../hooks';
import { getInputStyle } from '../utils';

/**
 * 텍스트 영역 컴포넌트
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({
  name,
  value,
  defaultValue,
  placeholder,
  disabled = false,
  readOnly = false,
  required = false,
  size = 'medium',
  variant = 'default',
  className = '',
  style,
  rows = 4,
  cols,
  wrap = 'soft',
  resize = 'vertical',
  autoResize = false,
  onChange,
  onBlur,
  onFocus,
  'data-testid': testId,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ref 전달
  useImperativeHandle(ref, () => textareaRef.current!, []);

  // 자동 리사이징
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value, autoResize]);

  // 에러 prop 추출
  const { error, ...restProps } = props;
  
  // 검증 상태 결정
  const validationState = error ? 'invalid' : undefined;

  // CSS 클래스 생성
  const classes = useFormClasses('textarea', {
    size,
    variant,
    validationState,
    disabled,
    readOnly,
    focused,
    className
  });

  // 인라인 스타일 생성
  const textareaStyle = {
    ...getInputStyle(size, variant, validationState, disabled, readOnly, focused),
    resize: autoResize ? 'none' : resize,
    minHeight: autoResize ? `${rows * 1.5}em` : undefined,
    ...style
  };

  // 이벤트 핸들러
  const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    setFocused(false);
    onBlur?.(event);
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    // 자동 리사이징
    if (autoResize) {
      const textarea = event.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
    
    onChange?.(event);
  };

  return (
    <textarea
      ref={textareaRef}
      name={name}
      value={value as string | number | readonly string[]}
      defaultValue={defaultValue as string | number | readonly string[]}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      rows={rows}
      cols={cols}
      wrap={wrap}
      className={classes}
      style={textareaStyle}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-testid={testId}
      {...restProps}
    />
  );
});