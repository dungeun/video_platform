import { useState, useEffect, useCallback, useRef } from 'react';
import { CommunityAnalyticsService } from '../services/CommunityAnalyticsService';
import type { 
  UseCommunityAnalyticsOptions,
  CommunityAnalytics,
  DateRange,
  ServiceResponse
} from '../types';

export const useCommunityAnalytics = (options: UseCommunityAnalyticsOptions) => {
  const {
    timeRange,
    metrics,
    realtime = false
  } = options;

  // Service instance
  const analyticsService = useRef(new CommunityAnalyticsService());

  // State
  const [analytics, setAnalytics] = useState<CommunityAnalytics | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Realtime interval ref
  const realtimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load community analytics
  const loadAnalytics = useCallback(async (customTimeRange?: DateRange) => {
    setIsLoading(true);
    setError(null);

    try {
      const targetTimeRange = customTimeRange || timeRange;
      const result = await analyticsService.current.getCommunityAnalytics(targetTimeRange);
      
      if (result.success && result.data) {
        setAnalytics(result.data);
        setLastUpdate(new Date());
      } else {
        throw new Error(result.error || 'Failed to load analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  // Load community overview
  const getCommunityOverview = useCallback(async (customTimeRange?: DateRange) => {
    try {
      const targetTimeRange = customTimeRange || timeRange;
      const result = await analyticsService.current.getCommunityOverview(targetTimeRange);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get community overview');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [timeRange]);

  // Load content analytics
  const getContentAnalytics = useCallback(async (customTimeRange?: DateRange) => {
    try {
      const targetTimeRange = customTimeRange || timeRange;
      const result = await analyticsService.current.getContentAnalytics(targetTimeRange);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get content analytics');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [timeRange]);

  // Load user analytics
  const getUserAnalytics = useCallback(async (customTimeRange?: DateRange) => {
    try {
      const targetTimeRange = customTimeRange || timeRange;
      const result = await analyticsService.current.getUserAnalytics(targetTimeRange);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get user analytics');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [timeRange]);

  // Load engagement analytics
  const getEngagementAnalytics = useCallback(async (customTimeRange?: DateRange) => {
    try {
      const targetTimeRange = customTimeRange || timeRange;
      const result = await analyticsService.current.getEngagementAnalytics(targetTimeRange);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get engagement analytics');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [timeRange]);

  // Load moderation analytics
  const getModerationAnalytics = useCallback(async (customTimeRange?: DateRange) => {
    try {
      const targetTimeRange = customTimeRange || timeRange;
      const result = await analyticsService.current.getModerationAnalytics(targetTimeRange);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get moderation analytics');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [timeRange]);

  // Load real-time metrics
  const loadRealtimeMetrics = useCallback(async () => {
    try {
      const result = await analyticsService.current.getRealTimeMetrics();
      if (result.success && result.data) {
        setRealtimeMetrics(result.data);
      } else {
        throw new Error(result.error || 'Failed to load real-time metrics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load real-time metrics');
    }
  }, []);

  // Export analytics data
  const exportAnalytics = useCallback(async (
    exportTimeRange?: DateRange,
    format: 'json' | 'csv' = 'json'
  ) => {
    try {
      const targetTimeRange = exportTimeRange || timeRange;
      const result = await analyticsService.current.exportAnalytics(targetTimeRange, format);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export analytics');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [timeRange]);

  // Get analytics for specific metrics
  const getSpecificMetrics = useCallback(async (metricNames: string[], customTimeRange?: DateRange) => {
    try {
      const targetTimeRange = customTimeRange || timeRange;
      
      // Load all analytics first
      const result = await analyticsService.current.getCommunityAnalytics(targetTimeRange);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to load analytics');
      }

      // Filter to requested metrics
      const filteredMetrics: any = {};
      const data = result.data;

      metricNames.forEach(metric => {
        switch (metric) {
          case 'overview':
            filteredMetrics.overview = data.overview;
            break;
          case 'content':
            filteredMetrics.content = data.content;
            break;
          case 'users':
            filteredMetrics.users = data.users;
            break;
          case 'engagement':
            filteredMetrics.engagement = data.engagement;
            break;
          case 'moderation':
            filteredMetrics.moderation = data.moderation;
            break;
        }
      });

      return { success: true, data: filteredMetrics };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get specific metrics');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [timeRange]);

  // Compare time periods
  const compareTimePeriods = useCallback(async (
    currentPeriod: DateRange,
    previousPeriod: DateRange
  ) => {
    try {
      const [currentResult, previousResult] = await Promise.all([
        analyticsService.current.getCommunityAnalytics(currentPeriod),
        analyticsService.current.getCommunityAnalytics(previousPeriod)
      ]);

      if (!currentResult.success || !previousResult.success) {
        throw new Error('Failed to load comparison data');
      }

      const current = currentResult.data!;
      const previous = previousResult.data!;

      // Calculate changes
      const comparison = {
        totalUsers: {
          current: current.overview.totalUsers,
          previous: previous.overview.totalUsers,
          change: current.overview.totalUsers - previous.overview.totalUsers,
          changePercent: previous.overview.totalUsers > 0 
            ? ((current.overview.totalUsers - previous.overview.totalUsers) / previous.overview.totalUsers) * 100 
            : 0
        },
        activeUsers: {
          current: current.overview.activeUsers,
          previous: previous.overview.activeUsers,
          change: current.overview.activeUsers - previous.overview.activeUsers,
          changePercent: previous.overview.activeUsers > 0 
            ? ((current.overview.activeUsers - previous.overview.activeUsers) / previous.overview.activeUsers) * 100 
            : 0
        },
        totalPosts: {
          current: current.overview.totalPosts,
          previous: previous.overview.totalPosts,
          change: current.overview.totalPosts - previous.overview.totalPosts,
          changePercent: previous.overview.totalPosts > 0 
            ? ((current.overview.totalPosts - previous.overview.totalPosts) / previous.overview.totalPosts) * 100 
            : 0
        },
        engagementRate: {
          current: current.overview.engagement.rate,
          previous: previous.overview.engagement.rate,
          change: current.overview.engagement.rate - previous.overview.engagement.rate,
          changePercent: previous.overview.engagement.rate > 0 
            ? ((current.overview.engagement.rate - previous.overview.engagement.rate) / previous.overview.engagement.rate) * 100 
            : 0
        }
      };

      return { success: true, data: comparison };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare time periods');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, []);

  // Generate automatic insights
  const generateInsights = useCallback((analyticsData: CommunityAnalytics) => {
    const insights = [];

    // User growth insights
    if (analyticsData.overview.newUsers > 0) {
      insights.push({
        type: 'growth',
        title: 'User Growth',
        message: `${analyticsData.overview.newUsers} new users joined`,
        severity: 'positive'
      });
    }

    // Engagement insights
    if (analyticsData.overview.engagement.rate > 70) {
      insights.push({
        type: 'engagement',
        title: 'High Engagement',
        message: `Engagement rate is ${analyticsData.overview.engagement.rate.toFixed(1)}%`,
        severity: 'positive'
      });
    } else if (analyticsData.overview.engagement.rate < 40) {
      insights.push({
        type: 'engagement',
        title: 'Low Engagement',
        message: `Engagement rate is only ${analyticsData.overview.engagement.rate.toFixed(1)}%`,
        severity: 'warning'
      });
    }

    // Moderation insights
    if (analyticsData.moderation.reports.pending > 10) {
      insights.push({
        type: 'moderation',
        title: 'High Report Volume',
        message: `${analyticsData.moderation.reports.pending} reports pending review`,
        severity: 'warning'
      });
    }

    // Content insights
    const postsToday = analyticsData.overview.totalPosts;
    if (postsToday > 100) {
      insights.push({
        type: 'content',
        title: 'Active Community',
        message: `${postsToday} posts created today`,
        severity: 'positive'
      });
    }

    return insights;
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh analytics
  const refresh = useCallback(async () => {
    await loadAnalytics();
    if (realtime) {
      await loadRealtimeMetrics();
    }
  }, [loadAnalytics, loadRealtimeMetrics, realtime]);

  // Setup realtime updates
  useEffect(() => {
    if (realtime) {
      loadRealtimeMetrics();
      
      realtimeIntervalRef.current = setInterval(() => {
        loadRealtimeMetrics();
      }, 30000); // Update every 30 seconds

      return () => {
        if (realtimeIntervalRef.current) {
          clearInterval(realtimeIntervalRef.current);
        }
      };
    }
  }, [realtime, loadRealtimeMetrics]);

  // Load initial data
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Update analytics when timeRange or metrics change
  useEffect(() => {
    if (timeRange) {
      loadAnalytics();
    }
  }, [timeRange, metrics, loadAnalytics]);

  // Generate insights when analytics data changes
  const insights = analytics ? generateInsights(analytics) : [];

  return {
    // State
    analytics,
    realtimeMetrics,
    isLoading,
    error,
    lastUpdate,
    insights,

    // Methods
    loadAnalytics,
    getCommunityOverview,
    getContentAnalytics,
    getUserAnalytics,
    getEngagementAnalytics,
    getModerationAnalytics,
    loadRealtimeMetrics,
    getSpecificMetrics,
    compareTimePeriods,
    exportAnalytics,
    refresh,
    clearError
  };
};

export default useCommunityAnalytics;