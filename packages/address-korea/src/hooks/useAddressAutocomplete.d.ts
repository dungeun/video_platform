/**
 * 주소 자동완성 Hook
 */
import type { AddressSuggestion } from '../types';
interface UseAddressAutocompleteOptions {
    kakaoApiKey?: string;
    minLength?: number;
    debounceMs?: number;
    maxSuggestions?: number;
}
interface UseAddressAutocompleteReturn {
    query: string;
    suggestions: AddressSuggestion[];
    isLoading: boolean;
    error: string | null;
    setQuery: (query: string) => void;
    selectSuggestion: (suggestion: AddressSuggestion) => void;
    clearSuggestions: () => void;
    refresh: () => void;
}
export declare const useAddressAutocomplete: (options?: UseAddressAutocompleteOptions) => UseAddressAutocompleteReturn;
/**
 * 최근 검색 주소 관리 Hook
 */
interface RecentAddress {
    id: string;
    address: string;
    timestamp: Date;
}
interface UseRecentAddressesOptions {
    maxItems?: number;
    storageKey?: string;
}
export declare const useRecentAddresses: (options?: UseRecentAddressesOptions) => {
    recentAddresses: RecentAddress[];
    addRecentAddress: (address: string) => void;
    removeRecentAddress: (id: string) => void;
    clearRecentAddresses: () => void;
};
export {};
//# sourceMappingURL=useAddressAutocomplete.d.ts.map