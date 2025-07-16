import { ModuleBase, Logger, ErrorHandler } from '@repo/core';
import { CacheManager } from '@repo/cache';
import { StorageManager } from '@repo/storage';
import {
  SuggestionParams,
  SuggestionResult,
  Suggestion,
  SuggestionContext
} from '../types';
import Fuse from 'fuse.js';
import { debounce } from 'lodash';

export class SearchSuggestionService extends ModuleBase {
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private cache: CacheManager;
  private storage: StorageManager;
  private popularSearches: Map<string, number> = new Map();
  private suggestionIndex?: Fuse<any>;
  private debouncedIndexUpdate: Function;

  constructor() {
    super('SearchSuggestionService');
    this.logger = new Logger('SearchSuggestionService');
    this.errorHandler = new ErrorHandler('SearchSuggestionService');
    this.cache = new CacheManager({
      ttl: 600000, // 10 minutes
      maxSize: 500
    });
    this.storage = new StorageManager({
      type: 'localStorage',
      prefix: 'search-suggestions'
    });

    // Debounce index updates
    this.debouncedIndexUpdate = debounce(this.updateSuggestionIndex.bind(this), 5000);

    this.initialize();
  }

  /**
   * Initialize the service
   */
  private async initialize(): Promise<void> {
    try {
      // Load popular searches from storage
      const stored = await this.storage.get<Array<[string, number]>>('popular');
      if (stored) {
        this.popularSearches = new Map(stored);
      }

      // Initialize suggestion index
      await this.buildSuggestionIndex();

      this.logger.info('Search suggestion service initialized');
    } catch (error) {
      this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(
    query: string,
    limit: number = 10,
    context?: SuggestionContext
  ): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `suggestions:${query}:${limit}`;
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      this.logger.debug('Getting suggestions', { query, limit });

      const params: SuggestionParams = {
        query,
        limit,
        context
      };

      const result = await this.generateSuggestions(params);
      const suggestions = result.suggestions
        .slice(0, limit)
        .map(s => s.text);

      await this.cache.set(cacheKey, suggestions);

      return suggestions;
    } catch (error) {
      this.errorHandler.handleError(error as Error);
      return [];
    }
  }

  /**
   * Get related searches
   */
  async getRelatedSearches(query: string, limit: number = 5): Promise<string[]> {
    try {
      this.logger.debug('Getting related searches', { query });

      // Get suggestions with broader matching
      const suggestions = await this.generateSuggestions({
        query,
        limit: limit * 2,
        fuzzy: true
      });

      // Filter out exact matches and return related ones
      return suggestions.suggestions
        .filter(s => s.text.toLowerCase() !== query.toLowerCase())
        .slice(0, limit)
        .map(s => s.text);
    } catch (error) {
      this.errorHandler.handleError(error as Error);
      return [];
    }
  }

