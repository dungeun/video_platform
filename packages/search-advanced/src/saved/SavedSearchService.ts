import { ModuleBase, Logger, ErrorHandler } from '@company/core';
import { StorageManager } from '@company/storage';
import { ApiClient } from '@company/api-client';
import {
  SavedSearch,
  SearchParams,
  NotificationSettings,
  SearchResult
} from '../types';
import { v4 as uuidv4 } from '@company/utils';

export class SavedSearchService extends ModuleBase {
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private storage: StorageManager;
  private apiClient: ApiClient;
  private savedSearches: Map<string, SavedSearch> = new Map();
  private checkInterval?: NodeJS.Timeout;

  constructor(apiClient: ApiClient) {
    super('SavedSearchService');
    this.logger = new Logger('SavedSearchService');
    this.errorHandler = new ErrorHandler('SavedSearchService');
    this.apiClient = apiClient;
    this.storage = new StorageManager({
      type: 'indexedDB',
      prefix: 'saved-searches'
    });

    this.initialize();
  }

  /**
   * Initialize the service
   */
  private async initialize(): Promise<void> {
    try {
      await this.loadSavedSearches();
      this.startNotificationCheck();
      this.logger.info('Saved search service initialized');
    } catch (error) {
      this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Save a search
   */
  async saveSearch(search: Omit<SavedSearch, 'id' | 'createdAt' | 'updatedAt' | 'runCount'>): Promise<SavedSearch> {
    try {
      const savedSearch: SavedSearch = {
        ...search,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
        runCount: 0
      };

      // Validate search parameters
      this.validateSavedSearch(savedSearch);

      // Save to storage
      this.savedSearches.set(savedSearch.id, savedSearch);
      await this.persistSavedSearches();

      // Save to backend
      if (this.apiClient) {
        try {
          await this.apiClient.post('/saved-searches', savedSearch);
        } catch (error) {
          this.logger.error('Failed to save to backend', error);
        }
      }

      this.emit('search.saved', savedSearch);
      this.logger.info('Search saved', { id: savedSearch.id, name: savedSearch.name });

      return savedSearch;
    } catch (error) {
      throw this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Get saved searches for a user
   */
  async getSavedSearches(userId?: string): Promise<SavedSearch[]> {
    try {
      if (userId) {
        return Array.from(this.savedSearches.values())
          .filter(search => search.userId === userId)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      }

      return Array.from(this.savedSearches.values())
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      throw this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Get a saved search by ID
   */
  async getSavedSearch(id: string): Promise<SavedSearch | null> {
    return this.savedSearches.get(id) || null;
  }

  /**
   * Update a saved search
   */
  async updateSavedSearch(
    id: string, 
    updates: Partial<Omit<SavedSearch, 'id' | 'createdAt'>>
  ): Promise<SavedSearch> {
    try {
      const existing = this.savedSearches.get(id);
      if (!existing) {
        throw new Error('Saved search not found');
      }

      const updated: SavedSearch = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      };

      // Validate if search params are updated
      if (updates.query !== undefined || updates.filters !== undefined) {
        this.validateSavedSearch(updated);
      }

      this.savedSearches.set(id, updated);
      await this.persistSavedSearches();

      // Update in backend
      if (this.apiClient) {
        try {
          await this.apiClient.put(`/saved-searches/${id}`, updated);
        } catch (error) {
          this.logger.error('Failed to update in backend', error);
        }
      }

      this.emit('search.updated', updated);
      this.logger.info('Saved search updated', { id });

      return updated;
    } catch (error) {
      throw this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(id: string): Promise<void> {
    try {
      const existing = this.savedSearches.get(id);
      if (!existing) {
        throw new Error('Saved search not found');
      }

      this.savedSearches.delete(id);
      await this.persistSavedSearches();

      // Delete from backend
      if (this.apiClient) {
        try {
          await this.apiClient.delete(`/saved-searches/${id}`);
        } catch (error) {
          this.logger.error('Failed to delete from backend', error);
        }
      }

      this.emit('search.deleted', { id });
      this.logger.info('Saved search deleted', { id });
    } catch (error) {
      throw this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Run a saved search
   */
  async runSavedSearch(id: string, searchFn: (params: SearchParams) => Promise<SearchResult>): Promise<SearchResult> {
    try {
      const savedSearch = this.savedSearches.get(id);
      if (!savedSearch) {
        throw new Error('Saved search not found');
      }

      const params: SearchParams = {
        query: savedSearch.query,
        filters: savedSearch.filters,
        sort: savedSearch.sort
      };

      const result = await searchFn(params);

      // Update run count and last run time
      await this.updateSavedSearch(id, {
        lastRun: new Date(),
        runCount: savedSearch.runCount + 1
      });

      this.emit('search.run', { id, resultsCount: result.total });

      return result;
    } catch (error) {
      throw this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Enable/disable notifications for a saved search
   */
  async toggleNotifications(
    id: string, 
    settings: NotificationSettings
  ): Promise<void> {
    try {
      await this.updateSavedSearch(id, { notification: settings });
      this.logger.info('Notification settings updated', { id, enabled: settings.enabled });
    } catch (error) {
      throw this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Check for notification triggers
   */
  private async checkNotificationTriggers(): Promise<void> {
    const searches = Array.from(this.savedSearches.values())
      .filter(s => s.notification?.enabled);

    for (const search of searches) {
      try {
        // Check if it's time to run based on frequency
        if (this.shouldRunNotificationCheck(search)) {
          await this.checkSearchForNotifications(search);
        }
      } catch (error) {
        this.logger.error('Failed to check notifications', { 
          searchId: search.id, 
          error 
        });
      }
    }
  }

  /**
   * Check if notification check should run
   */
  private shouldRunNotificationCheck(search: SavedSearch): boolean {
    if (!search.notification || !search.lastRun) {
      return true;
    }

    const now = new Date();
    const lastRun = new Date(search.lastRun);
    const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);

    switch (search.notification.frequency) {
      case 'realtime':
        return hoursSinceLastRun >= 0.25; // Check every 15 minutes
      case 'daily':
        return hoursSinceLastRun >= 24;
      case 'weekly':
        return hoursSinceLastRun >= 168;
      default:
        return false;
    }
  }

  /**
   * Check a search for notifications
   */
  private async checkSearchForNotifications(search: SavedSearch): Promise<void> {
    // This would integrate with your notification system
    // For now, just emit an event
    this.emit('notification.check', {
      searchId: search.id,
      userId: search.userId,
      settings: search.notification
    });
  }

  /**
   * Start notification check interval
   */
  private startNotificationCheck(): void {
    // Check every 15 minutes
    this.checkInterval = setInterval(() => {
      this.checkNotificationTriggers().catch(error => {
        this.logger.error('Notification check failed', error);
      });
    }, 15 * 60 * 1000);
  }

  /**
   * Stop notification check interval
   */
  private stopNotificationCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  /**
   * Validate saved search
   */
  private validateSavedSearch(search: SavedSearch): void {
    if (!search.name || search.name.trim().length === 0) {
      throw new Error('Search name is required');
    }

    if (!search.query && (!search.filters || Object.keys(search.filters).length === 0)) {
      throw new Error('Either query or filters must be provided');
    }

    if (!search.userId) {
      throw new Error('User ID is required');
    }
  }

  /**
   * Load saved searches from storage
   */
  private async loadSavedSearches(): Promise<void> {
    try {
      const stored = await this.storage.get<SavedSearch[]>('searches');
      if (stored) {
        stored.forEach(search => {
          // Convert dates from strings
          search.createdAt = new Date(search.createdAt);
          search.updatedAt = new Date(search.updatedAt);
          if (search.lastRun) {
            search.lastRun = new Date(search.lastRun);
          }
          this.savedSearches.set(search.id, search);
        });
      }

      // Sync with backend
      if (this.apiClient) {
        try {
          const response = await this.apiClient.get<SavedSearch[]>('/saved-searches');
          response.data.forEach(search => {
            if (!this.savedSearches.has(search.id)) {
              this.savedSearches.set(search.id, search);
            }
          });
          await this.persistSavedSearches();
        } catch (error) {
          this.logger.error('Failed to sync with backend', error);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Persist saved searches to storage
   */
  private async persistSavedSearches(): Promise<void> {
    try {
      const searches = Array.from(this.savedSearches.values());
      await this.storage.set('searches', searches);
    } catch (error) {
      this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Export saved searches
   */
  async exportSavedSearches(userId: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    try {
      const searches = await this.getSavedSearches(userId);

      if (format === 'json') {
        const json = JSON.stringify(searches, null, 2);
        return new Blob([json], { type: 'application/json' });
      } else {
        const csv = this.savedSearchesToCSV(searches);
        return new Blob([csv], { type: 'text/csv' });
      }
    } catch (error) {
      throw this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Convert saved searches to CSV
   */
  private savedSearchesToCSV(searches: SavedSearch[]): string {
    const headers = ['name', 'query', 'filters', 'createdAt', 'lastRun', 'runCount'];
    const rows = searches.map(search => [
      search.name,
      search.query,
      JSON.stringify(search.filters),
      search.createdAt.toISOString(),
      search.lastRun?.toISOString() || '',
      search.runCount.toString()
    ].join(','));

    return [headers.join(','), ...rows].join('\\n');
  }

  /**
   * Import saved searches
   */
  async importSavedSearches(userId: string, data: Blob): Promise<number> {
    try {
      const text = await data.text();
      const searches = JSON.parse(text) as SavedSearch[];

      let imported = 0;
      for (const search of searches) {
        try {
          await this.saveSearch({
            ...search,
            userId // Override with current user
          });
          imported++;
        } catch (error) {
          this.logger.error('Failed to import search', { name: search.name, error });
        }
      }

      return imported;
    } catch (error) {
      throw this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopNotificationCheck();
    await this.persistSavedSearches();
    this.logger.info('Saved search service cleaned up');
  }
}