import { useState, useCallback, useEffect, useRef } from 'react';
import { debounce } from '@revu/shared-utils';
import { SearchService } from '../services/searchService';
import type {
  InfluencerProfile,
  ProfileFilter,
  ProfileSortOption
} from '../types';
import type { SearchResult, SavedSearch } from '../services/searchService';

const searchService = new SearchService();

export function useProfileSearch() {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const search = useCallback(async (
    query?: string,
    filter?: ProfileFilter,
    sort?: ProfileSortOption,
    page?: number,
    limit?: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchService.search(query, filter, sort, page, limit);
      setResults(data);
      
      // Track search for analytics
      if (query) {
        searchService.trackSearchQuery(query, data.total);
      }
      
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      const data = await searchService.getSearchSuggestions(query);
      setSuggestions(data);
    } catch (err) {
      console.error('Failed to get suggestions:', err);
    }
  }, []);

  const debouncedGetSuggestions = useRef(
    debounce(getSuggestions, 300)
  ).current;

  const clearResults = useCallback(() => {
    setResults(null);
    setSuggestions([]);
  }, []);

  return {
    results,
    loading,
    error,
    suggestions,
    search,
    getSuggestions: debouncedGetSuggestions,
    clearResults
  };
}

export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedSearches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await searchService.getSavedSearches();
      setSearches(data);
    } catch (err) {
      console.error('Failed to fetch saved searches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSearch = useCallback(async (
    name: string,
    filter: ProfileFilter,
    notifications?: boolean
  ) => {
    const saved = await searchService.saveSearch(name, filter, notifications);
    setSearches(prev => [...prev, saved]);
    return saved;
  }, []);

  const updateSearch = useCallback(async (
    searchId: string,
    updates: Partial<SavedSearch>
  ) => {
    const updated = await searchService.updateSavedSearch(searchId, updates);
    setSearches(prev => prev.map(s => s.id === searchId ? updated : s));
    return updated;
  }, []);

  const deleteSearch = useCallback(async (searchId: string) => {
    await searchService.deleteSavedSearch(searchId);
    setSearches(prev => prev.filter(s => s.id !== searchId));
  }, []);

  useEffect(() => {
    fetchSavedSearches();
  }, [fetchSavedSearches]);

  return {
    searches,
    loading,
    saveSearch,
    updateSearch,
    deleteSearch,
    refetch: fetchSavedSearches
  };
}

export function useTrendingInfluencers() {
  const [profiles, setProfiles] = useState<InfluencerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrending = useCallback(async (
    category?: string,
    platform?: string
  ) => {
    setLoading(true);
    try {
      const data = await searchService.getTrendingInfluencers(
        category as any,
        platform as any
      );
      setProfiles(data);
    } catch (err) {
      console.error('Failed to fetch trending influencers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  return {
    profiles,
    loading,
    refetch: fetchTrending
  };
}

export function useSimilarProfiles(profileId: string) {
  const [profiles, setProfiles] = useState<InfluencerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      setLoading(true);
      try {
        const data = await searchService.getSimilarProfiles(profileId);
        setProfiles(data);
      } catch (err) {
        console.error('Failed to fetch similar profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      fetchSimilar();
    }
  }, [profileId]);

  return { profiles, loading };
}