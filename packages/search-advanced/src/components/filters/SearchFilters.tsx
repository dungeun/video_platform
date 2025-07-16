import React, { useState, useEffect } from 'react';
import { FilterConfig, SearchFilters as SearchFiltersType } from '../../types';

export interface SearchFiltersProps {
  filters: FilterConfig[];
  values: SearchFiltersType;
  onChange: (filters: SearchFiltersType) => void;
  layout?: 'vertical' | 'horizontal' | 'sidebar';
  collapsible?: boolean;
  className?: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  values,
  onChange,
  layout = 'vertical',
  collapsible = false,
  className = ''
}) => {
  const [localValues, setLocalValues] = useState<SearchFiltersType>(values);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const handleFilterChange = (field: string, value: any) => {
    const newValues = { ...localValues, [field]: value };
    setLocalValues(newValues);
    onChange(newValues);
  };

  const handleFilterClear = (field: string) => {
    const newValues = { ...localValues };
    delete newValues[field];
    setLocalValues(newValues);
    onChange(newValues);
  };

  const handleClearAll = () => {
    setLocalValues({});
    onChange({});
  };

  const toggleCollapse = (field: string) => {
    setCollapsed(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const renderFilter = (filter: FilterConfig) => {
    const value = localValues[filter.field];
    const isCollapsed = collapsed[filter.field];

    return (
      <div key={filter.field} className="filter-group mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {filter.label}
            {filter.validation?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="flex items-center space-x-2">
            {value !== undefined && (
              <button
                onClick={() => handleFilterClear(filter.field)}
                className="text-xs text-gray-500 hover:text-red-500"
                title="Clear filter"
              >
                Clear
              </button>
            )}
            {collapsible && (
              <button
                onClick={() => toggleCollapse(filter.field)}
                className="text-xs text-gray-500"
              >
                {isCollapsed ? '▼' : '▲'}
              </button>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <div className="filter-input">
            {renderFilterInput(filter, value)}
          </div>
        )}
      </div>
    );
  };

  const renderFilterInput = (filter: FilterConfig, value: any) => {
    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Enter ${filter.label.toLowerCase()}`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.field, Number(e.target.value))}
            min={filter.validation?.min}
            max={filter.validation?.max}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'range':
        return (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={value?.min || ''}
                onChange={(e) => handleFilterChange(filter.field, {
                  ...value,
                  min: Number(e.target.value)
                })}
                min={filter.validation?.min}
                max={filter.validation?.max}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={value?.max || ''}
                onChange={(e) => handleFilterChange(filter.field, {
                  ...value,
                  max: Number(e.target.value)
                })}
                min={filter.validation?.min}
                max={filter.validation?.max}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {filter.validation?.min !== undefined && filter.validation?.max !== undefined && (
              <input
                type="range"
                min={filter.validation.min}
                max={filter.validation.max}
                value={value?.min || filter.validation.min}
                onChange={(e) => handleFilterChange(filter.field, {
                  ...value,
                  min: Number(e.target.value),
                  max: value?.max || filter.validation!.max
                })}
                className="w-full"
              />
            )}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'dateRange':
        return (
          <div className="space-y-2">
            <input
              type="date"
              placeholder="Start date"
              value={value?.start || ''}
              onChange={(e) => handleFilterChange(filter.field, {
                ...value,
                start: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              placeholder="End date"
              value={value?.end || ''}
              onChange={(e) => handleFilterChange(filter.field, {
                ...value,
                end: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select {filter.label}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} {option.count && `(${option.count})`}
              </option>
            ))}
          </select>
        );

      case 'multiSelect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {filter.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter(v => v !== option.value);
                    handleFilterChange(filter.field, newValues);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">
                  {option.label} {option.count && `(${option.count})`}
                </span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={value === true}
                onChange={() => handleFilterChange(filter.field, true)}
                className="border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={value === false}
                onChange={() => handleFilterChange(filter.field, false)}
                className="border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">No</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={value === undefined}
                onChange={() => handleFilterClear(filter.field)}
                className="border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Any</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  const layoutClasses = {
    vertical: 'space-y-4',
    horizontal: 'flex flex-wrap gap-4',
    sidebar: 'space-y-4 w-64'
  };

  return (
    <div className={`search-filters ${layoutClasses[layout]} ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <button
          onClick={handleClearAll}
          className="text-sm text-gray-500 hover:text-red-500"
        >
          Clear All
        </button>
      </div>
      
      {filters.map(renderFilter)}
    </div>
  );
};