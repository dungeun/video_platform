import React, { useState, useEffect } from 'react';
import {
  NotificationDelivery,
  NotificationType,
  DeliveryStatus
} from '../types';

interface NotificationHistoryProps {
  deliveries: NotificationDelivery[];
  onRefresh?: () => Promise<void>;
  onResend?: (delivery: NotificationDelivery) => Promise<void>;
  className?: string;
}

export const NotificationHistory: React.FC<NotificationHistoryProps> = ({
  deliveries,
  onRefresh,
  onResend,
  className = ''
}) => {
  const [filter, setFilter] = useState({
    type: '' as NotificationType | '',
    status: '' as DeliveryStatus | '',
    search: ''
  });
  const [sortBy, setSortBy] = useState<'sentAt' | 'type' | 'status'>('sentAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshing, setRefreshing] = useState(false);

  const getStatusBadge = (status: DeliveryStatus) => {
    const statusConfig = {
      [DeliveryStatus.PENDING]: { bg: 'bg-gray-100', text: 'text-gray-700', label: '대기중' },
      [DeliveryStatus.QUEUED]: { bg: 'bg-blue-100', text: 'text-blue-700', label: '대기열' },
      [DeliveryStatus.SENDING]: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '전송중' },
      [DeliveryStatus.SENT]: { bg: 'bg-green-100', text: 'text-green-700', label: '전송됨' },
      [DeliveryStatus.DELIVERED]: { bg: 'bg-green-200', text: 'text-green-800', label: '전달됨' },
      [DeliveryStatus.FAILED]: { bg: 'bg-red-100', text: 'text-red-700', label: '실패' },
      [DeliveryStatus.BOUNCED]: { bg: 'bg-orange-100', text: 'text-orange-700', label: '반송' }
    };

    const config = statusConfig[status] || statusConfig[DeliveryStatus.PENDING];
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getTypeIcon = (type: NotificationType) => {
    const icons = {
      [NotificationType.EMAIL]: '✉️',
      [NotificationType.SMS]: '💬',
      [NotificationType.PUSH]: '🔔',
      [NotificationType.IN_APP]: '📱'
    };
    return icons[type] || '📨';
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    if (filter.type && delivery.type !== filter.type) return false;
    if (filter.status && delivery.status !== filter.status) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        delivery.recipient.toLowerCase().includes(searchLower) ||
        delivery.notificationId.toLowerCase().includes(searchLower) ||
        delivery.id.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const sortedDeliveries = [...filteredDeliveries].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case 'sentAt':
        const dateA = a.sentAt || new Date(0);
        const dateB = b.sentAt || new Date(0);
        compareValue = dateA.getTime() - dateB.getTime();
        break;
      case 'type':
        compareValue = a.type.localeCompare(b.type);
        break;
      case 'status':
        compareValue = a.status.localeCompare(b.status);
        break;
    }
    
    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  const handleRefresh = async () => {
    if (onRefresh && !refreshing) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  const handleResend = async (delivery: NotificationDelivery) => {
    if (onResend) {
      await onResend(delivery);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    const d = new Date(date);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  return (
    <div className={`notification-history ${className}`}>
      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">알림 전송 내역</h3>
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              {refreshing ? '새로고침 중...' : '새로고침'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              검색
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="수신자, ID로 검색..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              알림 유형
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as NotificationType | '' }))}
            >
              <option value="">전체</option>
              <option value={NotificationType.EMAIL}>이메일</option>
              <option value={NotificationType.SMS}>SMS</option>
              <option value={NotificationType.PUSH}>푸시 알림</option>
              <option value={NotificationType.IN_APP}>인앱 알림</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상태
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as DeliveryStatus | '' }))}
            >
              <option value="">전체</option>
              <option value={DeliveryStatus.PENDING}>대기중</option>
              <option value={DeliveryStatus.QUEUED}>대기열</option>
              <option value={DeliveryStatus.SENDING}>전송중</option>
              <option value={DeliveryStatus.SENT}>전송됨</option>
              <option value={DeliveryStatus.DELIVERED}>전달됨</option>
              <option value={DeliveryStatus.FAILED}>실패</option>
              <option value={DeliveryStatus.BOUNCED}>반송</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                유형
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                수신자
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  if (sortBy === 'status') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('status');
                    setSortOrder('asc');
                  }
                }}
              >
                상태
                {sortBy === 'status' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  if (sortBy === 'sentAt') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('sentAt');
                    setSortOrder('desc');
                  }
                }}
              >
                전송 시간
                {sortBy === 'sentAt' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제공자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                시도
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">작업</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedDeliveries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  전송 내역이 없습니다
                </td>
              </tr>
            ) : (
              sortedDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-2xl">{getTypeIcon(delivery.type)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{delivery.recipient}</div>
                    <div className="text-xs text-gray-500">{delivery.notificationId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(delivery.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(delivery.sentAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {delivery.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {delivery.attempts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {delivery.status === DeliveryStatus.FAILED && onResend && (
                      <button
                        onClick={() => handleResend(delivery)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        재전송
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">전체</p>
          <p className="text-2xl font-semibold">{deliveries.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">성공</p>
          <p className="text-2xl font-semibold text-green-600">
            {deliveries.filter(d => d.status === DeliveryStatus.DELIVERED).length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">실패</p>
          <p className="text-2xl font-semibold text-red-600">
            {deliveries.filter(d => d.status === DeliveryStatus.FAILED || d.status === DeliveryStatus.BOUNCED).length}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">대기중</p>
          <p className="text-2xl font-semibold text-blue-600">
            {deliveries.filter(d => d.status === DeliveryStatus.PENDING || d.status === DeliveryStatus.QUEUED).length}
          </p>
        </div>
      </div>
    </div>
  );
};