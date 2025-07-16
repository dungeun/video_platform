/**
 * @repo/ui-tables - TableToolbar Component
 * 테이블 툴바 컴포넌트 (검색, 필터, 액션 버튼 등)
 */

import React, { ReactNode } from 'react';

/**
 * TableToolbar Props
 */
export interface TableToolbarProps {
  /**
   * 검색 기능 활성화
   */
  searchable?: boolean;
  
  /**
   * 검색 플레이스홀더
   */
  searchPlaceholder?: string;
  
  /**
   * 검색 값
   */
  searchValue?: string;
  
  /**
   * 검색 변경 콜백
   */
  onSearchChange?: (value: string) => void;
  
  /**
   * 컬럼 관리 기능 활성화
   */
  columnManagement?: boolean;
  
  /**
   * 컬럼 관리 콜백
   */
  onColumnManagement?: () => void;
  
  /**
   * 엑스포트 기능 활성화
   */
  exportable?: boolean;
  
  /**
   * 엑스포트 콜백
   */
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  
  /**
   * 새로고침 기능 활성화
   */
  refreshable?: boolean;
  
  /**
   * 새로고침 콜백
   */
  onRefresh?: () => void;
  
  /**
   * 커스텀 액션들
   */
  customActions?: ReactNode;
  
  /**
   * 클래스명
   */
  className?: string;
}

/**
 * TableToolbar 컴포넌트
 */
export function TableToolbar({
  searchable = false,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  columnManagement = false,
  onColumnManagement,
  exportable = false,
  onExport,
  refreshable = false,
  onRefresh,
  customActions,
  className = ''
}: TableToolbarProps) {
  // 엑스포트 드롭다운 상태
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  return (
    <div className={`table-toolbar ${className}`}>
      {/* 왼쪽 영역 - 검색 */}
      <div className="toolbar-left">
        {searchable && (
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
        )}
      </div>

      {/* 오른쪽 영역 - 액션 버튼들 */}
      <div className="toolbar-right">
        {/* 커스텀 액션들 */}
        {customActions}

        {/* 컬럼 관리 버튼 */}
        {columnManagement && (
          <button
            className="toolbar-btn column-btn"
            onClick={onColumnManagement}
            title="Manage Columns"
          >
            ⚙️ Columns
          </button>
        )}

        {/* 엑스포트 버튼 */}
        {exportable && (
          <div className="export-container">
            <button
              className="toolbar-btn export-btn"
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Export Data"
            >
              📥 Export
            </button>
            
            {showExportMenu && (
              <div className="export-menu">
                <button
                  className="export-option"
                  onClick={() => {
                    onExport?.('csv');
                    setShowExportMenu(false);
                  }}
                >
                  📄 CSV
                </button>
                <button
                  className="export-option"
                  onClick={() => {
                    onExport?.('excel');
                    setShowExportMenu(false);
                  }}
                >
                  📊 Excel
                </button>
                <button
                  className="export-option"
                  onClick={() => {
                    onExport?.('pdf');
                    setShowExportMenu(false);
                  }}
                >
                  📑 PDF
                </button>
              </div>
            )}
          </div>
        )}

        {/* 새로고침 버튼 */}
        {refreshable && (
          <button
            className="toolbar-btn refresh-btn"
            onClick={onRefresh}
            title="Refresh Data"
          >
            🔄 Refresh
          </button>
        )}
      </div>
    </div>
  );
}

export default TableToolbar;