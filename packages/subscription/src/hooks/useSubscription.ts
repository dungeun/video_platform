import { useState, useEffect, useCallback } from 'react';
import {
  UseSubscriptionOptions,
  UseSubscriptionResult,
  UseSubscriptionListOptions,
  UseSubscriptionListResult,
  Subscription,
  SubscriptionOrder,
  SubscriptionMetrics,
  UpdateSubscriptionRequest,
  PauseSubscriptionRequest,
  CancelSubscriptionRequest,
  SkipDeliveryRequest
} from '../types';
import { SubscriptionService } from '../services/SubscriptionService';

const defaultConfig = {
  defaultTrialDays: 7,
  maxPauseMonths: 3,
  retryAttempts: 3,
  retryIntervalDays: [1, 3, 7],
  gracePeriodDays: 5,
  cancellationPolicy: {
    allowImmediateCancel: true,
    refundPolicy: 'prorated' as const,
    minimumCommitmentEnforced: false
  },
  delivery: {
    defaultLeadTimeDays: 2,
    maxAdvanceDeliveryDays: 30,
    allowWeekendDelivery: false,
    allowHolidayDelivery: false
  },
  notifications: {
    upcomingDeliveryDays: 3,
    paymentRetryDays: [1, 3, 7],
    cancellationReminderDays: 7
  }
};

let serviceInstance: SubscriptionService | null = null;

const getSubscriptionService = (): SubscriptionService => {
  if (!serviceInstance) {
    serviceInstance = new SubscriptionService(defaultConfig);
  }
  return serviceInstance;
};

export const useSubscription = (options: UseSubscriptionOptions): UseSubscriptionResult => {
  const {
    subscriptionId,
    includeOrders = false,
    includeMetrics = false
  } = options;

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const service = getSubscriptionService();

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const sub = await service.getSubscription(subscriptionId);
      setSubscription(sub);

      if (includeOrders && sub) {
        const ordersResponse = await service.getSubscriptionOrders(subscriptionId);
        setOrders(ordersResponse.orders);
      }

      if (includeMetrics && sub) {
        // Mock metrics - in real implementation, this would be calculated
        const mockMetrics: SubscriptionMetrics = {
          subscriptionId: sub.id,
          totalOrders: 12,
          successfulDeliveries: 11,
          failedDeliveries: 1,
          totalRevenue: sub.totalAmount * 12,
          averageOrderValue: sub.totalAmount,
          onTimeDeliveryRate: 0.92,
          customerSatisfactionScore: 4.5,
          lastActivityDate: new Date()
        };
        setMetrics(mockMetrics);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch subscription'));
    } finally {
      setIsLoading(false);
    }
  }, [subscriptionId, includeOrders, includeMetrics, service]);

  const updateSubscription = useCallback(async (updates: UpdateSubscriptionRequest) => {
    try {
      const updatedSub = await service.updateSubscription(updates);
      setSubscription(updatedSub);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update subscription'));
      throw err;
    }
  }, [service]);

  const pauseSubscription = useCallback(async (request: PauseSubscriptionRequest) => {
    try {
      const pausedSub = await service.pauseSubscription(request);
      setSubscription(pausedSub);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to pause subscription'));
      throw err;
    }
  }, [service]);

  const resumeSubscription = useCallback(async () => {
    try {
      const resumedSub = await service.resumeSubscription(subscriptionId);
      setSubscription(resumedSub);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to resume subscription'));
      throw err;
    }
  }, [service, subscriptionId]);

  const cancelSubscription = useCallback(async (request: CancelSubscriptionRequest) => {
    try {
      const cancelledSub = await service.cancelSubscription(request);
      setSubscription(cancelledSub);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to cancel subscription'));
      throw err;
    }
  }, [service]);

  const skipNextDelivery = useCallback(async (request: SkipDeliveryRequest) => {
    try {
      await service.skipNextDelivery(request);
      await fetchSubscription(); // Refresh subscription data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to skip delivery'));
      throw err;
    }
  }, [service, fetchSubscription]);

  const refetch = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    if (subscriptionId) {
      fetchSubscription();
    }
  }, [fetchSubscription, subscriptionId]);

  return {
    subscription,
    orders,
    metrics,
    isLoading,
    error,
    refetch,
    updateSubscription,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    skipNextDelivery
  };
};

export const useSubscriptionList = (options: UseSubscriptionListOptions): UseSubscriptionListResult => {
  const { userId, status, page = 1, limit = 10 } = options;

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false
  });

  const service = getSubscriptionService();

  const fetchSubscriptions = useCallback(async (resetList = true) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await service.getUserSubscriptions(userId, {
        status,
        page: resetList ? 1 : page,
        limit
      });

      if (resetList) {
        setSubscriptions(response.subscriptions);
      } else {
        setSubscriptions(prev => [...prev, ...response.subscriptions]);
      }

      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.page < response.pagination.totalPages
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch subscriptions'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, status, page, limit, service]);

  const refetch = useCallback(async () => {
    await fetchSubscriptions(true);
  }, [fetchSubscriptions]);

  const loadMore = useCallback(async () => {
    if (pagination.hasMore && !isLoading) {
      await fetchSubscriptions(false);
    }
  }, [fetchSubscriptions, pagination.hasMore, isLoading]);

  useEffect(() => {
    if (userId) {
      fetchSubscriptions(true);
    }
  }, [userId, status]);

  return {
    subscriptions,
    isLoading,
    error,
    pagination,
    refetch,
    loadMore
  };
};

// Hook for subscription analytics
export const useSubscriptionAnalytics = (timeRange?: { start: Date; end: Date }) => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const service = getSubscriptionService();

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await service.getAnalytics(timeRange);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, service]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics
  };
};