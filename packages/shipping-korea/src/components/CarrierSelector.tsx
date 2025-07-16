/**
 * Carrier selector component
 */

import React from 'react';
import { CarrierCode } from '../types';
import { CARRIERS } from '../index';

export interface CarrierSelectorProps {
  value?: CarrierCode;
  onChange: (carrier: CarrierCode) => void;
  disabled?: boolean;
}

export function CarrierSelector({ value, onChange, disabled }: CarrierSelectorProps) {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value as CarrierCode)}
      disabled={disabled}
      className="carrier-selector"
    >
      <option value="">택배사를 선택하세요</option>
      {Object.entries(CARRIERS).map(([code, info]) => (
        <option key={code} value={code}>
          {info.displayName}
        </option>
      ))}
    </select>
  );
}