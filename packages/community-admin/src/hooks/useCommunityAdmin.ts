import { useState, useEffect, useCallback, useRef } from 'react';
import { CommunityRegistryService } from '../services/CommunityRegistryService';
import { ContentModerationService } from '../services/ContentModerationService';
import { UserModerationService } from '../services/UserModerationService';
import { CommunityAnalyticsService } from '../services/CommunityAnalyticsService';
import { NotificationService } from '../services/NotificationService';
import type { 
  UseCommunityAdminOptions,
  CommunityAdminConfig,
  ServiceResponse,
  CommunityAnalytics,
  DateRange
} from '../types';

export const useCommunityAdmin = (options: UseCommunityAdminOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableRealtime = false
  } = options;

  // Service instances
  const registryService = useRef(new CommunityRegistryService());
  const contentModerationService = useRef(new ContentModerationService());
  const userModerationService = useRef(new UserModerationService());
  const analyticsService = useRef(new CommunityAnalyticsService());
  const notificationService = useRef(new NotificationService());

  // State
  const [config, setConfig] = useState<CommunityAdminConfig | null>(null);
  const [analytics, setAnalytics] = useState<CommunityAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Refresh interval ref
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize services and load initial data
  const initialize = useCallback(async (initialConfig?: CommunityAdminConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize registry service if config provided
      if (initialConfig) {
        const initResult = await registryService.current.initialize(initialConfig);
        if (!initResult.success) {
          throw new Error(initResult.error || 'Failed to initialize registry');
        }
      }

      // Load configuration
      const configResult = await registryService.current.getConfig();
      if (configResult) {
        setConfig(configResult);
      }

      // Load initial analytics
      await refreshAnalytics();

      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh analytics data
  const refreshAnalytics = useCallback(async (timeRange?: DateRange) => {
    try {
      const defaultTimeRange: DateRange = timeRange || {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        end: new Date()
      };

      const analyticsResult = await analyticsService.current.getCommunityAnalytics(defaultTimeRange);
      if (analyticsResult.success && analyticsResult.data) {
        setAnalytics(analyticsResult.data);
      } else {
        throw new Error(analyticsResult.error || 'Failed to load analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh analytics');
    }
  }, []);

  // Get real-time metrics
  const getRealTimeMetrics = useCallback(async () => {
    try {
      const metricsResult = await analyticsService.current.getRealTimeMetrics();
      if (metricsResult.success) {
        return metricsResult.data;
      } else {
        throw new Error(metricsResult.error || 'Failed to get real-time metrics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get real-time metrics');
      return null;
    }
  }, []);

  // Update configuration
  const updateConfig = useCallback(async (updates: Partial<CommunityAdminConfig>) => {
    try {
      const result = await registryService.current.updateConfig(updates);
      if (result.success) {
        const updatedConfig = await registryService.current.getConfig();
        if (updatedConfig) {
          setConfig(updatedConfig);
        }
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to update configuration');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update configuration';
      setError(error);
      return { success: false, error };
    }
  }, []);

  // Get moderation queue
  const getModerationQueue = useCallback(async (filters = {}) => {
    try {
      const result = await contentModerationService.current.getModerationQueue(filters);
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to get moderation queue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get moderation queue');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, []);

  // Get user notifications
  const getUserNotifications = useCallback(async (userId: string, filters = {}) => {
    try {
      const result = await notificationService.current.getUserNotifications(userId, filters);
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to get notifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get notifications');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, []);

  // Send notification
  const sendNotification = useCallback(async (
    templateId: string,
    userId: string,
    variables: Record<string, any>,
    channels = ['in_app'],
    priority = 'normal'
  ) => {
    try {
      const result = await notificationService.current.sendNotificationFromTemplate(
        templateId,
        userId,
        variables,
        channels,
        priority
      );
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to send notification');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, []);

  // Export analytics data
  const exportAnalytics = useCallback(async (
    timeRange: DateRange,
    format: 'json' | 'csv' = 'json'
  ) => {
    try {
      const result = await analyticsService.current.exportAnalytics(timeRange, format);
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to export analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export analytics');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Manual refresh
  const refresh = useCallback(async () => {
    await refreshAnalytics();
    setLastRefresh(new Date());
  }, [refreshAnalytics]);

  // Setup auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refresh();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, refresh]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    config,
    analytics,
    isLoading,
    error,
    lastRefresh,

    // Services
    services: {
      registry: registryService.current,
      contentModeration: contentModerationService.current,
      userModeration: userModerationService.current,
      analytics: analyticsService.current,
      notification: notificationService.current
    },

    // Methods
    initialize,
    updateConfig,
    refreshAnalytics,
    getRealTimeMetrics,
    getModerationQueue,
    getUserNotifications,
    sendNotification,
    exportAnalytics,
    refresh,
    clearError
  };
};

export default useCommunityAdmin;