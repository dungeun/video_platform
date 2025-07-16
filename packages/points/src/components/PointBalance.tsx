import React from 'react';
import { PointBalance as IPointBalance } from '../types';

interface PointBalanceProps {
  balance: IPointBalance;
  showDetails?: boolean;
  onUsePoints?: () => void;
  className?: string;
}

export const PointBalance: React.FC<PointBalanceProps> = ({
  balance,
  showDetails = false,
  onUsePoints,
  className = ''
}) => {
  const formatNumber = (num: number): string => {
    return num.toLocaleString('ko-KR');
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* 메인 잔액 표시 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-1">사용 가능 포인트</h3>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-gray-900">
            {formatNumber(balance.availablePoints)}
          </span>
          <span className="ml-1 text-lg text-gray-500">P</span>
        </div>
      </div>

      {/* 상세 정보 */}
      {showDetails && (
        <div className="space-y-4 border-t pt-4">
          {/* 적립 예정 */}
          {balance.pendingPoints > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">적립 예정</span>
              <span className="text-sm font-medium text-blue-600">
                +{formatNumber(balance.pendingPoints)} P
              </span>
            </div>
          )}

          {/* 만료 예정 */}
          {balance.expiringPoints > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">30일 내 만료 예정</span>
              <span className="text-sm font-medium text-red-600">
                -{formatNumber(balance.expiringPoints)} P
              </span>
            </div>
          )}

          {/* 총 포인트 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">총 포인트</span>
            <span className="text-sm font-medium">
              {formatNumber(balance.totalPoints)} P
            </span>
          </div>

          {/* 누적 통계 */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">총 적립</span>
              <span className="text-xs text-gray-600">
                {formatNumber(balance.totalEarned)} P
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">총 사용</span>
              <span className="text-xs text-gray-600">
                {formatNumber(balance.totalSpent)} P
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">총 만료</span>
              <span className="text-xs text-gray-600">
                {formatNumber(balance.totalExpired)} P
              </span>
            </div>
          </div>

          {/* 최근 업데이트 */}
          <div className="text-xs text-gray-400 text-right">
            마지막 업데이트: {formatDate(balance.lastCalculatedAt)}
          </div>
        </div>
      )}

      {/* 포인트 사용 버튼 */}
      {onUsePoints && balance.availablePoints > 0 && (
        <button
          onClick={onUsePoints}
          className="mt-4 w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 transition-colors"
        >
          포인트 사용하기
        </button>
      )}
    </div>
  );
};