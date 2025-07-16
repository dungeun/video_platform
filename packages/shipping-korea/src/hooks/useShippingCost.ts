/**
 * React hook for shipping cost calculation
 */

import { useState } from 'react';
import { CostCalculator } from '../cost/calculator/CostCalculator';
import { ShippingCostRequest, ShippingCostResponse, ApiError } from '../types';

export function useShippingCost(calculator: CostCalculator) {
  const [data, setData] = useState<ShippingCostResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const calculate = async (request: ShippingCostRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await calculator.calculate(request);
      if (response.success && response.data) {
        setData(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err: any) {
      setError({
        code: 'COST_ERROR',
        message: err.message,
        retryable: true
      });
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, calculate };
}