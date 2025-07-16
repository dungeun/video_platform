/**
 * 주소 관리 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  DaumPostcodeService,
  AddressSearchService,
  AddressValidationService,
  AddressFormattingService,
  GeocodingService
} from '../services';
import type {
  DetailedAddress,
  AddressSearchResult,
  AddressSearchOptions,
  AddressValidationResult,
  Coordinates,
  GeocodingResult
} from '../types';

interface UseAddressOptions {
  kakaoApiKey?: string;
  autoValidate?: boolean;
  autoGeocode?: boolean;
}

interface UseAddressReturn {
  // 상태
  address: DetailedAddress | null;
  isSearching: boolean;
  isValidating: boolean;
  isGeocoding: boolean;
  error: string | null;
  validationResult: AddressValidationResult | null;
  coordinates: Coordinates | null;
  
  // 액션
  searchAddress: (options?: AddressSearchOptions) => Promise<void>;
  setAddress: (address: DetailedAddress) => void;
  updateAddress: (updates: Partial<DetailedAddress>) => void;
  validateAddress: () => Promise<AddressValidationResult>;
  geocodeAddress: () => Promise<GeocodingResult | null>;
  clearAddress: () => void;
  
  // 유틸리티
  formatAddress: (options?: any) => string;
  isComplete: () => boolean;
}

export const useAddress = (options: UseAddressOptions = {}): UseAddressReturn => {
  const [address, setAddress] = useState<DetailedAddress | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  // 서비스 인스턴스
  const postcodeService = DaumPostcodeService.getInstance();
  const searchService = new AddressSearchService(options.kakaoApiKey);
  const validationService = new AddressValidationService();
  const formattingService = new AddressFormattingService();
  const geocodingService = new GeocodingService(options.kakaoApiKey);

  // 자동 유효성 검사
  useEffect(() => {
    if (options.autoValidate && address) {
      validateAddress();
    }
  }, [address, options.autoValidate]);

  // 자동 지오코딩
  useEffect(() => {
    if (options.autoGeocode && address?.address) {
      geocodeAddress();
    }
  }, [address?.address, options.autoGeocode]);

  // 주소 검색
  const searchAddress = useCallback(async (searchOptions?: AddressSearchOptions) => {
    setIsSearching(true);
    setError(null);

    try {
      const result = await postcodeService.openSearch(searchOptions);
      const detailedAddress = formattingService.toDetailedAddress(result);
      setAddress(detailedAddress);
      setValidationResult(null);
      setCoordinates(null);
    } catch (err) {
      if (err instanceof Error && err.message !== 'User closed the popup') {
        setError('주소 검색에 실패했습니다.');
        console.error('Address search error:', err);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 주소 업데이트
  const updateAddress = useCallback((updates: Partial<DetailedAddress>) => {
    if (!address) return;
    
    const updated = { ...address, ...updates };
    setAddress(updated);
    setValidationResult(null);
  }, [address]);

  // 주소 유효성 검사
  const validateAddress = useCallback(async (): Promise<AddressValidationResult> => {
    if (!address) {
      const result: AddressValidationResult = {
        isValid: false,
        errors: ['주소가 입력되지 않았습니다.']
      };
      setValidationResult(result);
      return result;
    }

    setIsValidating(true);
    setError(null);

    try {
      const result = validationService.validate(address);
      setValidationResult(result);
      
      if (result.normalizedAddress) {
        setAddress(result.normalizedAddress);
      }
      
      return result;
    } catch (err) {
      const errorResult: AddressValidationResult = {
        isValid: false,
        errors: ['주소 유효성 검사에 실패했습니다.']
      };
      setError('주소 유효성 검사에 실패했습니다.');
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, [address]);

  // 지오코딩
  const geocodeAddress = useCallback(async (): Promise<GeocodingResult | null> => {
    if (!address?.address) return null;

    setIsGeocoding(true);
    setError(null);

    try {
      const result = await geocodingService.geocode(address);
      if (result) {
        setCoordinates(result.coordinates);
      }
      return result;
    } catch (err) {
      setError('좌표 변환에 실패했습니다.');
      console.error('Geocoding error:', err);
      return null;
    } finally {
      setIsGeocoding(false);
    }
  }, [address]);

  // 주소 포맷팅
  const formatAddress = useCallback((formatOptions?: any) => {
    if (!address) return '';
    return formattingService.format(address, formatOptions);
  }, [address]);

  // 주소 완성도 확인
  const isComplete = useCallback(() => {
    if (!address) return false;
    return !!(
      address.zonecode &&
      address.address &&
      address.detailAddress
    );
  }, [address]);

  // 주소 초기화
  const clearAddress = useCallback(() => {
    setAddress(null);
    setValidationResult(null);
    setCoordinates(null);
    setError(null);
  }, []);

  return {
    // 상태
    address,
    isSearching,
    isValidating,
    isGeocoding,
    error,
    validationResult,
    coordinates,
    
    // 액션
    searchAddress,
    setAddress,
    updateAddress,
    validateAddress,
    geocodeAddress,
    clearAddress,
    
    // 유틸리티
    formatAddress,
    isComplete
  };
};