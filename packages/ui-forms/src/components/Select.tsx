/**
 * @repo/ui-forms - Select Component
 * 
 * 선택 옵션을 위한 드롭다운 컴포넌트
 */

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { SelectProps, SelectOption } from '../types';
import { useFormClasses } from '../hooks';
import { getInputStyle } from '../utils';

/**
 * 선택 컴포넌트
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
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
  options = [],
  multiple = false,
  searchable = false,
  clearable = false,
  loading = false,
  noOptionsMessage = 'No options available',
  loadingMessage = 'Loading...',
  maxMenuHeight = 200,
  onChange,
  onBlur,
  onFocus,
  'data-testid': testId,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLSelectElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ref 전달
  useImperativeHandle(ref, () => selectRef.current!, []);

  // 에러 prop 추출
  const { error, ...restProps } = props;
  
  // 검증 상태 결정
  const validationState = error ? 'invalid' : undefined;

  // CSS 클래스 생성
  const classes = useFormClasses('select', {
    size,
    variant,
    validationState,
    disabled,
    readOnly,
    focused,
    className
  });

  // 옵션 필터링 (검색 가능한 경우)
  const filteredOptions = searchable && searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // 그룹별 옵션 정리
  const groupedOptions = filteredOptions.reduce((groups, option) => {
    const group = option.group || 'default';
    if (!groups[group]) groups[group] = [];
    groups[group].push(option);
    return groups;
  }, {} as Record<string, SelectOption[]>);

  // 이벤트 핸들러
  const handleFocus = (event: React.FocusEvent<HTMLSelectElement>) => {
    setFocused(true);
    setIsOpen(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLSelectElement>) => {
    setTimeout(() => {
      setFocused(false);
      setIsOpen(false);
      setSearchTerm('');
    }, 150); // 옵션 클릭을 위한 지연
    onBlur?.(event);
  };

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(event);
  };

  const handleClear = () => {
    if (selectRef.current) {
      const event = {
        target: { ...selectRef.current, value: '' }
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange?.(event);
    }
  };

  // 검색 입력 핸들러
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // 클릭 외부 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 기본 select (검색 불가능하고 단순한 경우)
  if (!searchable && !clearable) {
    return (
      <select
        ref={selectRef}
        name={name}
        value={value as string | number | readonly string[]}
        defaultValue={defaultValue as string | number | readonly string[]}
        disabled={disabled}
        required={required}
        multiple={multiple}
        className={classes}
        style={{
          ...getInputStyle(size, variant, validationState, disabled, readOnly, focused),
          ...style
        }}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-testid={testId}
        {...restProps}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {Object.entries(groupedOptions).map(([groupName, groupOptions]) => {
          if (groupName === 'default') {
            return groupOptions.map(option => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ));
          }

          return (
            <optgroup key={groupName} label={groupName}>
              {groupOptions.map(option => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    );
  }

  // 커스텀 select (검색 가능하거나 클리어 가능한 경우)
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`${classes} select-wrapper`} style={style}>
      {/* 히든 select (폼 제출용) */}
      <select
        ref={selectRef}
        name={name}
        value={value as string | number | readonly string[]}
        defaultValue={defaultValue as string | number | readonly string[]}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={handleChange}
        tabIndex={-1}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* 표시용 입력 */}
      <div
        className="select-control"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {searchable && isOpen ? (
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            placeholder={placeholder}
            className="select-search"
            onChange={handleSearchChange}
            autoFocus
          />
        ) : (
          <span className="select-value">
            {selectedOption?.label || placeholder}
          </span>
        )}

        <div className="select-actions">
          {clearable && value && (
            <button
              type="button"
              className="select-clear"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              ×
            </button>
          )}
          <span className={`select-arrow ${isOpen ? 'select-arrow--open' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      {/* 옵션 메뉴 */}
      {isOpen && (
        <div
          className="select-menu"
          style={{ maxHeight: maxMenuHeight }}
        >
          {loading ? (
            <div className="select-loading">
              {loadingMessage}
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="select-no-options">
              {noOptionsMessage}
            </div>
          ) : (
            Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
              <div key={groupName}>
                {groupName !== 'default' && (
                  <div className="select-group-label">
                    {groupName}
                  </div>
                )}
                {groupOptions.map(option => (
                  <div
                    key={option.value}
                    className={`select-option ${option.value === value ? 'select-option--selected' : ''} ${option.disabled ? 'select-option--disabled' : ''}`}
                    onClick={() => {
                      if (!option.disabled && selectRef.current) {
                        const event = {
                          target: { ...selectRef.current, value: option.value }
                        } as React.ChangeEvent<HTMLSelectElement>;
                        onChange?.(event);
                        setIsOpen(false);
                        setSearchTerm('');
                      }
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});