import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { HeroSliderProps } from '../types';
import { BaseCarousel } from './BaseCarousel';
import { carouselTheme } from '../utils/carouselTheme';

export const HeroSlider = forwardRef<HTMLDivElement, HeroSliderProps>(
  (
    {
      items,
      height = 'lg',
      fullWidth = true,
      overlay = true,
      overlayContent,
      transitionDuration = 300,
      options,
      ...rest
    },
    ref
  ) => {
    const heightClass = typeof height === 'string' 
      ? carouselTheme.heroSlider.height[height as keyof typeof carouselTheme.heroSlider.height]
      : undefined;

    const mergedOptions = {
      loop: true,
      align: 'start' as const,
      containScroll: false as const,
      ...options,
      duration: transitionDuration
    };

    const renderHeroItem = (item: any, index: number) => {
      const isImage = typeof item.content === 'string' && 
        (item.content.startsWith('http') || item.content.startsWith('/'));

      return (
        <div className="relative w-full h-full">
          {isImage ? (
            <img
              src={item.content}
              alt={item.metadata?.alt || `Slide ${index + 1}`}
              className={carouselTheme.heroSlider.image}
            />
          ) : (
            item.content
          )}
          
          {overlay && (
            <div className={carouselTheme.heroSlider.overlay} />
          )}
          
          {overlayContent && (
            <div className={carouselTheme.heroSlider.content}>
              {overlayContent}
            </div>
          )}
          
          {item.metadata?.title && (
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h2 className="text-4xl font-bold mb-2">{item.metadata.title}</h2>
              {item.metadata.subtitle && (
                <p className="text-xl">{item.metadata.subtitle}</p>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div
        className={clsx(
          carouselTheme.heroSlider.container,
          heightClass,
          fullWidth && 'w-full'
        )}
        style={typeof height === 'number' ? { height } : undefined}
      >
        <BaseCarousel
          ref={ref}
          items={items}
          options={mergedOptions}
          renderItem={renderHeroItem}
          className="h-full"
          {...rest}
        />
      </div>
    );
  }
);

HeroSlider.displayName = 'HeroSlider';