import { SearchConfig } from '../types';

let globalConfig: SearchConfig | null = null;

/**
 * Configure the search module
 */
export const configureSearch = (config: SearchConfig): void => {
  globalConfig = config;
};

/**
 * Get the current search configuration
 */
export const getSearchConfig = (): SearchConfig => {
  if (!globalConfig) {
    throw new Error('Search module not configured. Call configureSearch() first.');
  }
  return globalConfig;
};

/**
 * Default configuration
 */
export const defaultConfig: SearchConfig = {
  engine: {
    type: 'custom',
    endpoint: '',
    index: 'default'
  },
  suggestions: {
    enabled: true,
    minChars: 2,
    maxSuggestions: 10,
    debounceMs: 300,
    sources: ['history', 'popular']
  },
  analytics: {
    enabled: true,
    trackClicks: true,
    trackConversions: false,
    anonymizeData: true,
    retentionDays: 30
  },
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 1000,
    strategy: 'lru'
  },
  features: {
    facets: true,
    suggestions: true,
    savedSearches: true,
    analytics: true,
    export: true,
    history: true
  }
};

/**
 * Merge user config with defaults
 */
export const mergeConfig = (userConfig: Partial<SearchConfig>): SearchConfig => {
  return {
    engine: { ...defaultConfig.engine, ...userConfig.engine },
    suggestions: { ...defaultConfig.suggestions, ...userConfig.suggestions },
    analytics: { ...defaultConfig.analytics, ...userConfig.analytics },
    cache: { ...defaultConfig.cache, ...userConfig.cache },
    features: { ...defaultConfig.features, ...userConfig.features }
  };
};