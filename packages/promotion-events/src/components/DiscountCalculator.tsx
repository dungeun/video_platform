/**
 * DiscountCalculator Component
 * Displays applied discounts and calculates final pricing
 */

import React, { useState, useEffect } from 'react';
import { 
  DiscountCalculationResult, 
  PromotionCampaign, 
  DiscountType 
} from '../types';

export interface DiscountCalculatorProps {
  originalAmount: number;
  discountResult?: DiscountCalculationResult;
  showBreakdown?: boolean;
  showSavings?: boolean;
  currency?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const DiscountCalculator: React.FC<DiscountCalculatorProps> = ({
  originalAmount,
  discountResult,
  showBreakdown = true,
  showSavings = true,
  currency = 'KRW',
  className = '',
  style = {}
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDiscountIcon = (discountType: DiscountType): string => {
    switch (discountType) {
      case DiscountType.PERCENTAGE:
        return '%';
      case DiscountType.FIXED:
        return '₩';
      case DiscountType.BUY_X_GET_Y:
        return '🎁';
      case DiscountType.FREE_SHIPPING:
        return '🚚';
      default:
        return '💰';
    }
  };

  const getSavingsPercentage = (): number => {
    if (!discountResult || originalAmount === 0) return 0;
    return (discountResult.discountAmount / originalAmount) * 100;
  };

  if (!discountResult || discountResult.discountAmount === 0) {
    return (
      <div className={`discount-calculator no-discount ${className}`} style={style}>
        <div className="price-summary">
          <div className="total-amount">
            <span className="label">Total:</span>
            <span className="amount">{formatCurrency(originalAmount)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`discount-calculator ${className}`} style={style}>
      {showBreakdown && discountResult.appliedPromotions.length > 0 && (
        <div className="discount-breakdown">
          <h4 className="breakdown-title">Applied Discounts</h4>
          <div className="promotion-list">
            {discountResult.appliedPromotions.map((promotion, index) => (
              <div key={index} className="promotion-item">
                <div className="promotion-info">
                  <span className="promotion-icon">
                    {getDiscountIcon(promotion.discountType)}
                  </span>
                  <span className="promotion-name">{promotion.campaignName}</span>
                </div>
                <div className="promotion-discount">
                  <span className="discount-amount">
                    -{formatCurrency(promotion.discountAmount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {discountResult.freeShipping && (
            <div className="promotion-item free-shipping">
              <div className="promotion-info">
                <span className="promotion-icon">🚚</span>
                <span className="promotion-name">Free Shipping</span>
              </div>
              <div className="promotion-discount">
                <span className="discount-amount">Free</span>
              </div>
            </div>
          )}

          {discountResult.messages.length > 0 && (
            <div className="discount-messages">
              {discountResult.messages.map((message, index) => (
                <div key={index} className="discount-message">
                  ✓ {message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="price-summary">
        <div className="original-amount">
          <span className="label">Subtotal:</span>
          <span className="amount">{formatCurrency(discountResult.originalAmount)}</span>
        </div>
        
        {discountResult.discountAmount > 0 && (
          <div className="discount-amount">
            <span className="label">Discount:</span>
            <span className="amount discount">
              -{formatCurrency(discountResult.discountAmount)}
            </span>
          </div>
        )}

        <div className="total-amount">
          <span className="label">Total:</span>
          <span className="amount final">
            {formatCurrency(discountResult.finalAmount)}
          </span>
        </div>

        {showSavings && discountResult.discountAmount > 0 && (
          <div className="savings-info">
            <span className="savings-text">
              You save {formatCurrency(discountResult.discountAmount)} 
              ({getSavingsPercentage().toFixed(1)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Inline Discount Display Component
export interface InlineDiscountProps {
  originalPrice: number;
  discountedPrice: number;
  discountPercentage?: number;
  currency?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const InlineDiscount: React.FC<InlineDiscountProps> = ({
  originalPrice,
  discountedPrice,
  discountPercentage,
  currency = 'KRW',
  size = 'medium',
  className = ''
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculatedPercentage = discountPercentage || 
    ((originalPrice - discountedPrice) / originalPrice) * 100;

  if (originalPrice === discountedPrice) {
    return (
      <span className={`inline-discount no-discount ${size} ${className}`}>
        {formatCurrency(originalPrice)}
      </span>
    );
  }

  return (
    <span className={`inline-discount ${size} ${className}`}>
      <span className="original-price">{formatCurrency(originalPrice)}</span>
      <span className="discounted-price">{formatCurrency(discountedPrice)}</span>
      {calculatedPercentage > 0 && (
        <span className="discount-badge">
          {calculatedPercentage.toFixed(0)}% OFF
        </span>
      )}
    </span>
  );
};

// Promotion Code Input Component
export interface PromotionCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onApply: (code: string) => void;
  isLoading?: boolean;
  error?: string;
  success?: string;
  placeholder?: string;
  className?: string;
}

export const PromotionCodeInput: React.FC<PromotionCodeInputProps> = ({
  value,
  onChange,
  onApply,
  isLoading = false,
  error,
  success,
  placeholder = 'Enter promotion code',
  className = ''
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localValue.trim() && !isLoading) {
      onApply(localValue.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className={`promotion-code-input ${className}`}>
      <form onSubmit={handleSubmit} className="code-form">
        <div className="input-group">
          <input
            type="text"
            value={localValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`code-input ${error ? 'error' : ''} ${success ? 'success' : ''}`}
            disabled={isLoading}
            maxLength={20}
          />
          <button
            type="submit"
            className="apply-button"
            disabled={!localValue.trim() || isLoading}
          >
            {isLoading ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </form>

      {error && (
        <div className="code-message error">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="code-message success">
          ✅ {success}
        </div>
      )}
    </div>
  );
};

// Discount Badge Component
export interface DiscountBadgeProps {
  discountType: DiscountType;
  value: number | string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  className?: string;
}

export const DiscountBadge: React.FC<DiscountBadgeProps> = ({
  discountType,
  value,
  size = 'medium',
  variant = 'primary',
  className = ''
}) => {
  const getBadgeText = (): string => {
    switch (discountType) {
      case DiscountType.PERCENTAGE:
        return `${value}% OFF`;
      case DiscountType.FIXED:
        return `₩${value} OFF`;
      case DiscountType.BUY_X_GET_Y:
        return `BOGO`;
      case DiscountType.FREE_SHIPPING:
        return `FREE SHIPPING`;
      default:
        return `SPECIAL OFFER`;
    }
  };

  const getBadgeIcon = (): string => {
    switch (discountType) {
      case DiscountType.PERCENTAGE:
        return '%';
      case DiscountType.FIXED:
        return '₩';
      case DiscountType.BUY_X_GET_Y:
        return '🎁';
      case DiscountType.FREE_SHIPPING:
        return '🚚';
      default:
        return '💰';
    }
  };

  return (
    <span className={`discount-badge ${size} ${variant} ${className}`}>
      <span className="badge-icon">{getBadgeIcon()}</span>
      <span className="badge-text">{getBadgeText()}</span>
    </span>
  );
};

export default DiscountCalculator;