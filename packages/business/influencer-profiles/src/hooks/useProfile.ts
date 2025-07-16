import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '@revu/ui-kit';
import { ProfileService } from '../services';
import type { InfluencerProfile } from '../types';

const profileService = new ProfileService();

export function useProfile(profileId?: string) {
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showNotification } = useNotification();

  const fetchProfile = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileService.getProfile(id);
      setProfile(data);
    } catch (err) {
      setError(err as Error);
      showNotification({
        type: 'error',
        message: 'Failed to load profile'
      });
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const updateProfile = useCallback(async (
    id: string,
    updates: Partial<InfluencerProfile>
  ) => {
    setLoading(true);
    try {
      const updated = await profileService.updateProfile(id, updates);
      setProfile(updated);
      showNotification({
        type: 'success',
        message: 'Profile updated successfully'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to update profile'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const deleteProfile = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await profileService.deleteProfile(id);
      setProfile(null);
      showNotification({
        type: 'success',
        message: 'Profile deleted successfully'
      });
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to delete profile'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const syncMetrics = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const metrics = await profileService.syncSocialMetrics(id);
      if (profile) {
        setProfile({ ...profile, metrics });
      }
      showNotification({
        type: 'success',
        message: 'Metrics synced successfully'
      });
      return metrics;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to sync metrics'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profile, showNotification]);

  useEffect(() => {
    if (profileId) {
      fetchProfile(profileId);
    }
  }, [profileId, fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    deleteProfile,
    syncMetrics,
    refetch: () => profileId && fetchProfile(profileId)
  };
}

export function useMyProfile() {
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { showNotification } = useNotification();

  const fetchMyProfile = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileService.getProfileByUserId(userId);
      setProfile(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMyProfile = useCallback(async (
    data: Partial<InfluencerProfile>
  ) => {
    setLoading(true);
    try {
      const created = await profileService.createProfile(data);
      setProfile(created);
      showNotification({
        type: 'success',
        message: 'Profile created successfully'
      });
      return created;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to create profile'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  return {
    profile,
    loading,
    error,
    fetchMyProfile,
    createMyProfile,
    hasProfile: !!profile
  };
}