import { SearchEngine } from '../core/SearchEngine';
import { ElasticsearchEngine } from './engines/ElasticsearchEngine';
import { AlgoliaEngine } from './engines/AlgoliaEngine';
import { MeilisearchEngine } from './engines/MeilisearchEngine';
import { InMemoryEngine } from './engines/InMemoryEngine';
import {
  SearchParams,
  SearchResult,
  AdvancedSearchParams,
  SearchConfig,
  SearchError
} from '../types';
import { Logger } from '@company/core';

export class SearchService {
  private engine: SearchEngine;
  private logger: Logger;
  private config: SearchConfig;

  constructor(config: SearchConfig) {
    this.config = config;
    this.logger = new Logger('SearchService');
    this.engine = this.createEngine(config);
  }

  /**
   * Create search engine based on configuration
   */
  private createEngine(config: SearchConfig): SearchEngine {
    switch (config.engine.type) {
      case 'elasticsearch':
        return new ElasticsearchEngine(config.engine);
      case 'algolia':
        return new AlgoliaEngine(config.engine);
      case 'meilisearch':
        return new MeilisearchEngine(config.engine);
      case 'custom':
      default:
        return new InMemoryEngine(config.engine);
    }
  }

  /**
   * Initialize the search service
   */
  async initialize(): Promise<void> {
    await this.engine.initialize();
    this.logger.info('Search service initialized');
  }

  /**
   * Perform a search
   */
  async search<T = any>(params: SearchParams): Promise<SearchResult<T>> {
    this.logger.debug('Performing search', { query: params.query });
    
    // Apply default pagination if not provided
    if (!params.pagination) {
      params.pagination = { page: 1, pageSize: 20 };
    }

    // Apply default sort if not provided
    if (!params.sort) {
      params.sort = { field: '_score', order: 'desc' };
    }

    return await this.engine.search<T>(params);
  }

  /**
   * Perform an advanced search
   */
  async advancedSearch<T = any>(params: AdvancedSearchParams): Promise<SearchResult<T>> {
    this.logger.debug('Performing advanced search', { query: params.query });
    return await this.engine.advancedSearch<T>(params);
  }

  /**
   * Search by IDs
   */
  async searchByIds<T = any>(ids: string[]): Promise<SearchResult<T>> {
    this.logger.debug('Searching by IDs', { count: ids.length });
    return await this.engine.searchByIds<T>(ids);
  }

  /**
   * Perform a quick search (simplified interface)
   */
  async quickSearch<T = any>(query: string, options?: {
    limit?: number;
    category?: string;
  }): Promise<T[]> {
    const result = await this.search<T>({
      query,
      filters: options?.category ? { category: options.category } : undefined,
      pagination: { page: 1, pageSize: options?.limit || 10 }
    });

    return result.items.map(item => item.source);
  }

  /**
   * Count results for a query
   */
  async count(params: Omit<SearchParams, 'pagination'>): Promise<number> {
    const result = await this.search({
      ...params,
      pagination: { page: 1, pageSize: 1 }
    });

    return result.total;
  }

  /**
   * Check if any results exist for a query
   */
  async exists(params: Omit<SearchParams, 'pagination'>): Promise<boolean> {
    const count = await this.count(params);
    return count > 0;
  }

  /**
   * Get all results (with pagination)
   */
  async *getAllResults<T = any>(
    params: Omit<SearchParams, 'pagination'>,
    pageSize: number = 50
  ): AsyncGenerator<T[], void, unknown> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await this.search<T>({
        ...params,
        pagination: { page, pageSize }
      });

      if (result.items.length > 0) {
        yield result.items.map(item => item.source);
      }

      hasMore = page < result.totalPages;
      page++;
    }
  }

  /**
   * Clear search cache
   */
  async clearCache(): Promise<void> {
    await this.engine.clearCache();
  }

  /**
   * Get search statistics
   */
  async getStats(): Promise<any> {
    return await this.engine.getStats();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.engine.cleanup();
  }
}