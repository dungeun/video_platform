import React from 'react';
import { OptionSelector } from './OptionSelector';
import { VariantPriceDisplay } from './VariantPriceDisplay';
import { useProductOptions } from '../hooks/useProductOptions';

interface ProductOptionsFormProps {
  productId: string;
  onAddToCart?: (variantId: string, quantity: number) => void;
  className?: string;
}

export const ProductOptionsForm: React.FC<ProductOptionsFormProps> = ({
  productId,
  onAddToCart,
  className = ''
}) => {
  const {
    options,
    selectedOptions,
    selectedVariant,
    availableValues,
    isLoading,
    error,
    selectOption,
    getPrice,
    getStock,
    isSelectionComplete
  } = useProductOptions(productId);

  const [quantity, setQuantity] = React.useState(1);

  const handleAddToCart = () => {
    if (selectedVariant && onAddToCart) {
      onAddToCart(selectedVariant.id, quantity);
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 ${className}`}>
        옵션을 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  const maxQuantity = Math.min(getStock() || 10, 10);
  const canAddToCart = isSelectionComplete() && selectedVariant && selectedVariant.isActive && getStock() > 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Options */}
      {options.map((option) => (
        <OptionSelector
          key={option.id}
          option={option}
          selectedValue={selectedOptions[option.name] || ''}
          availableValues={availableValues[option.name] || []}
          onChange={(value) => selectOption(option.name, value)}
        />
      ))}

      {/* Price Display */}
      <div className="border-t pt-4">
        <VariantPriceDisplay
          variant={selectedVariant}
          basePrice={getPrice()}
          quantity={quantity}
        />
      </div>

      {/* Quantity Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          수량
        </label>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setQuantity(Math.min(Math.max(1, val), maxQuantity));
            }}
            className="w-20 text-center px-3 py-2 border border-gray-300 rounded-md"
            min="1"
            max={maxQuantity}
          />
          <button
            onClick={() => setQuantity(Math.min(quantity + 1, maxQuantity))}
            disabled={quantity >= maxQuantity}
            className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!canAddToCart}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
          canAddToCart
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {!isSelectionComplete()
          ? '옵션을 선택해주세요'
          : !selectedVariant
          ? '선택하신 옵션의 상품이 없습니다'
          : !selectedVariant.isActive
          ? '판매 중지된 상품입니다'
          : getStock() === 0
          ? '품절'
          : '장바구니에 담기'}
      </button>

      {/* SKU Display (for debugging) */}
      {selectedVariant && (
        <div className="text-xs text-gray-500">
          SKU: {selectedVariant.sku}
        </div>
      )}
    </div>
  );
};