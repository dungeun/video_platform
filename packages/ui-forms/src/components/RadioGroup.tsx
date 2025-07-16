/**
 * @repo/ui-forms - RadioGroup Component
 * 
 * 라디오 버튼 그룹을 위한 컴포넌트
 */

import React, { useState } from 'react';
import { RadioGroupProps } from '../types';
import { useFormClasses } from '../hooks';

/**
 * 라디오 그룹 컴포넌트
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  defaultValue,
  disabled = false,
  readOnly = false,
  required = false,
  size = 'medium',
  variant = 'default',
  className = '',
  style,
  options = [],
  direction = 'vertical',
  onChange,
  onBlur,
  onFocus,
  'data-testid': testId,
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  // 에러 prop 추출
  const { error, ...restProps } = props;
  
  // 검증 상태 결정
  const validationState = error ? 'invalid' : undefined;

  // CSS 클래스 생성
  const classes = useFormClasses('radio-group', {
    size,
    variant,
    validationState,
    disabled,
    readOnly,
    focused,
    className
  });

  // 이벤트 핸들러
  const handleChange = (optionValue: string | number, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && !readOnly) {
      onChange?.(optionValue, event);
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <div
      className={`${classes} radio-group--${direction}`}
      style={style}
      role="radiogroup"
      data-testid={testId}
      {...(restProps as any)}
    >
      {options.map((option, index) => {
        const optionId = `${name}-option-${index}`;
        const isChecked = value === option.value;
        const isDisabled = disabled || option.disabled;

        return (
          <label
            key={option.value}
            htmlFor={optionId}
            className={`radio-option ${isDisabled ? 'radio-option--disabled' : ''} ${isChecked ? 'radio-option--checked' : ''}`}
          >
            <span className="radio-option__wrapper">
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={isChecked}
                defaultChecked={defaultValue === option.value}
                disabled={isDisabled}
                readOnly={readOnly}
                required={required}
                className="radio-option__input"
                onChange={(event) => handleChange(option.value, event)}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <span className="radio-option__indicator">
                {isChecked && <span className="radio-option__dot" />}
              </span>
            </span>
            
            <span className="radio-option__label">
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
};