import React from 'react';
import clsx from 'clsx';
import { NavigationDotsProps } from '../types';
import { carouselTheme, getDotClasses } from '../utils/carouselTheme';

export const NavigationDots: React.FC<NavigationDotsProps> = ({
  totalSlides,
  currentSlide,
  onDotClick,
  variant = 'dots',
  position = 'bottom',
  className
}) => {
  return (
    <div
      className={clsx(
        carouselTheme.dots.container.base,
        carouselTheme.dots.container.position[position],
        className
      )}
    >
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onDotClick(index)}
          className={getDotClasses(variant, index === currentSlide)}
          aria-label={`Go to slide ${index + 1}`}
        >
          {variant === 'numbers' && index + 1}
        </button>
      ))}
    </div>
  );
};