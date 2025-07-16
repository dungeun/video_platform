import React, { useState, useEffect } from 'react';
import { PointPolicy, PointEarnReason } from '../types';

interface PointEarningCalculatorProps {
  policy: PointPolicy | null;
  userGrade?: string;
  onCalculate?: (points: number, details: CalculationDetails) => void;
  className?: string;
}

interface CalculationDetails {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  appliedRules: string[];
}

export const PointEarningCalculator: React.FC<PointEarningCalculatorProps> = ({
  policy,
  userGrade = 'REGULAR',
  onCalculate,
  className = ''
}) => {
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [earnReason, setEarnReason] = useState<PointEarnReason>(PointEarnReason.PURCHASE);
  const [calculationResult, setCalculationResult] = useState<CalculationDetails | null>(null);

  useEffect(() => {
    if (purchaseAmount && policy) {
      calculatePoints();
    }
  }, [purchaseAmount, earnReason, userGrade]);

  const calculatePoints = () => {
    if (!policy || !purchaseAmount) return;

    const amount = parseInt(purchaseAmount.replace(/,/g, ''));
    if (isNaN(amount)) return;

    const appliedRules: string[] = [];
    let baseRate = policy.earnRules.baseRate;
    let bonusRate = 0;

    // 기본 적립률
    appliedRules.push(`기본 적립률: ${baseRate}%`);

    // 더블 포인트 데이 확인
    const today = new Date().getDay();
    if (policy.earnRules.doublePointDays?.includes(today)) {
      baseRate *= 2;
      appliedRules.push('더블 포인트 데이 적용 (2배)');
    }

    // 등급별 혜택
    if (policy.gradeBonus && policy.gradeBonus[userGrade]) {
      const gradeMultiplier = policy.gradeBonus[userGrade].earnRateMultiplier;
      bonusRate = baseRate * (gradeMultiplier - 1);
      appliedRules.push(`${userGrade} 등급 보너스: ${gradeMultiplier}배`);
    }

    // 최대 적립률 제한
    const totalRate = Math.min(baseRate + bonusRate, policy.earnRules.maxRate);
    if (baseRate + bonusRate > policy.earnRules.maxRate) {
      appliedRules.push(`최대 적립률 제한: ${policy.earnRules.maxRate}%`);
    }

    const basePoints = Math.floor(amount * baseRate / 100);
    const bonusPoints = Math.floor(amount * bonusRate / 100);
    const totalPoints = Math.floor(amount * totalRate / 100);

    const details: CalculationDetails = {
      basePoints,
      bonusPoints,
      totalPoints,
      appliedRules
    };

    setCalculationResult(details);
    
    if (onCalculate) {
      onCalculate(totalPoints, details);
    }
  };

  const formatNumber = (value: string): string => {
    const number = value.replace(/[^\d]/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setPurchaseAmount(formatted);
  };

  if (!policy) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <p className="text-gray-500 text-center">포인트 정책이 설정되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">포인트 적립 계산기</h3>

      {/* 입력 폼 */}
      <div className="space-y-4">
        {/* 적립 사유 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            적립 사유
          </label>
          <select
            value={earnReason}
            onChange={(e) => setEarnReason(e.target.value as PointEarnReason)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={PointEarnReason.PURCHASE}>구매 적립</option>
            <option value={PointEarnReason.REVIEW}>리뷰 작성</option>
            <option value={PointEarnReason.PHOTO_REVIEW}>포토 리뷰</option>
            <option value={PointEarnReason.EVENT}>이벤트</option>
          </select>
        </div>

        {/* 구매 금액 입력 (구매 적립인 경우만) */}
        {earnReason === PointEarnReason.PURCHASE && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              구매 금액
            </label>
            <div className="relative">
              <input
                type="text"
                value={purchaseAmount}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                원
              </span>
            </div>
            {policy.earnRules.minPurchaseAmount && purchaseAmount && 
             parseInt(purchaseAmount.replace(/,/g, '')) < policy.earnRules.minPurchaseAmount && (
              <p className="mt-1 text-sm text-red-600">
                최소 구매 금액: {policy.earnRules.minPurchaseAmount.toLocaleString()}원
              </p>
            )}
          </div>
        )}

        {/* 회원 등급 표시 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            회원 등급
          </label>
          <div className="px-3 py-2 bg-gray-100 rounded-md text-sm">
            {userGrade}
            {policy.gradeBonus?.[userGrade] && (
              <span className="ml-2 text-blue-600">
                (적립률 {policy.gradeBonus[userGrade].earnRateMultiplier}배)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 계산 결과 */}
      {calculationResult && earnReason === PointEarnReason.PURCHASE && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3">적립 예정 포인트</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">기본 적립</span>
              <span className="font-medium">{calculationResult.basePoints.toLocaleString()} P</span>
            </div>
            
            {calculationResult.bonusPoints > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">보너스 적립</span>
                <span className="font-medium text-blue-600">
                  +{calculationResult.bonusPoints.toLocaleString()} P
                </span>
              </div>
            )}
            
            <div className="pt-2 border-t border-blue-200">
              <div className="flex justify-between">
                <span className="font-semibold text-blue-900">총 적립 포인트</span>
                <span className="font-bold text-lg text-blue-900">
                  {calculationResult.totalPoints.toLocaleString()} P
                </span>
              </div>
            </div>
          </div>

          {/* 적용된 규칙 */}
          {calculationResult.appliedRules.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs font-medium text-blue-800 mb-1">적용된 혜택:</p>
              <ul className="text-xs text-blue-700 space-y-0.5">
                {calculationResult.appliedRules.map((rule, index) => (
                  <li key={index}>• {rule}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 기타 적립 사유의 경우 */}
      {earnReason !== PointEarnReason.PURCHASE && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {earnReason === PointEarnReason.REVIEW && '리뷰 작성 시 100 포인트가 적립됩니다.'}
            {earnReason === PointEarnReason.PHOTO_REVIEW && '포토 리뷰 작성 시 300 포인트가 적립됩니다.'}
            {earnReason === PointEarnReason.EVENT && '이벤트별로 적립 포인트가 다릅니다.'}
          </p>
        </div>
      )}
    </div>
  );
};