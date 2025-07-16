import React from 'react';
import { NavigationArrowsProps } from '../types';
import { getNavigationArrowClasses } from '../utils/carouselTheme';

export const NavigationArrows: React.FC<NavigationArrowsProps> = ({
  onPrevClick,
  onNextClick,
  canScrollPrev,
  canScrollNext,
  variant = 'circle',
  position = 'inside',
  className
}) => {
  return (
    <>
      <button
        type="button"
        onClick={onPrevClick}
        disabled={!canScrollPrev}
        className={getNavigationArrowClasses(variant, position, 'prev', !canScrollPrev)}
        aria-label="Previous slide"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={onNextClick}
        disabled={!canScrollNext}
        className={getNavigationArrowClasses(variant, position, 'next', !canScrollNext)}
        aria-label="Next slide"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </>
  );
};