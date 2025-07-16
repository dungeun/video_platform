import { useState, useCallback } from 'react';
import { 
  Coupon, 
  ValidationContext, 
  ValidationResult,
  DiscountCalculation 
} from '../types';

interface UseCouponOptions {
  onValidate?: (result: ValidationResult) => void;
  onApply?: (calculation: DiscountCalculation) => void;
  onError?: (error: Error) => void;
}

export function useCoupon(options: UseCouponOptions = {}) {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [calculation, setCalculation] = useState<DiscountCalculation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCoupon = useCallback(async (code: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/coupons/code/${code}`);
      if (!response.ok) throw new Error('Failed to fetch coupon');
      
      const data = await response.json();
      setCoupon(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      throw error;
    }
  }, [options]);

  const validateCoupon = useCallback(async (
    couponData: Coupon,
    context: ValidationContext
  ) => {
    try {
      setIsValidating(true);
      setError(null);
      
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon: couponData, context })
      });
      
      if (!response.ok) throw new Error('Validation failed');
      
      const result: ValidationResult = await response.json();
      setValidationResult(result);
      options.onValidate?.(result);
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, [options]);

  const applyCoupon = useCallback(async (
    code: string,
    context: ValidationContext
  ) => {
    try {
      setIsApplying(true);
      setError(null);
      
      // Fetch coupon if not already loaded
      let couponData = coupon;
      if (!couponData || couponData.code !== code.toUpperCase()) {
        couponData = await fetchCoupon(code);
      }
      
      // Validate coupon
      const validation = await validateCoupon(couponData, context);
      if (!validation.isValid) {
        throw new Error(validation.errors?.[0]?.message || 'Invalid coupon');
      }
      
      // Calculate discount
      const response = await fetch('/api/coupons/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon: couponData, context })
      });
      
      if (!response.ok) throw new Error('Calculation failed');
      
      const calc: DiscountCalculation = await response.json();
      setCalculation(calc);
      options.onApply?.(calc);
      
      return calc;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsApplying(false);
    }
  }, [coupon, fetchCoupon, validateCoupon, options]);

  const removeCoupon = useCallback(() => {
    setCoupon(null);
    setValidationResult(null);
    setCalculation(null);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    removeCoupon();
    setIsValidating(false);
    setIsApplying(false);
  }, [removeCoupon]);

  return {
    coupon,
    validationResult,
    calculation,
    isValidating,
    isApplying,
    error,
    fetchCoupon,
    validateCoupon,
    applyCoupon,
    removeCoupon,
    reset
  };
}