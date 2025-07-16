// Search Types
export interface SearchParams {
  query: string;
  filters?: SearchFilters;
  pagination?: PaginationParams;
  sort?: SortParams;
  fields?: string[];
  highlight?: boolean;
}

export interface AdvancedSearchParams extends SearchParams {
  fuzzy?: boolean;
  synonyms?: boolean;
  boost?: Record<string, number>;
  aggregations?: string[];
}

export interface SearchFilters {
  [key: string]: any;
  category?: string | string[];
  priceRange?: { min?: number; max?: number };
  dateRange?: { start?: Date; end?: Date };
  tags?: string[];
  attributes?: Record<string, any>;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface SearchResult<T = any> {
  items: SearchItem<T>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  took: number;
  query: string;
  filters: SearchFilters;
}

export interface SearchItem<T = any> {
  id: string;
  score: number;
  source: T;
  highlights?: Record<string, string[]>;
}

// Faceted Search Types
export interface FacetedSearchParams extends SearchParams {
  requestedFacets: string[];
  facetSize?: number;
}

export interface FacetedSearchResult<T = any> extends SearchResult<T> {
  facets: Facet[];
}

export interface Facet {
  field: string;
  label: string;
  type: 'term' | 'range' | 'date' | 'hierarchical';
  values: FacetValue[];
}

export interface FacetValue {
  value: any;
  label: string;
  count: number;
  selected?: boolean;
  children?: FacetValue[];
}

// Filter Types
export interface FilterConfig {
  field: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  validation?: FilterValidation;
}

export type FilterType = 
  | 'text' 
  | 'number' 
  | 'range' 
  | 'date' 
  | 'dateRange' 
  | 'select' 
  | 'multiSelect' 
  | 'boolean'
  | 'hierarchical';

export interface FilterOption {
  value: any;
  label: string;
  count?: number;
}

export interface FilterValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: (value: any) => boolean | string;
}

// Suggestion Types
export interface SuggestionParams {
  query: string;
  limit?: number;
  fuzzy?: boolean;
  context?: SuggestionContext;
}

export interface SuggestionContext {
  category?: string;
  previousSearches?: string[];
  userPreferences?: Record<string, any>;
}

export interface SuggestionResult {
  suggestions: Suggestion[];
  related: string[];
  took: number;
}

export interface Suggestion {
  text: string;
  score: number;
  payload?: any;
  type: 'query' | 'product' | 'category' | 'brand';
}

// Analytics Types
export interface SearchTrackingData {
  query: string;
  filters?: SearchFilters;
  resultsCount: number;
  clickedResults?: string[];
  searchTime: number;
  userId?: string;
  sessionId: string;
  timestamp: Date;
}

export interface SearchMetrics {
  totalSearches: number;
  uniqueUsers: number;
  avgSearchTime: number;
  avgResultsCount: number;
  topQueries: QueryMetric[];
  topFilters: FilterMetric[];
  conversionRate: number;
  clickThroughRate: number;
}

export interface QueryMetric {
  query: string;
  count: number;
  avgResultsCount: number;
  clickRate: number;
}

export interface FilterMetric {
  filter: string;
  value: any;
  count: number;
  conversionRate: number;
}

export interface AnalyticsOptions {
  timeframe: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';
  customRange?: { start: Date; end: Date };
  limit?: number;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

// Saved Search Types
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  description?: string;
  query: string;
  filters: SearchFilters;
  sort?: SortParams;
  notification?: NotificationSettings;
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  runCount: number;
}

export interface NotificationSettings {
  enabled: boolean;
  frequency: 'realtime' | 'daily' | 'weekly';
  channel: 'email' | 'push' | 'both';
  threshold?: number;
}

// Search History Types
export interface SearchHistoryItem {
  id: string;
  userId: string;
  query: string;
  filters: SearchFilters;
  resultsCount: number;
  timestamp: Date;
  clickedResults: string[];
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  fields?: string[];
  limit?: number;
  includeScore?: boolean;
  includeHighlights?: boolean;
}

// Configuration Types
export interface SearchConfig {
  engine: SearchEngineConfig;
  suggestions?: SuggestionConfig;
  analytics?: AnalyticsConfig;
  cache?: CacheConfig;
  features?: FeatureConfig;
}

export interface SearchEngineConfig {
  type: 'elasticsearch' | 'algolia' | 'meilisearch' | 'custom';
  endpoint: string;
  apiKey?: string;
  index?: string;
  options?: Record<string, any>;
}

export interface SuggestionConfig {
  enabled: boolean;
  minChars: number;
  maxSuggestions: number;
  debounceMs: number;
  sources: ('history' | 'popular' | 'ai')[];
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackClicks: boolean;
  trackConversions: boolean;
  anonymizeData: boolean;
  retentionDays: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'lfu' | 'fifo';
}

export interface FeatureConfig {
  facets: boolean;
  suggestions: boolean;
  savedSearches: boolean;
  analytics: boolean;
  export: boolean;
  history: boolean;
}

// Event Types
export interface SearchEvent {
  type: SearchEventType;
  payload: any;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

export type SearchEventType = 
  | 'search.performed'
  | 'search.completed'
  | 'search.failed'
  | 'result.clicked'
  | 'filter.applied'
  | 'filter.removed'
  | 'suggestion.selected'
  | 'search.saved'
  | 'search.exported';

// Error Types
export interface SearchError extends Error {
  code: SearchErrorCode;
  details?: any;
}

export type SearchErrorCode =
  | 'SEARCH_ENGINE_ERROR'
  | 'INVALID_QUERY'
  | 'INVALID_FILTERS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED'
  | 'INDEX_NOT_FOUND'
  | 'NETWORK_ERROR';