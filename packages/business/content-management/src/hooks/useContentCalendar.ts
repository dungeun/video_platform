import { useState, useCallback, useEffect } from 'react';
import { useNotification } from '@revu/ui-kit';
import { CalendarService } from '../services';
import type { ContentCalendar, CalendarEntry, Content } from '../types';

const calendarService = new CalendarService();

export function useContentCalendar(params: {
  month: number;
  year: number;
  campaignId?: string;
  influencerId?: string;
}) {
  const [calendar, setCalendar] = useState<ContentCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { showNotification } = useNotification();

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await calendarService.getCalendar(params);
      setCalendar(data);
    } catch (err) {
      setError(err as Error);
      showNotification({
        type: 'error',
        message: 'Failed to load calendar'
      });
    } finally {
      setLoading(false);
    }
  }, [params, showNotification]);

  const scheduleContent = useCallback(async (
    contentId: string,
    date: Date
  ) => {
    try {
      const updated = await calendarService.scheduleContent(contentId, date);
      await fetchCalendar(); // Refresh calendar
      showNotification({
        type: 'success',
        message: 'Content scheduled successfully'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to schedule content'
      });
      throw err;
    }
  }, [fetchCalendar, showNotification]);

  const rescheduleContent = useCallback(async (
    contentId: string,
    newDate: Date
  ) => {
    try {
      const updated = await calendarService.rescheduleContent(contentId, newDate);
      await fetchCalendar(); // Refresh calendar
      showNotification({
        type: 'success',
        message: 'Content rescheduled successfully'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to reschedule content'
      });
      throw err;
    }
  }, [fetchCalendar, showNotification]);

  const unscheduleContent = useCallback(async (contentId: string) => {
    try {
      await calendarService.unscheduleContent(contentId);
      await fetchCalendar(); // Refresh calendar
      showNotification({
        type: 'success',
        message: 'Content unscheduled'
      });
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to unschedule content'
      });
      throw err;
    }
  }, [fetchCalendar, showNotification]);

  const exportCalendar = useCallback(async (
    format: 'ics' | 'pdf' | 'excel'
  ) => {
    try {
      const blob = await calendarService.exportCalendar({
        ...params,
        format
      });
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calendar-${params.year}-${params.month}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showNotification({
        type: 'success',
        message: 'Calendar exported successfully'
      });
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to export calendar'
      });
      throw err;
    }
  }, [params, showNotification]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  return {
    calendar,
    loading,
    error,
    scheduleContent,
    rescheduleContent,
    unscheduleContent,
    exportCalendar,
    refetch: fetchCalendar
  };
}

export function useCalendarRange(params: {
  startDate: Date;
  endDate: Date;
  campaignId?: string;
  influencerId?: string;
}) {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRange = async () => {
      setLoading(true);
      try {
        const data = await calendarService.getCalendarRange(params);
        setEntries(data);
      } catch (err) {
        console.error('Failed to fetch calendar range:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRange();
  }, [params]);

  return { entries, loading };
}

export function useAvailableSlots(params: {
  campaignId: string;
  influencerId: string;
  startDate: Date;
  endDate: Date;
  platform?: string;
}) {
  const [slots, setSlots] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      try {
        const data = await calendarService.getAvailableSlots(params);
        setSlots(data);
      } catch (err) {
        console.error('Failed to fetch available slots:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.campaignId && params.influencerId) {
      fetchSlots();
    }
  }, [params]);

  return { slots, loading };
}

export function useOptimalPostingTimes(params: {
  influencerId: string;
  platform: string;
  timezone?: string;
}) {
  const [times, setTimes] = useState<{
    weekdays: Record<string, string[]>;
    weekends: Record<string, string[]>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimes = async () => {
      setLoading(true);
      try {
        const data = await calendarService.getOptimalPostingTimes(params);
        setTimes(data);
      } catch (err) {
        console.error('Failed to fetch optimal posting times:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.influencerId && params.platform) {
      fetchTimes();
    }
  }, [params]);

  return { times, loading };
}

export function useCalendarInsights(params: {
  month: number;
  year: number;
  campaignId?: string;
  influencerId?: string;
}) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const data = await calendarService.getCalendarInsights(params);
        setInsights(data);
      } catch (err) {
        console.error('Failed to fetch calendar insights:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [params]);

  return { insights, loading };
}