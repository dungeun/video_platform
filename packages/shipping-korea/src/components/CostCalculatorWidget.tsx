/**
 * Cost calculator widget component
 */

import React from 'react';
import { ShippingCostResponse } from '../types';

export interface CostCalculatorWidgetProps {
  costs?: ShippingCostResponse[];
  loading?: boolean;
}

export function CostCalculatorWidget({ costs, loading }: CostCalculatorWidgetProps) {
  if (loading) return <div>Calculating costs...</div>;
  if (!costs || costs.length === 0) return <div>No cost data available</div>;

  return (
    <div className="cost-calculator-widget">
      <h3>Shipping Cost Comparison</h3>
      {costs.map((cost, index) => (
        <div key={index}>
          <h4>{cost.carrier}</h4>
          <p>Total: {cost.totalCost.toLocaleString()} {cost.currency}</p>
        </div>
      ))}
    </div>
  );
}