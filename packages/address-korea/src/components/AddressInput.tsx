/**
 * 주소 입력 폼 필드 컴포넌트
 */

import React, { useState, useCallback } from 'react';
import { AddressSearch } from './AddressSearch';
import { AddressFormattingService } from '../services/AddressFormattingService';
import type { AddressInputProps, AddressSearchResult, DetailedAddress } from '../types';

const formattingService = new AddressFormattingService();

export const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = '주소를 검색해주세요',
  disabled = false,
  readOnly = false,
  required = false,
  error,
  className = '',
  showPostcode = true,
  showDetails = true,
  showExtra = true,
  addressType = 'ROAD'
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localValue, setLocalValue] = useState<DetailedAddress | undefined>(value);

  const handleSearchClick = useCallback(() => {
    if (!disabled && !readOnly) {
      setIsSearchOpen(true);
      onSearch?.();
    }
  }, [disabled, readOnly, onSearch]);

  const handleSearchComplete = useCallback((result: AddressSearchResult) => {
    const detailedAddress = formattingService.toDetailedAddress(result);
    setLocalValue(detailedAddress);
    onChange?.(detailedAddress);
    setIsSearchOpen(false);
  }, [onChange]);

  const handleDetailChange = useCallback((
    field: keyof DetailedAddress,
    value: string
  ) => {
    if (!localValue || disabled || readOnly) return;

    const updated = {
      ...localValue,
      [field]: value
    };
    setLocalValue(updated);
    onChange?.(updated);
  }, [localValue, disabled, readOnly, onChange]);

  const baseInputClass = `
    w-full px-3 py-2 border rounded-md
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${error ? 'border-red-500' : 'border-gray-300'}
    ${readOnly ? 'cursor-default' : ''}
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
  `;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 우편번호 */}
      {showPostcode && (
        <div className="flex gap-2">
          <input
            type="text"
            value={localValue?.zonecode || ''}
            placeholder="우편번호"
            readOnly
            required={required}
            className={`${baseInputClass} flex-shrink-0 w-32`}
            aria-label="우편번호"
          />
          <button
            type="button"
            onClick={handleSearchClick}
            disabled={disabled || readOnly}
            className={`
              px-4 py-2 rounded-md font-medium transition-colors
              ${disabled || readOnly
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }
            `}
          >
            주소 검색
          </button>
        </div>
      )}

      {/* 기본 주소 */}
      <input
        type="text"
        value={localValue?.address || ''}
        placeholder={placeholder}
        readOnly
        required={required}
        onClick={handleSearchClick}
        className={`${baseInputClass} ${!readOnly && !disabled ? 'cursor-pointer' : ''}`}
        aria-label="주소"
      />

      {/* 상세 주소 */}
      {showDetails && (
        <input
          type="text"
          value={localValue?.detailAddress || ''}
          onChange={(e) => handleDetailChange('detailAddress', e.target.value)}
          placeholder="상세 주소를 입력해주세요"
          disabled={disabled || !localValue?.address}
          readOnly={readOnly}
          className={baseInputClass}
          aria-label="상세 주소"
        />
      )}

      {/* 참고 항목 */}
      {showExtra && localValue?.extraAddress && (
        <input
          type="text"
          value={localValue.extraAddress}
          readOnly
          className={`${baseInputClass} bg-gray-50`}
          aria-label="참고 항목"
        />
      )}

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}

      {/* 주소 검색 모달 */}
      <AddressSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onComplete={handleSearchComplete}
        options={{
          theme: {
            bgColor: '#FFFFFF',
            searchBgColor: '#FFFFFF',
            contentBgColor: '#FFFFFF',
            pageBgColor: '#FAFAFA',
            textColor: '#333333',
            queryTextColor: '#222222',
            postcodeTextColor: '#FA4256',
            emphTextColor: '#008BD3',
            outlineColor: '#E0E0E0'
          }
        }}
      />
    </div>
  );
};

/**
 * 간단한 주소 입력 필드 (단일 필드)
 */
interface SimpleAddressInputProps {
  value?: string;
  onChange?: (address: string, fullAddress?: DetailedAddress) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

export const SimpleAddressInput: React.FC<SimpleAddressInputProps> = ({
  value,
  onChange,
  placeholder = '주소를 검색해주세요',
  disabled = false,
  required = false,
  error,
  className = ''
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchComplete = useCallback((result: AddressSearchResult) => {
    const detailedAddress = formattingService.toDetailedAddress(result);
    const formattedAddress = formattingService.toSingleLine(detailedAddress, true);
    onChange?.(formattedAddress, detailedAddress);
    setIsSearchOpen(false);
  }, [onChange]);

  return (
    <div className={className}>
      <div className="relative">
        <input
          type="text"
          value={value || ''}
          placeholder={placeholder}
          readOnly
          required={required}
          onClick={() => !disabled && setIsSearchOpen(true)}
          className={`
            w-full px-3 py-2 pr-10 border rounded-md
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'}
            ${error ? 'border-red-500' : 'border-gray-300'}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          `}
        />
        <button
          type="button"
          onClick={() => !disabled && setIsSearchOpen(true)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
          aria-label="주소 검색"
        >
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>

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