/**
 * 주소 자동완성 Hook
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { AddressSearchService } from '../services/AddressSearchService';
export const useAddressAutocomplete = (options = {}) => {
    const { kakaoApiKey, minLength = 2, debounceMs = 300, maxSuggestions = 5 } = options;
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const searchService = useRef(new AddressSearchService(kakaoApiKey));
    const debounceTimer = useRef();
    // 검색 실행
    const performSearch = useCallback(async (searchQuery) => {
        if (searchQuery.length < minLength) {
            setSuggestions([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const results = await searchService.current.getSuggestions(searchQuery, maxSuggestions);
            setSuggestions(results);
        }
        catch (err) {
            setError('자동완성 검색에 실패했습니다.');
            setSuggestions([]);
            console.error('Autocomplete error:', err);
        }
        finally {
            setIsLoading(false);
        }
    }, [minLength, maxSuggestions]);
    // 쿼리 변경 시 디바운스 검색
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        if (query.length < minLength) {
            setSuggestions([]);
            return;
        }
        debounceTimer.current = setTimeout(() => {
            performSearch(query);
        }, debounceMs);
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [query, minLength, debounceMs, performSearch]);
    // 제안 선택
    const selectSuggestion = useCallback((suggestion) => {
        setQuery(suggestion.text);
        setSuggestions([]);
    }, []);
    // 제안 목록 초기화
    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
    }, []);
    // 새로고침
    const refresh = useCallback(() => {
        if (query) {
            performSearch(query);
        }
    }, [query, performSearch]);
    return {
        query,
        suggestions,
        isLoading,
        error,
        setQuery,
        selectSuggestion,
        clearSuggestions,
        refresh
    };
};
export const useRecentAddresses = (options = {}) => {
    const { maxItems = 10, storageKey = 'recent_addresses' } = options;
    const [recentAddresses, setRecentAddresses] = useState(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.map((item) => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                }));
            }
        }
        catch (err) {
            console.error('Failed to load recent addresses:', err);
        }
        return [];
    });
    // 로컬 스토리지에 저장
    const saveToStorage = useCallback((addresses) => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(addresses));
        }
        catch (err) {
            console.error('Failed to save recent addresses:', err);
        }
    }, [storageKey]);
    // 주소 추가
    const addRecentAddress = useCallback((address) => {
        const id = `recent_${Date.now()}`;
        const newItem = {
            id,
            address,
            timestamp: new Date()
        };
        setRecentAddresses(prev => {
            // 중복 제거
            const filtered = prev.filter(item => item.address !== address);
            // 최신 항목을 앞에 추가
            const updated = [newItem, ...filtered].slice(0, maxItems);
            saveToStorage(updated);
            return updated;
        });
    }, [maxItems, saveToStorage]);
    // 주소 삭제
    const removeRecentAddress = useCallback((id) => {
        setRecentAddresses(prev => {
            const updated = prev.filter(item => item.id !== id);
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);
    // 전체 삭제
    const clearRecentAddresses = useCallback(() => {
        setRecentAddresses([]);
        localStorage.removeItem(storageKey);
    }, [storageKey]);
    return {
        recentAddresses,
        addRecentAddress,
        removeRecentAddress,
        clearRecentAddresses
    };
};
//# sourceMappingURL=useAddressAutocomplete.js.map