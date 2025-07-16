import { useState, useEffect, useCallback } from 'react';
import type { UserProfile, UserProfileQueryOptions } from '../types';
import { UserProfileService } from '../services';

export interface UseUserProfilesOptions {
  service: UserProfileService;
  queryOptions?: UserProfileQueryOptions;
  autoLoad?: boolean;
}

export interface UseUserProfilesReturn {
  profiles: UserProfile[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
  updateQueryOptions: (options: UserProfileQueryOptions) => void;
}

/**
 * Hook for managing multiple user profiles with pagination
 */
export function useUserProfiles({
  service,
  queryOptions = {},
  autoLoad = true
}: UseUserProfilesOptions): UseUserProfilesReturn {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentOptions, setCurrentOptions] = useState<UserProfileQueryOptions>(queryOptions);

  const loadProfiles = useCallback(async (append = false) => {
    setLoading(true);
    setError(null);

    try {
      const [loadedProfiles, count] = await Promise.all([
        service.findMany(currentOptions),
        service.count(currentOptions.filters)
      ]);

      if (append) {
        setProfiles(prev => [...prev, ...loadedProfiles]);
      } else {
        setProfiles(loadedProfiles);
      }
      
      setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }, [service, currentOptions]);

  const loadMore = useCallback(async () => {
    const currentOffset = currentOptions.offset || 0;
    const limit = currentOptions.limit || 10;
    
    const newOptions = {
      ...currentOptions,
      offset: currentOffset + limit
    };
    
    setCurrentOptions(newOptions);
    
    try {
      const moreProfiles = await service.findMany(newOptions);
      setProfiles(prev => [...prev, ...moreProfiles]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more profiles');
    }
  }, [service, currentOptions]);

  const updateQueryOptions = useCallback((options: UserProfileQueryOptions) => {
    setCurrentOptions({ ...options, offset: 0 }); // Reset offset when changing options
  }, []);

  const hasMore = profiles.length < totalCount;

  useEffect(() => {
    if (autoLoad) {
      loadProfiles();
    }
  }, [autoLoad, loadProfiles]);

  return {
    profiles,
    loading,
    error,
    totalCount,
    hasMore,
    loadMore,
    reload: () => loadProfiles(false),
    updateQueryOptions
  };
}