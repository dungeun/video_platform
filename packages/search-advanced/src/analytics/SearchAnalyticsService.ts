import { ModuleBase, Logger, ErrorHandler } from '@repo/core';
import { StorageManager } from '@repo/storage';
import {
  SearchTrackingData,
  SearchMetrics,
  QueryMetric,
  FilterMetric,
  AnalyticsOptions,
  SearchEvent
} from '../types';

export class SearchAnalyticsService extends ModuleBase {
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private storage: StorageManager;
  private events: SearchEvent[] = [];
  private sessionData: Map<string, any> = new Map();

  constructor() {
    super('SearchAnalyticsService');
    this.logger = new Logger('SearchAnalyticsService');
    this.errorHandler = new ErrorHandler('SearchAnalyticsService');
    this.storage = new StorageManager({
      type: 'indexedDB',
      prefix: 'search-analytics'
    });

    this.initialize();
  }

  /**
   * Initialize the service
   */
  private async initialize(): Promise<void> {
    try {
      // Load recent events from storage
      const stored = await this.storage.get<SearchEvent[]>('events');
      if (stored) {
        this.events = stored;
      }

      // Clean up old events
      await this.cleanupOldEvents();

      this.logger.info('Search analytics service initialized');
    } catch (error) {
      this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Track a search
   */
  async trackSearch(data: SearchTrackingData): Promise<void> {
    try {
      const event: SearchEvent = {
        type: 'search.performed',
        payload: data,
        timestamp: new Date(),
        userId: data.userId,
        sessionId: data.sessionId
      };

      this.events.push(event);
      this.emit('analytics.tracked', event);

      // Update session data
      this.updateSessionData(data.sessionId, data);

      // Persist periodically
      if (this.events.length % 10 === 0) {
        await this.persistEvents();
      }

      this.logger.debug('Search tracked', { query: data.query });
    } catch (error) {
      this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Track result click
   */
  async trackResultClick(data: {
    searchId: string;
    resultId: string;
    position: number;
    sessionId: string;
    userId?: string;
  }): Promise<void> {
    try {
      const event: SearchEvent = {
        type: 'result.clicked',
        payload: data,
        timestamp: new Date(),
        userId: data.userId,
        sessionId: data.sessionId
      };

      this.events.push(event);
      this.emit('result.clicked', event);

      this.logger.debug('Result click tracked', { resultId: data.resultId });
    } catch (error) {
      this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(options: AnalyticsOptions): Promise<QueryMetric[]> {
    try {
      const events = await this.getEventsInTimeframe(options);
      const searchEvents = events.filter(e => e.type === 'search.performed');

      // Group by query
      const queryMap = new Map<string, {
        count: number;
        totalResults: number;
        clicks: number;
      }>();

      searchEvents.forEach(event => {
        const data = event.payload as SearchTrackingData;
        const query = data.query.toLowerCase();
        
        const existing = queryMap.get(query) || {
          count: 0,
          totalResults: 0,
          clicks: 0
        };

        existing.count++;
        existing.totalResults += data.resultsCount;
        existing.clicks += data.clickedResults?.length || 0;

        queryMap.set(query, existing);
      });

      // Convert to metrics
      const metrics: QueryMetric[] = [];
      queryMap.forEach((data, query) => {
        metrics.push({
          query,
          count: data.count,
          avgResultsCount: data.totalResults / data.count,
          clickRate: data.clicks / data.count
        });
      });

      // Sort by count and limit
      return metrics
        .sort((a, b) => b.count - a.count)
        .slice(0, options.limit || 10);
    } catch (error) {
      throw this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Get search metrics
   */
  async getSearchMetrics(timeframe: string): Promise<SearchMetrics> {
    try {
      const options: AnalyticsOptions = { timeframe: timeframe as any };
      const events = await this.getEventsInTimeframe(options);

      const searchEvents = events.filter(e => e.type === 'search.performed');
      const clickEvents = events.filter(e => e.type === 'result.clicked');

      // Calculate metrics
      const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean));
      const totalSearches = searchEvents.length;
      const totalClicks = clickEvents.length;

      // Calculate average search time
      const searchTimes = searchEvents
        .map(e => (e.payload as SearchTrackingData).searchTime)
        .filter(t => t > 0);
      const avgSearchTime = searchTimes.length > 0
        ? searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length
        : 0;

      // Calculate average results count
      const resultsCounts = searchEvents
        .map(e => (e.payload as SearchTrackingData).resultsCount);
      const avgResultsCount = resultsCounts.length > 0
        ? resultsCounts.reduce((a, b) => a + b, 0) / resultsCounts.length
        : 0;

      // Get top queries
      const topQueries = await this.getPopularSearches({ ...options, limit: 10 });

      // Get top filters
      const topFilters = await this.getPopularFilters(options);

      // Calculate rates
      const clickThroughRate = totalSearches > 0 ? totalClicks / totalSearches : 0;
      const conversionRate = await this.calculateConversionRate(events);

      return {
        totalSearches,
        uniqueUsers: uniqueUsers.size,
        avgSearchTime,
        avgResultsCount,
        topQueries,
        topFilters,
        conversionRate,
        clickThroughRate
      };
    } catch (error) {
      throw this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Get popular filters
   */
  private async getPopularFilters(options: AnalyticsOptions): Promise<FilterMetric[]> {
    const events = await this.getEventsInTimeframe(options);
    const searchEvents = events.filter(e => e.type === 'search.performed');

    // Count filter usage
    const filterMap = new Map<string, Map<any, number>>();

    searchEvents.forEach(event => {
      const data = event.payload as SearchTrackingData;
      if (data.filters) {
        Object.entries(data.filters).forEach(([key, value]) => {
          if (!filterMap.has(key)) {
            filterMap.set(key, new Map());
          }
          const valueMap = filterMap.get(key)!;
          const valueStr = JSON.stringify(value);
          valueMap.set(valueStr, (valueMap.get(valueStr) || 0) + 1);
        });
      }
    });

    // Convert to metrics
    const metrics: FilterMetric[] = [];
    filterMap.forEach((valueMap, filter) => {
      valueMap.forEach((count, valueStr) => {
        metrics.push({
          filter,
          value: JSON.parse(valueStr),
          count,
          conversionRate: 0 // Simplified for now
        });
      });
    });

    return metrics
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Calculate conversion rate
   */
  private async calculateConversionRate(events: SearchEvent[]): Promise<number> {
    // This is a simplified implementation
    // In production, you'd track actual conversions
    const searchSessions = new Set(
      events
        .filter(e => e.type === 'search.performed')
        .map(e => e.sessionId)
    );

    const convertedSessions = new Set(
      events
        .filter(e => e.type === 'result.clicked')
        .map(e => e.sessionId)
    );

    return searchSessions.size > 0
      ? convertedSessions.size / searchSessions.size
      : 0;
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(format: 'csv' | 'json'): Promise<Blob> {
    try {
      const events = await this.getAllEvents();

      if (format === 'json') {
        const json = JSON.stringify(events, null, 2);
        return new Blob([json], { type: 'application/json' });
      } else {
        const csv = this.eventsToCSV(events);
        return new Blob([csv], { type: 'text/csv' });
      }
    } catch (error) {
      throw this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Convert events to CSV
   */
  private eventsToCSV(events: SearchEvent[]): string {
    const headers = ['timestamp', 'type', 'userId', 'sessionId', 'query', 'resultsCount'];
    const rows = events.map(event => {
      const data = event.payload as any;
      return [
        event.timestamp.toISOString(),
        event.type,
        event.userId || '',
        event.sessionId,
        data.query || '',
        data.resultsCount || ''
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\\n');
  }

  /**
   * Get events in timeframe
   */
  private async getEventsInTimeframe(options: AnalyticsOptions): Promise<SearchEvent[]> {
    const now = new Date();
    let startDate: Date;

    switch (options.timeframe) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'yesterday':
        startDate = new Date(now.setDate(now.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last7days':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'last30days':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case 'custom':
        if (!options.customRange) {
          throw new Error('Custom range required');
        }
        startDate = options.customRange.start;
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    return this.events.filter(e => e.timestamp >= startDate);
  }

  /**
   * Update session data
   */
  private updateSessionData(sessionId: string, data: SearchTrackingData): void {
    const session = this.sessionData.get(sessionId) || {
      searches: [],
      startTime: new Date(),
      lastActivity: new Date()
    };

    session.searches.push(data);
    session.lastActivity = new Date();

    this.sessionData.set(sessionId, session);
  }

  /**
   * Get session insights
   */
  getSessionInsights(sessionId: string): any {
    return this.sessionData.get(sessionId);
  }

  /**
   * Persist events to storage
   */
  private async persistEvents(): Promise<void> {
    try {
      await this.storage.set('events', this.events);
      this.logger.debug('Events persisted', { count: this.events.length });
    } catch (error) {
      this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Get all events
   */
  private async getAllEvents(): Promise<SearchEvent[]> {
    const stored = await this.storage.get<SearchEvent[]>('events');
    return stored || this.events;
  }

  /**
   * Clean up old events
   */
  private async cleanupOldEvents(): Promise<void> {
    const retentionDays = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.events = this.events.filter(e => e.timestamp > cutoffDate);
    await this.persistEvents();

    this.logger.info('Old events cleaned up', {
      retentionDays,
      remainingEvents: this.events.length
    });
  }

  /**
   * Clear all analytics data
   */
  async clearAnalytics(): Promise<void> {
    this.events = [];
    this.sessionData.clear();
    await this.storage.remove('events');
    this.logger.info('Analytics data cleared');
  }
}