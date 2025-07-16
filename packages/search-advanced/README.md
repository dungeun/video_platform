# @company/search-advanced

Advanced search module providing comprehensive search capabilities with multi-filter system, faceted search, search suggestions, analytics, and saved searches.

## Features

- **Multi-Filter System**: Complex filtering with multiple criteria
- **Faceted Search**: Dynamic facet generation and filtering
- **Search Suggestions**: Real-time search suggestions and autocomplete
- **Search Analytics**: Track and analyze search patterns
- **Saved Searches**: Save and manage search queries
- **Full-Text Search**: Advanced text search with ranking
- **Search History**: Track user search history
- **Search Export**: Export search results

## Installation

```bash
pnpm add @company/search-advanced
```

## Usage

### Basic Search

```typescript
import { SearchService } from '@company/search-advanced';

const searchService = new SearchService();

// Perform basic search
const results = await searchService.search({
  query: 'laptop',
  filters: {
    category: 'electronics',
    priceRange: { min: 500, max: 1500 }
  }
});
```

### Faceted Search

```typescript
import { FacetedSearchService } from '@company/search-advanced';

const facetedSearch = new FacetedSearchService();

// Get search results with facets
const results = await facetedSearch.searchWithFacets({
  query: 'laptop',
  requestedFacets: ['category', 'brand', 'price', 'rating']
});

// Results include:
// - items: search results
// - facets: available facets with counts
```

### Search Suggestions

```typescript
import { SearchSuggestionService } from '@company/search-advanced';

const suggestionService = new SearchSuggestionService();

// Get search suggestions
const suggestions = await suggestionService.getSuggestions('lapt');
// Returns: ['laptop', 'laptop bag', 'laptop stand', ...]
```

### Saved Searches

```typescript
import { SavedSearchService } from '@company/search-advanced';

const savedSearchService = new SavedSearchService();

// Save a search
await savedSearchService.saveSearch({
  name: 'Gaming Laptops',
  query: 'gaming laptop',
  filters: {
    category: 'electronics',
    priceRange: { min: 1000, max: 3000 }
  }
});

// Get saved searches
const savedSearches = await savedSearchService.getSavedSearches();
```

### Search Analytics

```typescript
import { SearchAnalyticsService } from '@company/search-advanced';

const analytics = new SearchAnalyticsService();

// Track search
await analytics.trackSearch({
  query: 'laptop',
  resultsCount: 42,
  clickedResults: ['item-123', 'item-456']
});

// Get popular searches
const popularSearches = await analytics.getPopularSearches({
  timeframe: 'last7days',
  limit: 10
});
```

## API Reference

### SearchService
- `search(params: SearchParams): Promise<SearchResult>`
- `searchByIds(ids: string[]): Promise<SearchResult>`
- `advancedSearch(params: AdvancedSearchParams): Promise<SearchResult>`

### FacetedSearchService
- `searchWithFacets(params: FacetedSearchParams): Promise<FacetedSearchResult>`
- `getFacets(category?: string): Promise<Facet[]>`
- `applyFacetFilter(facet: string, value: any): void`

### SearchSuggestionService
- `getSuggestions(query: string, limit?: number): Promise<string[]>`
- `getRelatedSearches(query: string): Promise<string[]>`
- `trackSuggestionClick(suggestion: string): void`

### SavedSearchService
- `saveSearch(search: SavedSearch): Promise<void>`
- `getSavedSearches(): Promise<SavedSearch[]>`
- `deleteSavedSearch(id: string): Promise<void>`
- `updateSavedSearch(id: string, updates: Partial<SavedSearch>): Promise<void>`

### SearchAnalyticsService
- `trackSearch(data: SearchTrackingData): Promise<void>`
- `getPopularSearches(options: AnalyticsOptions): Promise<PopularSearch[]>`
- `getSearchMetrics(timeframe: string): Promise<SearchMetrics>`
- `exportAnalytics(format: 'csv' | 'json'): Promise<Blob>`

## Components

### SearchBox
```tsx
<SearchBox
  onSearch={handleSearch}
  suggestions={true}
  placeholder="Search products..."
  debounceMs={300}
/>
```

### SearchFilters
```tsx
<SearchFilters
  filters={availableFilters}
  selectedFilters={currentFilters}
  onChange={handleFilterChange}
  layout="sidebar" // or "horizontal"
/>
```

### SearchResults
```tsx
<SearchResults
  results={searchResults}
  view="grid" // or "list"
  onItemClick={handleItemClick}
  loading={isLoading}
/>
```

### FacetedSearch
```tsx
<FacetedSearch
  onSearch={handleSearch}
  facets={['category', 'brand', 'price']}
  defaultFilters={defaultFilters}
/>
```

## Configuration

```typescript
import { configureSearch } from '@company/search-advanced';

configureSearch({
  // Search engine configuration
  engine: {
    type: 'elasticsearch', // or 'algolia', 'meilisearch'
    endpoint: 'https://search.example.com',
    apiKey: 'your-api-key'
  },
  
  // Suggestion settings
  suggestions: {
    enabled: true,
    minChars: 2,
    maxSuggestions: 10,
    debounceMs: 300
  },
  
  // Analytics settings
  analytics: {
    enabled: true,
    trackClicks: true,
    anonymizeData: true
  },
  
  // Cache settings
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 100
  }
});
```

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## License

MIT