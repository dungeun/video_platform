/**
 * @company/ui-tables - ColumnManager Component
 * 
 * 테이블 컬럼 관리 컴포넌트
 */

import React, { useState } from 'react';
import { ColumnManagerProps } from '../types';
import { mergeTableClasses } from '../utils/tableTheme';

export function ColumnManager<T>({
  columns,
  onColumnsChange,
  allowHiding = true,
  allowReordering = true,
  className
}: ColumnManagerProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleToggleVisibility = (key: keyof T | string) => {
    const updated = columns.map(col =>
      col.key === key ? { ...col, hidden: !col.hidden } : col
    );
    onColumnsChange(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newColumns = [...columns];
    const draggedColumn = newColumns[draggedIndex];
    if (draggedColumn) {
      newColumns.splice(draggedIndex, 1);
      newColumns.splice(index, 0, draggedColumn);
    }
    
    onColumnsChange(newColumns);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const visibleCount = columns.filter(col => !col.hidden).length;

  return (
    <div className={mergeTableClasses('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        Manage Columns ({visibleCount}/{columns.length})
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50 p-4">
            <h3 className="text-sm font-semibold mb-3">Column Settings</h3>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {columns.map((column, index) => {
                const label = typeof column.header === 'string' 
                  ? column.header 
                  : String(column.key);
                
                return (
                  <div
                    key={String(column.key)}
                    draggable={allowReordering}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={mergeTableClasses(
                      'flex items-center justify-between p-2 rounded',
                      'hover:bg-gray-50',
                      allowReordering ? 'cursor-move' : undefined,
                      draggedIndex === index ? 'opacity-50' : undefined
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {allowReordering && (
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                          />
                        </svg>
                      )}
                      <span className="text-sm">{label}</span>
                    </div>
                    
                    {allowHiding && (
                      <input
                        type="checkbox"
                        checked={!column.hidden}
                        onChange={() => handleToggleVisibility(column.key)}
                        className="w-4 h-4"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t flex justify-between">
              <button
                onClick={() => {
                  const allVisible = columns.map(col => ({ ...col, hidden: false }));
                  onColumnsChange(allVisible);
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Show All
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}