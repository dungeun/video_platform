import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { ProductCarouselProps } from '../types';
import { BaseCarousel } from './BaseCarousel';
import { carouselTheme } from '../utils/carouselTheme';

export const ProductCarousel = forwardRef<HTMLDivElement, ProductCarouselProps>(
  (
    {
      items,
      itemsPerView = 4,
      spacing = 16,
      showAddToCart = true,
      showQuickView = true,
      onAddToCart,
      onQuickView,
      options,
      ...rest
    },
    ref
  ) => {
    const slidesToScroll = itemsPerView === 'auto' ? 1 : Math.max(1, Math.floor(itemsPerView / 2));

    const mergedOptions = {
      align: 'start' as const,
      containScroll: 'trimSnaps' as const,
      slidesToScroll,
      ...options
    };

    const renderProductItem = (item: any, index: number) => {
      const product = item.metadata || {};
      const hasImage = typeof item.content === 'string' && 
        (item.content.startsWith('http') || item.content.startsWith('/'));

      return (
        <div className={carouselTheme.productCarousel.item}>
          <div className="relative overflow-hidden rounded-lg">
            {hasImage ? (
              <img
                src={item.content}
                alt={product.name || `Product ${index + 1}`}
                className={carouselTheme.productCarousel.image}
              />
            ) : (
              <div className="aspect-square bg-gray-200 flex items-center justify-center">
                {item.content}
              </div>
            )}
            
            <div className={carouselTheme.productCarousel.overlay} />
            
            {(showAddToCart || showQuickView) && (
              <div className={carouselTheme.productCarousel.actions}>
                {showQuickView && (
                  <button
                    onClick={() => onQuickView?.(item)}
                    className="flex-1 bg-white text-gray-900 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                    aria-label="Quick view"
                  >
                    Quick View
                  </button>
                )}
                
                {showAddToCart && (
                  <button
                    onClick={() => onAddToCart?.(item)}
                    className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                    aria-label="Add to cart"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            )}
          </div>
          
          {(product.name || product.price) && (
            <div className={carouselTheme.productCarousel.content}>
              {product.name && (
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {product.name}
                </h3>
              )}
              
              {product.price && (
                <p className="text-gray-600">
                  {typeof product.price === 'number' 
                    ? `$${product.price.toFixed(2)}`
                    : product.price
                  }
                </p>
              )}
            </div>
          )}
        </div>
      );
    };

    const containerStyle = itemsPerView === 'auto' ? undefined : {
      '--items-per-view': itemsPerView,
      '--spacing': `${spacing}px`
    } as React.CSSProperties;

    return (
      <div
        className={carouselTheme.productCarousel.container}
        style={containerStyle}
      >
        <BaseCarousel
          ref={ref}
          items={items}
          options={mergedOptions}
          renderItem={renderProductItem}
          {...rest}
        />
      </div>
    );
  }
);

ProductCarousel.displayName = 'ProductCarousel';