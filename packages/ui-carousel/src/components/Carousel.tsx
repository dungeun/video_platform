import React, { forwardRef } from 'react';
import { BaseCarousel } from './BaseCarousel';
import { HeroSlider } from './HeroSlider';
import { ProductCarousel } from './ProductCarousel';
import { BaseCarouselProps } from '../types';

interface CarouselProps extends BaseCarouselProps {
  variant?: 'default' | 'hero' | 'product';
}

export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  ({ variant = 'default', ...props }, ref) => {
    switch (variant) {
      case 'hero':
        return <HeroSlider ref={ref} {...props as any} />;
      case 'product':
        return <ProductCarousel ref={ref} {...props as any} />;
      default:
        return <BaseCarousel ref={ref} {...props} />;
    }
  }
);

Carousel.displayName = 'Carousel';