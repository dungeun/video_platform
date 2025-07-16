import { CarouselOptions, ResponsiveConfig } from '../types';

/**
 * Get responsive carousel options based on current viewport width
 */
export function getResponsiveOptions(
  baseOptions: CarouselOptions,
  responsive?: ResponsiveConfig[],
  viewportWidth?: number
): CarouselOptions {
  if (!responsive || !responsive.length) {
    return baseOptions;
  }

  const width = viewportWidth || (typeof window !== 'undefined' ? window.innerWidth : 0);
  
  // Sort breakpoints in descending order
  const sortedConfigs = [...responsive].sort((a, b) => b.breakpoint - a.breakpoint);
  
  // Find the first matching breakpoint
  const matchingConfig = sortedConfigs.find(config => width >= config.breakpoint);
  
  if (!matchingConfig) {
    return baseOptions;
  }
  
  return {
    ...baseOptions,
    ...matchingConfig.settings
  };
}

/**
 * Calculate number of visible slides based on container width and item width
 */
export function calculateSlidesPerView(
  containerWidth: number,
  itemWidth: number,
  spacing: number = 0
): number {
  if (containerWidth <= 0 || itemWidth <= 0) {
    return 1;
  }
  
  // Account for spacing between items
  const effectiveItemWidth = itemWidth + spacing;
  const slidesPerView = Math.floor((containerWidth + spacing) / effectiveItemWidth);
  
  return Math.max(1, slidesPerView);
}

/**
 * Get the optimal slide index to scroll to based on direction
 */
export function getTargetIndex(
  currentIndex: number,
  direction: 'prev' | 'next',
  totalSlides: number,
  slidesToScroll: number = 1,
  loop: boolean = false
): number {
  let targetIndex = currentIndex;
  
  if (direction === 'next') {
    targetIndex = currentIndex + slidesToScroll;
    
    if (targetIndex >= totalSlides) {
      targetIndex = loop ? 0 : totalSlides - 1;
    }
  } else {
    targetIndex = currentIndex - slidesToScroll;
    
    if (targetIndex < 0) {
      targetIndex = loop ? totalSlides - 1 : 0;
    }
  }
  
  return targetIndex;
}

/**
 * Calculate progress percentage based on current scroll position
 */
export function calculateProgress(
  scrollProgress: number,
  currentIndex: number,
  totalSlides: number
): number {
  if (totalSlides <= 1) {
    return 100;
  }
  
  const baseProgress = (currentIndex / (totalSlides - 1)) * 100;
  const slideProgress = (scrollProgress / (totalSlides - 1)) * 100;
  
  return Math.min(100, Math.max(0, baseProgress + slideProgress));
}

/**
 * Check if touch/swipe is supported
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Debounce function for resize events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function for scroll events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Get CSS transform value for slide animation
 */
export function getSlideTransform(
  index: number,
  currentIndex: number,
  dragOffset: number = 0
): string {
  const offset = (index - currentIndex) * 100 + dragOffset;
  return `translateX(${offset}%)`;
}

/**
 * Format duration for CSS transition
 */
export function formatDuration(duration: number): string {
  return `${duration}ms`;
}

/**
 * Preload images in carousel items
 */
export function preloadImages(imageUrls: string[]): Promise<void[]> {
  const promises = imageUrls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  });
  
  return Promise.all(promises);
}