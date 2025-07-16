// Core exports
export { SearchEngine } from './core/SearchEngine';

// Service exports
export { SearchService } from './services/SearchService';
export { FacetedSearchService } from './facets/FacetedSearchService';
export { SearchSuggestionService } from './suggestions/SearchSuggestionService';
export { SearchAnalyticsService } from './analytics/SearchAnalyticsService';
export { SavedSearchService } from './saved/SavedSearchService';

// Engine exports
export { InMemoryEngine } from './services/engines/InMemoryEngine';
export { ElasticsearchEngine } from './services/engines/ElasticsearchEngine';
export { AlgoliaEngine } from './services/engines/AlgoliaEngine';
export { MeilisearchEngine } from './services/engines/MeilisearchEngine';

// Filter exports
export { FilterBuilder } from './filters/FilterBuilder';

// Component exports
export { SearchBox } from './components/search/SearchBox';
export { SearchFilters } from './components/filters/SearchFilters';
export { SearchResults } from './components/results/SearchResults';

// Hook exports
export { useSearch } from './hooks/useSearch';
export { useSuggestions } from './hooks/useSuggestions';

// Configuration exports
export { 
  configureSearch, 
  getSearchConfig, 
  defaultConfig, 
  mergeConfig 
} from './config';

// Utility exports
export {
  validateQuery,
  sanitizeQuery,
  validateFilters,
  cleanFilters,
  generateCacheKey,
  extractKeywords,
  highlightText,
  formatResultCount,
  formatSearchTime,
  parseAdvancedQuery,
  deepMerge
} from './utils';

// Type exports
export type {
  // Search types
  SearchParams,
  AdvancedSearchParams,
  SearchResult,
  SearchItem,
  SearchFilters,
  PaginationParams,
  SortParams,

  // Faceted search types
  FacetedSearchParams,
  FacetedSearchResult,
  Facet,
  FacetValue,

  // Filter types
  FilterConfig,
  FilterType,
  FilterOption,
  FilterValidation,

  // Suggestion types
  SuggestionParams,
  SuggestionResult,
  Suggestion,
  SuggestionContext,

  // Analytics types
  SearchTrackingData,
  SearchMetrics,
  QueryMetric,
  FilterMetric,
  AnalyticsOptions,

  // Saved search types
  SavedSearch,
  NotificationSettings,
  SearchHistoryItem,

  // Export types
  ExportOptions,

  // Configuration types
  SearchConfig,
  SearchEngineConfig,
  SuggestionConfig,
  AnalyticsConfig,
  CacheConfig,
  FeatureConfig,

  // Event types
  SearchEvent,
  SearchEventType,

  // Error types
  SearchError,
  SearchErrorCode
} from './types';

// Default export for convenience
const SearchAdvanced = {
  // Services
  SearchService,
  FacetedSearchService,
  SearchSuggestionService,
  SearchAnalyticsService,
  SavedSearchService,

  // Engines
  InMemoryEngine,
  ElasticsearchEngine,
  AlgoliaEngine,
  MeilisearchEngine,

  // Builders
  FilterBuilder,

  // Components
  SearchBox,
  SearchFilters,
  SearchResults,

  // Hooks
  useSearch,
  useSuggestions,

  // Configuration
  configure: configureSearch,
  getConfig: getSearchConfig,
  defaultConfig
};

export default SearchAdvanced;