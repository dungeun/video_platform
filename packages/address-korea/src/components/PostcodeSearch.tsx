/**
 * 우편번호 검색 전용 컴포넌트
 */

import React, { useState, useCallback } from 'react';
import { AddressSearch } from './AddressSearch';
import type { AddressSearchResult } from '../types';

interface PostcodeSearchProps {
  value?: string;
  onChange?: (postcode: string, address?: AddressSearchResult) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  buttonText?: string;
  buttonPosition?: 'right' | 'bottom';
}

export const PostcodeSearch: React.FC<PostcodeSearchProps> = ({
  value,
  onChange,
  placeholder = '우편번호',
  disabled = false,
  required = false,
  error,
  className = '',
  buttonText = '우편번호 찾기',
  buttonPosition = 'right'
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchComplete = useCallback((result: AddressSearchResult) => {
    onChange?.(result.zonecode, result);
    setIsSearchOpen(false);
  }, [onChange]);

  const inputClass = `
    px-3 py-2 border rounded-md
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${error ? 'border-red-500' : 'border-gray-300'}
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
  `;

  const buttonClass = `
    px-4 py-2 rounded-md font-medium transition-colors
    ${disabled
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
      : 'bg-blue-500 text-white hover:bg-blue-600'
    }
  `;

  return (
    <div className={className}>
      {buttonPosition === 'right' ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={value || ''}
            placeholder={placeholder}
            readOnly
            required={required}
            disabled={disabled}
            className={`${inputClass} w-32`}
            aria-label="우편번호"
          />
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            disabled={disabled}
            className={buttonClass}
          >
            {buttonText}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={value || ''}
            placeholder={placeholder}
            readOnly
            required={required}
            disabled={disabled}
            className={`${inputClass} w-full`}
            aria-label="우편번호"
          />
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            disabled={disabled}
            className={`${buttonClass} w-full`}
          >
            {buttonText}
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}

      <AddressSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onComplete={handleSearchComplete}
      />
    </div>
  );
};

/**
 * 인라인 우편번호 검색 컴포넌트
 */
interface InlinePostcodeSearchProps {
  value?: string;
  onChange?: (postcode: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const InlinePostcodeSearch: React.FC<InlinePostcodeSearchProps> = ({
  value,
  onChange,
  className = '',
  size = 'md'
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSearchComplete = useCallback((result: AddressSearchResult) => {
    onChange?.(result.zonecode);
    setIsSearchOpen(false);
  }, [onChange]);

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsSearchOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          inline-flex items-center gap-2 border rounded-md transition-all
          ${sizeClasses[size]}
          ${value 
            ? 'border-gray-300 hover:border-blue-500' 
            : 'border-dashed border-gray-400 hover:border-blue-500'
          }
          ${className}
        `}
      >
        {value ? (
          <>
            <span className="font-mono">{value}</span>
            {isHovered && (
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            )}
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-gray-500">우편번호 추가</span>
          </>
        )}
      </button>

      <AddressSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onComplete={handleSearchComplete}
      />
    </>
  );
};