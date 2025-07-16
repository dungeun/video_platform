import React from 'react';
import type { ProductOption, OptionValue } from '../types';

interface OptionSelectorProps {
  option: ProductOption;
  selectedValue: string;
  availableValues: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const OptionSelector: React.FC<OptionSelectorProps> = ({
  option,
  selectedValue,
  availableValues,
  onChange,
  disabled = false
}) => {
  const renderSelector = () => {
    switch (option.type) {
      case 'select':
        return (
          <select
            value={selectedValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">선택하세요</option>
            {option.values.map((value) => (
              <option
                key={value.id}
                value={value.value}
                disabled={!availableValues.includes(value.value)}
              >
                {value.displayValue}
                {value.priceModifier > 0 && (
                  <span className="text-gray-500">
                    {value.priceModifierType === 'fixed'
                      ? ` (+${value.priceModifier.toLocaleString()}원)`
                      : ` (+${value.priceModifier}%)`}
                  </span>
                )}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {option.values.map((value) => (
              <label
                key={value.id}
                className={`flex items-center space-x-2 cursor-pointer ${
                  !availableValues.includes(value.value) ? 'opacity-50' : ''
                }`}
              >
                <input
                  type="radio"
                  name={option.name}
                  value={value.value}
                  checked={selectedValue === value.value}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={disabled || !availableValues.includes(value.value)}
                  className="text-blue-600"
                />
                <span>{value.displayValue}</span>
                {value.priceModifier > 0 && (
                  <span className="text-gray-500 text-sm">
                    {value.priceModifierType === 'fixed'
                      ? `(+${value.priceModifier.toLocaleString()}원)`
                      : `(+${value.priceModifier}%)`}
                  </span>
                )}
              </label>
            ))}
          </div>
        );

      case 'color':
        return (
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => (
              <button
                key={value.id}
                onClick={() => onChange(value.value)}
                disabled={disabled || !availableValues.includes(value.value)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  selectedValue === value.value
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-300'
                } ${
                  !availableValues.includes(value.value)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:border-gray-400'
                }`}
                style={{
                  backgroundColor: value.metadata?.colorCode || value.value
                }}
                title={value.displayValue}
              />
            ))}
          </div>
        );

      case 'size':
        return (
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => (
              <button
                key={value.id}
                onClick={() => onChange(value.value)}
                disabled={disabled || !availableValues.includes(value.value)}
                className={`px-4 py-2 border rounded-md transition-all ${
                  selectedValue === value.value
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-300'
                } ${
                  !availableValues.includes(value.value)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:border-gray-400'
                }`}
              >
                {value.displayValue}
              </button>
            ))}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            {option.values.map((value) => (
              <button
                key={value.id}
                onClick={() => onChange(value.value)}
                disabled={disabled || !availableValues.includes(value.value)}
                className={`w-full px-4 py-2 text-left border rounded-md transition-all ${
                  selectedValue === value.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                } ${
                  !availableValues.includes(value.value)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:border-gray-400'
                }`}
              >
                <span>{value.displayValue}</span>
                {value.priceModifier > 0 && (
                  <span className="text-gray-500 text-sm ml-2">
                    {value.priceModifierType === 'fixed'
                      ? `(+${value.priceModifier.toLocaleString()}원)`
                      : `(+${value.priceModifier}%)`}
                  </span>
                )}
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {option.displayName}
        {option.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderSelector()}
    </div>
  );
};