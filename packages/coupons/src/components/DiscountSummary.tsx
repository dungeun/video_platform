import React from 'react';
import { DiscountCalculation } from '../types';

interface DiscountSummaryProps {
  calculation: DiscountCalculation;
  showDetails?: boolean;
  className?: string;
}

export const DiscountSummary: React.FC<DiscountSummaryProps> = ({
  calculation,
  showDetails = false,
  className = ''
}) => {
  const savingsPercentage = calculation.originalAmount > 0
    ? (calculation.discountAmount / calculation.originalAmount) * 100
    : 0;

  return (
    <div className={`discount-summary ${className}`}>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Coupon ({calculation.couponCode})
          </span>
          <span className="text-sm font-semibold text-green-600">
            -${calculation.discountAmount.toFixed(2)}
          </span>
        </div>

        {showDetails && calculation.appliedRules.length > 0 && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-xs font-medium text-gray-600 mb-2">Applied Rules:</p>
            <ul className="space-y-1">
              {calculation.appliedRules.map((rule, index) => (
                <li key={index} className="text-xs text-gray-600">
                  • {rule.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-gray-900">
              Total after discount
            </span>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                ${calculation.finalAmount.toFixed(2)}
              </p>
              <p className="text-xs text-green-600">
                You save {savingsPercentage.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};