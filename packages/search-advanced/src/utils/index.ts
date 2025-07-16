import { SearchFilters, FilterConfig } from '../types';

/**
 * Validate search query
 */
export const validateQuery = (query: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (query.length > 1000) {
    errors.push('Query is too long (max 1000 characters)');
  }

  // Check for potentially harmful patterns
  const harmfulPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(query)) {
      errors.push('Query contains potentially harmful content');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize search query
 */
export const sanitizeQuery = (query: string): string => {
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/\s+/g, ' '); // Normalize whitespace
};

/**
 * Validate search filters
 */
export const validateFilters = (
  filters: SearchFilters,
  config: FilterConfig[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const configMap = new Map(config.map(c => [c.field, c]));

  Object.entries(filters).forEach(([field, value]) => {
    const filterConfig = configMap.get(field);
    
    if (!filterConfig) {
      errors.push(`Unknown filter: ${field}`);
      return;
    }

    // Type validation
    switch (filterConfig.type) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${filterConfig.label} must be a valid number`);
        }
        break;
      case 'range':
        if (typeof value !== 'object' || !value) {
          errors.push(`${filterConfig.label} must be a range object`);
        } else {
          if (value.min !== undefined && (typeof value.min !== 'number' || isNaN(value.min))) {
            errors.push(`${filterConfig.label} minimum must be a valid number`);
          }
          if (value.max !== undefined && (typeof value.max !== 'number' || isNaN(value.max))) {
            errors.push(`${filterConfig.label} maximum must be a valid number`);
          }
          if (value.min !== undefined && value.max !== undefined && value.min > value.max) {
            errors.push(`${filterConfig.label} minimum cannot be greater than maximum`);
          }
        }
        break;
      case 'multiSelect':
        if (!Array.isArray(value)) {
          errors.push(`${filterConfig.label} must be an array`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${filterConfig.label} must be a boolean`);
        }
        break;
    }

    // Additional validation from config
    if (filterConfig.validation) {
      const { validation } = filterConfig;
      
      if (validation.required && (value === undefined || value === null || value === '')) {
        errors.push(`${filterConfig.label} is required`);
      }
      
      if (validation.min !== undefined && typeof value === 'number' && value < validation.min) {
        errors.push(`${filterConfig.label} must be at least ${validation.min}`);
      }
      
      if (validation.max !== undefined && typeof value === 'number' && value > validation.max) {
        errors.push(`${filterConfig.label} must be at most ${validation.max}`);
      }
      
      if (validation.pattern && typeof value === 'string') {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
          errors.push(`${filterConfig.label} has invalid format`);
        }
      }
      
      if (validation.custom) {
        const result = validation.custom(value);
        if (typeof result === 'string') {
          errors.push(`${filterConfig.label}: ${result}`);
        } else if (!result) {
          errors.push(`${filterConfig.label} is invalid`);
        }
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Clean empty filters
 */
export const cleanFilters = (filters: SearchFilters): SearchFilters => {
  const cleaned: SearchFilters = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          cleaned[key] = value;
        }
      } else if (typeof value === 'object') {
        // Check for empty range objects
        const hasValues = Object.values(value).some(v => v !== undefined && v !== null && v !== '');
        if (hasValues) {
          cleaned[key] = value;
        }
      } else {
        cleaned[key] = value;
      }
    }
  });

  return cleaned;
};

/**
 * Generate cache key for search parameters
 */
export const generateCacheKey = (params: {
  query?: string;
  filters?: SearchFilters;
  sort?: any;
  pagination?: any;
}): string => {
  const normalized = {
    query: params.query || '',
    filters: cleanFilters(params.filters || {}),
    sort: params.sort,
    pagination: params.pagination
  };

  return btoa(JSON.stringify(normalized)).replace(/[+/=]/g, '');
};

/**
 * Extract keywords from query
 */
export const extractKeywords = (query: string): string[] => {
  return query
    .toLowerCase()
    .split(/\\s+/)
    .filter(word => word.length > 2) // Filter out short words
    .filter(word => !/^(and|or|not|the|is|at|which|on)$/.test(word)) // Filter out stop words
    .slice(0, 10); // Limit to 10 keywords
};

/**
 * Highlight text with query matches
 */
export const highlightText = (text: string, query: string): string => {
  if (!query || !text) return text;

  const words = query.toLowerCase().split(/\\s+/).filter(w => w.length > 1);
  let highlighted = text;

  words.forEach(word => {
    const regex = new RegExp(`(${escapeRegex(word)})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });

  return highlighted;
};

/**
 * Escape regex special characters
 */
export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
};

/**
 * Format search result count
 */
export const formatResultCount = (count: number): string => {
  if (count === 0) return 'No results';
  if (count === 1) return '1 result';
  if (count < 1000) return `${count} results`;
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K results`;
  return `${(count / 1000000).toFixed(1)}M results`;
};

/**
 * Format search time
 */
export const formatSearchTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

/**
 * Parse query for advanced syntax
 */
export const parseAdvancedQuery = (query: string): {
  terms: string[];
  phrases: string[];
  excluded: string[];
  required: string[];
} => {
  const terms: string[] = [];
  const phrases: string[] = [];
  const excluded: string[] = [];
  const required: string[] = [];

  // Extract quoted phrases
  const phraseMatches = query.match(/"([^"]+)"/g);
  if (phraseMatches) {
    phrases.push(...phraseMatches.map(p => p.slice(1, -1)));
    query = query.replace(/"[^"]+"/g, '');
  }

  // Extract excluded terms (-)
  const excludedMatches = query.match(/-\\w+/g);
  if (excludedMatches) {
    excluded.push(...excludedMatches.map(e => e.slice(1)));
    query = query.replace(/-\\w+/g, '');
  }

  // Extract required terms (+)
  const requiredMatches = query.match(/\\+\\w+/g);
  if (requiredMatches) {
    required.push(...requiredMatches.map(r => r.slice(1)));
    query = query.replace(/\\+\\w+/g, '');
  }

  // Remaining terms
  terms.push(...query.split(/\\s+/).filter(t => t.length > 0));

  return { terms, phrases, excluded, required };
};

/**
 * Deep merge objects
 */
export const deepMerge = <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
  const result = { ...target };

  Object.keys(source).forEach(key => {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue as T[Extract<keyof T, string>];
    }
  });

  return result;
};