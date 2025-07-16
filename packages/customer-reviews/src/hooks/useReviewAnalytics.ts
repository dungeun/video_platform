import { useState, useEffect, useCallback } from 'react';
import { ReviewAnalytics } from '../types';
import { AnalyticsService } from '../services';

export interface UseReviewAnalyticsOptions {
  productId?: string;
  dateRange?: { start: Date; end: Date };
  autoLoad?: boolean;
}

export interface UseReviewAnalyticsReturn {
  analytics: ReviewAnalytics | null;
  loading: boolean;
  error: string | null;
  loadAnalytics: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useReviewAnalytics(
  analyticsService: AnalyticsService,
  options: UseReviewAnalyticsOptions = {}
): UseReviewAnalyticsReturn {
  const { productId, dateRange, autoLoad = true } = options;

  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let result: ReviewAnalytics;
      
      if (productId) {
        result = await analyticsService.getProductAnalytics(productId, dateRange);
      } else {
        result = await analyticsService.getOverallAnalytics(dateRange);
      }

      setAnalytics(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [analyticsService, productId, dateRange]);

  const refresh = useCallback(async () => {
    await loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    if (autoLoad) {
      loadAnalytics();
    }
  }, [autoLoad, loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    loadAnalytics,
    refresh,
  };
}