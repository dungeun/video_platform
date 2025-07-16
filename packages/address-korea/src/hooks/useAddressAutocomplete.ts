/**
 * 주소 자동완성 Hook
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { AddressSearchService } from '../services/AddressSearchService';
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

export const useAddressAutocomplete = (
  options: UseAddressAutocompleteOptions = {}
): UseAddressAutocompleteReturn => {
  const {
    kakaoApiKey,
    minLength = 2,
    debounceMs = 300,
    maxSuggestions = 5
  } = options;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchService = useRef(new AddressSearchService(kakaoApiKey));
  const debounceTimer = useRef<NodeJS.Timeout>();

  // 검색 실행
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minLength) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchService.current.getSuggestions(
        searchQuery,
        maxSuggestions
      );
      setSuggestions(results);
    } catch (err) {
      setError('자동완성 검색에 실패했습니다.');
      setSuggestions([]);
      console.error('Autocomplete error:', err);
    } finally {
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
  const selectSuggestion = useCallback((suggestion: AddressSuggestion) => {
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

export const useRecentAddresses = (
  options: UseRecentAddressesOptions = {}
) => {
  const { maxItems = 10, storageKey = 'recent_addresses' } = options;
  
  const [recentAddresses, setRecentAddresses] = useState<RecentAddress[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (err) {
      console.error('Failed to load recent addresses:', err);
    }
    return [];
  });

  // 로컬 스토리지에 저장
  const saveToStorage = useCallback((addresses: RecentAddress[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(addresses));
    } catch (err) {
      console.error('Failed to save recent addresses:', err);
    }
  }, [storageKey]);

  // 주소 추가
  const addRecentAddress = useCallback((address: string) => {
    const id = `recent_${Date.now()}`;
    const newItem: RecentAddress = {
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
  const removeRecentAddress = useCallback((id: string) => {
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