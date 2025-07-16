/**
 * 주소 관리 Hook
 */
import { useState, useCallback, useEffect } from 'react';
import { DaumPostcodeService, AddressSearchService, AddressValidationService, AddressFormattingService, GeocodingService } from '../services';
export const useAddress = (options = {}) => {
    const [address, setAddress] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [error, setError] = useState(null);
    const [validationResult, setValidationResult] = useState(null);
    const [coordinates, setCoordinates] = useState(null);
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
    const searchAddress = useCallback(async (searchOptions) => {
        setIsSearching(true);
        setError(null);
        try {
            const result = await postcodeService.openSearch(searchOptions);
            const detailedAddress = formattingService.toDetailedAddress(result);
            setAddress(detailedAddress);
            setValidationResult(null);
            setCoordinates(null);
        }
        catch (err) {
            if (err instanceof Error && err.message !== 'User closed the popup') {
                setError('주소 검색에 실패했습니다.');
                console.error('Address search error:', err);
            }
        }
        finally {
            setIsSearching(false);
        }
    }, []);
    // 주소 업데이트
    const updateAddress = useCallback((updates) => {
        if (!address)
            return;
        const updated = { ...address, ...updates };
        setAddress(updated);
        setValidationResult(null);
    }, [address]);
    // 주소 유효성 검사
    const validateAddress = useCallback(async () => {
        if (!address) {
            const result = {
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
        }
        catch (err) {
            const errorResult = {
                isValid: false,
                errors: ['주소 유효성 검사에 실패했습니다.']
            };
            setError('주소 유효성 검사에 실패했습니다.');
            setValidationResult(errorResult);
            return errorResult;
        }
        finally {
            setIsValidating(false);
        }
    }, [address]);
    // 지오코딩
    const geocodeAddress = useCallback(async () => {
        if (!address?.address)
            return null;
        setIsGeocoding(true);
        setError(null);
        try {
            const result = await geocodingService.geocode(address);
            if (result) {
                setCoordinates(result.coordinates);
            }
            return result;
        }
        catch (err) {
            setError('좌표 변환에 실패했습니다.');
            console.error('Geocoding error:', err);
            return null;
        }
        finally {
            setIsGeocoding(false);
        }
    }, [address]);
    // 주소 포맷팅
    const formatAddress = useCallback((formatOptions) => {
        if (!address)
            return '';
        return formattingService.format(address, formatOptions);
    }, [address]);
    // 주소 완성도 확인
    const isComplete = useCallback(() => {
        if (!address)
            return false;
        return !!(address.zonecode &&
            address.address &&
            address.detailAddress);
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
//# sourceMappingURL=useAddress.js.map