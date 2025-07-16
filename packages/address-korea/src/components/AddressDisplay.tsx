/**
 * 주소 표시 컴포넌트
 */

import React from 'react';
import { AddressFormattingService } from '../services/AddressFormattingService';
import type { DetailedAddress, AddressFormatOptions } from '../types';

const formattingService = new AddressFormattingService();

interface AddressDisplayProps {
  address: DetailedAddress;
  format?: 'single' | 'multi' | 'shipping' | 'english';
  options?: AddressFormatOptions;
  className?: string;
  showCopyButton?: boolean;
  showMapButton?: boolean;
  onMapClick?: (address: DetailedAddress) => void;
}

export const AddressDisplay: React.FC<AddressDisplayProps> = ({
  address,
  format = 'single',
  options,
  className = '',
  showCopyButton = false,
  showMapButton = false,
  onMapClick
}) => {
  const handleCopy = async () => {
    const text = formattingService.format(address, options);
    try {
      await navigator.clipboard.writeText(text);
      // TODO: 복사 완료 토스트 메시지
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleMapClick = () => {
    onMapClick?.(address);
  };

  const renderAddress = () => {
    switch (format) {
      case 'multi':
        return (
          <div className="space-y-1">
            {formattingService.toMultiLine(address).map((line, index) => (
              <div key={index} className="text-gray-800">
                {line}
              </div>
            ))}
          </div>
        );

      case 'shipping':
        return (
          <pre className="font-sans whitespace-pre-wrap text-gray-800">
            {formattingService.toShippingLabel(address)}
          </pre>
        );

      case 'english':
        return (
          <div className="text-gray-800">
            {formattingService.toEnglish(address)}
          </div>
        );

      default:
        return (
          <div className="text-gray-800">
            {formattingService.format(address, options)}
          </div>
        );
    }
  };

  return (
    <div className={`relative ${className}`}>
      {renderAddress()}

      {(showCopyButton || showMapButton) && (
        <div className="flex gap-2 mt-2">
          {showCopyButton && (
            <button
              onClick={handleCopy}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              aria-label="주소 복사"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              복사
            </button>
          )}

          {showMapButton && (
            <button
              onClick={handleMapClick}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              aria-label="지도에서 보기"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              지도
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 주소 카드 컴포넌트
 */
interface AddressCardProps {
  address: DetailedAddress;
  title?: string;
  isDefault?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  className?: string;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  title,
  isDefault = false,
  onEdit,
  onDelete,
  onSetDefault,
  className = ''
}) => {
  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          {title && (
            <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
          )}
          {isDefault && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              기본 배송지
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-sm text-gray-600 hover:text-gray-800"
              aria-label="수정"
            >
              수정
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-sm text-red-600 hover:text-red-700"
              aria-label="삭제"
            >
              삭제
            </button>
          )}
        </div>
      </div>

      <AddressDisplay
        address={address}
        format="multi"
        className="text-sm"
      />

      {onSetDefault && !isDefault && (
        <button
          onClick={onSetDefault}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700"
        >
          기본 배송지로 설정
        </button>
      )}
    </div>
  );
};

/**
 * 주소 요약 표시 컴포넌트 (모바일용)
 */
interface AddressSummaryProps {
  address: DetailedAddress;
  maxLength?: number;
  className?: string;
  onClick?: () => void;
}

export const AddressSummary: React.FC<AddressSummaryProps> = ({
  address,
  maxLength = 30,
  className = '',
  onClick
}) => {
  const summary = formattingService.summarize(address, maxLength);

  return (
    <div 
      className={`flex items-center justify-between ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <span className="text-gray-800 truncate">{summary}</span>
      {onClick && (
        <svg
          className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      )}
    </div>
  );
};