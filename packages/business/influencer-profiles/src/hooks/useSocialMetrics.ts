import { useState, useCallback, useEffect } from 'react';
import { useNotification } from '@revu/ui-kit';
import { ProfileService } from '../services';
import type { InfluencerMetrics, SocialAccount, SocialPlatform } from '../types';

const profileService = new ProfileService();

export function useSocialMetrics(profileId: string, autoSync: boolean = false) {
  const [metrics, setMetrics] = useState<InfluencerMetrics | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { showNotification } = useNotification();

  const syncMetrics = useCallback(async () => {
    if (!profileId || syncing) return;
    
    setSyncing(true);
    try {
      const updatedMetrics = await profileService.syncSocialMetrics(profileId);
      setMetrics(updatedMetrics);
      showNotification({
        type: 'success',
        message: 'Social metrics updated'
      });
      return updatedMetrics;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to sync metrics'
      });
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [profileId, syncing, showNotification]);

  const updateSocialAccounts = useCallback(async (
    newAccounts: SocialAccount[]
  ) => {
    setLoading(true);
    try {
      const profile = await profileService.updateSocialAccounts(profileId, newAccounts);
      setAccounts(profile.socialAccounts);
      setMetrics(profile.metrics);
      showNotification({
        type: 'success',
        message: 'Social accounts updated'
      });
      return profile;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to update social accounts'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profileId, showNotification]);

  const connectSocialAccount = useCallback(async (
    platform: SocialPlatform,
    authCode: string
  ) => {
    // This would typically handle OAuth flow
    // For now, we'll simulate adding a new account
    const newAccount: SocialAccount = {
      platform,
      handle: '',
      url: '',
      verified: false,
      followers: 0,
      engagement: 0,
      lastUpdated: new Date()
    };
    
    const updatedAccounts = [...accounts, newAccount];
    return updateSocialAccounts(updatedAccounts);
  }, [accounts, updateSocialAccounts]);

  const disconnectSocialAccount = useCallback(async (
    platform: SocialPlatform
  ) => {
    const filteredAccounts = accounts.filter(a => a.platform !== platform);
    return updateSocialAccounts(filteredAccounts);
  }, [accounts, updateSocialAccounts]);

  const getAccountByPlatform = useCallback((
    platform: SocialPlatform
  ): SocialAccount | undefined => {
    return accounts.find(a => a.platform === platform);
  }, [accounts]);

  // Auto-sync metrics periodically if enabled
  useEffect(() => {
    if (!autoSync || !profileId) return;
    
    const interval = setInterval(() => {
      syncMetrics();
    }, 5 * 60 * 1000); // Sync every 5 minutes
    
    return () => clearInterval(interval);
  }, [autoSync, profileId, syncMetrics]);

  return {
    metrics,
    accounts,
    loading,
    syncing,
    syncMetrics,
    updateSocialAccounts,
    connectSocialAccount,
    disconnectSocialAccount,
    getAccountByPlatform
  };
}

export function useMetricsComparison(profileIds: string[]) {
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const compareProfiles = useCallback(async () => {
    if (profileIds.length < 2) return;
    
    setLoading(true);
    try {
      const data = await profileService.getProfileComparison(profileIds);
      setComparison(data);
    } catch (err) {
      console.error('Failed to compare profiles:', err);
    } finally {
      setLoading(false);
    }
  }, [profileIds]);

  useEffect(() => {
    compareProfiles();
  }, [compareProfiles]);

  return { comparison, loading, refetch: compareProfiles };
}