  /**
   * Track suggestion click
   */
  trackSuggestionClick(suggestion: string): void {
    try {
      const count = this.popularSearches.get(suggestion) || 0;
      this.popularSearches.set(suggestion, count + 1);

      // Update storage periodically
      this.debouncedIndexUpdate();

      this.emit('suggestion.clicked', { suggestion });
    } catch (error) {
      this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Generate suggestions
   */
  private async generateSuggestions(
    params: SuggestionParams
  ): Promise<SuggestionResult> {
    const startTime = Date.now();
    const suggestions: Suggestion[] = [];

    // Get suggestions from multiple sources
    const [
      historySuggestions,
      popularSuggestions,
      fuzzySuggestions
    ] = await Promise.all([
      this.getHistorySuggestions(params),
      this.getPopularSuggestions(params),
      this.getFuzzySuggestions(params)
    ]);

    // Merge and deduplicate
    const suggestionMap = new Map<string, Suggestion>();

    [...historySuggestions, ...popularSuggestions, ...fuzzySuggestions].forEach(s => {
      const existing = suggestionMap.get(s.text.toLowerCase());
      if (!existing || existing.score < s.score) {
        suggestionMap.set(s.text.toLowerCase(), s);
      }
    });

    // Convert back to array and sort by score
    suggestions.push(...Array.from(suggestionMap.values()));
    suggestions.sort((a, b) => b.score - a.score);

    return {
      suggestions: suggestions.slice(0, params.limit || 10),
      related: await this.findRelatedTerms(params.query),
      took: Date.now() - startTime
    };
  }

  /**
   * Get suggestions from search history
   */
  private async getHistorySuggestions(
    params: SuggestionParams
  ): Promise<Suggestion[]> {
    if (!params.context?.previousSearches) {
      return [];
    }

    const query = params.query.toLowerCase();
    return params.context.previousSearches
      .filter(search => search.toLowerCase().includes(query))
      .map(search => ({
        text: search,
        score: 0.8,
        type: 'query' as const,
        payload: { source: 'history' }
      }));
  }

  /**
   * Get popular suggestions
   */
  private async getPopularSuggestions(
    params: SuggestionParams
  ): Promise<Suggestion[]> {
    const query = params.query.toLowerCase();
    const suggestions: Suggestion[] = [];

    this.popularSearches.forEach((count, term) => {
      if (term.toLowerCase().includes(query)) {
        suggestions.push({
          text: term,
          score: Math.min(count / 100, 1), // Normalize score
          type: 'query',
          payload: { source: 'popular', count }
        });
      }
    });

    return suggestions.sort((a, b) => b.score - a.score);
  }

  /**
   * Get fuzzy suggestions
   */
  private async getFuzzySuggestions(
    params: SuggestionParams
  ): Promise<Suggestion[]> {
    if (!this.suggestionIndex || !params.fuzzy) {
      return [];
    }

    const results = this.suggestionIndex.search(params.query, {
      limit: params.limit || 10,
      threshold: 0.3
    });

    return results.map(result => ({
      text: result.item.text,
      score: 1 - (result.score || 0), // Fuse returns distance, we want similarity
      type: result.item.type || 'query',
      payload: result.item.payload
    }));
  }

  /**
   * Find related terms
   */
  private async findRelatedTerms(query: string): Promise<string[]> {
    // This is a simplified implementation
    // In production, you might use word embeddings or an ML model
    const related: string[] = [];

    // Find terms that share common words
    const words = query.toLowerCase().split(' ');
    this.popularSearches.forEach((_, term) => {
      const termWords = term.toLowerCase().split(' ');
      const commonWords = words.filter(w => termWords.includes(w));
      if (commonWords.length > 0 && term !== query) {
        related.push(term);
      }
    });

    return related.slice(0, 5);
  }

  /**
   * Build suggestion index
   */
  private async buildSuggestionIndex(): Promise<void> {
    try {
      // Get all available terms for indexing
      const terms: any[] = [];

      // Add popular searches
      this.popularSearches.forEach((count, term) => {
        terms.push({
          text: term,
          type: 'query',
          payload: { count }
        });
      });

      // Create Fuse index
      this.suggestionIndex = new Fuse(terms, {
        keys: ['text'],
        includeScore: true,
        threshold: 0.3,
        minMatchCharLength: 2
      });

      this.logger.info('Suggestion index built', { termCount: terms.length });
    } catch (error) {
      this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Update suggestion index
   */
  private async updateSuggestionIndex(): Promise<void> {
    try {
      // Save popular searches to storage
      await this.storage.set(
        'popular',
        Array.from(this.popularSearches.entries())
      );

      // Rebuild index
      await this.buildSuggestionIndex();

      this.logger.debug('Suggestion index updated');
    } catch (error) {
      this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Add custom suggestions
   */
  async addSuggestions(suggestions: Array<{
    text: string;
    type?: Suggestion['type'];
    payload?: any;
  }>): Promise<void> {
    try {
      // Add to popular searches with initial count
      suggestions.forEach(s => {
        if (!this.popularSearches.has(s.text)) {
          this.popularSearches.set(s.text, 1);
        }
      });

      await this.updateSuggestionIndex();
      this.logger.info('Added custom suggestions', { count: suggestions.length });
    } catch (error) {
      this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Clear suggestions
   */
  async clearSuggestions(): Promise<void> {
    this.popularSearches.clear();
    await this.storage.remove('popular');
    await this.cache.clear();
    this.suggestionIndex = undefined;
    this.logger.info('Suggestions cleared');
  }

  /**
   * Get suggestion statistics
   */
  getStats(): {
    totalSuggestions: number;
    topSuggestions: Array<{ text: string; count: number }>;
  } {
    const topSuggestions = Array.from(this.popularSearches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([text, count]) => ({ text, count }));

    return {
      totalSuggestions: this.popularSearches.size,
      topSuggestions
    };
  }
}