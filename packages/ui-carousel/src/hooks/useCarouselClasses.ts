import { useMemo } from 'react';
import clsx from 'clsx';
import { carouselTheme } from '../utils/carouselTheme';

interface UseCarouselClassesOptions {
  variant?: 'default' | 'hero' | 'product';
  fullWidth?: boolean;
  showNavigation?: boolean;
  isDraggable?: boolean;
  className?: string;
}

export function useCarouselClasses(options: UseCarouselClassesOptions = {}) {
  const {
    variant = 'default',
    fullWidth = false,
    showNavigation = false,
    isDraggable = true,
    className
  } = options;

  const classes = useMemo(() => {
    return {
      container: clsx(
        carouselTheme.container.base,
        fullWidth && carouselTheme.container.fullWidth,
        showNavigation && carouselTheme.container.withNavigation,
        variant === 'hero' && carouselTheme.heroSlider.container,
        variant === 'product' && carouselTheme.productCarousel.container,
        className
      ),
      viewport: clsx(
        carouselTheme.viewport.base,
        isDraggable && carouselTheme.viewport.draggable
      ),
      slideContainer: carouselTheme.slideContainer.base,
      slide: (index: number, totalSlides: number, spacing?: string) => {
        const isLast = index === totalSlides - 1;
        return clsx(
          carouselTheme.slide.base,
          !isLast && spacing && carouselTheme.slide.spacing[spacing as keyof typeof carouselTheme.slide.spacing],
          variant === 'hero' && carouselTheme.heroSlider.slide,
          variant === 'product' && carouselTheme.productCarousel.item
        );
      }
    };
  }, [variant, fullWidth, showNavigation, isDraggable, className]);

  return classes;
}