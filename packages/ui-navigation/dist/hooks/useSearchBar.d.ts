/**
 * useSearchBar Hook
 * 검색바 상태 관리
 */
import { SearchSuggestion } from '../types';
export interface UseSearchBarOptions {
    value?: string;
    suggestions?: SearchSuggestion[];
    debounceMs?: number;
    minQueryLength?: number;
    maxSuggestions?: number;
    onChange?: (value: string) => void;
    onSearch?: (query: string) => void;
    onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    autoFocus?: boolean;
    clearOnSearch?: boolean;
}
export interface UseSearchBarReturn {
    query: string;
    isOpen: boolean;
    isFocused: boolean;
    isLoading: boolean;
    activeSuggestionIndex: number;
    filteredSuggestions: SearchSuggestion[];
    setQuery: (value: string) => void;
    setIsLoading: (loading: boolean) => void;
    handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleSearch: (searchQuery?: string) => void;
    handleSuggestionClick: (suggestion: SearchSuggestion) => void;
    handleFocus: () => void;
    handleBlur: () => void;
    handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    clearSearch: () => void;
    closeSuggestions: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
    inputProps: {
        ref: React.RefObject<HTMLInputElement>;
        value: string;
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
        onFocus: () => void;
        onBlur: () => void;
        onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    };
}
export declare const useSearchBar: (options: UseSearchBarOptions) => UseSearchBarReturn;
//# sourceMappingURL=useSearchBar.d.ts.map