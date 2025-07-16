import React from 'react';
import type { ProductCardProps } from '../types';

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  layout,
  showQuickView = true,
  showAddToCart = true,
  showWishlist = true,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  imageAspectRatio = '1/1',
  className = ''
}) => {
  const discount = product.compareAtPrice && product.price < product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  if (layout === 'list') {
    return (
      <div className={`flex gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
        <div className="relative w-48 flex-shrink-0">
          <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: imageAspectRatio }}>
            <img
              src={product.imageUrl}
              alt={product.imageAlt || product.name}
              className="w-full h-full object-cover"
              onClick={() => onProductClick?.(product)}
            />
            {product.badges && product.badges.length > 0 && (
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {product.badges.map(badge => (
                  <span
                    key={badge.id}
                    className="px-2 py-1 text-xs font-semibold rounded"
                    style={{
                      color: badge.color || 'white',
                      backgroundColor: badge.bgColor || 'red'
                    }}
                  >
                    {badge.text}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1">
          <h3 
            className="text-lg font-medium mb-2 cursor-pointer hover:text-blue-600"
            onClick={() => onProductClick?.(product)}
          >
            {product.name}
          </h3>
          
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-xl font-bold">{product.price.toLocaleString()}원</span>
            {product.compareAtPrice && (
              <>
                <span className="text-sm text-gray-500 line-through">
                  {product.compareAtPrice.toLocaleString()}원
                </span>
                <span className="text-sm text-red-600 font-semibold">{discount}%</span>
              </>
            )}
          </div>
          
          {product.rating && (
            <div className="flex items-center gap-1 mb-3">
              <span className="text-yellow-400">★</span>
              <span className="text-sm">{product.rating}</span>
              {product.reviewCount && (
                <span className="text-sm text-gray-500">({product.reviewCount})</span>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            {showAddToCart && !product.isSoldOut && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart?.(product);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                장바구니 담기
              </button>
            )}
            {product.isSoldOut && (
              <span className="px-4 py-2 bg-gray-200 text-gray-500 rounded">품절</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="relative overflow-hidden rounded-t-lg" style={{ aspectRatio: imageAspectRatio }}>
        <img
          src={product.imageUrl}
          alt={product.imageAlt || product.name}
          className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
          onClick={() => onProductClick?.(product)}
        />
        
        {product.badges && product.badges.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {product.badges.map(badge => (
              <span
                key={badge.id}
                className="px-2 py-1 text-xs font-semibold rounded"
                style={{
                  color: badge.color || 'white',
                  backgroundColor: badge.bgColor || 'red'
                }}
              >
                {badge.text}
              </span>
            ))}
          </div>
        )}
        
        {showWishlist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist?.(product);
            }}
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-600">♡</span>
          </button>
        )}
        
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-2 justify-center">
            {showQuickView && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView?.(product);
                }}
                className="px-3 py-1 bg-white text-sm rounded hover:bg-gray-100 transition-colors"
              >
                빠른 보기
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 
          className="font-medium mb-2 cursor-pointer hover:text-blue-600 line-clamp-2"
          onClick={() => onProductClick?.(product)}
        >
          {product.name}
        </h3>
        
        {product.rating && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-sm">{product.rating}</span>
            {product.reviewCount && (
              <span className="text-sm text-gray-500">({product.reviewCount})</span>
            )}
          </div>
        )}
        
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold">{product.price.toLocaleString()}원</span>
          {product.compareAtPrice && (
            <>
              <span className="text-sm text-gray-500 line-through">
                {product.compareAtPrice.toLocaleString()}원
              </span>
              <span className="text-sm text-red-600 font-semibold">{discount}%</span>
            </>
          )}
        </div>
        
        {showAddToCart && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(product);
            }}
            disabled={product.isSoldOut}
            className={`w-full py-2 rounded transition-colors ${
              product.isSoldOut
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {product.isSoldOut ? '품절' : '장바구니'}
          </button>
        )}
      </div>
    </div>
  );
};