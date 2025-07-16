import { useState, useEffect, useCallback } from 'react';
import type { UserProfile, CreateUserProfileInput, UpdateUserProfileInput } from '../types';
import { UserProfileService } from '../services';

export interface UseUserProfileOptions {
  service: UserProfileService;
  userId: string;
  autoLoad?: boolean;
}

export interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  create: (input: CreateUserProfileInput) => Promise<void>;
  update: (input: UpdateUserProfileInput) => Promise<void>;
  delete: () => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Hook for managing a single user profile
 */
export function useUserProfile({
  service,
  userId,
  autoLoad = true
}: UseUserProfileOptions): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const loadedProfile = await service.findById(userId);
      setProfile(loadedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [service, userId]);

  const create = useCallback(async (input: CreateUserProfileInput) => {
    setLoading(true);
    setError(null);

    try {
      const newProfile = await service.create(input);
      setProfile(newProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const update = useCallback(async (input: UpdateUserProfileInput) => {
    if (!userId) {
      throw new Error('User ID is required for update');
    }

    setLoading(true);
    setError(null);

    try {
      const updatedProfile = await service.update(userId, input);
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, userId]);

  const deleteProfile = useCallback(async () => {
    if (!userId) {
      throw new Error('User ID is required for delete');
    }

    setLoading(true);
    setError(null);

    try {
      await service.delete(userId);
      setProfile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, userId]);

  useEffect(() => {
    if (autoLoad) {
      loadProfile();
    }
  }, [autoLoad, loadProfile]);

  return {
    profile,
    loading,
    error,
    create,
    update,
    delete: deleteProfile,
    reload: loadProfile
  };
}