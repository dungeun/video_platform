/**
 * useSearchBar Hook
 * 검색바 상태 관리
 */
import { useState, useCallback, useRef, useEffect } from 'react';
export const useSearchBar = (options) => {
    const { value = '', suggestions = [], debounceMs = 300, minQueryLength = 1, maxSuggestions = 10, onChange, onSearch, onSuggestionSelect, onFocus, onBlur, autoFocus = false, clearOnSearch = false } = options;
    const [query, setQuery] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);
    const blurTimeoutRef = useRef(null);
    // 자동 포커스
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);
    // 외부 value prop 변경 반영
    useEffect(() => {
        setQuery(value);
    }, [value]);
    // 디바운스된 onChange 호출
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            onChange?.(query);
        }, debounceMs);
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, debounceMs, onChange]);
    // 정리
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
            }
        };
    }, []);
    // 필터된 제안사항
    const filteredSuggestions = useCallback(() => {
        if (!query || query.length < minQueryLength) {
            return [];
        }
        const filtered = suggestions.filter(suggestion => suggestion.text.toLowerCase().includes(query.toLowerCase()));
        return filtered.slice(0, maxSuggestions);
    }, [query, suggestions, minQueryLength, maxSuggestions]);
    const suggestionList = filteredSuggestions();
    // 입력 변경 핸들러
    const handleInputChange = useCallback((event) => {
        const newValue = event.target.value;
        setQuery(newValue);
        setActiveSuggestionIndex(-1);
        // 제안사항 표시 여부 결정
        if (newValue.length >= minQueryLength && suggestionList.length > 0) {
            setIsOpen(true);
        }
        else {
            setIsOpen(false);
        }
    }, [minQueryLength, suggestionList.length]);
    // 검색 실행
    const handleSearch = useCallback((searchQuery) => {
        const queryToSearch = searchQuery || query;
        if (queryToSearch.trim()) {
            onSearch?.(queryToSearch.trim());
            if (clearOnSearch) {
                setQuery('');
            }
        }
        setIsOpen(false);
        setActiveSuggestionIndex(-1);
    }, [query, onSearch, clearOnSearch]);
    // 제안사항 클릭
    const handleSuggestionClick = useCallback((suggestion) => {
        setQuery(suggestion.text);
        setIsOpen(false);
        setActiveSuggestionIndex(-1);
        // 커스텀 핸들러 실행
        onSuggestionSelect?.(suggestion);
        // 제안사항 자체 핸들러 실행
        if (suggestion.onClick) {
            suggestion.onClick();
        }
        else {
            // 기본 동작: 검색 실행
            handleSearch(suggestion.text);
        }
    }, [onSuggestionSelect, handleSearch]);
    // 포커스 핸들러
    const handleFocus = useCallback(() => {
        if (blurTimeoutRef.current) {
            clearTimeout(blurTimeoutRef.current);
            blurTimeoutRef.current = null;
        }
        setIsFocused(true);
        onFocus?.();
        // 제안사항이 있으면 표시
        if (query.length >= minQueryLength && suggestionList.length > 0) {
            setIsOpen(true);
        }
    }, [query, minQueryLength, suggestionList.length, onFocus]);
    // 블러 핸들러
    const handleBlur = useCallback(() => {
        // 제안사항 클릭을 위해 지연
        blurTimeoutRef.current = setTimeout(() => {
            setIsFocused(false);
            setIsOpen(false);
            setActiveSuggestionIndex(-1);
            onBlur?.();
        }, 150);
    }, [onBlur]);
    // 키보드 네비게이션
    const handleKeyDown = useCallback((event) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (!isOpen && suggestionList.length > 0) {
                    setIsOpen(true);
                }
                setActiveSuggestionIndex(prev => prev < suggestionList.length - 1 ? prev + 1 : prev);
                break;
            case 'ArrowUp':
                event.preventDefault();
                setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                event.preventDefault();
                if (activeSuggestionIndex >= 0 && suggestionList[activeSuggestionIndex]) {
                    handleSuggestionClick(suggestionList[activeSuggestionIndex]);
                }
                else {
                    handleSearch();
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setActiveSuggestionIndex(-1);
                inputRef.current?.blur();
                break;
            case 'Tab':
                setIsOpen(false);
                setActiveSuggestionIndex(-1);
                break;
        }
    }, [isOpen, activeSuggestionIndex, suggestionList, handleSuggestionClick, handleSearch]);
    // 검색 초기화
    const clearSearch = useCallback(() => {
        setQuery('');
        setIsOpen(false);
        setActiveSuggestionIndex(-1);
        inputRef.current?.focus();
    }, []);
    // 제안사항 닫기
    const closeSuggestions = useCallback(() => {
        setIsOpen(false);
        setActiveSuggestionIndex(-1);
    }, []);
    // 입력 props
    const inputProps = {
        ref: inputRef,
        value: query,
        onChange: handleInputChange,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onKeyDown: handleKeyDown
    };
    return {
        query,
        isOpen,
        isFocused,
        isLoading,
        activeSuggestionIndex,
        filteredSuggestions: suggestionList,
        setQuery,
        setIsLoading,
        handleInputChange,
        handleSearch,
        handleSuggestionClick,
        handleFocus,
        handleBlur,
        handleKeyDown,
        clearSearch,
        closeSuggestions,
        inputRef,
        inputProps
    };
};
//# sourceMappingURL=useSearchBar.js.map