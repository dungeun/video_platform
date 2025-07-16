import { useState, useCallback, useEffect } from 'react';
import {
  NotificationRequest,
  NotificationDelivery,
  NotificationTemplate,
  NotificationType,
  DeliveryStatus,
  NotificationPreferences
} from '../types';

interface UseNotificationOptions {
  apiUrl?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export const useNotification = (options: UseNotificationOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);

  const sendNotification = useCallback(async (
    request: NotificationRequest
  ): Promise<{
    success: boolean;
    notificationId?: string;
    error?: string;
  }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${options.apiUrl || '/api'}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send notification');
      }

      options.onSuccess?.(result);
      return { success: true, notificationId: result.notificationId };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [options]);

  const sendBulkNotifications = useCallback(async (
    requests: NotificationRequest[]
  ): Promise<Map<string, { success: boolean; error?: string }>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${options.apiUrl || '/api'}/notifications/send-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: requests })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send bulk notifications');
      }

      return new Map(Object.entries(result.results));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      return new Map();
    } finally {
      setLoading(false);
    }
  }, [options]);

  const fetchDeliveries = useCallback(async (
    filter?: {
      startDate?: Date;
      endDate?: Date;
      type?: NotificationType;
      status?: DeliveryStatus;
      recipient?: string;
    }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filter?.startDate) params.append('startDate', filter.startDate.toISOString());
      if (filter?.endDate) params.append('endDate', filter.endDate.toISOString());
      if (filter?.type) params.append('type', filter.type);
      if (filter?.status) params.append('status', filter.status);
      if (filter?.recipient) params.append('recipient', filter.recipient);

      const response = await fetch(
        `${options.apiUrl || '/api'}/notifications/deliveries?${params}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch deliveries');
      }

      setDeliveries(result.deliveries);
      return result.deliveries;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [options]);

  const fetchTemplates = useCallback(async (
    type?: NotificationType,
    language?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (language) params.append('language', language);

      const response = await fetch(
        `${options.apiUrl || '/api'}/notifications/templates?${params}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch templates');
      }

      setTemplates(result.templates);
      return result.templates;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [options]);

  const saveTemplate = useCallback(async (
    template: Partial<NotificationTemplate>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${options.apiUrl || '/api'}/notifications/templates`, {
        method: template.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save template');
      }

      // Refresh templates
      await fetchTemplates();
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [options, fetchTemplates]);

  const updateUserPreferences = useCallback(async (
    userId: string,
    preferences: NotificationPreferences
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${options.apiUrl || '/api'}/notifications/preferences/${userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preferences)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update preferences');
      }

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [options]);

  const resendNotification = useCallback(async (
    delivery: NotificationDelivery
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${options.apiUrl || '/api'}/notifications/resend/${delivery.id}`,
        { method: 'POST' }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend notification');
      }

      // Refresh deliveries
      await fetchDeliveries();
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [options, fetchDeliveries]);

  const getDeliveryStats = useCallback(async (
    startDate: Date,
    endDate: Date,
    type?: NotificationType
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      if (type) params.append('type', type);

      const response = await fetch(
        `${options.apiUrl || '/api'}/notifications/stats?${params}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch stats');
      }

      return result.stats;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);

  return {
    // State
    loading,
    error,
    deliveries,
    templates,

    // Actions
    sendNotification,
    sendBulkNotifications,
    fetchDeliveries,
    fetchTemplates,
    saveTemplate,
    updateUserPreferences,
    resendNotification,
    getDeliveryStats
  };
};