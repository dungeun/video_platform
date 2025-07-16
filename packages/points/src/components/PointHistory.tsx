import React, { useState } from 'react';
import { 
  PointTransaction, 
  PointTransactionType, 
  PointStatus,
  PointHistoryFilter 
} from '../types';

interface PointHistoryProps {
  transactions: PointTransaction[];
  onFilterChange?: (filter: Partial<PointHistoryFilter>) => void;
  loading?: boolean;
  pagination?: {
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange?: (page: number) => void;
  className?: string;
}

export const PointHistory: React.FC<PointHistoryProps> = ({
  transactions,
  onFilterChange,
  loading = false,
  pagination,
  onPageChange,
  className = ''
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'earn' | 'spend'>('all');

  const formatNumber = (num: number): string => {
    return num.toLocaleString('ko-KR');
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: PointTransactionType): string => {
    switch (type) {
      case PointTransactionType.EARN:
        return '+';
      case PointTransactionType.SPEND:
        return '-';
      case PointTransactionType.EXPIRE:
        return '⏰';
      case PointTransactionType.CANCEL:
        return '↩';
      case PointTransactionType.REFUND:
        return '↺';
      default:
        return '•';
    }
  };

  const getTransactionColor = (type: PointTransactionType): string => {
    switch (type) {
      case PointTransactionType.EARN:
      case PointTransactionType.REFUND:
        return 'text-green-600';
      case PointTransactionType.SPEND:
      case PointTransactionType.EXPIRE:
        return 'text-red-600';
      case PointTransactionType.CANCEL:
        return 'text-gray-500';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: PointStatus): JSX.Element => {
    const statusConfig = {
      [PointStatus.AVAILABLE]: { text: '사용가능', className: 'bg-green-100 text-green-800' },
      [PointStatus.PENDING]: { text: '대기중', className: 'bg-yellow-100 text-yellow-800' },
      [PointStatus.USED]: { text: '사용완료', className: 'bg-gray-100 text-gray-800' },
      [PointStatus.EXPIRED]: { text: '만료', className: 'bg-red-100 text-red-800' },
      [PointStatus.CANCELLED]: { text: '취소', className: 'bg-gray-100 text-gray-600' },
      [PointStatus.LOCKED]: { text: '잠김', className: 'bg-orange-100 text-orange-800' }
    };

    const config = statusConfig[status];
    return (
      <span className={`inline-flex text-xs px-2 py-1 rounded-full ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const handleFilterChange = (filter: 'all' | 'earn' | 'spend') => {
    setActiveFilter(filter);
    if (onFilterChange) {
      const types = filter === 'all' 
        ? undefined 
        : filter === 'earn'
        ? [PointTransactionType.EARN, PointTransactionType.REFUND]
        : [PointTransactionType.SPEND];
      
      onFilterChange({ types });
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* 헤더 & 필터 */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold mb-3">포인트 내역</h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => handleFilterChange('earn')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              activeFilter === 'earn'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            적립
          </button>
          <button
            onClick={() => handleFilterChange('spend')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              activeFilter === 'spend'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            사용
          </button>
        </div>
      </div>

      {/* 거래 목록 */}
      <div className="divide-y">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            로딩 중...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            포인트 내역이 없습니다.
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className={`text-lg font-semibold mr-2 ${getTransactionColor(transaction.type)}`}>
                      {getTransactionIcon(transaction.type)}
                    </span>
                    <h4 className="font-medium text-gray-900">
                      {transaction.description}
                    </h4>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <span>{formatDate(transaction.createdAt)}</span>
                    {transaction.orderId && (
                      <span>주문번호: {transaction.orderId}</span>
                    )}
                    {getStatusBadge(transaction.status)}
                  </div>

                  {transaction.expiresAt && transaction.status === PointStatus.AVAILABLE && (
                    <div className="mt-1 text-xs text-gray-400">
                      만료일: {formatDate(transaction.expiresAt)}
                    </div>
                  )}
                </div>

                <div className="text-right ml-4">
                  <div className={`text-lg font-semibold ${getTransactionColor(transaction.type)}`}>
                    {transaction.amount > 0 ? '+' : ''}{formatNumber(transaction.amount)} P
                  </div>
                  <div className="text-sm text-gray-500">
                    잔액: {formatNumber(transaction.balance)} P
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            총 {pagination.total}개 중 {((pagination.page - 1) * 20) + 1}-
            {Math.min(pagination.page * 20, pagination.total)}개 표시
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className={`px-3 py-1 text-sm rounded-md ${
                pagination.hasPrev
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              이전
            </button>
            
            <span className="px-3 py-1 text-sm">
              {pagination.page} / {pagination.totalPages}
            </span>
            
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className={`px-3 py-1 text-sm rounded-md ${
                pagination.hasNext
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
};