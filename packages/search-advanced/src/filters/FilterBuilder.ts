import { 
  FilterConfig, 
  FilterType, 
  FilterOption, 
  FilterValidation,
  SearchFilters 
} from '../types';
import { Logger } from '@company/core';

export class FilterBuilder {
  private filters: Map<string, FilterConfig> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger('FilterBuilder');
  }

  /**
   * Add a text filter
   */
  addTextFilter(field: string, label: string, validation?: FilterValidation): this {
    this.addFilter({
      field,
      label,
      type: 'text',
      validation
    });
    return this;
  }

  /**
   * Add a number filter
   */
  addNumberFilter(
    field: string, 
    label: string, 
    validation?: FilterValidation
  ): this {
    this.addFilter({
      field,
      label,
      type: 'number',
      validation: {
        ...validation,
        pattern: '^-?[0-9]+(\\.[0-9]+)?$'
      }
    });
    return this;
  }

  /**
   * Add a range filter
   */
  addRangeFilter(
    field: string, 
    label: string, 
    min?: number, 
    max?: number
  ): this {
    this.addFilter({
      field,
      label,
      type: 'range',
      validation: { min, max }
    });
    return this;
  }

  /**
   * Add a date filter
   */
  addDateFilter(field: string, label: string): this {
    this.addFilter({
      field,
      label,
      type: 'date'
    });
    return this;
  }

  /**
   * Add a date range filter
   */
  addDateRangeFilter(field: string, label: string): this {
    this.addFilter({
      field,
      label,
      type: 'dateRange'
    });
    return this;
  }

  /**
   * Add a select filter
   */
  addSelectFilter(
    field: string, 
    label: string, 
    options: FilterOption[]
  ): this {
    this.addFilter({
      field,
      label,
      type: 'select',
      options
    });
    return this;
  }

  /**
   * Add a multi-select filter
   */
  addMultiSelectFilter(
    field: string, 
    label: string, 
    options: FilterOption[]
  ): this {
    this.addFilter({
      field,
      label,
      type: 'multiSelect',
      options
    });
    return this;
  }

  /**
   * Add a boolean filter
   */
  addBooleanFilter(field: string, label: string): this {
    this.addFilter({
      field,
      label,
      type: 'boolean',
      options: [
        { value: true, label: 'Yes' },
        { value: false, label: 'No' }
      ]
    });
    return this;
  }

  /**
   * Add a hierarchical filter
   */
  addHierarchicalFilter(
    field: string, 
    label: string, 
    options: FilterOption[]
  ): this {
    this.addFilter({
      field,
      label,
      type: 'hierarchical',
      options
    });
    return this;
  }

  /**
   * Add a custom filter
   */
  addFilter(config: FilterConfig): this {
    this.filters.set(config.field, config);
    this.logger.debug('Filter added', { field: config.field, type: config.type });
    return this;
  }

  /**
   * Build filters array
   */
  build(): FilterConfig[] {
    return Array.from(this.filters.values());
  }

  /**
   * Build filter map
   */
  buildMap(): Map<string, FilterConfig> {
    return new Map(this.filters);
  }

  /**
   * Validate filter values
   */
  validateFilters(values: SearchFilters): string[] {
    const errors: string[] = [];

    this.filters.forEach((config, field) => {
      const value = values[field];
      if (value !== undefined) {
        const error = this.validateFilter(config, value);
        if (error) {
          errors.push(`${config.label}: ${error}`);
        }
      } else if (config.validation?.required) {
        errors.push(`${config.label} is required`);
      }
    });

    return errors;
  }

  /**
   * Validate a single filter
   */
  private validateFilter(config: FilterConfig, value: any): string | null {
    const { validation, type } = config;

    if (!validation) {
      return null;
    }

    // Type-specific validation
    switch (type) {
      case 'number':
      case 'range':
        if (typeof value === 'number') {
          if (validation.min !== undefined && value < validation.min) {
            return `Must be at least ${validation.min}`;
          }
          if (validation.max !== undefined && value > validation.max) {
            return `Must be at most ${validation.max}`;
          }
        } else if (type === 'range' && typeof value === 'object') {
          if (value.min !== undefined && validation.min !== undefined && value.min < validation.min) {
            return `Minimum must be at least ${validation.min}`;
          }
          if (value.max !== undefined && validation.max !== undefined && value.max > validation.max) {
            return `Maximum must be at most ${validation.max}`;
          }
        }
        break;

      case 'text':
        if (validation.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            return 'Invalid format';
          }
        }
        break;

      case 'multiSelect':
        if (!Array.isArray(value)) {
          return 'Must be an array';
        }
        break;
    }

    // Custom validation
    if (validation.custom) {
      const result = validation.custom(value);
      if (typeof result === 'string') {
        return result;
      } else if (!result) {
        return 'Invalid value';
      }
    }

    return null;
  }

  /**
   * Apply defaults to filter values
   */
  applyDefaults(values: SearchFilters): SearchFilters {
    const result = { ...values };

    this.filters.forEach((config, field) => {
      if (result[field] === undefined) {
        // Apply default based on type
        switch (config.type) {
          case 'boolean':
            result[field] = false;
            break;
          case 'multiSelect':
            result[field] = [];
            break;
          case 'range':
            if (config.validation?.min !== undefined || config.validation?.max !== undefined) {
              result[field] = {
                min: config.validation.min,
                max: config.validation.max
              };
            }
            break;
        }
      }
    });

    return result;
  }

  /**
   * Clean filter values (remove empty/invalid)
   */
  cleanFilters(values: SearchFilters): SearchFilters {
    const cleaned: SearchFilters = {};

    Object.entries(values).forEach(([key, value]) => {
      const config = this.filters.get(key);
      if (!config) {
        return; // Skip unknown filters
      }

      // Check if value is meaningful
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length === 0) {
          return; // Skip empty arrays
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Check for empty objects or ranges
          const hasValues = Object.values(value).some(v => v !== undefined && v !== null);
          if (!hasValues) {
            return;
          }
        }
        cleaned[key] = value;
      }
    });

    return cleaned;
  }

  /**
   * Create common e-commerce filters
   */
  static createEcommerceFilters(): FilterBuilder {
    const builder = new FilterBuilder();

    return builder
      .addMultiSelectFilter('category', 'Category', [])
      .addMultiSelectFilter('brand', 'Brand', [])
      .addRangeFilter('price', 'Price', 0, 10000)
      .addMultiSelectFilter('color', 'Color', [])
      .addMultiSelectFilter('size', 'Size', [])
      .addRangeFilter('rating', 'Rating', 0, 5)
      .addBooleanFilter('inStock', 'In Stock')
      .addBooleanFilter('onSale', 'On Sale')
      .addDateRangeFilter('dateAdded', 'Date Added');
  }

  /**
   * Create common content filters
   */
  static createContentFilters(): FilterBuilder {
    const builder = new FilterBuilder();

    return builder
      .addMultiSelectFilter('category', 'Category', [])
      .addMultiSelectFilter('tags', 'Tags', [])
      .addMultiSelectFilter('author', 'Author', [])
      .addDateRangeFilter('publishDate', 'Publish Date')
      .addSelectFilter('status', 'Status', [
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
        { value: 'archived', label: 'Archived' }
      ])
      .addSelectFilter('visibility', 'Visibility', [
        { value: 'public', label: 'Public' },
        { value: 'private', label: 'Private' },
        { value: 'protected', label: 'Protected' }
      ]);
  }
}