import React from 'react';
import { ProductCard } from './ProductCard';
import type { ProductGridProps, GridConfig } from '../types';

const defaultConfig: GridConfig = {
  layout: 'grid',
  columns: 4,
  gap: 16,
  showQuickView: true,
  showAddToCart: true,
  showWishlist: true,
  imageAspectRatio: '1/1',
  enableInfiniteScroll: false,
  itemsPerPage: 20
};

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  config = {},
  loading = false,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  className = ''
}) => {
  const finalConfig = { ...defaultConfig, ...config };

  const getGridClassName = () => {
    if (finalConfig.layout === 'list') {
      return 'flex flex-col';
    }
    
    const colsMap = {
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
      5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
      6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
    };
    
    return `grid ${colsMap[finalConfig.columns]}`;
  };

  if (loading && products.length === 0) {
    return (
      <div className={`${getGridClassName()} gap-4 ${className}`}>
        {Array.from({ length: finalConfig.itemsPerPage }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div 
              className="bg-gray-200 rounded-lg mb-4" 
              style={{ aspectRatio: finalConfig.imageAspectRatio }}
            />
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">상품이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={`${getGridClassName()} gap-4 ${className}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          layout={finalConfig.layout}
          showQuickView={finalConfig.showQuickView}
          showAddToCart={finalConfig.showAddToCart}
          showWishlist={finalConfig.showWishlist}
          onProductClick={onProductClick}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          onQuickView={onQuickView}
          imageAspectRatio={finalConfig.imageAspectRatio}
        />
      ))}
    </div>
  );
};