/**
 * @company/ui-tables - Export Utilities
 * 
 * 테이블 데이터 내보내기 유틸리티
 */

import { ColumnConfig } from '../types';

/**
 * CSV로 내보내기
 */
export function exportToCSV<T>(
  data: T[],
  columns: ColumnConfig<T>[],
  filename: string = 'table-export.csv'
): void {
  const visibleColumns = columns.filter(col => !col.hidden);
  
  // 헤더 생성
  const headers = visibleColumns.map(col => 
    typeof col.header === 'string' ? col.header : String(col.key)
  );
  
  // 행 데이터 생성
  const rows = data.map(row => 
    visibleColumns.map(col => {
      const value = row[col.key as keyof T];
      return formatCellValue(value);
    })
  );
  
  // CSV 문자열 생성
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // 다운로드
  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * JSON으로 내보내기
 */
export function exportToJSON<T>(
  data: T[],
  filename: string = 'table-export.json'
): void {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}

/**
 * 셀 값 포맷팅
 */
function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' && value.includes(',')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return String(value);
}

/**
 * 파일 다운로드
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 선택된 행만 내보내기
 */
export function exportSelectedRows<T>(
  data: T[],
  selectedRows: T[],
  columns: ColumnConfig<T>[],
  format: 'csv' | 'json',
  filename?: string
): void {
  const exportData = selectedRows.length > 0 ? selectedRows : data;
  
  if (format === 'csv') {
    exportToCSV(exportData, columns, filename);
  } else {
    exportToJSON(exportData, filename);
  }
}