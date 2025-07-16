import { ModuleBase, Logger, ErrorHandler } from '@repo/core';
import { SearchService } from '../services/SearchService';
import {
  FacetedSearchParams,
  FacetedSearchResult,
  Facet,
  FacetValue,
  SearchParams,
  SearchResult
} from '../types';

export class FacetedSearchService extends ModuleBase {
  private searchService: SearchService;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private activeFacets: Map<string, any> = new Map();

  constructor(searchService: SearchService) {
    super('FacetedSearchService');
    this.searchService = searchService;
    this.logger = new Logger('FacetedSearchService');
    this.errorHandler = new ErrorHandler('FacetedSearchService');
  }

  /**
   * Perform search with facets
   */
  async searchWithFacets<T = any>(
    params: FacetedSearchParams
  ): Promise<FacetedSearchResult<T>> {
    try {
      this.logger.info('Performing faceted search', {
        query: params.query,
        facets: params.requestedFacets
      });

      // Execute search
      const searchResult = await this.searchService.search<T>(params);

      // Generate facets
      const facets = await this.generateFacets(
        params.requestedFacets,
        searchResult,
        params.facetSize || 10
      );

      // Combine results
      const result: FacetedSearchResult<T> = {
        ...searchResult,
        facets
      };

      this.emit('faceted-search.completed', {
        query: params.query,
        facetCount: facets.length
      });

      return result;
    } catch (error) {
      this.emit('faceted-search.failed', { error });
      throw this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Generate facets from search results
   */
  private async generateFacets<T>(
    requestedFacets: string[],
    searchResult: SearchResult<T>,
    facetSize: number
  ): Promise<Facet[]> {
    const facets: Facet[] = [];

    for (const facetField of requestedFacets) {
      const facet = await this.generateFacet(facetField, searchResult, facetSize);
      if (facet) {
        facets.push(facet);
      }
    }

    return facets;
  }

  /**
   * Generate a single facet
   */
  private async generateFacet<T>(
    field: string,
    searchResult: SearchResult<T>,
    size: number
  ): Promise<Facet | null> {
    try {
      // Extract values from search results
      const values = this.extractFacetValues(field, searchResult.items);

      if (values.length === 0) {
        return null;
      }

      // Determine facet type
      const type = this.determineFacetType(values[0].value);

      // Create facet
      const facet: Facet = {
        field,
        label: this.humanizeFieldName(field),
        type,
        values: values.slice(0, size)
      };

      // Mark selected values
      const activeValue = this.activeFacets.get(field);
      if (activeValue !== undefined) {
        facet.values.forEach(v => {
          v.selected = Array.isArray(activeValue)
            ? activeValue.includes(v.value)
            : v.value === activeValue;
        });
      }

      return facet;
    } catch (error) {
      this.logger.error('Failed to generate facet', { field, error });
      return null;
    }
  }

  /**
   * Extract facet values from search results
   */
  private extractFacetValues<T>(
    field: string,
    items: Array<{ source: T }>
  ): FacetValue[] {
    const valueCounts = new Map<any, number>();

    // Count occurrences
    items.forEach(item => {
      const value = this.getNestedValue(item.source, field);
      if (value !== undefined && value !== null) {
        const key = JSON.stringify(value);
        valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
      }
    });

    // Convert to FacetValue array
    const facetValues: FacetValue[] = [];
    valueCounts.forEach((count, key) => {
      const value = JSON.parse(key);
      facetValues.push({
        value,
        label: this.formatFacetValue(value),
        count
      });
    });

    // Sort by count descending
    return facetValues.sort((a, b) => b.count - a.count);
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
  }

  /**
   * Determine facet type based on value
   */
  private determineFacetType(value: any): Facet['type'] {
    if (typeof value === 'number') {
      return 'range';
    }
    if (value instanceof Date || !isNaN(Date.parse(value))) {
      return 'date';
    }
    if (typeof value === 'object' && value.children) {
      return 'hierarchical';
    }
    return 'term';
  }

  /**
   * Format facet value for display
   */
  private formatFacetValue(value: any): string {
    if (value === null || value === undefined) {
      return 'Unknown';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Humanize field name
   */
  private humanizeFieldName(field: string): string {
    return field
      .split(/[._-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Apply facet filter
   */
  applyFacetFilter(facet: string, value: any): void {
    this.activeFacets.set(facet, value);
    this.emit('facet.applied', { facet, value });
  }

  /**
   * Remove facet filter
   */
  removeFacetFilter(facet: string): void {
    this.activeFacets.delete(facet);
    this.emit('facet.removed', { facet });
  }

  /**
   * Clear all facet filters
   */
  clearFacetFilters(): void {
    this.activeFacets.clear();
    this.emit('facets.cleared');
  }

  /**
   * Get active facet filters
   */
  getActiveFacets(): Record<string, any> {
    const active: Record<string, any> = {};
    this.activeFacets.forEach((value, key) => {
      active[key] = value;
    });
    return active;
  }

  /**
   * Get facets for a category
   */
  async getFacets(category?: string): Promise<Facet[]> {
    const params: SearchParams = {
      query: '',
      filters: category ? { category } : {},
      pagination: { page: 1, pageSize: 100 }
    };

    const result = await this.searchService.search(params);
    
    // Common facets
    const commonFacets = ['category', 'brand', 'price', 'rating'];
    
    return await this.generateFacets(commonFacets, result, 10);
  }

  /**
   * Get hierarchical facet values
   */
  async getHierarchicalFacet(
    field: string,
    parentValue?: any
  ): Promise<FacetValue[]> {
    // Implementation depends on data structure
    // This is a placeholder
    return [];
  }

  /**
   * Build range facet
   */
  buildRangeFacet(
    field: string,
    min: number,
    max: number,
    step: number
  ): Facet {
    const values: FacetValue[] = [];
    
    for (let i = min; i < max; i += step) {
      values.push({
        value: { min: i, max: i + step },
        label: `${i} - ${i + step}`,
        count: 0
      });
    }

    return {
      field,
      label: this.humanizeFieldName(field),
      type: 'range',
      values
    };
  }

  /**
   * Build date range facet
   */
  buildDateRangeFacet(
    field: string,
    ranges: Array<{ label: string; start: Date; end: Date }>
  ): Facet {
    const values: FacetValue[] = ranges.map(range => ({
      value: { start: range.start, end: range.end },
      label: range.label,
      count: 0
    }));

    return {
      field,
      label: this.humanizeFieldName(field),
      type: 'date',
      values
    };
  }
}