/**
 * 주소 관리 Hook
 */
import type { DetailedAddress, AddressSearchOptions, AddressValidationResult, Coordinates, GeocodingResult } from '../types';
interface UseAddressOptions {
    kakaoApiKey?: string;
    autoValidate?: boolean;
    autoGeocode?: boolean;
}
interface UseAddressReturn {
    address: DetailedAddress | null;
    isSearching: boolean;
    isValidating: boolean;
    isGeocoding: boolean;
    error: string | null;
    validationResult: AddressValidationResult | null;
    coordinates: Coordinates | null;
    searchAddress: (options?: AddressSearchOptions) => Promise<void>;
    setAddress: (address: DetailedAddress) => void;
    updateAddress: (updates: Partial<DetailedAddress>) => void;
    validateAddress: () => Promise<AddressValidationResult>;
    geocodeAddress: () => Promise<GeocodingResult | null>;
    clearAddress: () => void;
    formatAddress: (options?: any) => string;
    isComplete: () => boolean;
}
export declare const useAddress: (options?: UseAddressOptions) => UseAddressReturn;
export {};
//# sourceMappingURL=useAddress.d.ts.map