/**
 * 주소 검색 팝업/모달 컴포넌트
 */

import React, { useState, useEffect, useRef } from 'react';
import { DaumPostcodeService } from '../services/DaumPostcodeService';
import type { AddressSearchModalProps, AddressSearchResult } from '../types';

export const AddressSearch: React.FC<AddressSearchModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  options,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const postcodeService = DaumPostcodeService.getInstance();

  useEffect(() => {
    if (isOpen) {
      handleSearch();
    }
  }, [isOpen]);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await postcodeService.openSearch(options);
      onComplete(result);
      onClose();
    } catch (err) {
      if (err instanceof Error && err.message !== 'User closed the popup') {
        setError('주소 검색 중 오류가 발생했습니다.');
        console.error('Address search error:', err);
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${className}`}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">주소 검색</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">주소 검색창을 불러오는 중...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="text-center text-gray-500 py-8">
            <p>Daum 우편번호 검색 팝업이 열립니다.</p>
            <p className="text-sm mt-2">팝업이 차단된 경우 팝업 차단을 해제해주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 임베드 방식 주소 검색 컴포넌트
 */
interface AddressSearchEmbedProps {
  onComplete: (address: AddressSearchResult) => void;
  options?: AddressSearchModalProps['options'];
  className?: string;
  height?: string | number;
}

export const AddressSearchEmbed: React.FC<AddressSearchEmbedProps> = ({
  onComplete,
  options,
  className = '',
  height = 400
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const embedId = useRef(`postcode-embed-${Date.now()}`);
  const postcodeService = DaumPostcodeService.getInstance();

  useEffect(() => {
    loadEmbed();
  }, []);

  const loadEmbed = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await postcodeService.embedSearch(embedId.current, options);
      onComplete(result);
    } catch (err) {
      setError('주소 검색을 불러오는데 실패했습니다.');
      console.error('Address search embed error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button
            onClick={loadEmbed}
            className="ml-4 text-sm underline hover:no-underline"
          >
            다시 시도
          </button>
        </div>
      )}

      <div
        id={embedId.current}
        className="border rounded-lg overflow-hidden"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      />
    </div>
  );
};