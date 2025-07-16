import { BaseService } from '@revu/core';
import type {
  ContentCalendar,
  CalendarEntry,
  Content
} from '../types';

export class CalendarService extends BaseService {
  async getCalendar(params: {
    month: number;
    year: number;
    campaignId?: string;
    influencerId?: string;
  }): Promise<ContentCalendar> {
    return this.get<ContentCalendar>('/content-calendar', { params });
  }

  async getCalendarRange(params: {
    startDate: Date;
    endDate: Date;
    campaignId?: string;
    influencerId?: string;
  }): Promise<CalendarEntry[]> {
    return this.get<CalendarEntry[]>('/content-calendar/range', { params });
  }

  async scheduleContent(
    contentId: string,
    date: Date
  ): Promise<Content> {
    return this.post<Content>('/content-calendar/schedule', {
      contentId,
      date
    });
  }

  async rescheduleContent(
    contentId: string,
    newDate: Date
  ): Promise<Content> {
    return this.put<Content>('/content-calendar/reschedule', {
      contentId,
      newDate
    });
  }

  async unscheduleContent(contentId: string): Promise<void> {
    return this.delete(`/content-calendar/schedule/${contentId}`);
  }

  async bulkSchedule(
    schedules: Array<{ contentId: string; date: Date }>
  ): Promise<Content[]> {
    return this.post<Content[]>('/content-calendar/bulk-schedule', {
      schedules
    });
  }

  async getAvailableSlots(params: {
    campaignId: string;
    influencerId: string;
    startDate: Date;
    endDate: Date;
    platform?: string;
  }): Promise<Date[]> {
    return this.get<Date[]>('/content-calendar/available-slots', { params });
  }

  async getOptimalPostingTimes(params: {
    influencerId: string;
    platform: string;
    timezone?: string;
  }): Promise<{
    weekdays: Record<string, string[]>;
    weekends: Record<string, string[]>;
  }> {
    return this.get('/content-calendar/optimal-times', { params });
  }

  async getCalendarInsights(params: {
    month: number;
    year: number;
    campaignId?: string;
    influencerId?: string;
  }): Promise<{
    totalContent: number;
    byPlatform: Record<string, number>;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    busyDays: Date[];
    emptyDays: Date[];
  }> {
    return this.get('/content-calendar/insights', { params });
  }

  async exportCalendar(params: {
    month: number;
    year: number;
    format: 'ics' | 'pdf' | 'excel';
    campaignId?: string;
    influencerId?: string;
  }): Promise<Blob> {
    const response = await this.get('/content-calendar/export', {
      params,
      responseType: 'blob'
    });
    return response as Blob;
  }

  async syncWithExternalCalendar(params: {
    provider: 'google' | 'outlook' | 'apple';
    accessToken: string;
    calendarId: string;
  }): Promise<{
    synced: number;
    failed: number;
    errors?: string[];
  }> {
    return this.post('/content-calendar/sync-external', params);
  }
}