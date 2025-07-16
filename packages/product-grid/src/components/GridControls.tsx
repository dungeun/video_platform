import React from 'react';
import type { GridControlsProps, GridLayout, GridColumns } from '../types';

export const GridControls: React.FC<GridControlsProps> = ({
  layout,
  columns,
  sortBy,
  totalItems,
  onLayoutChange,
  onColumnsChange,
  onSortChange,
  sortOptions,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center gap-4">
        {/* Layout Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">보기:</span>
          <div className="flex gap-1">
            <button
              onClick={() => onLayoutChange('grid')}
              className={`p-2 rounded transition-colors ${
                layout === 'grid' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="그리드 보기"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onLayoutChange('list')}
              className={`p-2 rounded transition-colors ${
                layout === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="리스트 보기"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Columns Selector (Grid layout only) */}
        {layout === 'grid' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">열:</span>
            <select
              value={columns}
              onChange={(e) => onColumnsChange(Number(e.target.value) as GridColumns)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
              <option value={6}>6</option>
            </select>
          </div>
        )}

        {/* Total Items */}
        <span className="text-sm text-gray-600">
          총 {totalItems.toLocaleString()}개
        </span>
      </div>

      {/* Sort Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">정렬:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};