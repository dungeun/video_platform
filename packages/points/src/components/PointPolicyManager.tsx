import React, { useState } from 'react';
import { PointPolicy } from '../types';

interface PointPolicyManagerProps {
  policy: PointPolicy | null;
  onPolicyUpdate?: (policy: PointPolicy) => void;
  isAdmin?: boolean;
  className?: string;
}

export const PointPolicyManager: React.FC<PointPolicyManagerProps> = ({
  policy,
  onPolicyUpdate,
  isAdmin = false,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPolicy, setEditedPolicy] = useState<Partial<PointPolicy>>(
    policy || {}
  );

  const formatPercent = (value: number): string => {
    return `${value}%`;
  };

  const formatNumber = (value: number): string => {
    return value.toLocaleString('ko-KR');
  };

  const handleSave = () => {
    if (onPolicyUpdate && editedPolicy) {
      onPolicyUpdate(editedPolicy as PointPolicy);
      setIsEditing(false);
    }
  };

  if (!policy) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <p className="text-gray-500 text-center">포인트 정책이 설정되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">포인트 정책</h3>
          {isAdmin && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              수정
            </button>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-600">{policy.description}</p>
      </div>

      {/* 정책 내용 */}
      <div className="p-6 space-y-6">
        {/* 적립 정책 */}
        <div>
          <h4 className="font-semibold text-lg mb-3">적립 정책</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">기본 적립률</span>
              <span className="font-medium">{formatPercent(policy.earnRules.baseRate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">최대 적립률</span>
              <span className="font-medium">{formatPercent(policy.earnRules.maxRate)}</span>
            </div>
            {policy.earnRules.minPurchaseAmount && (
              <div className="flex justify-between">
                <span className="text-gray-600">최소 구매 금액</span>
                <span className="font-medium">{formatNumber(policy.earnRules.minPurchaseAmount)}원</span>
              </div>
            )}
            {policy.earnRules.doublePointDays && policy.earnRules.doublePointDays.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">더블 포인트 데이</span>
                <span className="font-medium">
                  {policy.earnRules.doublePointDays.map(day => 
                    ['일', '월', '화', '수', '목', '금', '토'][day]
                  ).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 사용 정책 */}
        <div>
          <h4 className="font-semibold text-lg mb-3">사용 정책</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">최소 사용 포인트</span>
              <span className="font-medium">{formatNumber(policy.useRules.minPoints)} P</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">사용 단위</span>
              <span className="font-medium">{formatNumber(policy.useRules.unitOfUse)} P</span>
            </div>
            {policy.useRules.maxUsageRate && (
              <div className="flex justify-between">
                <span className="text-gray-600">최대 사용률</span>
                <span className="font-medium">결제 금액의 {formatPercent(policy.useRules.maxUsageRate)}</span>
              </div>
            )}
            {policy.useRules.maxPointsPerOrder && (
              <div className="flex justify-between">
                <span className="text-gray-600">주문당 최대 사용</span>
                <span className="font-medium">{formatNumber(policy.useRules.maxPointsPerOrder)} P</span>
              </div>
            )}
          </div>
        </div>

        {/* 유효기간 정책 */}
        <div>
          <h4 className="font-semibold text-lg mb-3">유효기간 정책</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">기본 유효기간</span>
              <span className="font-medium">{policy.expiryRules.defaultExpiryMonths}개월</span>
            </div>
            {policy.expiryRules.extendableExpiryMonths && (
              <div className="flex justify-between">
                <span className="text-gray-600">연장 가능 기간</span>
                <span className="font-medium">{policy.expiryRules.extendableExpiryMonths}개월</span>
              </div>
            )}
            {policy.expiryRules.gracePeroidDays && (
              <div className="flex justify-between">
                <span className="text-gray-600">유예 기간</span>
                <span className="font-medium">{policy.expiryRules.gracePeroidDays}일</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">만료 알림</span>
              <span className="font-medium">
                {policy.expiryRules.expiryNotificationDays.join(', ')}일 전
              </span>
            </div>
          </div>
        </div>

        {/* 등급별 혜택 */}
        {policy.gradeBonus && Object.keys(policy.gradeBonus).length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3">등급별 혜택</h4>
            <div className="space-y-3">
              {Object.entries(policy.gradeBonus).map(([grade, bonus]) => (
                <div key={grade} className="border rounded-lg p-3">
                  <h5 className="font-medium text-sm mb-2">{grade} 등급</h5>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>적립률: {bonus.earnRateMultiplier}배</div>
                    {bonus.birthdayPoints && (
                      <div>생일 포인트: {formatNumber(bonus.birthdayPoints)} P</div>
                    )}
                    {bonus.monthlyBonus && (
                      <div>월간 보너스: {formatNumber(bonus.monthlyBonus)} P</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 수정 모드 버튼 */}
      {isEditing && (
        <div className="p-6 border-t flex justify-end space-x-3">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      )}
    </div>
  );
};