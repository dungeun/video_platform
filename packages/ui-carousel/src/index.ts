// Components
export {
  Carousel,
  BaseCarousel,
  HeroSlider,
  ProductCarousel,
  NavigationArrows,
  NavigationDots
} from './components';

// Hooks
export {
  useCarousel,
  useAutoPlay,
  useTouch,
  useCarouselClasses
} from './hooks';

// Types
export type {
  CarouselItem,
  CarouselOptions,
  AutoPlayOptions,
  BaseCarouselProps,
  HeroSliderProps,
  ProductCarouselProps,
  NavigationDotsProps,
  NavigationArrowsProps,
  UseCarouselReturn,
  UseAutoPlayReturn,
  UseTouchReturn,
  CarouselEventMap,
  ResponsiveConfig,
  ResponsiveCarouselProps
} from './types';

// Utils
export {
  getResponsiveOptions,
  calculateSlidesPerView,
  getTargetIndex,
  calculateProgress,
  isTouchDevice,
  debounce,
  throttle,
  getSlideTransform,
  formatDuration,
  preloadImages,
  carouselTheme,
  getCarouselClasses,
  getNavigationArrowClasses,
  getDotClasses,
  getSlideClasses
} from './utils';