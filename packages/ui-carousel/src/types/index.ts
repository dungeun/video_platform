import { ReactNode, CSSProperties } from 'react';

// Base carousel types
export interface CarouselItem {
  id: string;
  content: ReactNode;
  metadata?: Record<string, any>;
}

export interface CarouselOptions {
  loop?: boolean;
  draggable?: boolean;
  dragFree?: boolean;
  align?: 'start' | 'center' | 'end';
  containScroll?: 'trimSnaps' | 'keepSnaps' | false;
  slidesToScroll?: number;
  skipSnaps?: boolean;
  duration?: number;
  startIndex?: number;
  inViewThreshold?: number;
  watchDrag?: boolean;
  watchResize?: boolean;
  watchSlides?: boolean;
}

export interface AutoPlayOptions {
  delay?: number;
  stopOnInteraction?: boolean;
  stopOnMouseEnter?: boolean;
  stopOnFocusIn?: boolean;
  rootNode?: (emblaRoot: HTMLElement) => HTMLElement | null;
}

// Component props
export interface BaseCarouselProps {
  items: CarouselItem[];
  options?: CarouselOptions;
  autoPlay?: boolean | AutoPlayOptions;
  showNavigation?: boolean;
  showDots?: boolean;
  className?: string;
  style?: CSSProperties;
  onSlideChange?: (index: number) => void;
  renderItem?: (item: CarouselItem, index: number) => ReactNode;
}

export interface HeroSliderProps extends BaseCarouselProps {
  height?: string | number;
  fullWidth?: boolean;
  overlay?: boolean;
  overlayContent?: ReactNode;
  transitionDuration?: number;
}

export interface ProductCarouselProps extends BaseCarouselProps {
  itemsPerView?: number | 'auto';
  spacing?: number;
  showAddToCart?: boolean;
  showQuickView?: boolean;
  onAddToCart?: (item: CarouselItem) => void;
  onQuickView?: (item: CarouselItem) => void;
}

export interface NavigationDotsProps {
  totalSlides: number;
  currentSlide: number;
  onDotClick: (index: number) => void;
  variant?: 'dots' | 'lines' | 'numbers';
  position?: 'bottom' | 'top' | 'left' | 'right';
  className?: string;
}

export interface NavigationArrowsProps {
  onPrevClick: () => void;
  onNextClick: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  variant?: 'circle' | 'square' | 'minimal';
  position?: 'inside' | 'outside';
  className?: string;
}

// Hook return types
export interface UseCarouselReturn {
  selectedIndex: number;
  scrollSnaps: number[];
  canScrollPrev: boolean;
  canScrollNext: boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (index: number) => void;
  reInit: () => void;
  destroy: () => void;
}

export interface UseAutoPlayReturn {
  isPlaying: boolean;
  play: () => void;
  stop: () => void;
  reset: () => void;
  toggle: () => void;
}

export interface UseTouchReturn {
  isDragging: boolean;
  dragProgress: number;
  dragOffset: number;
}

// Event types
export interface CarouselEventMap {
  init: void;
  destroy: void;
  select: { index: number; previousIndex: number };
  scroll: { progress: number };
  settle: { index: number };
  resize: void;
  reInit: void;
  pointerDown: MouseEvent | TouchEvent;
  pointerUp: MouseEvent | TouchEvent;
}

// Responsive configuration
export interface ResponsiveConfig {
  breakpoint: number;
  settings: Partial<CarouselOptions>;
}

export interface ResponsiveCarouselProps extends BaseCarouselProps {
  responsive?: ResponsiveConfig[];
}