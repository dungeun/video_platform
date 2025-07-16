import { useState, useEffect, useCallback } from 'react';
import { NotificationPreferences, NotificationType } from '../types';

interface UseNotificationPreferencesOptions {
  userId: string;
  apiUrl?: string;
  defaultPreferences?: NotificationPreferences;
}

export const useNotificationPreferences = ({
  userId,
  apiUrl = '/api',
  defaultPreferences
}: UseNotificationPreferencesOptions) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/notifications/preferences/${userId}`);
      
      if (response.status === 404 && defaultPreferences) {
        // User has no preferences yet, use defaults
        setPreferences(defaultPreferences);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      // Use default preferences on error
      if (defaultPreferences) {
        setPreferences(defaultPreferences);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, apiUrl, defaultPreferences]);

  // Save preferences
  const savePreferences = useCallback(async (
    newPreferences: NotificationPreferences
  ): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/notifications/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences)
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setPreferences(newPreferences);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [userId, apiUrl]);

  // Toggle channel
  const toggleChannel = useCallback((
    channel: keyof NotificationPreferences['channels']
  ) => {
    if (!preferences) return;

    const updated = {
      ...preferences,
      channels: {
        ...preferences.channels,
        [channel]: {
          ...preferences.channels[channel],
          enabled: !preferences.channels[channel].enabled
        }
      }
    };

    setPreferences(updated);
  }, [preferences]);

  // Toggle category
  const toggleCategory = useCallback((
    channel: keyof NotificationPreferences['channels'],
    category: string
  ) => {
    if (!preferences) return;

    const currentValue = preferences.channels[channel].categories[category] !== false;
    const updated = {
      ...preferences,
      channels: {
        ...preferences.channels,
        [channel]: {
          ...preferences.channels[channel],
          categories: {
            ...preferences.channels[channel].categories,
            [category]: !currentValue
          }
        }
      }
    };

    setPreferences(updated);
  }, [preferences]);

  // Toggle quiet hours
  const toggleQuietHours = useCallback(() => {
    if (!preferences) return;

    const updated = {
      ...preferences,
      quiet: {
        ...preferences.quiet,
        enabled: !preferences.quiet.enabled
      }
    };

    setPreferences(updated);
  }, [preferences]);

  // Update quiet hours
  const updateQuietHours = useCallback((
    start: string,
    end: string
  ) => {
    if (!preferences) return;

    const updated = {
      ...preferences,
      quiet: {
        ...preferences.quiet,
        start,
        end
      }
    };

    setPreferences(updated);
  }, [preferences]);

  // Check if user can receive notification
  const canReceiveNotification = useCallback((
    type: NotificationType,
    category?: string
  ): boolean => {
    if (!preferences) return true;

    const channelKey = type.toLowerCase() as keyof NotificationPreferences['channels'];
    const channel = preferences.channels[channelKey];

    // Check if channel is enabled
    if (!channel?.enabled) return false;

    // Check category preference
    if (category && channel.categories) {
      if (channel.categories[category] === false) return false;
    }

    // Check quiet hours
    if (preferences.quiet.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const [startHour, startMin] = preferences.quiet.start.split(':').map(Number);
      const [endHour, endMin] = preferences.quiet.end.split(':').map(Number);
      
      const quietStart = startHour * 60 + startMin;
      const quietEnd = endHour * 60 + endMin;

      if (quietStart <= quietEnd) {
        // Quiet hours don't span midnight
        if (currentTime >= quietStart && currentTime <= quietEnd) {
          return false;
        }
      } else {
        // Quiet hours span midnight
        if (currentTime >= quietStart || currentTime <= quietEnd) {
          return false;
        }
      }
    }

    return true;
  }, [preferences]);

  // Load preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    saving,
    
    // Actions
    savePreferences,
    toggleChannel,
    toggleCategory,
    toggleQuietHours,
    updateQuietHours,
    canReceiveNotification,
    refetch: fetchPreferences
  };
};