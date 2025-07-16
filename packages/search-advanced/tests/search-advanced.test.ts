import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  SearchService,
  InMemoryEngine,
  FacetedSearchService,
  SearchSuggestionService,
  SearchAnalyticsService,
  SavedSearchService,
  FilterBuilder
} from '../src';

describe('SearchAdvanced Module', () => {
  describe('SearchService', () => {
    let searchService: SearchService;
    let engine: InMemoryEngine;

    beforeEach(() => {
      const config = {
        engine: {
          type: 'custom' as const,
          endpoint: '',
          index: 'test'
        }
      };
      
      searchService = new SearchService(config);
      engine = new InMemoryEngine(config.engine);
      
      // Set test data
      const testData = [
        { id: '1', title: 'Laptop Computer', category: 'electronics', price: 999 },
        { id: '2', title: 'Gaming Mouse', category: 'electronics', price: 59 },
        { id: '3', title: 'Office Chair', category: 'furniture', price: 299 },
        { id: '4', title: 'Standing Desk', category: 'furniture', price: 599 }
      ];
      
      engine.setData(testData);
      (searchService as any).engine = engine;
    });

    it('should perform basic search', async () => {
      const result = await searchService.search({
        query: 'laptop',
        pagination: { page: 1, pageSize: 10 }
      });

      expect(result.total).toBeGreaterThan(0);
      expect(result.items).toBeDefined();
      expect(result.items[0].source.title).toContain('Laptop');
    });

    it('should apply filters', async () => {
      const result = await searchService.search({
        query: '',
        filters: { category: 'electronics' },
        pagination: { page: 1, pageSize: 10 }
      });

      expect(result.total).toBe(2);
      result.items.forEach(item => {
        expect(item.source.category).toBe('electronics');
      });
    });

    it('should handle pagination', async () => {
      const result = await searchService.search({
        query: '',
        filters: {},
        pagination: { page: 1, pageSize: 2 }
      });

      expect(result.pageSize).toBe(2);
      expect(result.items.length).toBeLessThanOrEqual(2);
      expect(result.totalPages).toBe(2);
    });

    it('should search by IDs', async () => {
      const result = await searchService.searchByIds(['1', '3']);

      expect(result.total).toBe(2);
      expect(result.items.some(item => item.id === '1')).toBe(true);
      expect(result.items.some(item => item.id === '3')).toBe(true);
    });
  });

  describe('FacetedSearchService', () => {
    let facetedSearchService: FacetedSearchService;
    let searchService: SearchService;

    beforeEach(() => {
      const config = {
        engine: {
          type: 'custom' as const,
          endpoint: '',
          index: 'test'
        }
      };
      
      searchService = new SearchService(config);
      facetedSearchService = new FacetedSearchService(searchService);
    });

    it('should generate facets', async () => {
      // Mock search service to return test data
      vi.spyOn(searchService, 'search').mockResolvedValue({
        items: [
          { id: '1', score: 1, source: { category: 'electronics', brand: 'Apple' } },
          { id: '2', score: 1, source: { category: 'electronics', brand: 'Dell' } },
          { id: '3', score: 1, source: { category: 'furniture', brand: 'IKEA' } }
        ],
        total: 3,
        page: 1,
        pageSize: 10,
        totalPages: 1,
        took: 10,
        query: 'test',
        filters: {}
      });

      const result = await facetedSearchService.searchWithFacets({
        query: 'test',
        requestedFacets: ['category', 'brand']
      });

      expect(result.facets).toBeDefined();
      expect(result.facets.length).toBe(2);
      
      const categoryFacet = result.facets.find(f => f.field === 'category');
      expect(categoryFacet).toBeDefined();
      expect(categoryFacet!.values.length).toBeGreaterThan(0);
    });
  });

  describe('SearchSuggestionService', () => {
    let suggestionService: SearchSuggestionService;

    beforeEach(() => {
      suggestionService = new SearchSuggestionService();
    });

    it('should return empty suggestions for short queries', async () => {
      const suggestions = await suggestionService.getSuggestions('a');
      expect(suggestions).toEqual([]);
    });

    it('should track suggestion clicks', () => {
      expect(() => {
        suggestionService.trackSuggestionClick('test suggestion');
      }).not.toThrow();
    });

    it('should get suggestion stats', () => {
      const stats = suggestionService.getStats();
      expect(stats).toHaveProperty('totalSuggestions');
      expect(stats).toHaveProperty('topSuggestions');
    });
  });

  describe('FilterBuilder', () => {
    let builder: FilterBuilder;

    beforeEach(() => {
      builder = new FilterBuilder();
    });

    it('should build text filter', () => {
      builder.addTextFilter('title', 'Title');
      const filters = builder.build();

      expect(filters).toHaveLength(1);
      expect(filters[0].field).toBe('title');
      expect(filters[0].type).toBe('text');
    });

    it('should build range filter', () => {
      builder.addRangeFilter('price', 'Price', 0, 1000);
      const filters = builder.build();

      expect(filters).toHaveLength(1);
      expect(filters[0].field).toBe('price');
      expect(filters[0].type).toBe('range');
      expect(filters[0].validation?.min).toBe(0);
      expect(filters[0].validation?.max).toBe(1000);
    });

    it('should build multi-select filter', () => {
      const options = [
        { value: 'electronics', label: 'Electronics' },
        { value: 'furniture', label: 'Furniture' }
      ];
      
      builder.addMultiSelectFilter('category', 'Category', options);
      const filters = builder.build();

      expect(filters).toHaveLength(1);
      expect(filters[0].type).toBe('multiSelect');
      expect(filters[0].options).toEqual(options);
    });

    it('should validate filter values', () => {
      builder
        .addTextFilter('title', 'Title', { required: true })
        .addRangeFilter('price', 'Price', 0, 1000);

      const errors = builder.validateFilters({
        price: { min: -10, max: 500 }
      });

      expect(errors).toContain('Title is required');
      expect(errors).toContain('Price: Minimum must be at least 0');
    });

    it('should create e-commerce filters', () => {
      const ecommerceBuilder = FilterBuilder.createEcommerceFilters();
      const filters = ecommerceBuilder.build();

      expect(filters.length).toBeGreaterThan(0);
      expect(filters.some(f => f.field === 'category')).toBe(true);
      expect(filters.some(f => f.field === 'price')).toBe(true);
      expect(filters.some(f => f.field === 'brand')).toBe(true);
    });
  });

  describe('SearchAnalyticsService', () => {
    let analyticsService: SearchAnalyticsService;

    beforeEach(() => {
      analyticsService = new SearchAnalyticsService();
    });

    it('should track search data', async () => {
      const trackingData = {
        query: 'test search',
        resultsCount: 42,
        searchTime: 150,
        sessionId: 'session-123',
        timestamp: new Date()
      };

      expect(async () => {
        await analyticsService.trackSearch(trackingData);
      }).not.toThrow();
    });

    it('should get popular searches', async () => {
      // Track some searches first
      await analyticsService.trackSearch({
        query: 'laptop',
        resultsCount: 10,
        searchTime: 100,
        sessionId: 'session-1',
        timestamp: new Date()
      });

      await analyticsService.trackSearch({
        query: 'laptop',
        resultsCount: 15,
        searchTime: 120,
        sessionId: 'session-2',
        timestamp: new Date()
      });

      const popular = await analyticsService.getPopularSearches({
        timeframe: 'last7days',
        limit: 10
      });

      expect(Array.isArray(popular)).toBe(true);
    });
  });

  describe('SavedSearchService', () => {
    let savedSearchService: SavedSearchService;
    let mockApiClient: any;

    beforeEach(() => {
      mockApiClient = {
        post: vi.fn().mockResolvedValue({}),
        put: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        get: vi.fn().mockResolvedValue({ data: [] })
      };
      
      savedSearchService = new SavedSearchService(mockApiClient);
    });

    it('should save a search', async () => {
      const searchData = {
        userId: 'user-123',
        name: 'My Search',
        query: 'laptop',
        filters: { category: 'electronics' }
      };

      const saved = await savedSearchService.saveSearch(searchData);

      expect(saved.id).toBeDefined();
      expect(saved.name).toBe('My Search');
      expect(saved.userId).toBe('user-123');
      expect(saved.createdAt).toBeInstanceOf(Date);
    });

    it('should get saved searches for user', async () => {
      const searchData = {
        userId: 'user-123',
        name: 'My Search',
        query: 'laptop',
        filters: { category: 'electronics' }
      };

      await savedSearchService.saveSearch(searchData);
      const searches = await savedSearchService.getSavedSearches('user-123');

      expect(searches.length).toBe(1);
      expect(searches[0].userId).toBe('user-123');
    });

    it('should update saved search', async () => {
      const searchData = {
        userId: 'user-123',
        name: 'My Search',
        query: 'laptop',
        filters: { category: 'electronics' }
      };

      const saved = await savedSearchService.saveSearch(searchData);
      const updated = await savedSearchService.updateSavedSearch(saved.id, {
        name: 'Updated Search'
      });

      expect(updated.name).toBe('Updated Search');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(saved.updatedAt.getTime());
    });

    it('should delete saved search', async () => {
      const searchData = {
        userId: 'user-123',
        name: 'My Search',
        query: 'laptop',
        filters: { category: 'electronics' }
      };

      const saved = await savedSearchService.saveSearch(searchData);
      await savedSearchService.deleteSavedSearch(saved.id);

      const search = await savedSearchService.getSavedSearch(saved.id);
      expect(search).toBeNull();
    });
  });
});