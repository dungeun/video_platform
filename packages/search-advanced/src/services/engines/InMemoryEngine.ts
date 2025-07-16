import { SearchEngine } from '../../core/SearchEngine';
import { 
  SearchParams, 
  SearchResult, 
  SearchItem,
  SearchEngineConfig 
} from '../../types';
import Fuse from 'fuse.js';

export class InMemoryEngine extends SearchEngine {
  private data: any[] = [];
  private fuseIndex?: Fuse<any>;

  constructor(config: SearchEngineConfig) {
    super(config);
  }

  protected async connect(): Promise<void> {
    // No connection needed for in-memory
    this.logger.info('In-memory engine connected');
  }

  protected async validateConnection(): Promise<void> {
    // Always valid for in-memory
    this.logger.info('In-memory engine connection validated');
  }

  /**
   * Set the data for searching
   */
  setData(data: any[]): void {
    this.data = data;
    this.buildIndex();
    this.logger.info('Data set for in-memory engine', { count: data.length });
  }

  /**
   * Build Fuse.js index
   */
  private buildIndex(): void {
    const keys = this.inferKeys(this.data[0] || {});
    
    this.fuseIndex = new Fuse(this.data, {
      keys,
      includeScore: true,
      threshold: 0.3,
      minMatchCharLength: 2,
      findAllMatches: true,
      ignoreLocation: true
    });
  }

  /**
   * Infer searchable keys from data
   */
  private inferKeys(sample: any): string[] {
    const keys: string[] = [];
    
    const traverse = (obj: any, prefix = '') => {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'string' || typeof value === 'number') {
          keys.push(fullKey);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          traverse(value, fullKey);
        }
      });
    };
    
    traverse(sample);
    return keys;
  }

  protected async executeSearch<T>(params: SearchParams): Promise<SearchResult<T>> {
    let results = [...this.data];
    
    // Apply text search if query provided
    if (params.query && this.fuseIndex) {
      const fuseResults = this.fuseIndex.search(params.query);
      results = fuseResults.map(r => ({
        ...r.item,
        _score: 1 - (r.score || 0)
      }));
    }

    // Apply filters
    if (params.filters) {
      results = this.applyFilters(results, params.filters);
    }

    // Apply sorting
    if (params.sort) {
      results = this.applySorting(results, params.sort);
    }

    // Calculate total before pagination
    const total = results.length;

    // Apply pagination
    const page = params.pagination?.page || 1;
    const pageSize = params.pagination?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    const paginatedResults = results.slice(start, end);

    // Format as SearchItems
    const items: SearchItem<T>[] = paginatedResults.map((item, index) => ({
      id: item.id || String(start + index),
      score: item._score || 1,
      source: item as T,
      highlights: params.highlight ? this.generateHighlights(item, params.query) : undefined
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      took: 0,
      query: params.query || '',
      filters: params.filters || {}
    };
  }

  /**
   * Apply filters to results
   */
  private applyFilters(results: any[], filters: Record<string, any>): any[] {
    return results.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        const itemValue = this.getNestedValue(item, key);
        
        // Handle different filter types
        if (Array.isArray(value)) {
          // Multi-value filter (OR)
          return value.includes(itemValue);
        } else if (typeof value === 'object' && value !== null) {
          // Range filter
          if ('min' in value || 'max' in value) {
            const numValue = Number(itemValue);
            if (isNaN(numValue)) return false;
            if (value.min !== undefined && numValue < value.min) return false;
            if (value.max !== undefined && numValue > value.max) return false;
            return true;
          }
          // Date range filter
          if ('start' in value || 'end' in value) {
            const dateValue = new Date(itemValue);
            if (isNaN(dateValue.getTime())) return false;
            if (value.start && dateValue < new Date(value.start)) return false;
            if (value.end && dateValue > new Date(value.end)) return false;
            return true;
          }
        }
        
        // Exact match
        return itemValue === value;
      });
    });
  }

  /**
   * Apply sorting to results
   */
  private applySorting(results: any[], sort: { field: string; order: 'asc' | 'desc' }): any[] {
    return results.sort((a, b) => {
      const aValue = sort.field === '_score' ? (a._score || 0) : this.getNestedValue(a, sort.field);
      const bValue = sort.field === '_score' ? (b._score || 0) : this.getNestedValue(b, sort.field);
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sort.order === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
  }

  /**
   * Generate highlights for search results
   */
  private generateHighlights(item: any, query?: string): Record<string, string[]> {
    if (!query) return {};
    
    const highlights: Record<string, string[]> = {};
    const queryLower = query.toLowerCase();
    
    const checkField = (value: any, key: string) => {
      if (typeof value === 'string') {
        const valueLower = value.toLowerCase();
        if (valueLower.includes(queryLower)) {
          const startIndex = valueLower.indexOf(queryLower);
          const endIndex = startIndex + query.length;
          const highlighted = 
            value.substring(0, startIndex) + 
            '<em>' + value.substring(startIndex, endIndex) + '</em>' + 
            value.substring(endIndex);
          
          if (!highlights[key]) {
            highlights[key] = [];
          }
          highlights[key].push(highlighted);
        }
      }
    };
    
    // Check all string fields
    const traverse = (obj: any, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'string') {
          checkField(value, fullKey);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          traverse(value, fullKey);
        }
      });
    };
    
    traverse(item);
    return highlights;
  }

  /**
   * Add items to the engine
   */
  addItems(items: any[]): void {
    this.data.push(...items);
    this.buildIndex();
    this.cache.clear(); // Clear cache when data changes
  }

  /**
   * Remove items from the engine
   */
  removeItems(ids: string[]): void {
    this.data = this.data.filter(item => !ids.includes(item.id));
    this.buildIndex();
    this.cache.clear();
  }

  /**
   * Update an item in the engine
   */
  updateItem(id: string, updates: any): void {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updates };
      this.buildIndex();
      this.cache.clear();
    }
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.data = [];
    this.fuseIndex = undefined;
    this.cache.clear();
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<any> {
    return {
      totalItems: this.data.length,
      indexSize: this.fuseIndex ? 'Built' : 'Not built',
      cacheSize: await this.cache.size()
    };
  }
}