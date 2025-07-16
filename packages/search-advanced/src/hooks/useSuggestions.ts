import { useState, useEffect, useCallback, useRef } from 'react';
import { SearchSuggestionService } from '../suggestions/SearchSuggestionService';
import { SuggestionContext } from '../types';

export interface UseSuggestionsOptions {
  suggestionService: SearchSuggestionService;
  debounceMs?: number;
  minChars?: number;
  maxSuggestions?: number;
  context?: SuggestionContext;
  enabled?: boolean;
}

export interface UseSuggestionsReturn {
  suggestions: string[];
  relatedSearches: string[];
  loading: boolean;
  error: string | null;
  getSuggestions: (query: string) => Promise<void>;
  trackClick: (suggestion: string) => void;
  clearSuggestions: () => void;
}

export const useSuggestions = ({
  suggestionService,
  debounceMs = 300,
  minChars = 2,
  maxSuggestions = 10,
  context,
  enabled = true
}: UseSuggestionsOptions): UseSuggestionsReturn => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [relatedSearches, setRelatedSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!enabled || !query || query.length < minChars) {
      setSuggestions([]);
      setRelatedSearches([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const [suggestionsData, relatedData] = await Promise.all([
        suggestionService.getSuggestions(query, maxSuggestions, context),
        suggestionService.getRelatedSearches(query, 5)
      ]);

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setSuggestions(suggestionsData);
      setRelatedSearches(relatedData);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to get suggestions');
        setSuggestions([]);
        setRelatedSearches([]);
      }
    } finally {
      setLoading(false);
    }
  }, [suggestionService, enabled, minChars, maxSuggestions, context]);

  // Debounced suggestions
  const debouncedGetSuggestions = useCallback((query: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, debounceMs);
  }, [fetchSuggestions, debounceMs]);

  // Main suggestions function
  const getSuggestions = useCallback(async (query: string) => {
    if (debounceMs > 0) {
      debouncedGetSuggestions(query);
    } else {
      await fetchSuggestions(query);
    }
  }, [fetchSuggestions, debouncedGetSuggestions, debounceMs]);

  // Track suggestion click
  const trackClick = useCallback((suggestion: string) => {
    suggestionService.trackSuggestionClick(suggestion);
  }, [suggestionService]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setRelatedSearches([]);
    setError(null);
    
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    suggestions,
    relatedSearches,
    loading,
    error,
    getSuggestions,
    trackClick,
    clearSuggestions
  };
};